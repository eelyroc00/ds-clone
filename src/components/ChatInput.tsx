import React, { useState, FormEvent } from 'react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isSubmitting: boolean;
};

export default function ChatInput({ onSendMessage, isSubmitting }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === '' || isSubmitting) {
      return;
    }
    
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="border-t border-gray-100 p-4 bg-white">
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || message.trim() === ''}
          className="absolute right-3 p-2 rounded-lg text-primary-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
} 