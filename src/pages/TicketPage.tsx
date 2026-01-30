import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import TicketList from "../components/tickets/TicketList";
import { useTicket } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";

const TicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { getUserTickets, getAllTickets, tickets } = useTicket();
  const { user } = useAuth();

  const isStaff = user?.role === "admin" || user?.role === "staff";

  useEffect(() => {
    if (tickets.length === 0) {
      if (isStaff) {
        getAllTickets();
      } else {
        getUserTickets();
      }
    }
  }, []);

  const handleBack = () => {
    navigate("/dashboard");
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
          {isStaff ? "Support Tickets" : "Your Support Tickets"}
        </motion.h1>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          {isStaff
            ? "View and manage all support tickets from students. Accept pending tickets to start helping."
            : "View and manage your support tickets. When our AI assistant can't help with your questions, tickets are created automatically."}
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Open</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Closed</span>
          </div>
        </div>
      </div>

      <TicketList />
    </div>
  );
};

export default TicketPage;
