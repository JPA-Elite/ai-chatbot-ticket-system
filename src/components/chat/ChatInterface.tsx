import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import { motion } from 'framer-motion';

interface ChatInterfaceProps {
  chatId?: string;
  onEscalation?: (ticketId: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId, onEscalation }) => {
  const [message, setMessage] = useState('');
  const { currentChat, sendMessage, loading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chat when component mounts
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const currentMessage = message.trim();
    setMessage('');
    
    try {
      const response = await sendMessage(currentMessage, chatId);
      
      // Handle escalation
      if (response.escalated && response.ticketId && onEscalation) {
        onEscalation(response.ticketId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(currentMessage); // Restore the message on error
    }
  };

  // Get filtered messages (exclude system messages)
  const displayMessages = currentChat?.messages?.filter(msg => msg.role !== 'system') || [];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Chat Header */}
      <div className="bg-blue-500 text-white p-4">
        <h2 className="text-xl font-semibold">AI Support Assistant</h2>
        <p className="text-sm opacity-80">Ask me anything, and I'll do my best to help you</p>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-blue-100 p-6 rounded-full mb-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <MessageSquareIcon className="h-12 w-12 text-blue-500" />
                </motion.div>
              </div>
              <h3 className="text-xl font-medium mb-2">How can I help you today?</h3>
              <p className="max-w-md">
                Ask me any questions about our products or services. If I can't answer, 
                I'll create a support ticket for you!
              </p>
            </motion.div>
          </div>
        ) : (
          displayMessages.map((msg, index) => (
            <ChatMessage
              key={msg._id || `${msg.role}-${index}-${msg.timestamp}`}
              message={msg}
              isAI={msg.role === 'assistant'}
            />
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="ml-2 text-sm">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            className={`bg-blue-500 text-white rounded-r-lg p-2 ${
              loading || !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
            disabled={loading || !message.trim()}
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Chat icon component
const MessageSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default ChatInterface;