import axios from 'axios';
import { PYTHON_API_BASE_URL } from '../config/api.js';
import { fetchRelevanceData } from '../repositories/pythonRepository.js';
import {
  INSUFFICIENT_METRICS_DATA_MESSAGE,
  METRICS_FETCH_FAILED_MESSAGE,
  TRAINING_SYNC_FAILED_MESSAGE,
  TRAINING_PREDICTION_FAILED_MESSAGE
} from '../constants/controllerMessages.js';

export const sendTrainingData = async ({
  userInquiry,
  aiResponse,
  isEscalated = false,
  chatId,
  userId
}) => {
  try {
    const response = await axios.post(
      `${PYTHON_API_BASE_URL}/train/ingest`,
      {
        user_inquiry: userInquiry,
        ai_response: aiResponse,
        is_escalated: Boolean(isEscalated),
        chat_id: chatId,
        user_id: userId
      },
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
          message: response.data?.message || TRAINING_SYNC_FAILED_MESSAGE
        }
      };
    }

    return {
      status: 200,
      payload: {
        status: 'success',
        message: response.data?.message || 'Training data synced',
        details: response.data
      }
    };
  } catch (error) {
    console.error('Training sync error:', error.message);
    return {
      status: 500,
      payload: {
        status: error,
        message: TRAINING_SYNC_FAILED_MESSAGE
      }
    };
  }
};

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

  const normalizeConfusionMatrix = rawMatrix => {
    if (!rawMatrix) {
      return {
        tp: 0,
        fp: 0,
        fn: 0,
        tn: 0
      };
    }

    if (Array.isArray(rawMatrix)) {
      if (rawMatrix.length === 2 && rawMatrix.every(Array.isArray)) {
        const [[tn, fp], [fn, tp]] = rawMatrix;
        return {
          tp: Number(tp) || 0,
          fp: Number(fp) || 0,
          fn: Number(fn) || 0,
          tn: Number(tn) || 0
        };
      }

      if (rawMatrix.length === 4 && rawMatrix.every(item => !Array.isArray(item))) {
        const [tn, fp, fn, tp] = rawMatrix;
        return {
          tp: Number(tp) || 0,
          fp: Number(fp) || 0,
          fn: Number(fn) || 0,
          tn: Number(tn) || 0
        };
      }
    }

    if (typeof rawMatrix === 'object') {
      const { tp = 0, fp = 0, fn = 0, tn = 0 } = rawMatrix;
      return {
        tp: Number(tp) || 0,
        fp: Number(fp) || 0,
        fn: Number(fn) || 0,
        tn: Number(tn) || 0
      };
    }

    return {
      tp: 0,
      fp: 0,
      fn: 0,
      tn: 0
    };
  };

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
    const confusionMatrix = normalizeConfusionMatrix(metrics?.confusion_matrix);

    const normalizedMetrics = {
      ...metrics,
      confusion_matrix: confusionMatrix
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

export const predictTrainingData = async ({ userInquiry }) => {
  try {
    const response = await axios.post(
      `${PYTHON_API_BASE_URL}/train/predict`,
      {
        user_inquiry: userInquiry
      },
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
          message: response.data?.message || TRAINING_PREDICTION_FAILED_MESSAGE
        }
      };
    }

    return {
      status: 200,
      payload: {
        status: 'success',
        prediction: response.data?.prediction
      }
    };
  } catch (error) {
    console.error('Training prediction error:', error.message);
    return {
      status: 500,
      payload: {
        status: error,
        message: TRAINING_PREDICTION_FAILED_MESSAGE
      }
    };
  }
};
