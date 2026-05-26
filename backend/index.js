import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Force absolute path mapping for the environment configuration file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Core Dependencies
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';

// Custom Application Models
import Transcription from './models/Transcription.js';

const app = express();

// Middleware
app.use(express.json());

// Create uploads folder automatically if it doesn't exist
const uploadsPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Serve uploads folder statically
app.use('/uploads', express.static(uploadsPath));

/* =========================
   DATABASE CONNECTION
========================= */

mongoose.connect('mongodb://127.0.0.1:27017/speechToText')
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });

/* =========================
   MULTER STORAGE SETUP
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },

  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* =========================
   ROUTES
========================= */

// Upload Audio + Save in MongoDB
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {

    // Check file exists
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided.'
      });
    }

    // Dynamic file URL
    const fileUrl =
      `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Create document
    const newTranscription = new Transcription({
      fileName: req.file.filename,
      fileUrl: fileUrl,
      transcript: '',
      status: 'pending'
    });

    // Save to DB
    const savedData = await newTranscription.save();

    // Success response
    res.status(201).json({
      message: '🚀 Audio uploaded and saved to database successfully!',
      data: savedData
    });

  } catch (error) {

    console.error('Upload Error:', error);

    res.status(500).json({
      error: 'Server database recording failed.'
    });
  }
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});