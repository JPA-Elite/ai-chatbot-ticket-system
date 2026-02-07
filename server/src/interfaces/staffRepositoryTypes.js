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
 * @property {(filter: Record<string, unknown>, options?: { select?: string, sort?: Record<string, unknown> }) => Promise<import('mongoose').Document[]>} findStaffByFilter
 */

export {};
