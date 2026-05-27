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
  apiKey: process.env.OPENAI_API_KEY,
});

// --- DAY 6: CONNECTING FRONTEND TO BACKEND ---
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    // 1. Validation check
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    // 2. OpenAI Whisper Integration (Day 7 logic ready)
    // NOTE: If you don't have an OPENAI_API_KEY set up yet in your backend/.env file,
    // comment out lines 48-51 and uncomment line 54 to test the frontend connection first!
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
    });
    
    // Mock response placeholder for testing without API key:
    // const transcription = { text: `[Test] Received ${req.file.originalname} successfully!` };

    // 3. Clean up the temporary server file
    if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    // 4. Return the text back to the React client
    res.json({ text: transcription.text });

  } catch (error) {
    console.error('Transcription error details:', error);
    
    // Safety cleanup if error happens during execution
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process transcription.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server cleanly running on port ${PORT}`));
