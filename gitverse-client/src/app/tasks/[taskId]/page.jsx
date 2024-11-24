'use client'

import React, { useEffect, useState } from 'react';

const Page = ({ params }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/tasks/${params.taskId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить задачу');
        }
        
        const data = await response.json();
        setTask(data);
        console.log(data)
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.taskId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white border-2 border-black flex items-center justify-center p-4 sm:p-6">
        <div className="bg-gray-200 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center sm:text-left">
            Загрузка задачи...
          </h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white border-2 border-black flex items-center justify-center p-4 sm:p-6">
        <div className="bg-gray-200 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center sm:text-left">
            Ошибка: {error}
          </h1>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-white border-2 border-black flex items-center justify-center p-4 sm:p-6">
        <div className="bg-gray-200 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center sm:text-left">
            Задача не найдена
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center sm:border-2 sm:border-black p-4 sm:p-6">
      <div className="bg-white rounded-[33px] shadow-xl p-8 sm:p-10 w-full max-w-3xl border-2 border-black">
        <h1 className="text-center text-[48px] font-mono mb-8 text-[#525EE1]">
          Задача {task.taskName}
        </h1>
        <div className="text-base  mb-4">
          <span className="text-[#525EE1]">Категория: </span>
          <span className="font-semibold">{task.taskCategory}</span>
        </div>
        <div className="text-base  mb-4">
          <span className="text-[#525EE1]">Исполнитель: </span>
          <span className="font-semibold">{task.taskEmployee}</span>
        </div>
        <div className="text-base  mb-4">
          <span className="text-[#525EE1]">Время начала: </span>
          <span className="font-semibold">{task.taskStart}</span>
        </div>
        <div className="text-base mb-4">
          <span className="text-[#525EE1]">Время окончания: </span>
          <span className="font-semibold">{task.taskEnd}</span>
        </div>
        {task.taskFailMessage && (
          <div className="text-base  mb-4">
            <span className="text-[#525EE1]">Сообщение об ошибке: </span>
            <span className="font-semibold">{task.taskFailMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};


export default Page;
