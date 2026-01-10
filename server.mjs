import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createVoiceMessage } from "./Test11LabsAPI.mjs";

dotenv.config({ path: './elevenlabs-api-key.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function maskedKey(key) {
  if (!key) return null;
  return key.length > 8 ? `${key.slice(0,4)}...${key.slice(-4)}` : '****';
}

if (!process.env.ELEVENLABS_API_KEY) {
  console.warn('Warning: ELEVENLABS_API_KEY is not set. Requests will fail with 401.');
} else {
  console.log('Loaded ELEVENLABS_API_KEY:', maskedKey(process.env.ELEVENLABS_API_KEY));
}

app.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'Server missing ELEVENLABS_API_KEY' });
    }

    const outFile = `voice_${Date.now()}.mp3`;
    // Use explicit custom voiceId to ensure the custom voice is used
    await createVoiceMessage(text, outFile, { voiceId: 'tQkv9ulgQzDoPFvGQ3yb' });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(path.resolve(outFile), (err) => {
      try { fs.unlinkSync(outFile); } catch (e) {}
      if (err) console.error('Error sending file', err);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
