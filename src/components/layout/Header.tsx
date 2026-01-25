import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Ticket, User, LogOut, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isStaff = user?.role === 'staff';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">AI Support</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user?.role === 'user' && (
                  <Link 
                    to="/chat" 
                    className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <MessageSquare className="h-5 w-5 mr-1" />
                    <span>Chat</span>
                  </Link>
                )}
                
                {(user?.role === 'user' || user?.role === 'staff') && (
                  <Link 
                    to="/tickets" 
                    className="text-gray-600 hover:text-blue-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <Ticket className="h-5 w-5 mr-1" />
                    <span>Tickets</span>
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
                          {user?.name.charAt(0).toUpperCase()}
                        </span>
                      </span>
                    </button>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
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
  );
};

export default Header;