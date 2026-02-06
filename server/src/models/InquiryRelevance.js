import mongoose from 'mongoose';

const InquiryRelevanceSchema = new mongoose.Schema({
  userInquiry: {
    type: String,
    required: [true, 'Please add a user inquiry'],
    trim: true,
    maxlength: [1000, 'User inquiry cannot be more than 1000 characters']
  },
  generatedInquiry: {
    type: String,
    required: [true, 'Please add a generated inquiry'],
    maxlength: [1000, 'Generated inquiry cannot be more than 1000 characters']
  },
  generatedResponse: {
    type: String,
    required: [true, 'Please add a generated response'],
    maxlength: [5000, 'Generated response cannot be more than 5000 characters']
  },
  similarityScore: {
    type: Number,
    required: [true, 'Please add a similarity score']
  },
  responsTime: {
    type: Number,
    required: [true, 'Please add a response time in milliseconds']
  },
  isRelevant: {
    type: Number,
    enum: [0, 1], // 0 = Not Relevant, 1 = Relevant
    default: 0
  },
  isUpdated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Inquiry-Relevance', InquiryRelevanceSchema);
