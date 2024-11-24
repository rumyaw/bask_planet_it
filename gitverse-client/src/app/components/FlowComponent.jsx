import { React, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    ReactFlow, Background, Controls, applyNodeChanges,
    applyEdgeChanges, addEdge, Handle, Position, Panel
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import Image from 'next/image';
import TaskComponent from './TaskComponent';
import AddMenuComponent from './AddMenuComponent';
import { Toaster, toast } from 'react-hot-toast';
import { debounce } from 'lodash';
import Cookies from 'js-cookie';
import { redirect } from 'next/navigation'
import * as XLSX from 'xlsx';

function generateEdgesFromNodes(nodes) {
    const edges = [];

    nodes.forEach((node) => {
        const { taskId, targetFor, sourceFor } = node.data;

        targetFor.forEach((targetNodeId) => {
            edges.push({
                id: `${targetNodeId}-${taskId}`,
                source: targetNodeId,
                target: taskId,
                type: 'default',
                animated: false,
            });
        });

        sourceFor.forEach((sourceNodeId) => {
            edges.push({
                id: `${taskId}-${sourceNodeId}`,
                source: taskId,
                target: sourceNodeId,
                type: 'default',
                animated: false,
            });
        });
    });

    return edges;
}

const createNotification = (type, name, message) => {
    const commonStyles = {
        borderRadius: '8px',
        color: '#ffffff',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    };

    if (type === 'success') {
        toast.success(`Задача ${name} выполнилась успешно`, {
            duration: 4000,
            style: {
                ...commonStyles,
                background: '#4caf50',
            },
        });
    } else if (type === 'failed') {
        toast.error(`Задача ${name} выполнилась с ошибкой: ${message}`, {
            duration: 4000,
            style: {
                ...commonStyles,
                background: '#f44336',
            },
        });
    }
};

const FlowComponent = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [addMenuStatus, setAddMenuStatus] = useState(false);
    const [tasksToExport, setTasksToExport] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        const userType = Cookies.get('user_type');
        if (!userType) {
            redirect('/login')
        }

        socketRef.current = new WebSocket('ws://localhost:8080/ws');

        socketRef.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message from server:', message);
        };

        socketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        const fetchTasks = async () => {
            try {
                const response = await fetch('http://localhost:8080/tasks');
                const data = await response.json();
                console.log(data)
                const formattedNodes = data.map((task) => ({
                    id: task.taskId,
                    type: 'custom',
                    position: { x: task.x, y: task.y },
                    data: {
                        taskId: task.taskId,
                        taskName: task.taskName,
                        taskEmployee: task.taskEmployee,
                        taskCategory: task.taskCategory,
                        taskStatus: task.taskStatus,
                        taskStart: task.taskStart,
                        taskEnd: task.taskEnd,
                        taskColor: task.taskColor,
                        taskFailMessage: task.taskFailMessage,
                        targetFor: task.targetFor || [],
                        sourceFor: task.sourceFor || []
                    }
                }));

                setNodes(formattedNodes);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };

        fetchTasks();

        return () => {
            socketRef.current.close();
        };

    }, []);

    const sendWs = useCallback((toSend) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'update', payload: { toSend } }));
        }
    }, []);

    const exportToExcel = async () => {
        try {
            const response = await fetch('http://localhost:8080/tasks');
            const data = await response.json();
            const formattedData = data.map(task => ({
                'Название задачи': task.taskName,
                'Ответственный': task.taskEmployee,
                'Категория задачи': task.taskCategory,
                'Статус задачи': task.taskStatus,
                'Дата начала': task.taskStart,
                'Дата окончания': task.taskEnd,
                'Сообщение об ошибке': task.taskFailMessage
            }));
            const ws = XLSX.utils.json_to_sheet(formattedData); 
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Отчёт');

            // Сохраняем файл Excel
            XLSX.writeFile(wb, 'tasks.xlsx');
        } catch (error) {
            console.error(error)
        }
    };

    useEffect(() => {
        setEdges(generateEdgesFromNodes(nodes));

        const debouncedSend = debounce(() => {
            sendWs(nodes);
        }, 500);

        debouncedSend();

        // Очистка debounce при размонтировании
        return () => {
            debouncedSend.cancel();
        };
    }, [nodes, sendWs]);

    const TaskNode = ({ data }) => {
        const targetHandleStyle = {
            'border-radius': '30px',
            'background': '#006ec2',
            'height': '.7rem',
            'width': '.7rem',
            'top': `1rem`,
            'right': '-0.35rem',
        };
        const sourceHandleStyle = {
            'border-radius': '30px',
            'background': '#1aab00',
            'height': '.7rem',
            'width': '.7rem',
            'top': `1rem`,
            'position': 'absolute',
        };

        return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <TaskComponent
                    taskId={data.taskId}
                    taskName={data.taskName}
                    taskCategory={data.taskCategory}
                    taskEmployee={data.taskEmployee}
                    taskStatus={data.taskStatus || "Ожидает"}
                    taskStart={data.taskStart}
                    taskEnd={data.taskEnd}
                    taskColor={data.taskColor}
                    taskFailMessage={data.taskFailMessage}
                    handleTaskDelete={handleNodeDelete}
                    sendStatus={handleStatusChange}
                />
                <Handle type="target" position={Position.Left} style={targetHandleStyle} />
                <Handle type="source" position={Position.Right} id="b" style={sourceHandleStyle} />
            </div>
        );
    };

    const nodeTypes = useMemo(() => ({ custom: TaskNode }), []);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [],
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );

    const onConnect = useCallback(
        (params) => {
            setNodes((prevNodes) => {
                const updatedNodes = prevNodes.map((node) => {
                    if (node.id === params.source) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                sourceFor: [...node.data.sourceFor, params.target]
                            }
                        };
                    }
                    if (node.id === params.target) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                targetFor: [...node.data.targetFor, params.source]
                            }
                        };
                    }
                    return node;
                });

                return updatedNodes;
            });

            setEdges((eds) => addEdge(params, eds));
        },
        [nodes]
    );

    function handleAddMenuOpen() {
        setAddMenuStatus(true);
    }

    function handleAddMenuClose() {
        setAddMenuStatus(false);
    }

    function handleNodeInsert(name, employee, category, color) {
        let newId = '0';
        if (nodes.length > 0) {
            newId = `${parseInt(nodes[nodes.length - 1].id) + 1}`;
        }
        const newNode = {
            id: newId,
            type: 'custom',
            style: { cursor: 'default' },
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            data: {
                taskId: newId,
                taskName: name,
                taskEmployee: employee,
                taskCategory: category,
                taskStatus: '',
                taskStart: '',
                taskEnd: '',
                taskColor: color,
                taskFailMessage: '',
                targetFor: [],
                sourceFor: []
            }
        };

        setNodes(prevNodes => {
            const updatedNodes = [...prevNodes, newNode];
            setEdges(generateEdgesFromNodes(updatedNodes));
            return updatedNodes;
        });
    }

    function handleStatusChange(taskId, status, start, end, failMessage) {
        setNodes((prevNodes) => {
            const updatedNodes = prevNodes.map((node) =>
                node.id === taskId
                    ? { ...node, data: { ...node.data, taskStatus: status, taskStart: start, taskEnd: end, taskFailMessage: failMessage } }
                    : node
            );
            const node = updatedNodes.find(node => node.id === taskId);
            if (node) {
                createNotification(status, node.data.taskName, failMessage);
            }

            return updatedNodes;
        });
    }



    function handleNodeDelete(taskId) {
        setNodes((prevNodes) => prevNodes.filter(node => node.id !== taskId));
    }

    function renderButtons() {
        switch (Cookies.get('user_type')) {
            case '':
                return <>
                    <Panel
                        position="bottom-center"
                        className='hover:w-[52px] hover:h-[52px] rounded-full w-[50px] h-[50px] bg-white shadow-xl border-[#525ee1] border-2'
                        onClick={handleAddMenuOpen}
                    >
                        <Image src="plus.svg" width={50} height={50} alt="Add task" className="no-drag cursor-pointer" />
                    </Panel>
                    <Panel
                        position="bottom-center"
                        className="hover:w-[52px] hover:h-[52px] rounded-full w-[50px] h-[50px] bg-white shadow-xl border-[#525ee1] border-2 flex items-center justify-center"
                        onClick={handleDocumentDownload}
                    >
                        <Image
                            src="excel.svg"
                            width={32}
                            height={32}
                            alt="Download document"
                            className="no-drag cursor-pointer"
                        />
                    </Panel>
                </>
            case 'tester':
                return null
            case 'developer':
                return <>
                    <Panel
                        position="bottom-center"
                        className='hover:w-[52px] hover:h-[52px] rounded-full w-[50px] h-[50px] bg-white shadow-xl border-[#525ee1] border-2'
                        onClick={handleAddMenuOpen}
                    >
                        <Image src="plus.svg" width={50} height={50} alt="Add task" className="no-drag cursor-pointer" />
                    </Panel>
                </>
            case 'admin':
                return <>
                    <Panel
                        position="bottom-center"
                        className="hover:w-[52px] hover:h-[52px] rounded-full w-[50px] h-[50px] bg-white shadow-xl border-[#525ee1] border-2 flex items-center justify-center"
                        onClick={exportToExcel}
                    >
                        <Image
                            src="excel.svg"
                            width={32}
                            height={32}
                            alt="Download document"
                            className="no-drag cursor-pointer"
                        />
                    </Panel></>
        }
    }

    return (
        <div style={{ height: '100%' }}>
            <ReactFlow
                className='react-flow-wrapper'
                panOnDrag={true}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
            >
                <Background />
                {renderButtons()}
            </ReactFlow>
            <Toaster position="top-right" />
            {addMenuStatus && <AddMenuComponent handleAddMenuClose={handleAddMenuClose} handleTaskUpdate={handleNodeInsert} />}
        </div>
    );
};

export default FlowComponent;
