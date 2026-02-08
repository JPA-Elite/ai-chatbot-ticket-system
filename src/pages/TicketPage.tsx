import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ArrowRight, CheckCircle, Share2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import TicketList from "../components/tickets/TicketList";
import { useTicket } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const TicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { getUserTickets, getAllTickets, tickets, rejectTicket, getTicketById } = useTicket();
  const { user } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "staff";

  useEffect(() => {
    if (isStaff) {
      getAllTickets();
    } else {
      getUserTickets();
    }
  }, []);

  const loadAvailableStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        const filteredStaff = data.data.filter((staff: any) => 
          staff._id !== user?.id && staff.role === 'staff'
        );
        setAvailableStaff(filteredStaff);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
    }
  };

  const handleForwardClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowForwardModal(true);
    loadAvailableStaff();
  };

  const handleRejectClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowRejectModal(true);
  };

  const handleForwardTicket = async () => {
    if (!selectedStaffId || !selectedTicketId) return;

    setIsForwarding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/${selectedTicketId}/forward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ staffId: selectedStaffId }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowForwardModal(false);
        setSelectedStaffId("");
        setSelectedTicketId(null);
        toast.success("Ticket forwarded successfully!");
        if (isStaff) {
          await getAllTickets();
        }
      } else {
        toast.error(data.message || "Failed to forward ticket");
      }
    } catch (error) {
      console.error("Error forwarding ticket:", error);
      toast.error("Failed to forward ticket");
    } finally {
      setIsForwarding(false);
    }
  };

  const handleRejectTicket = async () => {
    if (!selectedTicketId || !rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      await rejectTicket(selectedTicketId, rejectReason);
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedTicketId(null);
      toast.success("Ticket rejected successfully!");
      if (isStaff) {
        await getAllTickets();
      }
    } catch (error) {
      console.error("Error rejecting ticket:", error);
      toast.error("Failed to reject ticket");
    } finally {
      setIsRejecting(false);
    }
  };

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
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-600">Open</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Closed</span>
          </div>
        </div>
      </div>

      <TicketList 
        onForward={isStaff ? handleForwardClick : undefined}
        onReject={isStaff ? handleRejectClick : undefined}
      />

      {showForwardModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => !isForwarding && setShowForwardModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Forward Ticket to Staff
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Select a staff member to forward this ticket:</p>
            
            <div className="mb-4 overflow-y-auto border border-gray-300 rounded-lg flex-1" style={{ maxHeight: 'calc(90vh - 240px)' }}>
              {availableStaff.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No staff members available
                </div>
              ) : (
                availableStaff.map((staff) => (
                  <button
                    key={staff._id}
                    onClick={() => setSelectedStaffId(staff._id)}
                    disabled={isForwarding}
                    className={`w-full text-left p-4 border-b border-gray-200 last:border-b-0 transition-colors ${
                      selectedStaffId === staff._id
                        ? "bg-blue-50 border-l-4 border-l-blue-600"
                        : "hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{staff.name}</div>
                        <div className="text-sm text-gray-600 truncate mt-0.5">{staff.email}</div>
                        {staff.department && (
                          <div className="text-xs text-gray-500 mt-1">{staff.department}</div>
                        )}
                        {staff.tags && staff.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {staff.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedStaffId === staff._id && (
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            
            {availableStaff.length > 3 && (
              <p className="text-xs text-gray-500 mb-4 text-center">
                Showing {availableStaff.length} staff member{availableStaff.length !== 1 ? 's' : ''} - Scroll to see all
              </p>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setSelectedStaffId("");
                  setSelectedTicketId(null);
                }}
                disabled={isForwarding}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleForwardTicket}
                disabled={!selectedStaffId || isForwarding}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isForwarding ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Forwarding...
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5" />
                    Forward
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showRejectModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isRejecting && setShowRejectModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Reject Ticket
            </h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this ticket:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg py-2 px-3 mb-4 min-h-[100px]"
              disabled={isRejecting}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedTicketId(null);
                }}
                disabled={isRejecting}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTicket}
                disabled={!rejectReason.trim() || isRejecting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRejecting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TicketPage;