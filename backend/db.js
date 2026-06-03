import 'dotenv/config'; // 👈 ADD THIS AT THE VERY TOP
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

// Define the User Schema for Authentication
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);

// Updated Audio Schema linked to a User
const AudioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    transcription: { type: String, default: 'Processing...' },
    translation: { type: String },
    language: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const AudioTrack = mongoose.model('AudioTrack', AudioSchema);
