import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

export const findStaffMembers = () =>
  User.find({ role: { $in: ['staff', 'admin'] } }).select('-password');

export const findStaffById = (id) => User.findById(id).select('-password');

export const findUserById = (id) => User.findById(id);

export const countAdmins = () => User.countDocuments({ role: 'admin' });

export const findUserByEmail = (email) => User.findOne({ email });

export const createStaff = (data) => User.create(data);

export const saveStaff = (staff) => staff.save();

export const deleteStaffById = (id) => User.findByIdAndDelete(id);

export const findTicketsByAssignee = (staffId) =>
  Ticket.find({ assignedTo: staffId });

export const findTicketsByAssigneeWithUser = (staffId) =>
  Ticket.find({ assignedTo: staffId }).populate('userId', 'name email').sort({ createdAt: -1 });

export const unassignTickets = (staffId) =>
  Ticket.updateMany({ assignedTo: staffId }, { $unset: { assignedTo: 1 } });
