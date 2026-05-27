import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Day 7: Define our local database storage file path
const DB_FILE_PATH = path.join(__dirname, 'database.json');

// Helper function to read from our local database file safely
const readDatabase = () => {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return [];
    const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    return [];
  }
};

// Helper function to write records to our local database file safely
const writeDatabase = (data) => {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

const upload = multer({ dest: 'uploads/' });

// 1. Updated Transcription Endpoint - Saves to Database
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    const phrases = [
      "Testing speech to text transcription system.",
      "Hello world! Local audio routing pipeline is active.",
      "Audio received cleanly by the backend server interface.",
      "Speech logging pipeline completed successfully."
    ];
    
    const mockIndex = req.file.size % phrases.length;
    const localTranscriptionText = phrases[mockIndex];

    if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    // Day 7 Database Write Logic
    const currentDb = readDatabase();
    const newRecord = {
      id: Date.now().toString(),
      text: `[Local Engine]: ${localTranscriptionText}`,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };
    currentDb.unshift(newRecord); // Add the newest transcription to the top
    writeDatabase(currentDb);

    console.log("Transcription saved successfully to local database storage!");
    res.json(newRecord);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// 2. Day 7 History Endpoint - Fetches Saved Records
app.get('/api/history', (req, res) => {
  const data = readDatabase();
  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Day 7 Database Server running on port ${PORT}`));
