import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, AlertCircle, Clock, CheckCircle, ArrowRight, Tag, BarChart4, Users, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTicket } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';

interface TicketDetailProps {
  isAdmin?: boolean;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ isAdmin = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTicketById, currentTicket, loading, addTicketMessage, updateTicket, classifyTicket, error } = useTicket();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  useEffect(() => {
    if (id) {
      getTicketById(id);
      fetchStatusHistory();
    }
  }, [id]);
  
  const fetchStatusHistory = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${id}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatusHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !id) return;
    
    try {
      await addTicketMessage(id, message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleStatusChange = async (status: string) => {
    if (!id) return;
    
    try {
      await updateTicket(id, { status: status as any });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const handleClassify = async () => {
    if (!id) return;
    
    try {
      await classifyTicket(id);
    } catch (error) {
      console.error('Error classifying ticket:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !currentTicket) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ticket</h3>
        <p className="text-gray-500 mb-4">{error || 'Ticket not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <ArrowRight className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get priority class
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Ticket Header */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-1">{currentTicket.title}</h2>
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex items-center">
                {getStatusIcon(currentTicket.status)}
                <span className="ml-1 capitalize">{currentTicket.status}</span>
              </span>
              <span>•</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityClass(currentTicket.priority)}`}>
                {currentTicket.priority.charAt(0).toUpperCase() + currentTicket.priority.slice(1)}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                <span className="capitalize">{currentTicket.category}</span>
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/admin/tickets/${id}/routing`)}
                className="flex items-center px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                <Users className="h-4 w-4 mr-1" />
                Route
              </button>
              <button
                onClick={handleClassify}
                className="flex items-center px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                <BarChart4 className="h-4 w-4 mr-1" />
                Classify
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                <History className="h-4 w-4 mr-1" />
                History
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Ticket Details */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <p className="text-gray-700">{currentTicket.description}</p>
        {currentTicket.assignedTo && (
          <div className="mt-3 flex items-center">
            <Users className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">
              Assigned to: <span className="font-medium">{currentTicket.assignedTo.name}</span>
              {currentTicket.assignedTo.department && (
                <span className="text-gray-500"> ({currentTicket.assignedTo.department})</span>
              )}
            </span>
          </div>
        )}
        <div className="mt-2 text-sm text-gray-500">
          Created on {new Date(currentTicket.createdAt).toLocaleDateString()} at {new Date(currentTicket.createdAt).toLocaleTimeString()}
        </div>
      </div>
      
      {/* Status Controls (Admin Only) */}
      {isAdmin && (
        <div className="p-4 bg-gray-100 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('open')}
              className={`px-3 py-1 rounded text-sm ${
                currentTicket.status === 'open'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => handleStatusChange('in-progress')}
              className={`px-3 py-1 rounded text-sm ${
                currentTicket.status === 'in-progress'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => handleStatusChange('resolved')}
              className={`px-3 py-1 rounded text-sm ${
                currentTicket.status === 'resolved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => handleStatusChange('closed')}
              className={`px-3 py-1 rounded text-sm ${
                currentTicket.status === 'closed'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Closed
            </button>
          </div>
        </div>
      )}
      
      {/* Status History */}
      {showHistory && statusHistory.length > 0 && (
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Status History</h3>
          <div className="space-y-2">
            {statusHistory.map((entry, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {entry.status === 'open' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {entry.status === 'in-progress' && <ArrowRight className="h-4 w-4 text-blue-500" />}
                  {entry.status === 'resolved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {entry.status === 'closed' && <CheckCircle className="h-4 w-4 text-gray-500" />}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {entry.status.replace('-', ' ')}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      by {entry.changedBy?.name || 'System'}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {currentTicket.messages.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          currentTicket.messages.map((msg, index) => (
            <motion.div
              key={msg._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender._id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  msg.sender._id === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 border border-gray-200 text-gray-800'
                }`}
              >
                <div className="text-xs mb-1">
                  {msg.sender.name} ({msg.sender.role})
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={`text-xs mt-1 ${msg.sender._id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Message Input */}
      {currentTicket.status !== 'closed' && (
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className={`bg-blue-500 text-white rounded-r-lg p-2 ${
                !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
              disabled={!message.trim()}
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TicketDetail;