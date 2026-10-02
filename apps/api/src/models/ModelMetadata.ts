import mongoose, { Document, Schema } from 'mongoose';

export interface IModelMetadata extends Document {
  version: string;
  features: string[];
  datasetIdentifier: string;
  mae: number;
  rmse: number;
  r2: number;
  frameworkVersion: string;
  status: 'ACTIVE' | 'ARCHIVED';
  hyperparameters: Record<string, any>;
  createdAt: Date;
}

const ModelMetadataSchema = new Schema<IModelMetadata>(
  {
    version: { type: String, required: true, unique: true },
    features: [{ type: String, required: true }],
    datasetIdentifier: { type: String, required: true },
    mae: { type: Number, required: true },
    rmse: { type: Number, required: true },
    r2: { type: Number, required: true },
    frameworkVersion: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    hyperparameters: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

export const ModelMetadata = mongoose.model<IModelMetadata>('ModelMetadata', ModelMetadataSchema);
