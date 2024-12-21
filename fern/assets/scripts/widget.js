function injectElevenLabsWidget() {
  // 1. Inject the external ElevenLabs script
  const script = document.createElement('script');
  script.src = 'https://elevenlabs.io/convai-widget/index.js';
  script.async = true;
  script.type = 'text/javascript';
  document.head.appendChild(script);

  // 2. Create the wrapper and widget
  const wrapper = document.createElement('div');
  wrapper.className = 'desktop';

  const widget = document.createElement('elevenlabs-convai');
  widget.setAttribute('agent-id', 'OZmXb9pmFsSkDE5dukJv');

  // Set initial colors based on current theme
  updateWidgetColors(widget);

  // Watch for theme changes
  const observer = new MutationObserver(() => {
    updateWidgetColors(widget);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  function updateWidgetColors(widget) {
    const isDarkMode = !document.documentElement.classList.contains('light');
    if (isDarkMode) {
      widget.setAttribute('avatar-orb-color-1', '#2E2E2E');
      widget.setAttribute('avatar-orb-color-2', '#B8B8B8');
      widget.setAttribute('background-color', '#1e293b');
    } else {
      widget.setAttribute('avatar-orb-color-1', '#4D9CFF');
      widget.setAttribute('avatar-orb-color-2', '#9CE6E6');
      widget.setAttribute('background-color', '#ffffff');
    }
  }

  // 3. Listen for the widget's "call" event to inject client tools
  widget.addEventListener('elevenlabs-convai:call', (event) => {
    event.detail.config.clientTools = {
      redirectToDocs: ({ path }) => {
        const router = window?.next?.router;
        if (router) {
          router.push(path);
        }
      },
      redirectToEmailSupport: ({ subject, body }) => {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(
          `mailto:team@elevenlabs.io?subject=${encodedSubject}&body=${encodedBody}`,
          '_blank'
        );
      },
      redirectToExternalURL: ({ url }) => {
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    };
  });

  // 4. Attach widget to the DOM
  wrapper.appendChild(widget);
  document.body.appendChild(wrapper);
}

// 5. Only inject after DOM is ready (in case the script is added early)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectElevenLabsWidget);
} else {
  injectElevenLabsWidget();
}
