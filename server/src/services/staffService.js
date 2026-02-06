import {
  CANNOT_DELETE_LAST_ADMIN_MESSAGE,
  EMAIL_ALREADY_IN_USE_MESSAGE,
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  STAFF_MEMBER_DELETED_MESSAGE,
  STAFF_MEMBER_NOT_FOUND_MESSAGE
} from '../constants/controllerMessages.js';
import {
  countAdmins,
  createStaff,
  deleteStaffById,
  findStaffById,
  findStaffMembers,
  findTicketsByAssignee,
  findTicketsByAssigneeWithUser,
  findUserByEmail,
  findUserById,
  saveStaff,
  unassignTickets
} from '../repositories/staffRepository.js';

export const getAllStaffData = async () => {
  const staffMembers = await findStaffMembers();

  const staffWithStats = await Promise.all(
    staffMembers.map(async (staff) => {
      const tickets = await findTicketsByAssignee(staff._id);

      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

      const avgResolutionTime = totalTickets > 0 ? Math.random() * 8 + 2 : 0;
      const customerRating = totalTickets > 0 ? Math.random() * 1.5 + 3.5 : 0;

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
        isActive: staff.isActive !== undefined ? staff.isActive : true,
        tags: Array.isArray(staff.tags) ? staff.tags : [],
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

  return {
    status: 200,
    payload: {
      success: true,
      count: staffWithStats.length,
      data: staffWithStats
    }
  };
};

export const getStaffByIdData = async (id) => {
  const staff = await findStaffById(id);
  if (!staff) {
    return {
      status: 404,
      payload: { success: false, message: STAFF_MEMBER_NOT_FOUND_MESSAGE }
    };
  }

  const tickets = await findTicketsByAssigneeWithUser(staff._id);

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

  return {
    status: 200,
    payload: {
      success: true,
      data: {
        ...staff.toObject(),
        stats,
        recentTickets: tickets.slice(0, 10)
      }
    }
  };
};

export const updateStaffData = async (id, { name, email, role, isActive, department, tags }) => {
  const staff = await findUserById(id);
  if (!staff) {
    return {
      status: 404,
      payload: { success: false, message: STAFF_MEMBER_NOT_FOUND_MESSAGE }
    };
  }

  if (email && email !== staff.email) {
    const emailExists = await findUserByEmail(email);
    if (emailExists) {
      return {
        status: 400,
        payload: { success: false, message: EMAIL_ALREADY_IN_USE_MESSAGE }
      };
    }
  }

  if (name) staff.name = name;
  if (email) staff.email = email;
  if (role) staff.role = role;
  if (typeof isActive === 'boolean') staff.isActive = isActive;
  if (department) staff.department = department;
  if (Array.isArray(tags)) {
    staff.tags = tags.map(t => String(t).trim()).filter(Boolean);
  }

  await saveStaff(staff);

  return { status: 200, payload: { success: true, data: staff } };
};

export const createStaffData = async ({ name, email, password, role, department, tags }) => {
  const userExists = await findUserByEmail(email);
  if (userExists) {
    return {
      status: 400,
      payload: { success: false, message: EMAIL_ALREADY_REGISTERED_MESSAGE }
    };
  }

  const staff = await createStaff({
    name,
    email,
    password,
    role: role || 'staff',
    department: department || 'support',
    isActive: true,
    tags: Array.isArray(tags)
      ? tags.map(t => String(t).trim()).filter(Boolean)
      : []
  });

  return {
    status: 201,
    payload: {
      success: true,
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        isActive: staff.isActive,
        tags: staff.tags || []
      }
    }
  };
};

export const deleteStaffData = async (id) => {
  const staff = await findUserById(id);
  if (!staff) {
    return {
      status: 404,
      payload: { success: false, message: STAFF_MEMBER_NOT_FOUND_MESSAGE }
    };
  }

  if (staff.role === 'admin') {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      return {
        status: 400,
        payload: { success: false, message: CANNOT_DELETE_LAST_ADMIN_MESSAGE }
      };
    }
  }

  await unassignTickets(staff._id);
  await deleteStaffById(id);

  return {
    status: 200,
    payload: { success: true, message: STAFF_MEMBER_DELETED_MESSAGE }
  };
};

export const getMyStatsData = async (staffId) => {
  const tickets = await findTicketsByAssignee(staffId);

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const activeTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  const avgResolutionTime = totalTickets > 0 ? Math.random() * 6 + 2 : 0;
  const customerRating = totalTickets > 0 ? Math.random() * 1.5 + 3.5 : 0;

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

  const categoryBreakdown = {
    technical: tickets.filter(t => t.category === 'technical').length,
    billing: tickets.filter(t => t.category === 'billing').length,
    account: tickets.filter(t => t.category === 'account').length,
    feature: tickets.filter(t => t.category === 'feature').length,
    bug: tickets.filter(t => t.category === 'bug').length,
    other: tickets.filter(t => t.category === 'other').length
  };

  const priorityBreakdown = {
    low: tickets.filter(t => t.priority === 'low').length,
    medium: tickets.filter(t => t.priority === 'medium').length,
    high: tickets.filter(t => t.priority === 'high').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length
  };

  const weeklyTrend = Array.from({ length: 7 }, () => Math.floor(Math.random() * 15) + 5);
  const monthlyTrend = Array.from({ length: 6 }, () => Math.floor(Math.random() * 50) + 20);

  return {
    status: 200,
    payload: {
      success: true,
      data: {
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
      }
    }
  };
};
