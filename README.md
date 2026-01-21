# DeltaHacks12 - Text-to-Speech MP3 Generator

A Node.js module for generating MP3 audio files from text using the ElevenLabs Text-to-Speech API.

## Features

- Convert text to high-quality MP3 audio using ElevenLabs voices
- Support for multiple voice models and configurations
- Easy-to-use API with voice selection by ID or name
- Error handling and fallback mechanisms

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Bruno7333/DeltaHacks12.git
   cd DeltaHacks12
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your ElevenLabs API key:
   - Create a file `secrets/elevenlabs-api-key.env`
   - Add your API key: `ELEVENLABS_API_KEY=your_api_key_here`

## Usage

### Basic Example

```javascript
import { createMp3 } from './createMp3.mjs';

const audioFile = await createMp3('Hello, world!', 'output');
console.log('Audio file created:', audioFile); // output.mp3
```

### Voice Configuration

```javascript
import { createMp3, setCurrentVoice, getCurrentVoice } from './createMp3.mjs';

// Set a default voice
setCurrentVoice({ voiceName: 'Rachel' });

// Check current configuration
console.log(getCurrentVoice());

// Generate audio with default voice
await createMp3('This uses the default voice.', 'default-voice');

// Override voice for specific call
await createMp3('This uses a different voice.', 'custom-voice', { voiceId: 'custom-voice-id' });
```

## API Reference

### `createMp3(text, filename, options)`

Generates an MP3 file from the provided text.

- `text` (string): The text to convert to speech
- `filename` (string): Output filename (with or without .mp3 extension)
- `options` (object, optional):
  - `voiceId` (string): Specific voice ID to use
  - `voiceName` (string): Voice name to use (if voiceId not provided)
  - `model_id` (string): TTS model (default: 'eleven_multilingual_v2')

Returns: Promise<string> - Path to the created MP3 file

### `setCurrentVoice(config)`

Sets the default voice configuration for the module.

- `config` (object):
  - `voiceId` (string, optional): Default voice ID
  - `voiceName` (string, optional): Default voice name
  - `model_id` (string, optional): Default model ID

### `getCurrentVoice()`

Returns the current default voice configuration.

Returns: Object with `voiceId`, `voiceName`, and `model_id`

## Testing

Run the test script to verify functionality:

```bash
node testCreateMp3.mjs
```

This will generate a test MP3 file using your configured voice.

## Dependencies

- [elevenlabs](https://www.npmjs.com/package/elevenlabs) - ElevenLabs API client
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable loading

## License

ISC

## Contributing

This project was created for DeltaHacks 12. Feel free to fork and modify!</content>
<parameter name="filePath">c:\Users\bruno\OneDrive\Documents\DeltaHacks12\DeltaHacks12\README.md
