import { React } from 'react';

const HoverOverlayComponent = (props) => {
    let status;
    switch(props.taskStatus){
        case 'success':
            status = 'Выполнено';
            break;
        case 'failed':
            status = 'Выполнено с ошибкой';
            break;
        default:
            status = 'Ожидает';
    }
    return (
        <div class="h-fit w-[150px] space-y-2 rounded-xl bg-gray-900/50 p-2 text-white">
            <p class="text-[0.6rem] border-b border-gray-400 pb-1 break-all">Категория: {props.taskCategory}</p>
            <p class="text-[0.6rem] border-b border-gray-400 pb-1 break-all">Исполнитель: {props.taskEmployee}</p>
            <p class="text-[0.6rem] border-b border-gray-400 pb-1 break-all">Статус: {status}</p>
            <p class="text-[0.6rem] border-b border-gray-400 pb-1 break-all">Время старта: {props.taskStart}</p>
            <p class="text-[0.6rem]">Время окончания: {props.taskEnd}</p>
        </div>
    );
}

export default HoverOverlayComponent;
