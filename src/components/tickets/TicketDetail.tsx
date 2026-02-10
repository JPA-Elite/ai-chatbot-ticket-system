import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTicket } from "../../context/TicketContext";
import { useAuth } from "../../context/AuthContext";

interface TicketDetailProps {
  isAdmin?: boolean;
}

const TicketDetail: React.FC<TicketDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getTicketById,
    currentTicket,
    loading,
    addTicketMessage,
    acceptTicket,
    endConversation,
    error,
  } = useTicket();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAcceptingTicket, setIsAcceptingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSatisfactionSurvey, setShowSatisfactionSurvey] = useState(false);
  const [lastSurveyMessageId, setLastSurveyMessageId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (id) {
      getTicketById(id);
    }
  }, [id]);

  useEffect(() => {
      if (currentTicket?.messages && currentTicket.messages.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 300);
      }
    }, [currentTicket?._id]);

  useEffect(() => {
    if (!currentTicket) return;

    const studentSide = !(user?.role === "admin" || user?.role === "staff");
    if (!studentSide) return;

    const isTicketActive =
      currentTicket.status === "accepted" || currentTicket.status === "in-progress";

    if (!isTicketActive) return;

    const msgs = currentTicket.messages || [];
    if (msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];
    const lastMsgFromStaff =
      lastMsg?.sender?.role === "admin" || lastMsg?.sender?.role === "staff";

    if (!lastMsgFromStaff) return;

    const lastId = lastMsg?._id || `${msgs.length - 1}`;
    if (lastId === lastSurveyMessageId) return;

    setLastSurveyMessageId(lastId);
    setShowSatisfactionSurvey(true);
    
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [currentTicket?.messages, currentTicket?.status, user?.role, lastSurveyMessageId]);


  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        
        if (isNearBottom || currentTicket?.messages.length === 1) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!id) return;

    const currentMessage = message.trim();
    if (!currentMessage || isSending) return;

    setIsSending(true);
    setMessage("");

    try {
      await addTicketMessage(id, currentMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(currentMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptTicket = async () => {
    if (!id || isAcceptingTicket) return;

    setIsAcceptingTicket(true);

    try {
      await acceptTicket(id);
    } catch (error) {
      console.error("Error accepting ticket:", error);
    } finally {
      setIsAcceptingTicket(false);
    }
  };

  const handleEndConversation = async () => {
    if (!id) return;

    try {
      await endConversation(id);
      setShowSatisfactionSurvey(true);
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  };

const handleSatisfactionResponse = async (satisfied: boolean) => {
    setShowSatisfactionSurvey(false);

    if (!id) return;

    try {
      if (satisfied) {
        await endConversation(id);
        navigate("/tickets");
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !currentTicket) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !currentTicket) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Ticket
          </h3>
          <p className="text-gray-500 mb-4">{error || "Ticket not found"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        color: "bg-orange-100 text-orange-800",
        icon: <Clock className="h-4 w-4" />,
        text: "Pending",
      },
      accepted: {
        color: "bg-blue-100 text-blue-800",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Accepted",
      },
      "in-progress": {
        color: "bg-blue-100 text-blue-800",
        icon: <ArrowRight className="h-4 w-4" />,
        text: "In Progress",
      },
      resolved: {
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Resolved",
      },
      closed: {
        color: "bg-gray-100 text-gray-800",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Closed",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Rejected",
      },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: "bg-green-100 text-green-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  const isStaff = (user?.role === "admin" || user?.role === "staff") ?? false;
  const canAccept = isStaff && currentTicket.status === "pending";
  const canEndConversation =
    isStaff &&
    (currentTicket.status === "accepted" ||
      currentTicket.status === "in-progress");
  const isTicketActive =
    currentTicket.status === "accepted" || currentTicket.status === "in-progress";


  const statusBadge = getStatusBadge(currentTicket.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-500 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-full hover:bg-blue-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">
              {currentTicket.title}
            </h1>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span
              className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusBadge.color}`}
            >
              {statusBadge.icon}
              {statusBadge.text}
            </span>
            {/* <span>•</span> */}
            {/* <span
              className={`px-3 py-1 rounded-full ${getPriorityBadge(currentTicket.priority)}`}
            >
              {currentTicket.priority.charAt(0).toUpperCase() +
                currentTicket.priority.slice(1)}
            </span> */}
            {/* <span>•</span>
            <span className="flex items-center"> */}
              {/* <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg> */}
              {/* {currentTicket.category} */}
            {/* </span> */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4 border-l-4 border-blue-500">
          <p className="text-gray-700">{currentTicket.description}</p>
          <p className="text-sm text-gray-500 mt-2">
            Created on {new Date(currentTicket.createdAt).toLocaleDateString()}{" "}
            at {new Date(currentTicket.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {canAccept && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    New Ticket Request
                  </h3>
                  <p className="text-sm text-blue-700">
                    Accept this ticket to start helping the student
                  </p>
                </div>
              </div>
              <button
                onClick={handleAcceptTicket}
                disabled={isAcceptingTicket}
                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                  isAcceptingTicket
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isAcceptingTicket ? "Accepting..." : "Accept Ticket"}
              </button>
            </div>
          </div>
        )}

        {currentTicket.status === "pending" && !isStaff && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="font-semibold text-yellow-900 mb-1">
              Waiting for staff to accept this ticket...
            </h3>
            <p className="text-sm text-yellow-700">
              Your ticket is pending. Please wait for a staff member to accept
              your request.
            </p>
          </div>
        )}

        {currentTicket.status === "rejected" && !isStaff && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-semibold text-red-900 mb-1">
              Ticket Rejected
            </h3>
            <p className="text-sm text-red-700 mb-2">
              This ticket has been rejected by staff.
            </p>
            {currentTicket.rejectionReason && (
              <p className="text-sm text-red-800 font-medium">
                Reason: {currentTicket.rejectionReason}
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {currentTicket.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-blue-100 p-6 rounded-full mb-4 inline-block">
                    <AlertCircle className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 text-gray-700">
                    {currentTicket.status === "pending"
                      ? "Waiting for Staff"
                      : "No messages yet"}
                  </h3>
                  <p className="max-w-md text-gray-500">
                    {currentTicket.status === "pending"
                      ? "Your ticket is pending. A staff member will accept it soon!"
                      : "Start the conversation by sending a message below."}
                  </p>
                </motion.div>
              </div>
            ) : (
              currentTicket.messages.map((msg, index) => (
                <motion.div
                  key={msg._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.sender._id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      msg.sender._id === user?.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 border border-gray-200 text-gray-800"
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 font-medium ${msg.sender._id === user?.id ? "text-blue-100" : "text-gray-600"}`}
                    >
                      {msg.sender.name} ({msg.sender.role})
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`text-xs mt-1 ${msg.sender._id === user?.id ? "text-blue-100" : "text-gray-500"}`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {canEndConversation && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={handleEndConversation}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 px-4 transition-colors font-medium"
              >
                End Conversation
              </button>
            </div>
          )}

          {!isStaff && showSatisfactionSurvey && isTicketActive && (
            <div className="border-t border-gray-200 p-4 bg-yellow-50">
              <p className="text-gray-700 font-medium mb-3">Are you satisfied with the support?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSatisfactionResponse(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 px-4 transition-colors font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleSatisfactionResponse(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 px-4 transition-colors font-medium"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {isTicketActive && currentTicket.status !== "pending" && (
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-l-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSending}
                />

                <button
                  type="submit"
                  className={`bg-blue-500 text-white rounded-r-lg px-6 py-3 ${
                    isSending || !message.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-600"
                  }`}
                  disabled={isSending || !message.trim()}
                >
                  <Send className="h-6 w-6" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
