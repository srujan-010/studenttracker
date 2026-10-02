import axios from 'axios';
import { FeatureInputs } from '@eduguard/shared';
import { env } from '../config/environment';

export interface MLPredictionResponse {
  predictedScore: number;
  modelVersion: string;
  latencyMs?: number;
}

export class MLClientService {
  private getBaseUrl(): string {
    const rawUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL || 'http://localhost:8000';
    return rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
  }

  /**
   * Send student features to Python FastAPI ML service
   */
  async predict(features: FeatureInputs): Promise<MLPredictionResponse> {
    const targetUrl = new URL('predict', this.getBaseUrl()).toString();
    try {
      const response = await axios.post<MLPredictionResponse>(
        targetUrl,
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
      console.error('[MLClientService] Call failed to ML service at', targetUrl, error.message);
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
    const targetUrl = new URL('health', this.getBaseUrl()).toString();
    try {
      const response = await axios.get(targetUrl, { timeout: 3000 });
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
