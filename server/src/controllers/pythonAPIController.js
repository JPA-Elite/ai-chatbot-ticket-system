import { fetchMetricsData } from '../services/pythonAPIService.js';
import { METRICS_FETCH_FAILED_MESSAGE } from '../constants/controllerMessages.js';

// ---------------- Python API Controllers ---------------- //

// @desc    Fetch AI evaluation metrics (proxy to Python)
// @route   GET /api/metrics
// @access  Private/Admin
export const fetchMetrics = async (req, res) => {
    try {
        const result = await fetchMetricsData();
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Metrics fetch error:', error.message);
        return res.status(500).json({
            status: error,
            metrics: {},
            message: METRICS_FETCH_FAILED_MESSAGE,
        });
    }
};
