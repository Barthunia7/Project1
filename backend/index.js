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

// Enable Cross-Origin Resource Sharing (CORS) so your frontend can communicate with this backend
app.use(cors());
app.use(express.json());

// Handle file paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure a temporary 'uploads' directory exists to hold incoming audio files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer configuration for temporary file storage
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- DAY 4: SPEECH-TO-TEXT API ENDPOINT ---
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    // 1. Validation check
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    // 2. Forward the audio file stream to OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
    });

    // 3. Clean up the temporary server file to save storage space
    fs.unlinkSync(req.file.path);

    // 4. Return the transcribed text back to the client
    res.json({ text: transcription.text });

  } catch (error) {
    console.error('Transcription error details:', error);
    
    // Safety cleanup if error happens during API transfer
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process transcription.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server cleanly running on port ${PORT}`));
