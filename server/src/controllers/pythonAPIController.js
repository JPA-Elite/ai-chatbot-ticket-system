import InquiryRelevance from '../models/InquiryRelevance.js';
import axios from 'axios';

// ---------------- Python API Controllers ---------------- //

// @desc    Fetch AI evaluation metrics (proxy to Python)
// @route   GET /api/metrics
// @access  Private/Admin
export const fetchMetrics = async (req, res) => {
    try {
        const relevanceData = await InquiryRelevance.find({}, 'similarityScore isRelevant').lean();

        if (!relevanceData || relevanceData.length < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient data to compute metrics',
            });
        }

        // 2️⃣ Transform to Python payload format
        const payload = relevanceData.map(item => ({
            similarity_score: item.similarityScore,
            is_relevant: Number(item.isRelevant), // must be 0 or 1
        }));

        // 3️⃣ Call Python FastAPI
        const response = await axios.post(
            'http://127.0.0.1:8000/metrics/compute-metrics',
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
            }
        );

        const { metrics } = response.data;
        console.log('Received metrics from Python API:', response.data);
        const [[tn, fp], [fn, tp]] = metrics?.confusion_matrix || [[0, 0], [0, 0]];

        const normalizedMetrics = {
            ...metrics,
            confusion_matrix: {
                tp,
                fp,
                fn,
                tn,
            },
        };

        return res.status(200).json({
            status: 'success',
            metrics: normalizedMetrics,
        });

    } catch (error) {
        console.error('Metrics fetch error:', error.message);

        return res.status(500).json({
            status: error,
            metrics: {},
            message: 'Failed to fetch metrics',
        });
    }
};
