import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Modal from '../../components/modal/ui/Modal';
import API_BASE_URL, { WEB_APP_BASE_URL } from '../../config/api';

interface InquiryRelevance {
  _id: string;
  userInquiry: string;
  generatedInquiry: string;
  generatedResponse: string;
  similarityScore: number;
  responsTime: number;
  isRelevant: number;
  isUpdated?: boolean;
  createdAt: string;
}

const InquiryRelevanceDashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryRelevance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [editInquiry, setEditInquiry] = useState<{
    _id: string;
    userInquiry: string;
    generatedInquiry: string;
    generatedResponse: string;
    isRelevant: number;
  } | null>(null);
  const [relevanceFilter, setRelevanceFilter] = useState<'all' | 'relevant' | 'not_relevant'>('all');
  const [updatedFilter, setUpdatedFilter] = useState<'all' | 'updated' | 'not_updated'>('not_updated');

  const { token } = useAuth();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [perPage, setPerPage] = useState(5);

  const fetchInquiries = async (page = 1,
    search = '',
    limit = perPage,
    relevance = relevanceFilter,
    updated = updatedFilter
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE_URL}/api/inquiry-relevance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search, relevance, updated },
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

  function handleUpdateInquiryRelevance() {
    if (!editInquiry) return;

    axios.put(
      `${API_BASE_URL}/api/inquiry-relevance/${editInquiry._id}`,
      {
        userInquiry: editInquiry.userInquiry,
        generatedInquiry: editInquiry.generatedInquiry,
        generatedResponse: editInquiry.generatedResponse,
        isRelevant: editInquiry.isRelevant,
        isUpdated: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(res => {
        if (res.data.success) {
          toast.success('Inquiry relevance updated successfully');
          setShowEvaluateModal(false);
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

  const getPaginationRange = (
    current: number,
    total: number,
    siblingCount = 1
  ) => {
    const range: (number | string)[] = [];

    const start = Math.max(2, current - siblingCount);
    const end = Math.min(total - 1, current + siblingCount);

    range.push(1);

    if (start > 2) {
      range.push('...');
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < total - 1) {
      range.push('...');
    }

    if (total > 1) {
      range.push(total);
    }

    return range;
  };

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
        <a
          href={`${WEB_APP_BASE_URL}/admin`}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </a>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          User Output Relevance
        </motion.h1>
        <p className="text-gray-600">Evaluate the relevance of AI-generated outputs from user inquiries</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        {/* Per Page + Relevance Filter (LEFT) */}
        <div className="flex items-center space-x-4">
          {/* Per Page */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show</label>
            <select
              value={perPage}
              onChange={e => {
                const value = Number(e.target.value);
                setPerPage(value);
                setCurrentPage(1);
                fetchInquiries(1, searchQuery, value, relevanceFilter, updatedFilter);
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

          {/* Relevance Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={relevanceFilter}
              onChange={e => {
                const value = e.target.value as 'all' | 'relevant' | 'not_relevant';
                setRelevanceFilter(value);
                setCurrentPage(1);
                fetchInquiries(1, searchQuery, perPage, value, updatedFilter);
              }}
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="relevant">Relevant</option>
              <option value="not_relevant">Not Relevant</option>
            </select>
          </div>

          {/* Updated Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Updated</label>
            <select
              value={updatedFilter}
              onChange={e => {
                const value = e.target.value as 'all' | 'updated' | 'not_updated';
                setUpdatedFilter(value);
                setCurrentPage(1);
                fetchInquiries(1, searchQuery, perPage, relevanceFilter, value);
              }}
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="updated">Updated</option>
              <option value="not_updated">Not Updated</option>
            </select>
          </div>
        </div>

        {/* Search (RIGHT) */}
        <div className="flex items-center space-x-2 w-full max-w-md">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search outputs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                fetchInquiries(1, searchQuery, perPage, relevanceFilter, updatedFilter);
              }
            }}
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchInquiries(1, searchQuery, perPage, relevanceFilter, updatedFilter);
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
                  User Inquiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated Inquiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Similarity Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
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
                      <div className="text-sm text-gray-500 truncate max-w-xs">{inquiry.userInquiry}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        {inquiry.generatedResponse}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <span>{inquiry.similarityScore?.toFixed(4) || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <span>{(inquiry.responsTime / 1000).toFixed(2)}s</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-center">
                      <button className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setEditInquiry({
                            _id: inquiry._id,
                            userInquiry: inquiry.userInquiry,
                            generatedInquiry: inquiry.generatedInquiry,
                            generatedResponse: inquiry.generatedResponse,
                            isRelevant: inquiry.isRelevant,
                          });
                          setShowEvaluateModal(true);
                        }}>
                        Evaluate
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div>
            <nav
              className="relative z-0 flex justify-end px-2 py-2 rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              {/* Previous */}
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
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
              {getPaginationRange(currentPage, totalPages).map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-400 text-sm"
                    >
                      …
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
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
      {/* Evaluate Output Relevance */}
      <Modal
        open={showEvaluateModal}
        title="Evaluate Output Relevance"
        onClose={() => setShowEvaluateModal(false)}
      >
        {editInquiry && (
          <div className="space-y-5">

            {/* Comparison Section */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">

              {/* User Inquiry */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  User Inquiry
                </label>
                <textarea
                  disabled
                  value={editInquiry.userInquiry}
                  rows={6}
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50 resize-none"
                />
              </div>

              {/* Compare Icon */}
              <div className="flex justify-center items-center pt-6">
                <div className="text-gray-400 text-xl select-none">
                  ⇄
                </div>
              </div>

              {/* Generated Inquiry */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Generated Inquiry
                </label>
                <textarea
                  disabled
                  value={editInquiry.generatedInquiry}
                  rows={6}
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50 resize-none"
                />
              </div>
            </div>

            {/* Generated Response */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Generated Response
              </label>
              <textarea
                disabled
                value={editInquiry.generatedResponse}
                rows={10}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 resize-none"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center gap-8 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="relevance"
                  checked={editInquiry.isRelevant == 1}
                  onChange={() =>
                    setEditInquiry({ ...editInquiry, isRelevant: 1 })
                  }
                />
                Relevant
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="relevance"
                  checked={editInquiry.isRelevant == 0}
                  onChange={() =>
                    setEditInquiry({ ...editInquiry, isRelevant: 0 })
                  }
                />
                Not Relevant
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowEvaluateModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInquiryRelevance}
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
};

export default InquiryRelevanceDashboard;
