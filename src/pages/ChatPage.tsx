import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ChatInterface from '../components/chat/ChatInterface';
import { useChat } from '../context/ChatContext';

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadChat, currentChat, loading, error } = useChat();
  const [ticketEscalated, setTicketEscalated] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadChat(id);
    }
  }, [id]);
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  const handleEscalation = (ticketId: string) => {
    setTicketEscalated(true);
    toast.info(
      <div>
        <p>Your question has been escalated to a support ticket.</p>
        <button 
          onClick={() => navigate(`/tickets/${ticketId}`)}
          className="mt-2 bg-blue-500 text-white px-4 py-1 rounded text-sm"
        >
          View Ticket
        </button>
      </div>,
      { autoClose: false }
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Continue Conversation' : 'New Conversation'}
        </h1>
      </div>
      
      {currentChat?.escalatedToTicket && !ticketEscalated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center"
        >
          <Ticket className="h-5 w-5 text-yellow-500 mr-3" />
          <div className="flex-1">
            <p className="text-yellow-800">
              This conversation has been escalated to a support ticket.
            </p>
          </div>
          <button
            onClick={() => navigate(`/tickets/${currentChat.ticketId}`)}
            className="ml-4 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
          >
            View Ticket
          </button>
        </motion.div>
      )}
      
      <div className="h-[calc(100vh-12rem)]">
        <ChatInterface chatId={id} onEscalation={handleEscalation} />
      </div>
    </div>
  );
};

export default ChatPage;