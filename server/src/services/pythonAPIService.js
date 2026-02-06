import axios from 'axios';
import { PYTHON_API_BASE_URL } from '../config/api.js';
import { fetchRelevanceData } from '../repositories/pythonRepository.js';
import {
  INSUFFICIENT_METRICS_DATA_MESSAGE,
  METRICS_FETCH_FAILED_MESSAGE
} from '../constants/controllerMessages.js';

export const fetchMetricsData = async () => {
  const relevanceData = await fetchRelevanceData();
  const batchSize = 10000;

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
    const batches = [];
    for (let i = 0; i < payload.length; i += batchSize) {
      batches.push(payload.slice(i, i + batchSize));
    }

    const aggregated = {
      tp: 0,
      fp: 0,
      fn: 0,
      tn: 0,
      meanConfidenceSum: 0,
      totalSamples: 0
    };

    for (const batch of batches) {
      const response = await axios.post(
        `${PYTHON_API_BASE_URL}/metrics/compute-metrics`,
        batch,
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
      aggregated.tp += tp;
      aggregated.fp += fp;
      aggregated.fn += fn;
      aggregated.tn += tn;
      aggregated.meanConfidenceSum += (metrics?.mean_confidence || 0) * batch.length;
      aggregated.totalSamples += batch.length;
    }

    const total = aggregated.tp + aggregated.fp + aggregated.fn + aggregated.tn;
    const accuracy = total ? (aggregated.tp + aggregated.tn) / total : 0;
    const precision = (aggregated.tp + aggregated.fp) ? aggregated.tp / (aggregated.tp + aggregated.fp) : 0;
    const recall = (aggregated.tp + aggregated.fn) ? aggregated.tp / (aggregated.tp + aggregated.fn) : 0;
    const f1Score = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;

    const normalizedMetrics = {
      accuracy: Number((accuracy * 100).toFixed(2)),
      precision: Number((precision * 100).toFixed(2)),
      recall: Number((recall * 100).toFixed(2)),
      f1_score: Number((f1Score * 100).toFixed(2)),
      mean_confidence: aggregated.totalSamples
        ? Number((aggregated.meanConfidenceSum / aggregated.totalSamples).toFixed(2))
        : 0,
      confusion_matrix: {
        tp: aggregated.tp,
        fp: aggregated.fp,
        fn: aggregated.fn,
        tn: aggregated.tn
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
