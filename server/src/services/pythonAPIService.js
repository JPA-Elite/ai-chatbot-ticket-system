import axios from 'axios';
import { PYTHON_API_BASE_URL } from '../config/api.js';
import { fetchRelevanceData } from '../repositories/pythonRepository.js';
import {
  INSUFFICIENT_METRICS_DATA_MESSAGE,
  METRICS_FETCH_FAILED_MESSAGE
} from '../constants/controllerMessages.js';

export const fetchMetricsData = async () => {
  const relevanceData = await fetchRelevanceData();

  if (!relevanceData || relevanceData.length < 2) {
    return {
      status: 400,
      payload: {
        status: 'error',
        message: INSUFFICIENT_METRICS_DATA_MESSAGE
      }
    };
  }

  const payload = relevanceData.map(item => ({
    similarity_score: item.similarityScore,
    is_relevant: Number(item.isRelevant)
  }));

  try {
    const response = await axios.post(
      `${PYTHON_API_BASE_URL}/metrics/compute-metrics`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    if (response.data?.status !== 'success') {
      return {
        status: 500,
        payload: {
          status: response.data?.status || 'error',
          metrics: {},
          message: response.data?.message || METRICS_FETCH_FAILED_MESSAGE
        }
      };
    }

    const { metrics } = response.data;
    const [[tn, fp], [fn, tp]] = metrics?.confusion_matrix || [[0, 0], [0, 0]];

    const normalizedMetrics = {
      ...metrics,
      confusion_matrix: {
        tp,
        fp,
        fn,
        tn
      }
    };

    return {
      status: 200,
      payload: {
        status: 'success',
        metrics: normalizedMetrics
      }
    };
  } catch (error) {
    console.error('Metrics fetch error:', error.message);
    return {
      status: 500,
      payload: {
        status: error,
        metrics: {},
        message: METRICS_FETCH_FAILED_MESSAGE
      }
    };
  }
};
