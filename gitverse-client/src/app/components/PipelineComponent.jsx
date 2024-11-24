"use client";

import React from 'react';
import TaskComponent from './TaskComponent';
import FlowComponent from './FlowComponent';

const PipelineComponent = () => {
    return (
            <div className="h-screen w-screen">
                <FlowComponent />
            </div>
    );
};

export default PipelineComponent;
