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

    // Create the inner HTML
    this.shadowRoot.innerHTML = `
        <style>
          /* Shadow DOM styling can go here if needed */
          iframe {
            border: none;
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

// Replace the direct registration with a function
function registerAudioPlayer() {
  customElements.define('elevenlabs-audio-player', ElevenLabsAudioPlayer);
}

// Only register after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerAudioPlayer);
} else {
  registerAudioPlayer();
}