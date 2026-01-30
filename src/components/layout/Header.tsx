import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Ticket,
  User,
  LogOut,
  Settings,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTicket } from "../../context/TicketContext";

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { tickets, getAllTickets } = useTicket();
  const isStaff = user?.role === "staff";
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const LAST_SEEN_KEY = useMemo(() => {
    const uid = (user as any)?.id || (user as any)?._id || "unknown";
    return `staffTicketsLastSeen:${uid}`;
  }, [user]);

  const [lastSeen, setLastSeen] = useState<number>(() => 0);

  useEffect(() => {
    if (!isStaff) return;
    const v = localStorage.getItem(LAST_SEEN_KEY);
    const n = v ? Number(v) : 0;
    setLastSeen(Number.isFinite(n) ? n : 0);
  }, [isStaff, LAST_SEEN_KEY]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) return;

    getAllTickets();

    const interval = setInterval(() => {
      getAllTickets();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isStaff]);

  useEffect(() => {
    if (!isStaff) return;

    const onRead = () => {
      const v = localStorage.getItem(LAST_SEEN_KEY);
      const n = v ? Number(v) : 0;
      setLastSeen(Number.isFinite(n) ? n : 0);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_SEEN_KEY) onRead();
    };

    window.addEventListener("tickets:read" as any, onRead);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("tickets:read" as any, onRead);
      window.removeEventListener("storage", onStorage);
    };
  }, [isStaff, LAST_SEEN_KEY]);

  const pendingTickets = useMemo(() => {
    if (!isStaff) return [];
    return tickets.filter((t: any) => t.status === "pending");
  }, [tickets, isStaff]);

  const pendingCount = pendingTickets.length;

  const hasUnread = useMemo(() => {
    if (!isStaff) return false;
    if (pendingCount === 0) return false;

    const last = lastSeen || 0;

    return pendingTickets.some((t: any) => {
      const updated = new Date(t.updatedAt as any).getTime();
      return updated > last;
    });
  }, [pendingTickets, pendingCount, lastSeen, isStaff]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/");
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  AI Support
                </span>
              </Link>
            </div>

            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {user?.role === "user" && (
                    <Link
                      to="/chat"
                      className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                    >
                      <MessageSquare className="h-5 w-5 mr-1" />
                      <span>Chat</span>
                    </Link>
                  )}

                  {(user?.role === "user" || user?.role === "staff") && (
                    <Link
                      to="/tickets"
                      className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                    >
                      <Ticket className="h-5 w-5 mr-1" />
                      <span>Tickets</span>

                      {isStaff && hasUnread && (
                        <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] leading-none font-semibold rounded-full bg-red-500 text-white">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {isStaff && (
                    <Link
                      to="/staff/stats"
                      className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                    >
                      <BarChart3 className="h-5 w-5 mr-1" />
                      <span>My Stats</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <div className="relative group">
                      <button className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        <Settings className="h-5 w-5 mr-1" />
                        <span>Admin</span>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-1">
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/admin/staff"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Staff Management
                          </Link>
                          <Link
                            to="/admin/inquiry"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Inquiry Management
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative ml-3">
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                          <span className="text-xs font-medium leading-none text-white">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </span>
                      </button>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogoutClick}
                    className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <User className="h-5 w-5 mr-1" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
