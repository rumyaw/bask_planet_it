"use client";
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import Navbar from '../components/NavbarComponent';
import { useRouter } from 'next/navigation';

const createNotification = (type) => {
  const commonStyles = {
    borderRadius: '8px',
    color: '#ffffff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  };

  if (type === 'success') {
    toast.success(`Вы вошли в систему`, {
      duration: 4000,
      style: {
        ...commonStyles,
        background: '#4caf50',
      },
    });
  } else if (type === 'failed') {
    toast.error(`Неверное имя пользователя или пароль`, {
      duration: 4000,
      style: {
        ...commonStyles,
        background: '#f44336',
      },
    });
  }
};

const checkAuth = () => {
  const userType = Cookies.get('user_type');
  if (userType) {
    console.log(userType);
    console.log('User is already logged in');
  } else {
    console.log('User is not logged in');
  }
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from server:', data);
      createNotification('success');
      router.push('/');
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
          <h1 className="text-center text-[48px] leading-[64px] font-mono mb-8"
            onClick={checkAuth}>Авторизация</h1>

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

          <button
            type="submit"
            className="w-[60%] h-[60px] border-[2px] text-white shadow-xl hover:relative hover:top-1 rounded-[22px] font-mono text-[24px] mt-4 bg-[#525ee1]"
          >
            Войти
          </button>

          <p className="text-center text-[18px] mt-4 font-mono">
            Нет аккаунта? <a href="/register" className="underline hover:text-[#525ee1]">регистрация</a>
          </p>
        </form>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default LoginPage;
