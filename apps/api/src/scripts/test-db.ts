import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  console.log('Testing connection to MongoDB URI:', uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'UNDEFINED');
  
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('SUCCESS: Connected to MongoDB successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    await mongoose.disconnect();
    console.log('Disconnected cleanly.');
    process.exit(0);
  } catch (err: any) {
    console.error('ERROR connecting to MongoDB:', err.message);
    process.exit(1);
  }
}

testConnection();
