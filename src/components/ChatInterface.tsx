import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { useAuth } from '../lib/auth';
import Link from 'next/link';

type Message = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: string;
};

export default function ChatInterface() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize component when user is available
  useEffect(() => {
    if (user && !isInitializedRef.current) {
      loadConversations();
    }
  }, [user]);

  // Update messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    }
  }, [activeConversation]);

  // Format date for conversation list
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Unknown date';
    }
  }, []);

  // Format time in HH:MM AM/PM 
  const formatTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }, []);

  // Load conversations from API
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/conversations?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      const fetchedConversations = data.conversations || [];
      
      console.log(`Loaded ${fetchedConversations.length} conversations from database`);
      
      // Format conversations with consistent IDs
      setConversations(fetchedConversations.map(conv => ({
        ...conv,
        id: conv.id.startsWith('db-') ? conv.id : `db-${conv.id}`,
        lastUpdated: conv.updatedAt || conv.lastUpdated
      })));
      
      // Create a new conversation if none exist and this is first initialization
      if (fetchedConversations.length === 0 && !isInitializedRef.current) {
        console.log('No conversations found, creating a new one');
        isInitializedRef.current = true;
        await createNewConversation();
      } else if (fetchedConversations.length > 0) {
        // Set the most recent conversation as active
        const mostRecent = fetchedConversations[0];
        setActiveConversation({
          ...mostRecent,
          id: mostRecent.id.startsWith('db-') ? mostRecent.id : `db-${mostRecent.id}`,
          lastUpdated: mostRecent.updatedAt || mostRecent.lastUpdated
        });
        isInitializedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading conversations:', error);      
      
      // If there's an error and we haven't initialized yet, create a new conversation as a fallback
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        setConversations([]);
        await createNewConversation();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new conversation
  const createNewConversation = async () => {
    try {
      const newConversation: Conversation = {
        id: `temp-${Date.now()}`,
        title: 'New Conversation',
        messages: [],
        lastUpdated: new Date().toISOString(),
      };
      
      // Save to database if user exists
      if (user) {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            conversation: {
              title: newConversation.title
            }
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          newConversation.id = data.conversation.id;
        } else {
          console.error('Failed to create conversation in database:', await response.text());
        }
      }
      
      setActiveConversation(newConversation);
      setMessages([]);
      setConversations(prev => [newConversation, ...prev]);
      
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Save a single message to the database
  const saveMessageToDatabase = async (message: Message, conversationId: string) => {
    if (!user) return null;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: {
            conversationId,
            sender: message.sender,
            text: message.text,
            createdAt: message.createdAt
          }
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save message:', await response.text());
        return null;
      }
      
      return await response.json().then(data => data.message);
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (text: string) => {
    // Skip if empty or already submitting
    if (!text.trim() || isSubmitting) return;
    
    // Get or create conversation
    let currentConversation = activeConversation;
    if (!currentConversation) {
      const newConversation = await createNewConversation();
      if (!newConversation) return;
      currentConversation = newConversation;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create and display user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        text,
        createdAt: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Save user message to database
      const savedUserMessage = await saveMessageToDatabase(userMessage, currentConversation.id);
      if (savedUserMessage) {
        userMessage.id = savedUserMessage.id;
      }
      
      // Get AI response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      
      if (!chatResponse.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const data = await chatResponse.json();
      const responseText = data.response;
      
      // Create assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: responseText,
        createdAt: new Date().toISOString(),
      };
      
      // Save assistant message to database
      const savedAssistantMessage = await saveMessageToDatabase(assistantMessage, currentConversation.id);
      if (savedAssistantMessage) {
        assistantMessage.id = savedAssistantMessage.id;
      }
      
      const finalMessages = [...updatedMessages, assistantMessage];
      
      // Update conversation with new messages
      const updatedConversation = {
        ...currentConversation,
        messages: finalMessages,
        lastUpdated: new Date().toISOString(),
        // Set title based on first user message if this is a new conversation
        title: currentConversation.title === 'New Conversation' && finalMessages.length === 2 
          ? text.substring(0, 30) + (text.length > 30 ? '...' : '') 
          : currentConversation.title
      };
      
      setActiveConversation(updatedConversation);
      setMessages(finalMessages);
      
      // Update conversations list
      setConversations(prevConversations => {
        const exists = prevConversations.some(conv => conv.id === updatedConversation.id);
        
        if (exists) {
          return prevConversations.map(conv => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          );
        } else {
          return [updatedConversation, ...prevConversations.filter(c => c.id !== 'temp-new')];
        }
      });
      
      // Generate and play text-to-speech
      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: responseText }),
        });
        
        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            audioRef.current.onended = () => URL.revokeObjectURL(audioUrl);
          }
        }
      } catch (error) {
        console.error('Error generating speech:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      // Remove from UI immediately for responsiveness
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If active conversation was deleted, set a new active conversation
      if (activeConversation?.id === conversationId) {
        const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
        if (remainingConversations.length > 0) {
          setActiveConversation(remainingConversations[0]);
          setMessages(remainingConversations[0].messages);
        } else {
          await createNewConversation();
        }
      }
      
      // Delete from server if it's a saved conversation
      if (conversationId.startsWith('db-')) {
        console.log(`Attempting to delete conversation from database: ${conversationId}`);
        
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Server returned ${response.status}: ${errorData}`);
          throw new Error(`Failed to delete conversation: Server returned ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(`Failed to delete conversation: ${error}. The conversation may still exist in the database.`);
      
      // Restore the conversation in UI if deletion failed
      if (activeConversation && activeConversation.id === conversationId) {
        setConversations(prev => [activeConversation, ...prev.filter(c => c.id !== conversationId)]);
      }
    }
  };

  // Check if there's already an empty new conversation
  const hasEmptyNewConversation = conversations.some(
    conv => conv.title === 'New Conversation' && conv.messages.length === 0
  );

  if (!user) return null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">
            Loading your conversations...
          </h1>
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">DeepSeek Chat</h1>
        <div className="flex items-center gap-4">
          <Link 
            href="/profile" 
            className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer transition-colors"
          >
            {user.displayName}
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
      
      {/* Main container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-64px)]">
          <div className="p-4 border-b border-gray-200">
            <button 
              onClick={createNewConversation}
              disabled={hasEmptyNewConversation}
              className={`w-full py-2 px-4 text-white rounded-lg text-sm font-medium transition-colors ${
                hasEmptyNewConversation 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              New Conversation
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conversation => (
              <div 
                key={conversation.id} 
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  activeConversation?.id === conversation.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex justify-between items-start group relative">
                  <div 
                    className="flex-1 cursor-pointer pr-7"
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-800 truncate flex-1">
                        {conversation.messages.length > 0 
                          ? conversation.messages.find(msg => msg.sender === 'user')?.text || conversation.title
                          : conversation.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(conversation.lastUpdated)}
                      </span>
                    </div>
                    
                    {conversation.messages.length > 0 && (
                      <div className="flex justify-between items-start mt-1">
                        <p className="text-xs text-gray-500 truncate flex-1">
                          {conversation.messages[conversation.messages.length - 1].text}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {formatTime(conversation.messages[conversation.messages.length - 1].createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id);
                    }}
                    aria-label="Delete conversation"
                    title="Delete conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md flex flex-col h-[calc(100vh-140px)]">
            {/* Chat header */}
            <div className="border-b border-gray-200 py-4 px-6">
              <h2 className="text-lg font-medium text-gray-800">
                {activeConversation?.title || 'New Conversation'}
              </h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Send a message to start chatting</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat input */}
            <ChatInput onSendMessage={handleSendMessage} isSubmitting={isSubmitting} />
          </div>
        </div>
      </div>
      
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
} 