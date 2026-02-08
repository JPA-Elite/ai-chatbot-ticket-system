import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import API_BASE_URL from "../config/api";
 
interface TicketMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  content: string;
  timestamp: Date;
}

interface Ticket {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  chatId: string;
  title: string;
  description: string;
  category: "technical" | "billing" | "account" | "feature" | "bug" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "accepted" | "in-progress" | "resolved" | "closed";
  assignedTo:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        department?: string;
      }
    | null;
  acceptedBy:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      }
    | null;
  acceptedAt: Date | null;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface TicketContextType {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  getUserTickets: () => Promise<void>;
  getAllTickets: (
    page?: number,
    limit?: number,
    status?: string,
  ) => Promise<void>;
  getTicketById: (id: string) => Promise<void>;
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>;
  addTicketMessage: (id: string, content: string) => Promise<void>;
  classifyTicket: (id: string) => Promise<void>;
  acceptTicket: (id: string) => Promise<void>;
  endConversation: (id: string) => Promise<void>;
  clearCurrentTicket: () => void;
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}
 
const TicketContext = createContext<TicketContextType | undefined>(undefined);
 
export const TicketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const { isAuthenticated, token, isAdmin } = useAuth();
 
  useEffect(() => {
    if (isAuthenticated && tickets.length === 0) {
      if (isAdmin) {
        getAllTickets();
      } else {
        getUserTickets();
      }
    }
  }, [isAuthenticated]);
 
  const getUserTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE_URL}/api/tickets/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error loading tickets";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
 
  const getAllTickets = async (page = 1, limit = 10, status?: string) => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_BASE_URL}/api/tickets?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setTickets(res.data.data);
        setPagination({
          page: res.data.pagination.page,
          pages: res.data.pagination.pages,
          total: res.data.total,
        });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error loading tickets";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
 
  const getTicketById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE_URL}/api/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setCurrentTicket(res.data.data);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error loading ticket";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update ticket
  const updateTicket = async (id: string, data: Partial<Ticket>) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.put(
        `${API_BASE_URL}/api/tickets/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        setCurrentTicket(res.data.data);

        // Update ticket in the list
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === id ? res.data.data : ticket,
          ),
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error updating ticket";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add message to ticket
  const addTicketMessage = async (id: string, content: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_BASE_URL}/api/tickets/${id}/message`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        setCurrentTicket(res.data.data);
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === id ? res.data.data : ticket,
          ),
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error adding message";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
 
  const classifyTicket = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_BASE_URL}/api/tickets/${id}/classify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        // Refresh ticket data
        await getTicketById(id);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error classifying ticket";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear current ticket
  const acceptTicket = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_BASE_URL}/api/tickets/${id}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        setCurrentTicket(res.data.data);
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === id ? res.data.data : ticket,
          ),
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error accepting ticket";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const endConversation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_BASE_URL}/api/tickets/${id}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        setCurrentTicket(res.data.data);
        setTickets((prevTickets) =>
          prevTickets.map((ticket) =>
            ticket._id === id ? res.data.data : ticket,
          ),
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error ending conversation";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentTicket = () => {
    setCurrentTicket(null);
  };

  return (
    <TicketContext.Provider
      value={{
        tickets,
        currentTicket,
        loading,
        error,
        getUserTickets,
        getAllTickets,
        getTicketById,
        updateTicket,
        addTicketMessage,
        classifyTicket,
        acceptTicket,
        endConversation,
        clearCurrentTicket,
        pagination,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

// Custom hook for using ticket context
export const useTicket = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error("useTicket must be used within a TicketProvider");
  }
  return context;
};
