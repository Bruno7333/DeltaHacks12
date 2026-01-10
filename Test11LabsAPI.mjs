import fs from "fs";
import { ElevenLabsClient } from "elevenlabs";
import dotenv from "dotenv";

// Load environment variables from the project env file
dotenv.config({ path: './elevenlabs-api-key.env' });

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Helper to accept different stream/response types
async function writeAudioToFile(streamLike, filePath) {
  // Node-style stream
  if (streamLike && typeof streamLike.pipe === "function") {
    const outStream = fs.createWriteStream(filePath);
    streamLike.pipe(outStream);
    await new Promise((resolve, reject) => {
      outStream.on("finish", resolve);
      outStream.on("error", reject);
      streamLike.on("error", reject);
    });
    return;
  }

  // Response-like object with arrayBuffer()
  if (streamLike && typeof streamLike.arrayBuffer === "function") {
    const ab = await streamLike.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(ab));
    return;
  }

  // Web ReadableStream (getReader)
  if (streamLike && typeof streamLike.getReader === "function") {
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
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    return;
  }

  throw new Error("Unsupported audio response type");
}

/**
 * Create a voice message from input text and save to file.
 * @param {string} text - Text to speak
 * @param {string} [filePath="output.mp3"] - Output filename
 * @param {{voiceName?:string, model_id?:string}} [options]
 * @returns {Promise<string>} - Resolves with the output file path
 */
export async function createVoiceMessage(text, filePath = "output.mp3", options = {}) {
  const { voiceId: optVoiceId, voiceName = "EcoV2", model_id = "tQkv9ulgQzDoPFvGQ3yb" } = options;

  // Prefer explicit voiceId, otherwise try to resolve by name or use first available
  let voiceId = optVoiceId;
  if (!voiceId) {
    const voicesResp = await client.voices.getAll();
    const voices = voicesResp && voicesResp.voices ? voicesResp.voices : [];
    const found = voices.find((v) => v.name === voiceName);
    voiceId = (found && found.voice_id) || (voices[0] && voices[0].voice_id);
  }

  if (!voiceId) {
    throw new Error("No available voices found in your ElevenLabs account.");
  }

  console.log("Using voice id:", voiceId, "model:", model_id);

  async function tryConvert(voiceIdToUse, model) {
    try {
      return await client.textToSpeech.convert(voiceIdToUse, { text, model_id: model });
    } catch (err) {
      // attempt to extract readable error body if present for better messages
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
          // ignore body-read errors
        }
      }
      throw err;
    }
  }

  // First attempt with provided/default model
  try {
    const audioStream = await tryConvert(voiceId, model_id);
    await writeAudioToFile(audioStream, filePath);
    return filePath;
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : null;
    const bodyText = err && err._bodyText ? err._bodyText : null;
    if (status === 400 && model_id === 'tQkv9ulgQzDoPFvGQ3yb' /* EcoV2 */) {
      console.warn('Model EcoV2 returned 400; retrying with eleven_multilingual_v2');
      const fallback = 'eleven_multilingual_v2';
      const audioStream = await tryConvert(voiceId, fallback);
      await writeAudioToFile(audioStream, filePath);
      return filePath;
    }
    const msgParts = [err && err.message ? err.message : String(err)];
    if (bodyText) msgParts.push('\nBody: ' + bodyText);
    const message = msgParts.join(' ');
    const e = new Error(message);
    e.original = err;
    throw e;
  }
}

// CLI/demo when run directly
async function main() {
  try {
    await createVoiceMessage("Hello Bruno, your ElevenLabs API is working!", "output.mp3");
    console.log("Audio saved as output.mp3!");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();