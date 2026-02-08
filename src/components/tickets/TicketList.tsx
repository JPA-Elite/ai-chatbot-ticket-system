import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Share2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTicket } from "../../context/TicketContext";
import { useAuth } from "../../context/AuthContext";
import { getStatusIcon } from "../utils/utils";

interface TicketListProps {
  onForward?: (ticketId: string) => void;
  onReject?: (ticketId: string) => void;
}

const TicketList: React.FC<TicketListProps> = ({ onForward, onReject }) => {
  const { tickets, loading } = useTicket();
  const { user } = useAuth();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const isStaff = user?.role === "admin" || user?.role === "staff";

  const handleTicketClick = (id: string) => {
    if (user?.role === "staff") {
      const uid = (user as any)?.id || (user as any)?._id || "unknown";
      localStorage.setItem(`staffTicketsLastSeen:${uid}`, String(Date.now()));
      window.dispatchEvent(new Event("tickets:read"));
    }
    navigate(isAdmin ? `/admin/tickets/${id}` : `/tickets/${id}`);
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "pending":
        return "border-green-500";
      case "accepted":
      case "in-progress":
        return "border-blue-500";
      case "resolved":
      case "closed":
        return "border-gray-400";
      case "rejected":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  // const getPriorityClass = (priority: string) => {
  //   switch (priority) {
  //     case "low":
  //       return "bg-green-100 text-green-800";
  //     case "medium":
  //       return "bg-blue-100 text-blue-800";
  //     case "high":
  //       return "bg-orange-100 text-orange-800";
  //     case "urgent":
  //       return "bg-red-100 text-red-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6"
        >
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tickets found
          </h3>
          <p className="text-gray-500">
            {isAdmin
              ? "There are no support tickets in the system yet."
              : "You haven't created any support tickets yet."}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {tickets.map((ticket, index) => (
          <motion.li
            key={ticket._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`border-l-4 ${getStatusBorder(ticket.status)}`}
          >
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => handleTicketClick(ticket._id)}
                >
                  {getStatusIcon(ticket.status)}
                  <p className="ml-2 text-sm font-medium text-gray-900 truncate max-w-md">
                    {ticket.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isStaff &&
                    ticket.status !== "rejected" &&
                    ticket.status !== "closed" && (
                      <>
                        {onForward && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onForward(ticket._id);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Forward ticket"
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                        )}
                        {onReject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject(ticket._id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject ticket"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    )}
                  <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div
                className="mt-2 cursor-pointer"
                onClick={() => handleTicketClick(ticket._id)}
              >
                <p className="text-sm text-gray-500 truncate max-w-lg">
                  {ticket.description.length > 100
                    ? `${ticket.description.substring(0, 100)}...`
                    : ticket.description}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default TicketList;
