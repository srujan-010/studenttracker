import axios from 'axios';
import { FeatureInputs } from '@eduguard/shared';
import { env } from '../config/environment';

export interface MLPredictionResponse {
  predictedScore: number;
  modelVersion: string;
  latencyMs?: number;
}

export class MLClientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.ML_SERVICE_URL;
  }

  /**
   * Send student features to Python FastAPI ML service
   */
  async predict(features: FeatureInputs): Promise<MLPredictionResponse> {
    try {
      const response = await axios.post<MLPredictionResponse>(
        `${this.baseUrl}/predict`,
        {
          attendance: features.attendance,
          previousScore: features.previousScore,
          internalMarks: features.internalMarks,
          assignmentCompletion: features.assignmentCompletion,
          studyHours: features.studyHours,
          participation: features.participation,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Secret': env.ML_SERVICE_SECRET,
          },
          timeout: 6000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('[MLClientService] Call failed to ML service at', `${this.baseUrl}/predict`, error.message);
      const customError: any = new Error(
        'AI prediction service is currently unavailable. Please try again later.'
      );
      customError.statusCode = 503;
      throw customError;
    }
  }

  /**
   * Health check for ML Service
   */
  async checkHealth(): Promise<{ status: string; modelVersion?: string; ready: boolean }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return response.data;
    } catch (error: any) {
      return {
        status: 'UNAVAILABLE',
        ready: false,
      };
    }
  }
}

export const mlClientService = new MLClientService();
