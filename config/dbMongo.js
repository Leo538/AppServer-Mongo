import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Solo hacer exit en producción, no en tests
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        throw error;
    }

}
export default connectDB;