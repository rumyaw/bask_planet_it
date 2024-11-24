package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
	Type     string `json:"type"`
}

type Task struct {
	TaskId          string   `json:"taskId"`
	TaskName        string   `json:"taskName"`
	TaskEmployee    string   `json:"taskEmployee"`
	TaskCategory    string   `json:"taskCategory"`
	TaskStatus      string   `json:"taskStatus"`
	TaskStart       string   `json:"taskStart"`
	TaskEnd         string   `json:"taskEnd"`
	TaskColor       string   `json:"taskColor"`
	TaskFailMessage string   `json:"taskFailMessage"`
	TaskXPos        float64  `json:"x"`
	TaskYPos        float64  `json:"y"`
	TargetFor       []string `json:"targetFor"`
	SourceFor       []string `json:"sourceFor"`
}

type Response struct {
	Message string `json:"message"`
	Data    string `json:"data,omitempty"`
}

func randomString(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	rand.Seed(time.Now().UnixNano())
	for i := 0; i < length; i++ {
		result[i] = chars[rand.Intn(len(chars))]
	}
	return string(result)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func withRecovery(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Recovered from panic: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()
		h(w, r)
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		upgrader.CheckOrigin = func(r *http.Request) bool {
			return true
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to set WebSocket upgrade:", err)
			return
		}
		defer conn.Close()

		log.Println("Client connected")

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("Read error:", err)
				break
			}
			log.Printf("Received: %s", msg)

			var incomingMessage struct {
				Type    string `json:"type"`
				Payload struct {
					ToSend []struct {
						ID       string `json:"id"`
						Position struct {
							X float64 `json:"x"`
							Y float64 `json:"y"`
						} `json:"position"`
						Data Task `json:"data"`
					} `json:"toSend"`
				} `json:"payload"`
			}

			if err := json.Unmarshal(msg, &incomingMessage); err != nil {
				log.Println("Error parsing JSON:", err)
				continue
			}

			if incomingMessage.Type == "update" {
				if len(incomingMessage.Payload.ToSend) > 0 {
					err := overwriteTasksInDB(db, incomingMessage.Payload.ToSend)
					if err != nil {
						log.Println("Error overwriting tasks:", err)
						continue
					}
					log.Println("Tasks successfully updated")
				} else {
					log.Println("No tasks to update, skipping deletion.")
				}
			}
		}
	}
}

