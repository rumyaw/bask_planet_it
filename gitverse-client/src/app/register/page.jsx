'use client';
import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const createNotification = (type) => {
  const commonStyles = {
    borderRadius: '8px',
    color: '#ffffff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  };

  if (type === 'success') {
    toast.success(`Вы зарегистрировались`, {
      duration: 4000,
      style: {
        ...commonStyles,
        background: '#4caf50',
      },
    });
  } else if (type === 'failed') {
    toast.error(`Такой пользователь уже существует`, {
      duration: 4000,
      style: {
        ...commonStyles,
        background: '#f44336',
      },
    });
  }
};

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('developer');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, type }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from server:', data);
      createNotification('success');
      router.push('/login');
    } catch (error) {
      console.error('Error:', error);
      createNotification('failed');
    }
  };

  return (
    <div>
      <div className="relative w-full h-screen bg-white flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="w-[600px] md:w-[90%] max-w-[669px] bg-white sm:border-[2px] border-gray-700 sm:shadow-xl rounded-[33px] p-8 flex flex-col items-center"
        >
          <h1 className="text-center text-[48px] leading-[64px] font-mono mb-8">Регистрация</h1>

          <div className="w-full mb-6">
            <input
              type="text"
              placeholder="имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[60px] border-[2px] border-[#525ee1] rounded-[22px] px-4 placeholder-opacity-50 font-mono text-[24px] leading-[32px]"
              required
            />
          </div>

          <div className="w-full mb-6 relative">
            <input
              type="password"
              placeholder="пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[60px] border-[2px] border-[#525ee1] rounded-[22px] px-4 placeholder-opacity-50 font-mono text-[24px] leading-[32px]"
              required
            />
          </div>

          <div className="w-full mb-6">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-[60px] border-[2px] border-[#525ee1] rounded-[22px] px-4 font-mono text-[24px] leading-[32px] bg-white"
              required
            >
              <option value="tester">Тестировщик</option>
              <option value="developer">Разработчик</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-[fit] px-4 h-[60px] border-[2px] text-white shadow-xl hover:relative hover:top-1 rounded-[22px] font-mono text-[24px] mt-4 bg-[#525ee1]"
          >
            Зарегистрироваться
          </button>
        </form>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default RegisterPage;
