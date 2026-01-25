import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import TicketList from '../components/tickets/TicketList';
import { useTicket } from '../context/TicketContext';

const TicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { getUserTickets } = useTicket();
  
  useEffect(() => {
    getUserTickets();
  }, []);
  
  const handleBack = () => {
    navigate('/dashboard');
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
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-gray-900"
        >
          Your Support Tickets
        </motion.h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        View and manage your support tickets. When our AI assistant can't help with your questions, 
        tickets are created automatically.
      </p>
      
      <TicketList />
    </div>
  );
};

export default TicketPage;