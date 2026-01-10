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
  const { voiceId: optVoiceId, voiceName, model_id = "eleven_multilingual_v2" } = options;

  // Prefer explicit voiceId, otherwise try to resolve by name or use first available voice
  let voiceId = optVoiceId;
  if (!voiceId) {
    const voicesResp = await client.voices.getAll();
    const voices = voicesResp && voicesResp.voices ? voicesResp.voices : [];
    if (voiceName) {
      const found = voices.find((v) => v.name === voiceName);
      voiceId = found && found.voice_id;
    }
    if (!voiceId && voices[0]) {
      voiceId = voices[0].voice_id;
    }
  }

  if (!voiceId) {
    throw new Error("No available voices found in your ElevenLabs account.");
  }

  console.log("Using voice id:", voiceId, "model:", model_id);

  const audioStream = await client.textToSpeech.convert(voiceId, { text, model_id });
  await writeAudioToFile(audioStream, filePath);
  return filePath;
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