import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

// @desc    Get all staff members with statistics
// @route   GET /api/staff
// @access  Private/Admin
export const getAllStaff = async (req, res) => {
  try {
    // Get all staff and admin users
    const staffMembers = await User.find({
      role: { $in: ['staff', 'admin'] }
    }).select('-password');

    // Calculate statistics for each staff member
    const staffWithStats = await Promise.all(
      staffMembers.map(async (staff) => {
        // Get tickets assigned to this staff member
        const tickets = await Ticket.find({ assignedTo: staff._id });

        const totalTickets = tickets.length;
        const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

        // Calculate average resolution time (mock calculation)
        const avgResolutionTime = totalTickets > 0 ?
          Math.random() * 8 + 2 : 0; // Random between 2-10 hours for demo

        // Calculate customer rating (mock)
        const customerRating = totalTickets > 0 ?
          Math.random() * 1.5 + 3.5 : 0; // Random between 3.5-5.0 for demo

        // Calculate weekly and monthly resolved tickets
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const thisWeekResolved = tickets.filter(t =>
          (t.status === 'resolved' || t.status === 'closed') &&
          new Date(t.updatedAt) >= weekAgo
        ).length;

        const thisMonthResolved = tickets.filter(t =>
          (t.status === 'resolved' || t.status === 'closed') &&
          new Date(t.updatedAt) >= monthAgo
        ).length;

        return {
          ...staff.toObject(),
          // Ensure isActive defaults to true if not set
          isActive: staff.isActive !== undefined ? staff.isActive : true,
          stats: {
            totalTickets,
            resolvedTickets,
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
            customerRating: Math.round(customerRating * 10) / 10,
            activeTickets,
            thisWeekResolved,
            thisMonthResolved
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: staffWithStats.length,
      data: staffWithStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get staff member by ID with detailed statistics
// @route   GET /api/staff/:id
// @access  Private/Admin
export const getStaffById = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get detailed ticket statistics
    const tickets = await Ticket.find({ assignedTo: staff._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const stats = {
      totalTickets: tickets.length,
      resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      activeTickets: tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length,
      categoryBreakdown: {
        technical: tickets.filter(t => t.category === 'technical').length,
        billing: tickets.filter(t => t.category === 'billing').length,
        account: tickets.filter(t => t.category === 'account').length,
        feature: tickets.filter(t => t.category === 'feature').length,
        bug: tickets.filter(t => t.category === 'bug').length,
        other: tickets.filter(t => t.category === 'other').length
      },
      priorityBreakdown: {
        low: tickets.filter(t => t.priority === 'low').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        high: tickets.filter(t => t.priority === 'high').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        ...staff.toObject(),
        stats,
        recentTickets: tickets.slice(0, 10)
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

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
export const updateStaff = async (req, res) => {
  try {
    const { name, email, role, isActive, department } = req.body;

    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // check for email uniqueness
    if (email && email !== staff.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
    }

    // Update fields
    if (name) staff.name = name;
    if (email) staff.email = email;
    if (role) staff.role = role;
    if (typeof isActive === 'boolean') staff.isActive = isActive;
    if (department) staff.department = department;

    await staff.save();

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private/Admin
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create staff member
    const staff = await User.create({
      name,
      email,
      password,
      role: role || 'staff',
      department: department || 'support',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        isActive: staff.isActive
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

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Don't allow deletion of the last admin
    if (staff.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    // Reassign tickets to other staff members or mark as unassigned
    await Ticket.updateMany(
      { assignedTo: staff._id },
      { $unset: { assignedTo: 1 } }
    );

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current staff member's statistics
// @route   GET /api/staff/my-stats
// @access  Private/Staff
export const getMyStats = async (req, res) => {
  try {
    const staffId = req.user.id;

    // Get tickets assigned to this staff member
    const tickets = await Ticket.find({ assignedTo: staffId });

    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

    // Calculate average resolution time (mock calculation for now)
    const avgResolutionTime = totalTickets > 0 ?
      Math.random() * 6 + 2 : 0; // Random between 2-8 hours for demo

    // Calculate customer rating (mock)
    const customerRating = totalTickets > 0 ?
      Math.random() * 1.5 + 3.5 : 0; // Random between 3.5-5.0 for demo

    // Calculate weekly and monthly resolved tickets
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeekResolved = tickets.filter(t =>
      (t.status === 'resolved' || t.status === 'closed') &&
      new Date(t.updatedAt) >= weekAgo
    ).length;

    const thisMonthResolved = tickets.filter(t =>
      (t.status === 'resolved' || t.status === 'closed') &&
      new Date(t.updatedAt) >= monthAgo
    ).length;

    // Category breakdown
    const categoryBreakdown = {
      technical: tickets.filter(t => t.category === 'technical').length,
      billing: tickets.filter(t => t.category === 'billing').length,
      account: tickets.filter(t => t.category === 'account').length,
      feature: tickets.filter(t => t.category === 'feature').length,
      bug: tickets.filter(t => t.category === 'bug').length,
      other: tickets.filter(t => t.category === 'other').length
    };

    // Priority breakdown
    const priorityBreakdown = {
      low: tickets.filter(t => t.priority === 'low').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      high: tickets.filter(t => t.priority === 'high').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length
    };

    // Generate mock weekly and monthly trends
    const weeklyTrend = Array.from({ length: 7 }, () => Math.floor(Math.random() * 15) + 5);
    const monthlyTrend = Array.from({ length: 6 }, () => Math.floor(Math.random() * 50) + 20);

    const stats = {
      totalTickets,
      resolvedTickets,
      activeTickets,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      customerRating: Math.round(customerRating * 10) / 10,
      thisWeekResolved,
      thisMonthResolved,
      categoryBreakdown,
      priorityBreakdown,
      weeklyTrend,
      monthlyTrend
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};