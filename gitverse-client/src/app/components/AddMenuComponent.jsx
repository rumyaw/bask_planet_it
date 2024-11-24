import { React, useRef, useState } from 'react';
import Image from 'next/image';
import { GithubPicker } from 'react-color';

const AddMenuComponent = (props) => {
  const [taskColor, setTaskColor] = useState('#4b5563');

  const handleMenuSubmission = (formData) => {
    const taskName = formData.get("taskName");
    const taskEmployee = formData.get("taskEmployee");
    const taskCategory = formData.get("taskCategory");
    console.log(taskName, taskEmployee, taskCategory, taskColor);
    props.handleTaskUpdate(taskName, taskEmployee, taskCategory, taskColor);
  };

  const handleColorChange = (color) => {
    setTaskColor(color.hex);
    console.log(taskColor);
  };

  return (
    <form
      action={handleMenuSubmission}
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full sm:min-w-[40%] sm:w-fit h-fit bg-white border-t-2 border-[#525ee1] shadow-lg z-50 rounded-t-lg"
    >
      <div className="relative p-4 h-full">
        <div
          className="absolute top-4 right-4 w-[30px] h-[30px] flex items-center justify-center"
          onClick={props.handleAddMenuClose}
        >
          <Image
            src="close.svg"
            width={30}
            height={30}
            alt="Close task menu"
            className="no-drag cursor-pointer"
          />
        </div>
        <div className="h-full w-full flex flex-col gap-4 items-center justify-center">
          <h1 className="text-center sm:text-left">Добавить задачу:</h1>
          <input
            required
            name="taskName"
            type="text"
            placeholder="Название"
            className="text-xs h-6 border rounded p-2 w-full"
          />
          <input
            required
            name="taskEmployee"
            type="text"
            placeholder="Исполнитель"
            className="text-xs h-6 border rounded p-2 w-full"
          />
          <div className="flex items-center w-full border rounded">
            <input
              required
              name="taskCategory"
              type="text"
              placeholder="Категория"
              className="text-xs h-6 p-2 flex-grow border-none outline-none"
            />
            <div className="flex items-center justify-center cursor-pointer ml-2">
              <GithubPicker
                triangle="hide"
                className="overflow-hidden"
                colors={['#66A182', '#090C9B', '#9B1D20', '#FE7F2D', '#525ee1', '#4b5563']}
                width="fit-content"
                styles={{
                  default: {
                    card: {
                      boxShadow: 'none',
                      borderRadius: '4px',
                      padding: '5px',
                    },
                  },
                }}
                onChangeComplete={handleColorChange}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button className="px-4 py-1 bg-[#525ee1] text-white rounded-xl" type="submit">
            Добавить
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddMenuComponent;
