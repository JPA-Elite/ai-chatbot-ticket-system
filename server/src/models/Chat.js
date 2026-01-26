import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [MessageSchema],
  escalatedToTicket: {
    type: Boolean,
    default: false
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ChatSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Chat', ChatSchema);