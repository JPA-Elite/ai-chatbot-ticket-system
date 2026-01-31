import React, { useEffect, useState } from 'react';
import { UserPlus, AlertTriangle, Search, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Modal from '../../components/modal/ui/Modal';

interface Inquiry {
  _id: string;
  promptQuestion: string;
  promptResponse: string;
  isEnabled: boolean;
  createdAt: string;
}

const InquiryDashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInquiry, setEditInquiry] = useState<{
    _id: string;
    promptQuestion: string;
    promptResponse: string;
    isEnabled: boolean;
  } | null>(null);

  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [newInquiry, setNewInquiry] = useState({
    promptQuestion: '',
    promptResponse: '',
    isEnabled: true,
  });
  const { token, user: currentUser } = useAuth();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(5);


  const fetchInquiries = async (page = 1,
    search = '',
    limit = perPage
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get('http://localhost:5000/api/inquiry', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search },
      });

      if (res.data.success) {
        setInquiries(res.data.data);
        setCurrentPage(res.data.page);
        setTotalPages(res.data.totalPages);
      } else {
        throw new Error(res.data.message || 'Failed to fetch inquiries');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = () => {
    toast.info('CSV import coming soon');
  }


  // Fetch when page or search changes
  useEffect(() => {
    fetchInquiries(currentPage, searchQuery);
  }, [currentPage]);

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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Inquiry Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchInquiries(currentPage, searchQuery)}
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
          Inquiry Management
        </motion.h1>
        <p className="text-gray-600">Train AI (Artificial Intelligence) model by creating custom multiple inquiries</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleImportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Upload className="h-5 w-5" />
          Import CSV
        </button>
        <button
          onClick={() => {
            setNewInquiry({
              promptQuestion: '',
              promptResponse: '',
              isEnabled: true,
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <UserPlus className="h-5 w-5" />
          Add New Inquiry
        </button>
      </div>


      <div className="mb-4 flex items-center justify-between">
        {/* Per Page (LEFT) */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show</label>
          <select
            value={perPage}
            onChange={e => {
              const value = Number(e.target.value);
              setPerPage(value);
              setCurrentPage(1);
              fetchInquiries(1, searchQuery, value);
            }}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>

        {/* Search (RIGHT) */}
        <div className="flex items-center space-x-2 w-full max-w-md">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                fetchInquiries(1, searchQuery, perPage);
              }
            }}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchInquiries(1, searchQuery, perPage);
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Inquiry Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inquiries.map((inquiry, index) => (
                <motion.tr
                  key={inquiry._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{inquiry.promptQuestion}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        {inquiry.promptResponse}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${inquiry.isEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {inquiry.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setEditInquiry({
                            _id: inquiry._id,
                            promptQuestion: inquiry.promptQuestion,
                            promptResponse: inquiry.promptResponse,
                            isEnabled: inquiry.isEnabled,
                          });
                          setShowEditModal(true);
                        }}>
                        Edit
                      </button>
                      <button
                        className={`text-red-600 hover:text-red-900 ${inquiry._id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={inquiry._id === currentUser?.id}
                        onClick={() => {
                          setSelectedInquiryId(inquiry._id);
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
          {/* Pagination */}
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
            {/* Info */}
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * perPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * perPage, totalPages * perPage)}
                </span>{' '}
                of <span className="font-medium">{totalPages * perPage}</span> results
              </p>
            </div>

            {/* Pagination Controls */}
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              {/* Previous */}
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">Previous</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <span className="sr-only">Next</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        title="Delete Inquiry"
        onClose={() => setShowDeleteModal(false)}
        size='sm'
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this inquiry? This action cannot be undone.
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
              if (!selectedInquiryId) return;
              handleDeleteInquiry(selectedInquiryId);
              setShowDeleteModal(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Add Inquiry Modal */}
      <Modal
        open={showAddModal}
        title="Add Inquiry"
        onClose={() => setShowAddModal(false)}
        size='md'
      >
        <div className="space-y-4">
          <textarea
            placeholder={`ex: How can I reset my password if I forgot my email?`}
            className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
            rows={5}
            cols={20}
            value={newInquiry.promptQuestion}
            onChange={e =>
              setNewInquiry({ ...newInquiry, promptQuestion: e.target.value })
            }
          />
          <textarea
            placeholder="ex: To reset your password, click on 'Forgot Password' at the login page and follow the instructions sent to your registered email."
            className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
            rows={15}
            cols={20}
            value={newInquiry.promptResponse}
            onChange={e =>
              setNewInquiry({ ...newInquiry, promptResponse: e.target.value })
            }
          />
          {/* Status Toggle */}
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="status"
                checked={newInquiry.isEnabled === true}
                onChange={() =>
                  setNewInquiry({ ...newInquiry, isEnabled: true })
                }
              />
              Enabled
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="status"
                checked={newInquiry.isEnabled === false}
                onChange={() =>
                  setNewInquiry({ ...newInquiry, isEnabled: false })
                }
              />
              Disabled
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleAddInquiry}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Inquiry
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Inquiry Modal */}
      <Modal
        open={showEditModal}
        title="Edit Inquiry"
        onClose={() => setShowEditModal(false)}
      >
        {editInquiry && (
          <div className="space-y-4">
            <textarea
              placeholder="Edit Prompt Question..."
              className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
              rows={5}
              cols={20}
              value={editInquiry.promptQuestion}
              onChange={e =>
                setEditInquiry({ ...editInquiry, promptQuestion: e.target.value })
              }
            />
            <textarea
              placeholder="Edit Prompt Response..."
              className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
              rows={15}
              cols={20}
              value={editInquiry.promptResponse}
              onChange={e =>
                setEditInquiry({ ...editInquiry, promptResponse: e.target.value })
              }
            />
            {/* Status Toggle */}
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  checked={editInquiry.isEnabled === true}
                  onChange={() =>
                    setEditInquiry({ ...editInquiry, isEnabled: true })
                  }
                />
                Enabled
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  checked={editInquiry.isEnabled === false}
                  onChange={() =>
                    setEditInquiry({ ...editInquiry, isEnabled: false })
                  }
                />
                Disabled
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInquiry}
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

  function handleDeleteInquiry(inquiryId: string) {
    axios.delete(`http://localhost:5000/api/inquiry/${inquiryId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    })
      .then(res => {
        if (res.data.success) {
          toast.success('Inquiry deleted successfully');
          fetchInquiries();
        } else {
          toast.error(res.data.message || 'Failed to delete inquiry');
        }
      })
      .catch(err => {
        console.error('Error deleting inquiry:', err);
        toast.error(err?.response?.data?.message || 'Error deleting inquiry');
      });
  }

  function handleAddInquiry() {
    axios.post('http://localhost:5000/api/inquiry',
      {
        promptQuestion: newInquiry.promptQuestion,
        promptResponse: newInquiry.promptResponse,
        isEnabled: newInquiry.isEnabled,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
      })
      .then(res => {
        if (res.data.success) {
          toast.success('Inquiry added successfully');
          setShowAddModal(false);
          setNewInquiry({
            promptQuestion: '',
            promptResponse: '',
            isEnabled: true,
          });
          fetchInquiries();
        } else {
          toast.error(res.data.message || 'Failed to add inquiry');
        }
      })
      .catch(err => {
        console.error('Error adding inquiry:', err);
        toast.error(err?.response?.data?.message || 'Error adding inquiry');
      });
  }

  function handleUpdateInquiry() {
    if (!editInquiry) return;

    axios.put(
      `http://localhost:5000/api/inquiry/${editInquiry._id}`,
      {
        promptQuestion: editInquiry.promptQuestion,
        promptResponse: editInquiry.promptResponse,
        isEnabled: editInquiry.isEnabled,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(res => {
        if (res.data.success) {
          toast.success('Inquiry updated successfully');
          setShowEditModal(false);
          setEditInquiry(null);
          fetchInquiries();
        } else {
          toast.error(res.data.message || 'Failed to update inquiry');
        }
      })
      .catch(err => {
        console.error('Error updating inquiry:', err);
        toast.error(err?.response?.data?.message || 'Error updating inquiry');
      });
  }

};

export default InquiryDashboard;