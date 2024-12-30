class ElevenLabsAudioPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const audioTitle = this.getAttribute('audio-title') || 'Audio powered by ElevenLabs';
    const audioSrc = this.getAttribute('audio-src');

    // Construct the iframe URL
    const iframeSrc = `https://elevenlabs.io/player/index.html?title=${encodeURIComponent(audioTitle)}&small=true&preview=true&audioSrc=${encodeURIComponent(audioSrc)}`;

    this.shadowRoot.innerHTML = `
        <style>
          iframe {
            border: none;
            border-radius: 12px;
          }
        </style>
        <iframe
          width="100%"
          height="90"
          src="${iframeSrc}"
          allow="autoplay"
        ></iframe>
      `;
  }
}

function registerAudioPlayer() {
  customElements.define('elevenlabs-audio-player', ElevenLabsAudioPlayer);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerAudioPlayer);
} else {
  registerAudioPlayer();
}
