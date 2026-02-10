import React, { useEffect, useRef, useState } from 'react';
import { UserPlus, AlertTriangle, Search, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
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

  // Pagination + Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  // Import flow
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingText, setProcessingText] = useState(
    'Creating possible inquiries based on the uploaded file...'
  );
  const [showSelectCountModal, setShowSelectCountModal] = useState(false);
  const [selectedInquiryCount, setSelectedInquiryCount] = useState(10);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isProcessingSuccess, setIsProcessingSuccess] = useState(false);
  const [hasCreatedInquiries, setHasCreatedInquiries] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_FILE_SIZE_MB = 1;
  const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

  const fetchInquiries = async (
    page = 1,
    search = searchQuery,
    limit = perPage,
    status = statusFilter
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE_URL}/api/inquiry`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search, status },
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to fetch inquiries');
      }

      const pageFromApi = Number(res.data.page || 1);
      const totalFromApi = Number(res.data.totalPages || 1);

      setInquiries(res.data.data || []);
      setTotalPages(totalFromApi);

      // ✅ Clamp page based on backend response (prevents page drift after delete/search/import)
      const safePage = Math.min(Math.max(pageFromApi, 1), totalFromApi);
      setCurrentPage(safePage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load inquiries');
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Backend-driven: refetch whenever any server-side paging inputs change
  useEffect(() => {
    fetchInquiries(currentPage, searchQuery, perPage, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage, statusFilter]);

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(next);
    // optional immediate fetch (useEffect also covers it)
    fetchInquiries(next, searchQuery, perPage, statusFilter);
  };

  // Max 3 buttons
  const getPaginationRange = (current: number, total: number): number[] => {
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);

    let start = current - 1;
    let end = current + 1;

    if (start < 1) {
      start = 1;
      end = 3;
    }

    if (end > total) {
      end = total;
      start = total - 2;
    }

    return [start, start + 1, start + 2];
  };

  // File import handlers
  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const uploadFileWithCount = async (file: File, count: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('count', String(count));

    try {
      setShowProcessingModal(true);
      setIsProcessingSuccess(false);

      const { data } = await axios.post(`${API_BASE_URL}/api/inquiry/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProcessingText('Creating inquiries...');

      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsProcessingSuccess(true);

      if (data?.inquiries && data.inquiries.length > 0) {
        setHasCreatedInquiries(true);
        setProcessingText('Inquiries created successfully!');
      } else {
        setHasCreatedInquiries(false);
        setProcessingText('Sorry, no inquiries were created.');
      }

      // ✅ After import, refresh from page 1 (safer)
      setCurrentPage(1);
      await fetchInquiries(1, searchQuery, perPage, statusFilter);

      setTimeout(() => {
        setShowProcessingModal(false);
        setProcessingText('Creating possible inquiries based on the uploaded file...');
        setIsProcessingSuccess(false);
        setHasCreatedInquiries(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Import failed');
      setShowProcessingModal(false);
      setIsProcessingSuccess(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['csv', 'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExtensions.includes(ext)) {
      toast.error('Unsupported file type');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 1MB limit');
      e.target.value = '';
      return;
    }

    setPendingFile(file);
    setShowSelectCountModal(true);

    e.target.value = '';
  };

  // CRUD handlers
  const handleDeleteInquiry = async (inquiryId: string) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/inquiry/${inquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast.success('Inquiry deleted successfully');

        // ✅ refresh same page; backend clamp will correct if last page shrank
        await fetchInquiries(currentPage, searchQuery, perPage, statusFilter);
      } else {
        toast.error(res.data?.message || 'Failed to delete inquiry');
      }
    } catch (err: any) {
      console.error('Error deleting inquiry:', err);
      toast.error(err?.response?.data?.message || 'Error deleting inquiry');
    }
  };

  const handleAddInquiry = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/inquiry`,
        {
          promptQuestion: newInquiry.promptQuestion,
          promptResponse: newInquiry.promptResponse,
          isEnabled: newInquiry.isEnabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success('Inquiry added successfully');
        setShowAddModal(false);
        setNewInquiry({ promptQuestion: '', promptResponse: '', isEnabled: true });

        // ✅ stay on current page, refresh
        await fetchInquiries(currentPage, searchQuery, perPage, statusFilter);
      } else {
        toast.error(res.data?.message || 'Failed to add inquiry');
      }
    } catch (err: any) {
      console.error('Error adding inquiry:', err);
      toast.error(err?.response?.data?.message || 'Error adding inquiry');
    }
  };

  const handleUpdateInquiry = async () => {
    if (!editInquiry) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/inquiry/${editInquiry._id}`,
        {
          promptQuestion: editInquiry.promptQuestion,
          promptResponse: editInquiry.promptResponse,
          isEnabled: editInquiry.isEnabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success('Inquiry updated successfully');
        setShowEditModal(false);
        setEditInquiry(null);

        await fetchInquiries(currentPage, searchQuery, perPage, statusFilter);
      } else {
        toast.error(res.data?.message || 'Failed to update inquiry');
      }
    } catch (err: any) {
      console.error('Error updating inquiry:', err);
      toast.error(err?.response?.data?.message || 'Error updating inquiry');
    }
  };

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
            onClick={() => fetchInquiries(currentPage, searchQuery, perPage, statusFilter)}
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
        <input
          type="file"
          accept=".csv,.txt,.pdf,.doc,.docx,.xls,.xlsx"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleImportFile}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Upload className="h-5 w-5" />
          Import File
        </button>

        <button
          onClick={() => {
            setNewInquiry({ promptQuestion: '', promptResponse: '', isEnabled: true });
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
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">Show</label>
          <select
            value={perPage}
            onChange={e => {
              const value = Number(e.target.value);
              setPerPage(value);
              setCurrentPage(1);
              fetchInquiries(1, searchQuery, value, statusFilter);
            }}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">entries</span>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={statusFilter}
              onChange={e => {
                const value = e.target.value as 'all' | 'enabled' | 'disabled';
                setStatusFilter(value);
                setCurrentPage(1);
                fetchInquiries(1, searchQuery, perPage, value);
              }}
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
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
                fetchInquiries(1, searchQuery, perPage, statusFilter);
              }
            }}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchInquiries(1, searchQuery, perPage, statusFilter);
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
                    <div className="text-sm text-gray-500 truncate max-w-xs">{inquiry.promptQuestion}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-400 truncate max-w-xs">{inquiry.promptResponse}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                        inquiry.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {inquiry.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setEditInquiry({
                            _id: inquiry._id,
                            promptQuestion: inquiry.promptQuestion,
                            promptResponse: inquiry.promptResponse,
                            isEnabled: inquiry.isEnabled,
                          });
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className={`text-red-600 hover:text-red-900 ${
                          inquiry._id === (currentUser as any)?.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={inquiry._id === (currentUser as any)?.id}
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
          <div>
            <nav
              className="relative z-0 flex justify-end px-2 py-2 rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              {/* Previous */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {getPaginationRange(currentPage, totalPages).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
      <Modal open={showDeleteModal} title="Delete Inquiry" onClose={() => setShowDeleteModal(false)} size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this inquiry? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">
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
      <Modal open={showAddModal} title="Add Inquiry" onClose={() => setShowAddModal(false)} size="md">
        <div className="space-y-4">
          <textarea
            placeholder="ex: How can I reset my password if I forgot my email?"
            className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
            rows={5}
            value={newInquiry.promptQuestion}
            onChange={e => setNewInquiry({ ...newInquiry, promptQuestion: e.target.value })}
          />

          <textarea
            placeholder="ex: To reset your password, click on 'Forgot Password' at the login page and follow the instructions sent to your registered email."
            className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
            rows={15}
            value={newInquiry.promptResponse}
            onChange={e => setNewInquiry({ ...newInquiry, promptResponse: e.target.value })}
          />

          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="status-add"
                checked={newInquiry.isEnabled === true}
                onChange={() => setNewInquiry({ ...newInquiry, isEnabled: true })}
              />
              Enabled
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="status-add"
                checked={newInquiry.isEnabled === false}
                onChange={() => setNewInquiry({ ...newInquiry, isEnabled: false })}
              />
              Disabled
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button onClick={handleAddInquiry} className="px-4 py-2 bg-blue-600 text-white rounded">
              Add Inquiry
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Inquiry Modal */}
      <Modal open={showEditModal} title="Edit Inquiry" onClose={() => setShowEditModal(false)}>
        {editInquiry && (
          <div className="space-y-4">
            <textarea
              placeholder="Edit Prompt Question..."
              className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
              rows={5}
              value={editInquiry.promptQuestion}
              onChange={e => setEditInquiry({ ...editInquiry, promptQuestion: e.target.value })}
            />

            <textarea
              placeholder="Edit Prompt Response..."
              className="w-full border px-3 py-2 rounded resize-none placeholder:text-sm text-sm"
              rows={15}
              value={editInquiry.promptResponse}
              onChange={e => setEditInquiry({ ...editInquiry, promptResponse: e.target.value })}
            />

            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status-edit"
                  checked={editInquiry.isEnabled === true}
                  onChange={() => setEditInquiry({ ...editInquiry, isEnabled: true })}
                />
                Enabled
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status-edit"
                  checked={editInquiry.isEnabled === false}
                  onChange={() => setEditInquiry({ ...editInquiry, isEnabled: false })}
                />
                Disabled
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 rounded">
                Cancel
              </button>
              <button onClick={handleUpdateInquiry} className="px-4 py-2 bg-blue-600 text-white rounded">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Select Count Modal */}
      <Modal
        open={showSelectCountModal}
        title="Select Number of Inquiries"
        onClose={() => setShowSelectCountModal(false)}
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-start gap-2 p-3 w-full bg-yellow-50 border-l-4 border-yellow-400 rounded shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-500 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-9 3a1 1 0 102 0v-2a1 1 0 10-2 0v2zm1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-yellow-700 text-sm">
              Q&amp;A format files are <strong>ignored for this settings</strong>.
            </p>
          </div>

          <p className="text-gray-700 text-sm text-center">Choose how many inquiries to create from this file:</p>

          <input
            type="range"
            min={1}
            max={100}
            value={selectedInquiryCount}
            onChange={e => setSelectedInquiryCount(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-gray-700 font-semibold">{selectedInquiryCount} inquiries</p>

          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => setShowSelectCountModal(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowSelectCountModal(false);
                if (pendingFile) uploadFileWithCount(pendingFile, selectedInquiryCount);
                setPendingFile(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Proceed
            </button>
          </div>
        </div>
      </Modal>

      {/* Processing Modal */}
      <Modal open={showProcessingModal} title="Processing File" onClose={() => {}} size="sm">
        <div className="flex flex-col items-center justify-center py-8">
          {isProcessingSuccess ? (
            hasCreatedInquiries ? (
              <svg className="h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          )}
          <p className="text-center text-gray-700">{processingText}</p>
        </div>
      </Modal>
    </div>
  );
};

export default InquiryDashboard;