func overwriteTasksInDB(db *sql.DB, tasks []struct {
	ID       string `json:"id"`
	Position struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
	Data Task `json:"data"`
}) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}
	defer tx.Rollback()
	_, err = tx.Exec("DELETE FROM tasks")
	if err != nil {
		return fmt.Errorf("error deleting tasks: %v", err)
	}
	for _, item := range tasks {
		task := item.Data
		task.TaskXPos = item.Position.X
		task.TaskYPos = item.Position.Y
		targetForJSON, _ := json.Marshal(task.TargetFor)
		sourceForJSON, _ := json.Marshal(task.SourceFor)
		_, err := tx.Exec(`
			INSERT INTO tasks (
				task_id, task_name, task_employee, task_category, task_status,
				task_start, task_end, task_color, task_fail_message, task_x_pos, task_y_pos,
				target_for, source_for
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			task.TaskId, task.TaskName, task.TaskEmployee, task.TaskCategory, task.TaskStatus,
			task.TaskStart, task.TaskEnd, task.TaskColor, task.TaskFailMessage, task.TaskXPos, task.TaskYPos,
			string(targetForJSON), string(sourceForJSON),
		)
		if err != nil {
			return fmt.Errorf("error inserting task into DB: %v", err)
		}
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %v", err)
	}

	return nil
}

func main() {
	db, err := sql.Open("sqlite3", "./database.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	createTableUsers := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		type TEXT NOT NULL
	);`
	if _, err := db.Exec(createTableUsers); err != nil {
		log.Fatalf("Error creating table: %v", err)
	}
	createTableTasks := `
	CREATE TABLE IF NOT EXISTS tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		task_id TEXT UNIQUE,
		task_name TEXT,
		task_employee TEXT,
		task_category TEXT,
		task_status TEXT,
		task_start TEXT,
		task_end TEXT,
		task_color TEXT,
		task_fail_message TEXT,
		task_x_pos INTEGER,
		task_y_pos INTEGER,
		target_for TEXT,
		source_for TEXT
);
`
	if _, err := db.Exec(createTableTasks); err != nil {
		log.Fatalf("Error creating table: %v", err)
	}
	r := mux.NewRouter()
	r.HandleFunc("/register", withRecovery(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			log.Printf("Error decoding JSON: %v", err)
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		if user.Username == "" || user.Password == "" {
			http.Error(w, "Username and password are required", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("INSERT INTO users (username, password, type) VALUES (?, ?, ?)", user.Username, user.Password, user.Type)
		if err != nil {
			log.Printf("Error inserting user into database: %v", err)
			http.Error(w, "Error inserting user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(Response{Message: "User registered successfully"})
	})).Methods(http.MethodPost, http.MethodOptions)

	r.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var user User
		if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		var storedPassword, userType string
		err := db.QueryRow("SELECT password, type FROM users WHERE username = ?", user.Username).Scan(&storedPassword, &userType)
		if err != nil {
			http.Error(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}

		if user.Password != storedPassword {
			http.Error(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}
		sessionID := randomString(9)

		http.SetCookie(w, &http.Cookie{
			Name:     "session_id",
			Value:    sessionID,
			Path:     "/",
			HttpOnly: false,
			Secure:   true,
			MaxAge:   24000,
			SameSite: http.SameSiteNoneMode,
		})
		http.SetCookie(w, &http.Cookie{
			Name:     "user_type",
			Value:    userType,
			Path:     "/",
			HttpOnly: false,
			Secure:   true,
			MaxAge:   24000,
			SameSite: http.SameSiteNoneMode,
		})

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(Response{Message: "Login successful", Data: "Some protected information"})
	}).Methods(http.MethodPost, http.MethodOptions)

	r.HandleFunc("/tasks", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		rows, err := db.Query("SELECT task_id, task_name, task_employee, task_category, task_status, task_start, task_end, task_color, task_fail_message, task_x_pos, task_y_pos, target_for, source_for FROM tasks")
		if err != nil {
			log.Println("Error querying tasks:", err)
			http.Error(w, "Error fetching tasks", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		tasks := []Task{}
		for rows.Next() {
			var task Task
			var targetForJSON, sourceForJSON string
			if err := rows.Scan(&task.TaskId, &task.TaskName, &task.TaskEmployee, &task.TaskCategory, &task.TaskStatus, &task.TaskStart, &task.TaskEnd, &task.TaskColor, &task.TaskFailMessage, &task.TaskXPos, &task.TaskYPos, &targetForJSON, &sourceForJSON); err != nil {
				log.Println("Error scanning task:", err)
				continue
			}

			json.Unmarshal([]byte(targetForJSON), &task.TargetFor)
			json.Unmarshal([]byte(sourceForJSON), &task.SourceFor)
			tasks = append(tasks, task)
		}

		if err := rows.Err(); err != nil {
			log.Println("Error iterating over rows:", err)
			http.Error(w, "Error fetching tasks", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
	}).Methods(http.MethodGet)

	r.HandleFunc("/tasks/{taskId}", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		vars := mux.Vars(r)
		taskId := vars["taskId"]
		row := db.QueryRow(`
			SELECT task_id, task_name, task_employee, task_category, task_status, 
				   task_start, task_end, task_color, task_fail_message, task_x_pos, 
				   task_y_pos, target_for, source_for 
			FROM tasks WHERE task_id = ?`, taskId)

		var task Task
		var targetForJSON, sourceForJSON string
		if err := row.Scan(&task.TaskId, &task.TaskName, &task.TaskEmployee, &task.TaskCategory,
			&task.TaskStatus, &task.TaskStart, &task.TaskEnd, &task.TaskColor,
			&task.TaskFailMessage, &task.TaskXPos, &task.TaskYPos,
			&targetForJSON, &sourceForJSON); err != nil {
			log.Println("Error scanning task:", err)
			if err == sql.ErrNoRows {
				http.Error(w, "Task not found", http.StatusNotFound)
			} else {
				http.Error(w, "Error fetching task", http.StatusInternalServerError)
			}
			return
		}
		if err := json.Unmarshal([]byte(targetForJSON), &task.TargetFor); err != nil {
			log.Println("Error unmarshalling target_for:", err)
		}
		if err := json.Unmarshal([]byte(sourceForJSON), &task.SourceFor); err != nil {
			log.Println("Error unmarshalling source_for:", err)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(task)
	}).Methods(http.MethodGet)
	r.Use(corsMiddleware)
	r.HandleFunc("/ws", handleWebSocket(db))
	fmt.Println("Server is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
