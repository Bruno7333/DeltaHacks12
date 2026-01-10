import { createMp3, setCurrentVoice, getCurrentVoice } from './createMp3.mjs';

(async () => {
  try {
    console.log('Current voice config:', getCurrentVoice());

    // Example: set a specific voice by id or name (uncomment to use)
    // setCurrentVoice({ voiceId: 'tQkv9ulgQzDoPFvGQ3yb' });

    const out = await createMp3('Hello — this is a createMp3 test.', 'test-output');
    console.log('Wrote audio file:', out);
  } catch (err) {
    console.error('Error creating MP3:', err);
    process.exitCode = 1;
  }
})();
