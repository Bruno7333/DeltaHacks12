const textEl = document.getElementById('text');
const speakBtn = document.getElementById('speak');
const statusEl = document.getElementById('status');
const player = document.getElementById('player');
const audio = document.getElementById('audio');

async function generateAndPlay() {
  const text = textEl.value.trim();
  if (!text) return (statusEl.textContent = 'Please enter text.');
  statusEl.textContent = 'Generating...';
  player.classList.add('hidden');

  try {
      const voiceId = document.getElementById('voiceId')?.value?.trim();
      const model = document.getElementById('model')?.value?.trim();
      const body = { text };
      if (voiceId) body.voiceId = voiceId;
      if (model) body.model_id = model;
      const resp = await fetch('/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      statusEl.textContent = 'Error: ' + (err.error || resp.statusText);
      return;
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    player.classList.remove('hidden');
    audio.play().catch(() => {});
    statusEl.textContent = 'Ready';
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

speakBtn.addEventListener('click', generateAndPlay);
