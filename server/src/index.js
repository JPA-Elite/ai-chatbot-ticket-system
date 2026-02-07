import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import { WEB_APP_BASE_URL } from './config/api.js';
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
import { listMigrations, runMigration } from './migrations/index.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: WEB_APP_BASE_URL,
    methods: ['GET', 'POST']
  }
});

// Rate limiting
const rateLimitEnabled = process.env.NODE_ENV === 'production'
  ? process.env.RATE_LIMIT_ENABLED !== 'false'
  : process.env.RATE_LIMIT_ENABLED === 'true';
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

const isMigrationInvocation = process.env.npm_lifecycle_event === 'migrations';

function getMigrationName() {
  if (!isMigrationInvocation) {
    return null;
  }

  if (process.env.npm_config_migration) {
    return process.env.npm_config_migration;
  }

  const argIndex = process.argv.findIndex((arg) => arg === '--migration');
  if (argIndex !== -1 && process.argv[argIndex + 1]) {
    return process.argv[argIndex + 1];
  }

  const migrationArg = process.argv.find((arg) => arg.startsWith('--migration='));
  if (migrationArg) {
    return migrationArg.split('=')[1];
  }

  return null;
}

const migrationName = getMigrationName();
const shouldRunMigrations = isMigrationInvocation;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
if (rateLimitEnabled) {
  app.use(limiter);
}

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
  .then(async () => {
    console.log('Connected to MongoDB');

    if (shouldRunMigrations) {
      try {
        if (migrationName) {
          console.log(`Running migration: ${migrationName}`);
          const migrationResult = await runMigration(migrationName);
          console.log('Migration completed:', migrationResult);
        } else {
          const migrations = listMigrations();
          if (migrations.length === 0) {
            console.log('No migrations to run.');
          } else {
            for (const migration of migrations) {
              console.log(`Running migration: ${migration}`);
              const migrationResult = await runMigration(migration);
              console.log('Migration completed:', migrationResult);
            }
          }
        }
        process.exitCode = 0;
      } catch (err) {
        console.error('Migration failed:', err);
        console.log(`Available migrations: ${listMigrations().join(', ') || 'none'}`);
        process.exitCode = 1;
      } finally {
        await mongoose.connection.close();
        process.exit(process.exitCode ?? 0);
      }

      return;
    }
    
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
