import React from 'react';

const Loading = ({ size = 'medium', fullScreen = false }) => {
    const sizeClasses = {
        small: 'w-6 h-6 border-2',
        medium: 'w-12 h-12 border-4',
        large: 'w-16 h-16 border-4',
    };

    const spinnerClass = sizeClasses[size] || sizeClasses.medium;

    const spinner = (
        <div className={`${spinnerClass} border-primary border-t-transparent rounded-full loading-spinner`} />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-8">
            {spinner}
        </div>
    );
};

export default Loading;
