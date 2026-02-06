import axios from 'axios';
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
      'http://127.0.0.1:8000/metrics/compute-metrics',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

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
