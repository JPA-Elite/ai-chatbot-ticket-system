import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, CheckCircle, Star, TrendingUp, Users, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';

interface StaffStats {
  totalTickets: number;
  resolvedTickets: number;
  activeTickets: number;
  avgResolutionTime: number;
  customerRating: number;
  thisWeekResolved: number;
  thisMonthResolved: number;
  categoryBreakdown: {
    technical: number;
    billing: number;
    account: number;
    feature: number;
    bug: number;
    other: number;
  };
  priorityBreakdown: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  weeklyTrend: number[];
  monthlyTrend: number[];
}

const StaffStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/staff/my-stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          console.error('Failed to fetch stats');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load statistics</h3>
        <p className="text-gray-500">Please try again later.</p>
      </div>
    );
  }

  const resolutionRate = stats.totalTickets > 0 ? (stats.resolvedTickets / stats.totalTickets) * 100 : 0;
  const performanceScore = (stats.customerRating * 20) + (resolutionRate * 0.6) + (Math.max(0, 10 - stats.avgResolutionTime) * 2);

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
          My Performance Dashboard
        </motion.h1>
        <p className="text-gray-600">Track your support performance and statistics</p>
      </div>

      {/* Performance Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Resolved</p>
                <p className="text-2xl font-bold text-blue-900">{stats.resolvedTickets}</p>
                <p className="text-xs text-blue-600">of {stats.totalTickets} tickets</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-900">{resolutionRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600">
                  {resolutionRate >= 90 ? 'Excellent!' : resolutionRate >= 80 ? 'Great!' : 'Good'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 rounded-full mr-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-700">Customer Rating</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.customerRating}/5.0</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.floor(stats.customerRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-full mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-purple-900">{stats.avgResolutionTime}h</p>
                <p className="text-xs text-purple-600">
                  {stats.avgResolutionTime <= 4 ? 'Fast!' : stats.avgResolutionTime <= 6 ? 'Good' : 'Needs improvement'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <div className="flex space-x-2">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm rounded-md ${
                  selectedPeriod === period
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

      {/* Activity Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'All Time'}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tickets Resolved:</span>
              <span className="font-semibold">
                {selectedPeriod === 'week' 
                  ? stats.thisWeekResolved
                  : selectedPeriod === 'month'
                  ? stats.thisMonthResolved
                  : stats.resolvedTickets
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Tickets:</span>
              <span className="font-semibold text-orange-600">{stats.activeTickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Performance Score:</span>
              <span className={`font-semibold ${
                performanceScore >= 80 ? 'text-green-600' : 
                performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {performanceScore.toFixed(0)}/100
              </span>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{category}:</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / stats.totalTickets) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-sm w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Priority Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
          <div className="space-y-3">
            {Object.entries(stats.priorityBreakdown).map(([priority, count]) => {
              const colors = {
                low: 'bg-green-500',
                medium: 'bg-blue-500',
                high: 'bg-orange-500',
                urgent: 'bg-red-500'
              };
              return (
                <div key={priority} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{priority}:</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`${colors[priority as keyof typeof colors]} h-2 rounded-full`}
                        style={{ width: `${(count / stats.totalTickets) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-sm w-8">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Trend</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {(selectedPeriod === 'week' ? stats.weeklyTrend : stats.monthlyTrend).map((value, index) => {
            const maxValue = Math.max(...(selectedPeriod === 'week' ? stats.weeklyTrend : stats.monthlyTrend));
            const height = (value / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-blue-500 rounded-t w-full transition-all duration-500 hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {selectedPeriod === 'week' 
                    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]
                    : `W${index + 1}`
                  }
                </span>
                <span className="text-xs font-semibold text-gray-700">{value}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Performance Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Great Resolution Rate!</h4>
              <p className="text-sm text-gray-600">You're resolving {resolutionRate.toFixed(1)}% of your tickets successfully.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Keep Up the Momentum</h4>
              <p className="text-sm text-gray-600">You've resolved {stats.thisMonthResolved} tickets this month.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StaffStats;
