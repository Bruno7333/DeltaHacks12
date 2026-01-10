import fs from 'fs';
import { ElevenLabsClient } from 'elevenlabs';
import dotenv from 'dotenv';

dotenv.config({ path: './elevenlabs-api-key.env' });

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

async function writeAudioToFile(streamLike, filePath) {
  if (streamLike && typeof streamLike.pipe === 'function') {
    const outStream = fs.createWriteStream(filePath);
    streamLike.pipe(outStream);
    await new Promise((resolve, reject) => {
      outStream.on('finish', resolve);
      outStream.on('error', reject);
      streamLike.on('error', reject);
    });
    return;
  }

  if (streamLike && typeof streamLike.arrayBuffer === 'function') {
    const ab = await streamLike.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(ab));
    return;
  }

  if (streamLike && typeof streamLike.getReader === 'function') {
    const writer = fs.createWriteStream(filePath);
    const reader = streamLike.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writer.write(Buffer.from(value));
      }
    } finally {
      writer.end();
    }
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    return;
  }

  throw new Error('Unsupported audio response type');
}

/**
 * Create an MP3 file from `text` using ElevenLabs API.
 * @param {string} text
 * @param {string} filename - with or without .mp3
 * @param {{voiceId?:string, voiceName?:string, model_id?:string}} options
 * @returns {Promise<string>} - output filepath
 */
export async function createMp3(text, filename, options = {}) {
  if (!text) throw new Error('text is required');
  if (!filename) throw new Error('filename is required');
  const out = filename.toLowerCase().endsWith('.mp3') ? filename : `${filename}.mp3`;

  const { voiceId: optVoiceId, voiceName, model_id = 'eleven_multilingual_v2' } = options;

  let voiceId = optVoiceId;
  if (!voiceId) {
    const voicesResp = await client.voices.getAll();
    const voices = voicesResp && voicesResp.voices ? voicesResp.voices : [];
    const found = voiceName ? voices.find((v) => v.name === voiceName) : null;
    voiceId = (found && found.voice_id) || (voices[0] && voices[0].voice_id);
  }

  if (!voiceId) throw new Error('No available voices found in your ElevenLabs account.');

  async function tryConvert(voiceIdToUse, model) {
    try {
      return await client.textToSpeech.convert(voiceIdToUse, { text, model_id: model });
    } catch (err) {
      if (err && err.body) {
        try {
          if (typeof err.body.pipe === 'function') {
            const chunks = [];
            for await (const chunk of err.body) chunks.push(Buffer.from(chunk));
            err._bodyText = Buffer.concat(chunks).toString('utf8');
          } else if (typeof err.body.arrayBuffer === 'function') {
            const ab = await err.body.arrayBuffer();
            err._bodyText = Buffer.from(ab).toString('utf8');
          } else if (typeof err.body.getReader === 'function') {
            const reader = err.body.getReader();
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(Buffer.from(value));
            }
            err._bodyText = Buffer.concat(chunks).toString('utf8');
          }
        } catch (e) {
          // ignore
        }
      }
      throw err;
    }
  }

  try {
    const audioStream = await tryConvert(voiceId, model_id);
    await writeAudioToFile(audioStream, out);
    return out;
  } catch (err) {
    const status = err && (err.statusCode || err.status) ? (err.statusCode || err.status) : null;
    const bodyText = err && err._bodyText ? err._bodyText : null;
    const msgParts = [err && err.message ? err.message : String(err)];
    if (bodyText) msgParts.push('\nBody: ' + bodyText);
    const message = msgParts.join(' ');
    const e = new Error(message);
    e.original = err;
    throw e;
  }
}

export default createMp3;
