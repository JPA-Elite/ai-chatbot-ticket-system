import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, Plus, Search, MessageSquare, Clock } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import { motion } from 'framer-motion';

interface ChatInterfaceProps {
  chatId?: string;
  onEscalation?: (ticketId: string) => void;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId, onEscalation }) => {
  const [message, setMessage] = useState('');
  const { currentChat, sendMessage, loading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [chatHistory] = useState<ChatHistoryItem[]>([
    {
      id: 'chat-1',
      title: 'Product Inquiry',
      lastMessage: 'Tell me about your products',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: 'chat-2',
      title: 'Technical Support',
      lastMessage: 'I need help with installation',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: 'chat-3',
      title: 'Billing Question',
      lastMessage: 'When is my next payment due?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }
  ]);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

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
      
      if (response.escalated && response.ticketId && onEscalation) {
        onEscalation(response.ticketId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(currentMessage);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredChats = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayMessages = currentChat?.messages?.filter(msg => msg.role !== 'system') || [];

  return (
    <div className="flex h-full bg-white rounded-lg shadow overflow-hidden">
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-gray-900 text-white flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-700">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Chat
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 px-3 py-2">YOUR CHATS</div>
            
            {filteredChats.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full text-left px-3 py-3 rounded-lg mb-1 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{chat.title}</div>
                      <div className="text-xs text-gray-400 truncate mt-1">{chat.lastMessage}</div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTime(chat.timestamp)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-blue-500 text-white p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <h2 className="text-xl font-semibold">AI Support Assistant</h2>
            <p className="text-sm opacity-80">Ask me anything, and I'll do my best to help you</p>
          </div>
        </div>

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

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSubmit}
              className={`bg-blue-500 text-white rounded-r-lg p-2 ${
                loading || !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
              disabled={loading || !message.trim()}
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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