/**
 * @typedef {Object} TicketRepository
 * @property {(filter: Record<string, unknown>, options: { sort: Record<string, unknown>, skip: number, limit: number }) => Promise<import('mongoose').Document[]>} findTickets
 * @property {(filter: Record<string, unknown>) => Promise<number>} countTickets
 * @property {(userId: string) => Promise<import('mongoose').Document[]>} findTicketsByUserId
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findTicketById
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findTicketByIdWithChat
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findTicketByIdRaw
 * @property {(ticket: import('mongoose').Document) => Promise<import('mongoose').Document>} saveTicket
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createTicket
 */

export {};
