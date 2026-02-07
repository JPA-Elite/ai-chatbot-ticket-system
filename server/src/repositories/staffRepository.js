import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

/**
 * @typedef {Object} StaffRepository
 * @property {() => Promise<import('mongoose').Document[]>} findStaffMembers
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findStaffById
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findUserById
 * @property {() => Promise<number>} countAdmins
 * @property {(email: string) => Promise<import('mongoose').Document|null>} findUserByEmail
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createStaff
 * @property {(staff: import('mongoose').Document) => Promise<import('mongoose').Document>} saveStaff
 * @property {(id: string) => Promise<import('mongoose').Document|null>} deleteStaffById
 * @property {(staffId: string) => Promise<import('mongoose').Document[]>} findTicketsByAssignee
 * @property {(staffId: string) => Promise<import('mongoose').Document[]>} findTicketsByAssigneeWithUser
 * @property {(staffId: string) => Promise<import('mongoose').UpdateWriteOpResult>} unassignTickets
 */

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

/** @type {StaffRepository} */
export const staffRepository = {
  findStaffMembers,
  findStaffById,
  findUserById,
  countAdmins,
  findUserByEmail,
  createStaff,
  saveStaff,
  deleteStaffById,
  findTicketsByAssignee,
  findTicketsByAssigneeWithUser,
  unassignTickets
};
