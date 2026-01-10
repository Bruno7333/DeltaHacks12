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

app.post('/speak', async (req, res) => {
  try {
    const { text, voiceId, model_id } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const outFile = `voice_${Date.now()}.mp3`;
    const options = {};
    if (voiceId) options.voiceId = voiceId;
    if (model_id) options.model_id = model_id;

    await createVoiceMessage(text, outFile, options);

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
