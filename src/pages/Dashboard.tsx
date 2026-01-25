import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Ticket, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTicket } from '../context/TicketContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { chats, loadUserChats } = useChat();
  const { tickets, getUserTickets } = useTicket();
  const navigate = useNavigate();
  
  useEffect(() => {
    loadUserChats();
    getUserTickets();
  }, []);
  
  const getTicketStatusCount = (status: string) => {
    return tickets.filter(ticket => ticket.status === status).length;
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Welcome, {user?.name}!
        </motion.h1>
        <p className="text-gray-600">Here's an overview of your support activity</p>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate('/chat')}
            className="bg-blue-50 border border-blue-100 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Start a New Chat</h3>
                <p className="text-sm text-gray-600">Ask questions and get instant help from our AI assistant</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-500 ml-auto" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate('/tickets')}
            className="bg-green-50 border border-green-100 rounded-lg p-6 cursor-pointer hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Ticket className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">View Your Tickets</h3>
                <p className="text-sm text-gray-600">Check the status of your support tickets</p>
              </div>
              <ArrowRight className="h-5 w-5 text-green-500 ml-auto" />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center">
              <div className="mr-4">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Chats</p>
                <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center">
              <div className="mr-4">
                <Ticket className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center">
              <div className="mr-4">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTicketStatusCount('open') + getTicketStatusCount('in-progress')}
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center">
              <div className="mr-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resolved Tickets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTicketStatusCount('resolved') + getTicketStatusCount('closed')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Chats */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Chats</h2>
            <button
              onClick={() => navigate('/chat')}
              className="text-blue-500 text-sm font-medium hover:text-blue-600"
            >
              View All
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {chats.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No chat history yet</p>
                <button
                  onClick={() => navigate('/chat')}
                  className="mt-2 text-blue-500 font-medium hover:text-blue-600"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {chats.slice(0, 5).map((chat, index) => (
                  <motion.li
                    key={chat._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => navigate(`/chat/${chat._id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {chat.messages.length > 0 
                              ? chat.messages.filter(msg => msg.role === 'user')[0]?.content.substring(0, 40) + '...' || 'New conversation'
                              : 'New conversation'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {chat.escalatedToTicket && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Escalated
                        </span>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Recent Tickets */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
            <button
              onClick={() => navigate('/tickets')}
              className="text-blue-500 text-sm font-medium hover:text-blue-600"
            >
              View All
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Ticket className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No tickets yet</p>
                <button
                  onClick={() => navigate('/chat')}
                  className="mt-2 text-blue-500 font-medium hover:text-blue-600"
                >
                  Start a chat for help
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {tickets.slice(0, 5).map((ticket, index) => (
                  <motion.li
                    key={ticket._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start">
                        <div className="mt-0.5 mr-3">
                          {ticket.status === 'open' && <Clock className="h-5 w-5 text-yellow-500" />}
                          {ticket.status === 'in-progress' && <ArrowRight className="h-5 w-5 text-blue-500" />}
                          {ticket.status === 'resolved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {ticket.status === 'closed' && <CheckCircle className="h-5 w-5 text-gray-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ticket.priority === 'low' ? 'bg-green-100 text-green-800' :
                        ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;