import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema({
  promptQuestion: {
    type: String,
    required: [true, 'Please add a prompt question'],
    trim: true,
    maxlength: [1000, 'Prompt question cannot be more than 1000 characters']
  },
  promptResponse: {
    type: String,
    required: [true, 'Please add a prompt response'],
    unique: true,
    maxlength: [5000, 'Prompt response cannot be more than 5000 characters']
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Inquiry', InquirySchema);