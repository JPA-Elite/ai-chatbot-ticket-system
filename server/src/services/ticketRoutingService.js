import {
  DEFAULT_ROUTING_DEPARTMENTS,
  DEPARTMENT_MAPPING,
  PRIORITY_ROUTING,
  STAFF_ROLES,
  TICKET_ACTIVE_STATUSES
} from '../constants/constants.js';
import { classifyTicket } from './aiService.js';
import { findStaffByFilter, findUserById } from '../repositories/staffRepository.js';
import { countTickets, findTicketByIdRaw, saveTicket } from '../repositories/ticketRepository.js';

/**
 * AI-powered ticket routing service
 * Routes tickets to appropriate staff based on content analysis
 */

/**
 * Get staff workload (number of active tickets)
 */
const getStaffWorkload = async (staffId) => {
  const activeTickets = await countTickets({
    assignedTo: staffId,
    status: { $in: TICKET_ACTIVE_STATUSES }
  });
  
  return activeTickets;
};

/**
 * Calculate staff score for ticket assignment
 */
const calculateStaffScore = async (staff, category, priority, description) => {
  let score = 0;
  
  // Department match score (40% weight)
  const relevantDepartments = DEPARTMENT_MAPPING[category] || DEFAULT_ROUTING_DEPARTMENTS;
  if (relevantDepartments.includes(staff.department)) {
    score += 40;
  }
  
  // Workload score (30% weight) - prefer staff with fewer active tickets
  const workload = await getStaffWorkload(staff._id);
  const maxTickets = PRIORITY_ROUTING[priority]?.maxActiveTickets || 8;
  const workloadScore = Math.max(0, (maxTickets - workload) / maxTickets) * 30;
  score += workloadScore;
  
  // Experience score (20% weight) - based on total resolved tickets
  const experienceScore = Math.min(staff.stats.resolvedTickets / 50, 1) * 20;
  score += experienceScore;
  
  // Performance score (10% weight) - based on customer rating
  const performanceScore = (staff.stats.customerRating / 5) * 10;
  score += performanceScore;
  
  // Penalty for overloaded staff
  if (workload >= maxTickets) {
    score *= 0.1; // Heavy penalty for overloaded staff
  }
  
  // Bonus for senior staff on urgent tickets
  if (priority === 'urgent' && staff.role === 'admin') {
    score += 15;
  }
  
  return score;
};

/**
 * Find the best staff member for a ticket
 */
export const findBestStaffForTicket = async (category, priority, description, excludeStaffIds = []) => {
  try {
    // Get all active staff members
    const availableStaff = await findStaffByFilter({
      role: { $in: STAFF_ROLES },
      isActive: { $ne: false },
      _id: { $nin: excludeStaffIds }
    });

    if (availableStaff.length === 0) {
      console.log('No available staff members found');
      return null;
    }

    // Calculate scores for each staff member
    const staffScores = await Promise.all(
      availableStaff.map(async (staff) => {
        const score = await calculateStaffScore(staff, category, priority, description);
        return {
          staff,
          score
        };
      })
    );

    // Sort by score (highest first)
    staffScores.sort((a, b) => b.score - a.score);

    console.log('Staff routing scores:', staffScores.map(s => ({
      name: s.staff.name,
      department: s.staff.department,
      score: s.score.toFixed(2)
    })));

    return staffScores[0]?.staff || null;
  } catch (error) {
    console.error('Error in ticket routing:', error);
    return null;
  }
};

/**
 * Auto-assign ticket to best available staff
 */
export const autoAssignTicket = async (ticketId) => {
  try {
    const ticket = await findTicketByIdRaw(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Skip if already assigned
    if (ticket.assignedTo) {
      console.log('Ticket already assigned, skipping auto-assignment');
      return ticket;
    }

    // Classify ticket if not already classified
    let { category, priority } = ticket;
    if (category === 'other' || !category) {
      const classification = await classifyTicket(ticket.description);
      category = classification.category;
      priority = classification.priority;
      
      // Update ticket with classification
      ticket.category = category;
      ticket.priority = priority;
    }

    // Find best staff member
    const bestStaff = await findBestStaffForTicket(category, priority, ticket.description);
    
    if (bestStaff) {
      ticket.assignedTo = bestStaff._id;
      ticket.status = 'in-progress';
      
      // Add status history
      ticket.statusHistory.push({
        status: 'in-progress',
        changedBy: bestStaff._id,
        notes: `Auto-assigned to ${bestStaff.name} (${bestStaff.department} department) based on AI routing analysis`,
        timestamp: new Date()
      });
      
      await saveTicket(ticket);
      
      console.log(`Ticket ${ticketId} auto-assigned to ${bestStaff.name} (${bestStaff.department})`);
    } else {
      console.log('No suitable staff member found for auto-assignment');
    }

    return ticket;
  } catch (error) {
    console.error('Error in auto-assignment:', error);
    throw error;
  }
};

/**
 * Reassign ticket to different staff member
 */
export const reassignTicket = async (ticketId, newStaffId, adminId, reason = '') => {
  try {
    const ticket = await findTicketByIdRaw(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const newStaff = await findUserById(newStaffId);
    if (!newStaff) {
      throw new Error('Staff member not found');
    }

    const admin = await findUserById(adminId);
    const oldStaffId = ticket.assignedTo;

    // Update assignment
    ticket.assignedTo = newStaffId;
    
    // Add to status history
    ticket.statusHistory.push({
      status: ticket.status,
      changedBy: adminId,
      notes: `Reassigned from ${oldStaffId ? 'previous staff' : 'unassigned'} to ${newStaff.name} (${newStaff.department}). Reason: ${reason || 'Manual reassignment'}`,
      timestamp: new Date()
    });

    await saveTicket(ticket);
    
    console.log(`Ticket ${ticketId} reassigned to ${newStaff.name} by ${admin.name}`);
    
    return ticket;
  } catch (error) {
    console.error('Error in ticket reassignment:', error);
    throw error;
  }
};

/**
 * Get routing suggestions for a ticket
 */
export const getRoutingSuggestions = async (ticketId) => {
  try {
    const ticket = await findTicketByIdRaw(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get all available staff
    const availableStaff = await findStaffByFilter({
      role: { $in: STAFF_ROLES },
      isActive: { $ne: false }
    });

    // Calculate scores for each staff member
    const suggestions = await Promise.all(
      availableStaff.map(async (staff) => {
        const score = await calculateStaffScore(staff, ticket.category, ticket.priority, ticket.description);
        const workload = await getStaffWorkload(staff._id);
        
        return {
          staffId: staff._id,
          name: staff.name,
          department: staff.department,
          role: staff.role,
          score: Math.round(score),
          workload,
          customerRating: staff.stats.customerRating,
          resolvedTickets: staff.stats.resolvedTickets,
          isCurrentlyAssigned: ticket.assignedTo?.toString() === staff._id.toString()
        };
      })
    );

    // Sort by score
    suggestions.sort((a, b) => b.score - a.score);

    return suggestions;
  } catch (error) {
    console.error('Error getting routing suggestions:', error);
    throw error;
  }
};
