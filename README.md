# AI Chatbot with Ticket Escalation System

A MERN stack application that provides an AI-powered chatbot interface with automatic ticket escalation when the chatbot cannot answer questions.

## Features

- AI-powered chatbot (with mock responses for testing)
- Automatic ticket escalation system
- Ticket classification using mock AI
- User authentication
- Admin dashboard for ticket management
- Real-time notifications using Socket.io
- Responsive design for all devices

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI**: Mock responses (OpenAI GPT-4 API ready when available)
- **Authentication**: JWT
- **Real-time Communication**: Socket.io

## Quick Start (Without OpenAI API Key)

This version includes mock AI responses so you can test the application without an OpenAI API key.

### Prerequisites

- Node.js (v14+)
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone/download the project files
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. Set up environment variables:
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/chatbot-ticket-system
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRE=30d
   # OpenAI API key is optional for testing
   ```

4. Start MongoDB:
   ```bash
   # On Windows
   mongod
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

5. Run the application:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

6. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000 (or set `VITE_API_BASE_URL`)
   - Python API: http://127.0.0.1:8000 (or set `PYTHON_API_BASE_URL`)
   - Web app URL: http://localhost:5173 (or set `WEB_APP_BASE_URL`)
   - Rate limit config: `RATE_LIMIT_*` and `AUTH_RATE_LIMIT_*` in `.env` (disabled by default in non-production)

## Testing the Mock AI

The mock AI will respond to different types of messages:

### Regular Responses
- "Hello" → Greeting response
- "What are your services?" → General service information
- "I need help" → Support guidance

### Escalation Triggers (will create tickets)
Try these phrases to test ticket escalation:
- "I have a billing issue"
- "There's a technical problem"
- "This is not working"
- "I found a bug"
- "I need urgent help"
- "Payment not working"

### Creating an Admin User

1. Register a normal user first
2. Connect to MongoDB and update the user role:
   ```javascript
   // In MongoDB shell or Compass
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## Running the Ticket Classifier Migration

The server supports a one-off migration to load staff users from `server/src/data/files/ticket-classifier.csv`
and set their password to `TempPass123!` (hashed before storage).

1. Ensure MongoDB is running and your server `.env` file is configured.
2. Run the migration from the project root:
   ```bash
   npm run migrations --migration=ticket-classifier
   ```

   To run all migrations, omit the flag:
   ```bash
   npm run migrations
   ```

The migration will connect to MongoDB, upsert users in the `users` collection, and then exit without starting
the HTTP server.

## Adding Real OpenAI Integration

When you get an OpenAI API key:

1. Add your API key to `.env`:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

2. Replace the mock service with the real OpenAI integration (the original code is commented in the files)

## Project Structure

```
├── server/              # Backend code
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic (now with mock AI)
│   │   ├── middleware/  # Custom middleware
│   │   └── index.js     # Entry point
│   └── package.json
│
├── src/                 # Frontend code
│   ├── components/      # React components
│   ├── context/         # React context providers
│   ├── pages/           # Page components
│   └── main.tsx         # Entry point
│
└── package.json
```

## License

MIT
