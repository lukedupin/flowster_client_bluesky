import React from 'react'

export const TypingIndicator = ({ className = "" }) => {
    return (
        <div className={`flex space-x-1 ${className}`}>
            <div 
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
            />
            <div 
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms', animationDuration: '1s' }}
            />
            <div 
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms', animationDuration: '1s' }}
            />
        </div>
    );
}

