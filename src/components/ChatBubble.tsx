import React from 'react';
import { useAuth } from '../lib/auth';

type ChatBubbleProps = {
  message: {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    createdAt: string;
  };
};

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const { user } = useAuth();
  
  // Format the timestamp in HH:MM AM/PM format
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };
  
  const messageTime = formatTime(message.createdAt);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="mr-2 bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white">
          A
        </div>
      )}
      
      <div
        className={`px-4 py-2 rounded-lg relative ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <p>{message.text}</p>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {messageTime}
        </div>
      </div>
      
      {isUser && (
        <div className="ml-2 bg-gray-400 rounded-full w-8 h-8 flex items-center justify-center text-white">
          {user?.displayName?.charAt(0) || 'U'}
        </div>
      )}
    </div>
  );
} 