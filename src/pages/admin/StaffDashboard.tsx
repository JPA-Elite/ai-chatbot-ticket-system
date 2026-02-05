import React, { useEffect, useState } from 'react';
import { Users, UserPlus, BarChart3, Clock, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Modal from '../../components/modal/ui/Modal';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  department?: string;
  tags?: string[];
  stats: {
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number; // in hours
    customerRating: number;
    activeTickets: number;
    thisWeekResolved: number;
    thisMonthResolved: number;
  };
}

const StaffDashboard: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStaff, setEditStaff] = useState<{
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
    tags: string[];
    tagsText: string;
    password?: string;
    confirmPassword?: string;
  } | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    tagsText: '',
    password: '',
    confirmPassword: '',
  });
  const { token, user: currentUser } = useAuth();

  const parseTags = (value: string) =>
    value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

  const tagsToText = (tags?: string[]) => (tags || []).join(', ');

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:5000/api/staff', {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      if (response.data.success) {
        setStaffMembers(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch staff members');
      }
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
      setError(error.message);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const getOverallStats = () => {
    const activeStaff = staffMembers.filter(staff => staff.isActive);
    const totalTickets = staffMembers.reduce((sum, staff) => sum + staff.stats.totalTickets, 0);
    const totalResolved = staffMembers.reduce((sum, staff) => sum + staff.stats.resolvedTickets, 0);
    const avgRating = staffMembers.reduce((sum, staff) => sum + staff.stats.customerRating, 0) / staffMembers.length;
    const totalActive = staffMembers.reduce((sum, staff) => sum + staff.stats.activeTickets, 0);

    return {
      activeStaff: activeStaff.length,
      totalStaff: staffMembers.length,
      totalTickets,
      totalResolved,
      resolutionRate: totalTickets > 0 ? (totalResolved / totalTickets) * 100 : 0,
      avgRating: avgRating || 0,
      totalActive
    };
  };

  const getTopPerformers = () => {
    return [...staffMembers]
      .filter(staff => staff.isActive)
      .sort((a, b) => {
        const scoreA = (a.stats.customerRating * 0.4) +
          ((a.stats.resolvedTickets / Math.max(a.stats.totalTickets, 1)) * 0.3) +
          ((10 - Math.min(a.stats.avgResolutionTime, 10)) * 0.3);
        const scoreB = (b.stats.customerRating * 0.4) +
          ((b.stats.resolvedTickets / Math.max(b.stats.totalTickets, 1)) * 0.3) +
          ((10 - Math.min(b.stats.avgResolutionTime, 10)) * 0.3);
        return scoreB - scoreA;
      })
      .slice(0, 3);
  };

  const overallStats = getOverallStats();
  const topPerformers = getTopPerformers();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Staff Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchStaffMembers}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Staff Management Dashboard
        </motion.h1>
        <p className="text-gray-600">Monitor team performance and manage support staff</p>
      </div>

      {/* Overall Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.activeStaff}/{overallStats.totalStaff}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.resolutionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full mr-4">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.avgRating.toFixed(1)}/5.0
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full mr-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalActive}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((staff, index) => (
            <motion.div
              key={staff._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                  <p className="text-sm text-gray-600">{staff.role}</p>
                </div>
                {index === 0 && (
                  <div className="ml-auto">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-yellow-800" />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <span className="font-medium">{staff.stats.customerRating}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resolved:</span>
                  <span className="font-medium">{staff.stats.resolvedTickets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Time:</span>
                  <span className="font-medium">{staff.stats.avgResolutionTime}h</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Staff Performance</h2>
          <div className="flex space-x-2">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm rounded-md ${selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Resolution Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Tickets
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff, index) => (
                <motion.tr
                  key={staff._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-4">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">{staff.email}</div>
                        <div className="text-xs text-gray-400">
                          {staff.role} {staff.department && `• ${staff.department}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {(staff.tags && staff.tags.length) ? (
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {staff.tags.slice(0, 8).map(tag => (
                          <span
                            key={`${staff._id}-${tag}`}
                            className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {staff.tags.length > 8 && (
                          <span className="text-xs text-gray-500">+{staff.tags.length - 8}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No tags</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${staff.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {selectedPeriod === 'week'
                        ? staff.stats.thisWeekResolved
                        : selectedPeriod === 'month'
                          ? staff.stats.thisMonthResolved
                          : staff.stats.resolvedTickets
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      of {staff.stats.totalTickets} total
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staff.stats.avgResolutionTime}h</div>
                    <div className={`text-xs ${staff.stats.avgResolutionTime <= 4
                      ? 'text-green-600'
                      : staff.stats.avgResolutionTime <= 6
                        ? 'text-yellow-600'
                        : 'text-red-600'
                      }`}>
                      {staff.stats.avgResolutionTime <= 4 ? 'Excellent' :
                        staff.stats.avgResolutionTime <= 6 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">{staff.stats.customerRating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${staff.stats.activeTickets <= 5
                      ? 'bg-green-100 text-green-800'
                      : staff.stats.activeTickets <= 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {staff.stats.activeTickets}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          const initialTags = staff.tags || [];
                          setEditStaff({
                            _id: staff._id,
                            name: staff.name,
                            email: staff.email,
                            isActive: staff.isActive,
                            tags: initialTags,
                            tagsText: tagsToText(initialTags),
                          });
                          setShowEditModal(true);
                        }}>
                        Edit
                      </button>
                      <button
                        className={`text-red-600 hover:text-red-900 ${staff._id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={staff._id == currentUser?.id}
                        onClick={() => {
                          setSelectedStaffId(staff._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Button */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={fetchStaffMembers}
          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          Refresh Data
        </button>
        <button
          onClick={() => {
            setNewStaff({
              name: '',
              email: '',
              tagsText: '',
              password: '',
              confirmPassword: '',
            });
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add New Staff Member
        </button>
      </div>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        title="Delete Staff Member"
        onClose={() => setShowDeleteModal(false)}
        size='sm'
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this staff member? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedStaffId) return;
              handleDeleteStaff(selectedStaffId);
              setShowDeleteModal(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        open={showAddModal}
        title="Add Staff Member"
        onClose={() => setShowAddModal(false)}
        size='sm'
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border px-3 py-2 rounded"
            value={newStaff.name}
            onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full border px-3 py-2 rounded"
            value={newStaff.email}
            onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
          />

          <input
            type="text"
            placeholder="Tags (comma-separated)"
            className="w-full border px-3 py-2 rounded"
            value={newStaff.tagsText}
            onChange={e => setNewStaff({ ...newStaff, tagsText: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border px-3 py-2 rounded"
            value={newStaff.password}
            onChange={e =>
              setNewStaff({ ...newStaff, password: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full border px-3 py-2 rounded"
            value={newStaff.confirmPassword}
            onChange={e =>
              setNewStaff({ ...newStaff, confirmPassword: e.target.value })
            }
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStaff}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Staff
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        open={showEditModal}
        title="Edit Staff Member"
        onClose={() => setShowEditModal(false)}
        size='sm'
      >
        {editStaff && (
          <div className="space-y-4">
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={editStaff.name}
              onChange={e =>
                setEditStaff({ ...editStaff, name: e.target.value })
              }
            />

            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={editStaff.email}
              onChange={e =>
                setEditStaff({ ...editStaff, email: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Tags (comma-separated)"
              className="w-full border px-3 py-2 rounded"
              value={editStaff.tagsText}
              onChange={e =>
                setEditStaff({
                  ...editStaff,
                  tagsText: e.target.value,
                  tags: parseTags(e.target.value),
                })
              }
            />

            <input
              type="password"
              placeholder="New Password (optional)"
              className="w-full border px-3 py-2 rounded"
              value={editStaff.password || ''}
              onChange={e =>
                setEditStaff({ ...editStaff, password: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full border px-3 py-2 rounded"
              value={editStaff.confirmPassword || ''}
              onChange={e =>
                setEditStaff({ ...editStaff, confirmPassword: e.target.value })
              }
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editStaff.isActive}
                onChange={e =>
                  setEditStaff({ ...editStaff, isActive: e.target.checked })
                }
              />
              Active
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaff}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );

  function handleDeleteStaff(staffId: string) {
    axios.delete(`http://localhost:5000/api/staff/${staffId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    })
      .then(res => {
        if (res.data.success) {
          toast.success('Staff member deleted successfully');
          fetchStaffMembers();
        } else {
          toast.error(res.data.message || 'Failed to delete staff member');
        }
      })
      .catch(err => {
        console.error('Error deleting staff member:', err);
        toast.error('Error deleting staff member');
      });
  }

  function handleAddStaff() {
    if (newStaff.password !== newStaff.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    axios.post('http://localhost:5000/api/staff',
      {
        name: newStaff.name,
        email: newStaff.email,
        tags: parseTags(newStaff.tagsText),
        password: newStaff.password,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
      })
      .then(res => {
        if (res.data.success) {
          toast.success('Staff member added successfully');
          setShowAddModal(false);
          setNewStaff({
            name: '',
            email: '',
            tagsText: '',
            password: '',
            confirmPassword: '',
          });
          fetchStaffMembers();
        } else {
          toast.error(res.data.message || 'Failed to add staff member');
        }
      })
      .catch(err => {
        console.error('Error adding staff member:', err);
        toast.error(err?.response?.data?.message || 'Error adding staff member');
      });
  }

  function handleUpdateStaff() {
    if (!editStaff) return;

    if (
      editStaff.password &&
      editStaff.password !== editStaff.confirmPassword
    ) {
      toast.error('Passwords do not match');
      return;
    }

    axios.put(
      `http://localhost:5000/api/staff/${editStaff._id}`,
      {
        name: editStaff.name,
        email: editStaff.email,
        isActive: editStaff.isActive,
        tags: editStaff.tags,
        ...(editStaff.password && { password: editStaff.password }),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(res => {
        if (res.data.success) {
          toast.success('Staff member updated successfully');
          setShowEditModal(false);
          setEditStaff(null);
          fetchStaffMembers();
        } else {
          toast.error(res.data.message || 'Failed to update staff member');
        }
      })
      .catch(err => {
        console.error('Error updating staff member:', err);
        toast.error(err?.response?.data?.message || 'Error updating staff member');
      });
  }

};

export default StaffDashboard;