import React from 'react';
import { MessageSquare } from 'lucide-react';
import * as Util from "../helpers/util.js";

export const ChatItem = ( props ) => {
    const { title, isUnread, isSelected, lastMessage, timestamp } = props
    const onClick = props.onClick || (() => {})

    return (
        <div onClick={onClick}
             className={Util.classNames('p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50',
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : '')}>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                            {title}
                        </h3>
                        {isUnread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate mb-1">
                        {lastMessage}
                    </p>
                    
                    <span className="text-xs text-gray-400">
                        {timestamp}
                    </span>
                </div>
            </div>
        </div>
    );
}
