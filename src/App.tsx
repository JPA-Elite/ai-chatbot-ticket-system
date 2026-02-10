import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './components/layout/Header';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import TicketPage from './pages/TicketPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketDetails from './pages/admin/TicketDetails';
import StaffDashboard from './pages/admin/StaffDashboard';
import StaffStats from './pages/StaffStats';
import Profile from './pages/Profile';

// Context
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { TicketProvider } from './context/TicketContext';
import InquiryDashboard from './pages/admin/InquiryDashboard';
import InquiryRelevanceDashboard from './pages/admin/InquiryRelevanceDashboard';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <TicketProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/chat" element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  } />
                  <Route path="/chat/:id" element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  } />
                  <Route path="/tickets" element={
                    <PrivateRoute>
                      <TicketPage />
                    </PrivateRoute>
                  } />
                  <Route path="/tickets/:id" element={
                    <PrivateRoute>
                      <TicketDetails />
                    </PrivateRoute>
                  } />
                  <Route path="/staff/stats" element={
                    <PrivateRoute>
                      <StaffStats />
                    </PrivateRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/staff" element={
                    <AdminRoute>
                      <StaffDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/inquiry" element={
                    <AdminRoute>
                      <InquiryDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/inquiry-relevance" element={
                    <AdminRoute>
                      <InquiryRelevanceDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/tickets/:id" element={
                    <AdminRoute>
                      <TicketDetails isAdmin={true} />
                    </AdminRoute>
                  } />
                  <Route path="/profile-settings" element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } />
                </Routes>
              </main>
              <ToastContainer position="top-right" autoClose={3000} />
            </div>
          </Router>
        </TicketProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
