import Ticket from '../models/Ticket.js';
import { classifyTicket } from '../services/aiService.js';
import { sendTicketCreatedToStaff, sendTicketAcceptedToStudent } from '../services/emailService.js';

// @desc    Get all tickets (admin only)
// @route   GET /api/tickets
// @access  Private/Admin
export const getAllTickets = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filter by status if provided
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.user.role === 'staff') {
      const me = await (await import('../models/User.js')).default.findById(req.user.id).select('tags');
      const myTags = (me?.tags || []).map(t => String(t).trim()).filter(Boolean);

      const tagFilter = myTags.length
        ? { $in: myTags }
        : { $in: [] };

      filter = {
        ...filter,
        $or: [
          { assignedTo: req.user.id },
          { assignedTo: null, tag: tagFilter }
        ]
      };
    }

    const tickets = await Ticket.find(filter)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Ticket.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      pagination: {
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      data: tickets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user tickets
// @route   GET /api/tickets/user
// @access  Private
export const getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id })
      .populate('assignedTo', 'name email department')
      .populate('acceptedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email department')
      .populate('acceptedBy', 'name email')
      .populate({
        path: 'messages.sender',
        select: 'name role'
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const isOwner = ticket.userId._id.toString() === req.user.id;
    const isStaff = req.user.role === 'admin' || req.user.role === 'staff';
    const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === req.user.id;

    if (!isOwner && !isStaff && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ticket'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private/Admin
export const updateTicket = async (req, res) => {
  try {
    const { status, priority, category, assignedTo } = req.body;

    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Only admins can update tickets
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update tickets'
      });
    }

    // Update fields
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;
    if (assignedTo) ticket.assignedTo = assignedTo;

    await ticket.save();

    // Get updated ticket with populated fields
    ticket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add message to ticket
// @route   POST /api/tickets/:id/message
// @access  Private
export const addTicketMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const isOwner = ticket.userId.toString() === req.user.id;
    const isStaff = req.user.role === 'admin' || req.user.role === 'staff';
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isOwner && !isStaff && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add messages to this ticket'
      });
    }

    ticket.messages.push({
      sender: req.user.id,
      content
    });

    if ((req.user.role === 'admin' || req.user.role === 'staff') && ticket.status === 'accepted') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email department')
      .populate('acceptedBy', 'name email')
      .populate({
        path: 'messages.sender',
        select: 'name role'
      });

    res.status(200).json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Classify ticket using AI
// @route   POST /api/tickets/:id/classify
// @access  Private/Admin
export const classifyTicketAI = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'chatId',
        select: 'messages'
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to classify tickets'
      });
    }

    const chatMessages = ticket.chatId ? ticket.chatId.messages : [];

    const { category, priority } = await classifyTicket(ticket.description, chatMessages);

    ticket.category = category;
    ticket.priority = priority;

    await ticket.save();

    res.status(200).json({
      success: true,
      data: {
        ticketId: ticket._id,
        category,
        priority
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const acceptTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This ticket has already been accepted by another staff member'
      });
    }

    if (req.user.role === 'staff') {
      const User = (await import('../models/User.js')).default;
      const me = await User.findById(req.user.id).select('tags');
      const myTags = (me?.tags || []).map(t => String(t).trim());

      const ticketTag = String(ticket.tag || '').trim();
      const allowed = ticketTag && myTags.includes(ticketTag);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to accept this ticket (tag not assigned to your account)'
        });
      }
    }

    ticket.status = 'accepted';
    ticket.acceptedBy = req.user.id;
    ticket.acceptedAt = new Date();
    ticket.assignedTo = req.user.id;

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'messages.sender',
        select: 'name role'
      });

  try {
      const studentName = updatedTicket.userId?.name || 'Student';
      const studentEmail = updatedTicket.userId?.email || '';
      const staffName = updatedTicket.acceptedBy?.name || 'Staff';
      if (studentEmail) {
        await sendTicketAcceptedToStudent(updatedTicket, studentName, studentEmail, staffName);
      }
    } catch (emailError) {
      console.error('Error sending acceptance email:', emailError);
    }

    res.status(200).json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const endConversation = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end conversation'
      });
    }

    ticket.status = 'resolved';

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'messages.sender',
        select: 'name role'
      });

    res.status(200).json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};