"use client";
import { React, useState, useEffect } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [userType, setUserType] = useState("");
  const router = useRouter();

  useEffect(() => {
    const updateUserType = () => {
      switch (Cookies.get("user_type")) {
        case "tester":
          setUserType("Тестировщик");
          break;
        case "developer":
          setUserType("Разработчик");
          break;
        case "admin":
          setUserType("Администратор");
          break;
        default:
          setUserType("");
          break;
      }
    };

    updateUserType();

    const interval = setInterval(updateUserType, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    console.log(Cookies.get("user_type"));
    Cookies.remove("session_id");
    Cookies.remove("user_type");
    setUserType("");
    router.push("/login");
  }

  return (
    <div className="select-none w-full h-[80px] bg-white flex items-center justify-between px-8 fixed top-0 left-0 rounded-b-[22px] border-b-[3px] border-[#525ee1] shadow-md z-50">
      <div className="flex items-center gap-4">
        <Image
          alt="Logo"
          height={64}
          width={64}
          src="/gitverse-logo.png"
          className="no-drag"
        />
        <h1 className="text-[32px] leading-[40px] text-black hidden sm:block">
          Gitverse Pipeline
        </h1>
      </div>
      <div className="hidden sm:flex gap-8">
        <h1 className="text-[32px] leading-[40px] text-black">{userType}</h1>
        <h1
          onClick={handleLogout}
          className="text-[32px] leading-[40px] text-black cursor-pointer"
        >
          Выйти
        </h1>
      </div>
      <div className="flex md:hidden gap-4">
        <h1 className="text-[24px] leading-[30px] text-black">{userType}</h1>
        <h1
          onClick={handleLogout}
          className="text-[24px] leading-[30px] text-black cursor-pointer"
        >
          Выйти
        </h1>
      </div>
    </div>
  );
};

export default Navbar;
