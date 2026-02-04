import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Route imports
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import ticketRoutes from './routes/ticket.js';
import staffRoutes from './routes/staff.js';
import inquiryRoutes from './routes/inquiry.js';
import inquiryRelevanceRoutes from './routes/inquiryRelevance.js';
import metricsRoutes from './routes/metrics.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/inquiry-relevance', inquiryRelevanceRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('AI Chatbot and Ticket System API is running');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a room for admin or user
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  // Handle new ticket notifications
  socket.on('new_ticket', (ticketData) => {
    io.to('admin_room').emit('ticket_notification', ticketData);
  });
  
  // Handle ticket status updates
  socket.on('update_ticket', (ticketData) => {
    io.to(`user_${ticketData.userId}`).emit('ticket_update', ticketData);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});