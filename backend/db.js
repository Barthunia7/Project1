import mongoose from 'mongoose';

// Connect to MongoDB Atlas
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully...');
    } catch (err) {
        console.error('❌ Database Connection Failed:', err.message);
        process.exit(1);
    }
};

// Define the Data Structure for Audio Tracks
const AudioSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    transcription: { type: String, default: 'Processing...' },
    createdAt: { type: Date, default: Date.now }
});

export const AudioTrack = mongoose.model('AudioTrack', AudioSchema);
