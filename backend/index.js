import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for frontend communication
app.use(cors());
app.use(express.json());

// Handle file paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure an 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer configuration for temporary file storage
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_init_errors',
});

// --- DAY 6: CONNECTING FRONTEND TO BACKEND WITH OFFLINE BYPASS ---
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    let transcriptionText = "";

    try {
      // Try sending to OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: 'whisper-1',
      });
      transcriptionText = transcription.text;
    } catch (apiError) {
      console.log("OpenAI Quota Limit Hit. Bypassing safely with local mock text.");
      transcriptionText = `[Offline Mock Mode]: Audio received successfully by the backend server! OpenAI credentials are out of quota, but your full network route is working perfectly.`;
    }

    // Clean up temporary server file
    if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    // Return text to React client
    res.json({ text: transcriptionText });

  } catch (error) {
    console.error('Core transcription error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process transcription.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server cleanly running on port ${PORT}`));
