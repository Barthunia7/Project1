import fs from 'fs';
import path from 'path';
import os from 'os';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
const app = express();
app.use(cors());
app.use(express.json()); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const DB_FILE_PATH = path.join(__dirname, 'database.json');

const readDatabase = () => {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return [];
    const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    return [];
  }
};

const writeDatabase = (data) => {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// 1. Configure Multer with file type restriction logic
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024 // Enforce Groq's maximum file size limit (25MB)
  },
  fileFilter: (req, file, cb) => {
    // Whitelist common audio formats supported by Whisper AI
    const allowedExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Check both mimetype structure and file name extension
    if (file.mimetype.startsWith('audio/') || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a valid audio file format (.mp3, .wav, .m4a, etc).'), false);
    }
  }
});

// Wrapper to handle Multer validation errors gracefully
const handleUploadMiddleware = (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size allowed is 25MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  let finalFilePath = null;

  try {
    // 1. Validation check: Ensure the multer storage middleware intercepted a file payload
    if (!req.file) {
      console.error("Backend file check error: req.file is empty.");
      return res.status(400).json({ error: 'No audio file data stream was received.' });
    }

    // 2. Extract the actual local storage directory path assigned by multer
    let currentFilePath = req.file.path;
    finalFilePath = currentFilePath;

    // 3. Extract or fallback to the file extension so Groq identifies the container format
    const originalExt = path.extname(req.file.originalname) || '.webm';
    
    // 4. If multer saved it as an extensionless hash chunk, append the correct extension format string
    if (!path.extname(currentFilePath)) {
      finalFilePath = `${currentFilePath}${originalExt}`;
      fs.renameSync(currentFilePath, finalFilePath);
    }

    console.log("Preparing to transmit valid file payload path straight to Groq:", finalFilePath);

    // 5. Fire a standard physical system stream layout payload directly out to Groq Cloud Engine
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(finalFilePath),
      model: 'whisper-large-v3', // Standard Groq architecture model flag string
    });

    // 6. Housekeeping: Wipe the temporary local data file allocations completely off your hardware disk
    if (fs.existsSync(finalFilePath)) {
      fs.unlinkSync(finalFilePath);
    }

    // 7. Success Return Payload: Dispatch the finalized clean text response back to your React app view container
    console.log("Groq successfully returned valid transcribed text data string!");
    return res.status(200).json({ transcript: transcription.text });

  } catch (error) {
    console.error("Critical Groq System Error Intercepted:", error);
    
    // Safety cleanup block to handle mid-transit drops gracefully
    if (finalFilePath && fs.existsSync(finalFilePath)) {
      fs.unlinkSync(finalFilePath);
    }
    
    return res.status(500).json({ error: error.message || 'Groq Cloud processing connection dropped.' });
  }
});

app.get('/api/history', (req, res) => {
  const data = readDatabase();
  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Day 7 Database Server running on port ${PORT}`));
