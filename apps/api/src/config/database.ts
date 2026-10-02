import mongoose from 'mongoose';
import { env } from './environment';

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error('[Database] Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[Database] Disconnected from MongoDB');
}
