"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import HoverOverlayComponent from './HoverOverlayComponent';
import Link from 'next/link';

const TaskComponent = (props) => {
  const [status, setStatus] = useState('pending');
  const [overlay, setOverlay] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deleteButton, setDeleteButton] = useState('delete_gray');
  const prevStatus = useRef(null);

  useEffect(() => {
    prevStatus.current = status;
  }, [status]);

  const handlePauseOrResume = () => {
    if (status === 'start') {
      setStatus('running');
      prevStatus.current = 'running';
    }
    if (status === 'stop') {
      setStatus('pending');
      prevStatus.current = 'pending';
    }
  };

  useEffect(() => {
    handleStateChange(props.taskFailMessage);
  }, [status]);

  const handleStateChange = (failMessage) => {
    if (status === 'running') {
      const start = getCurrentDateTime();
      const randomChance = Math.random();

      if (randomChance < 0.3) {
        const generatedFailMessage = generateFailMessage();
        setStatus('failed');
        prevStatus.current = 'failed';
        props.sendStatus(props.taskId, prevStatus.current, start, getCurrentDateTime(), generatedFailMessage); // Send fail message to the parent
      } else {
        setTimeout(() => {
          const end = getCurrentDateTime();
          setStatus('success');
          prevStatus.current = 'success';
          props.sendStatus(props.taskId, prevStatus.current, start, end);
        }, Math.random() * 5000);
      }
    }
  };

  const generateFailMessage = () => {
    function generateRandomHexAddress() {
      const randomAddress = Math.floor(Math.random() * 0x10000);
      return `0x${randomAddress.toString(16).padStart(4, '0').toUpperCase()}`;
    }

    return generateRandomHexAddress();
  };

  const handleDeleteButton = () => {
    props.handleTaskDelete(props.taskId);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour12: false });
    const date = now.toLocaleDateString('ru-RU');
    return `${time}, ${date}`;
  };

  return (
    <>
      <div
        style={{ borderColor: props.taskColor }}
        className={`min-w-[150px] w-fit h-1/24 border-[${props.taskColor}] shadow-xl border-2 rounded-full flex items-center justify-evenly my-2 bg-white px-2`}
      >
        <div
          className="rounded-full flex items-center h-[26px] w-[26px] p-[2px]"
          onClick={handlePauseOrResume}
          onMouseEnter={() => {
            prevStatus.current = status;
            setStatus(status === 'running' ? 'stop' : 'start');
          }}
          onMouseLeave={() => {
            setStatus(prevStatus.current);
          }}
        >
          <Image src={status + '.svg'} width={24} height={24} alt="Task status" className="w-[24px]" />
        </div>
        <Image
          src="retry.svg"
          width={24}
          height={24}
          alt="Task status"
          className="w-[24px] relative right-1"
          onClick={() => { setStatus('running'); }}
        />
        <p
          className="text-sm pr-2"
          onMouseEnter={() => { setOverlay(true); }}
          onMouseLeave={() => setOverlay(false)}
        >
          <Link href={`/tasks/${props.taskId}`}>{props.taskName}</Link>
        </p>
        <Image src="drag-pan.svg" width={24} height={24} alt="Task status" className="w-[24px]" />
        <Image
          src={`${deleteButton}.svg`}
          width={24}
          height={24}
          alt="Delete node"
          className="cursor-pointer"
          onMouseEnter={() => setDeleteButton('delete_red')}
          onMouseLeave={() => setDeleteButton('delete_gray')}
          onClick={handleDeleteButton}
        />
      </div>
      {overlay ? (
        <HoverOverlayComponent
          taskName={props.taskName}
          taskCategory={props.taskCategory}
          taskEmployee={props.taskEmployee}
          taskStatus={props.taskStatus}
          taskStart={props.taskStart}
          taskEnd={props.taskEnd}
        />
      ) : null}
    </>
  );
};

export default TaskComponent;
