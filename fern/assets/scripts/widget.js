const ID = 'elevenlabs-convai-widget-60993087-3f3e-482d-9570-cc373770addc';

function injectElevenLabsWidget() {
  // Check if the widget is already loaded
  if (document.getElementById(ID)) {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
  script.async = true;
  script.type = 'text/javascript';
  document.head.appendChild(script);

  // Create the wrapper and widget
  const wrapper = document.createElement('div');
  wrapper.className = 'desktop';

  const widget = document.createElement('elevenlabs-convai');
  widget.id = ID;
  widget.setAttribute('agent-id', 'q6EtujId97WBxLEUlEgQ');
  widget.setAttribute('variant', 'full');

  // Set initial colors and variant based on current theme and device
  updateWidgetColors(widget);
  updateWidgetVariant(widget);

  // Watch for theme changes and resize events
  const observer = new MutationObserver(() => {
    updateWidgetColors(widget);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Add resize listener for mobile detection
  window.addEventListener('resize', () => {
    updateWidgetVariant(widget);
  });

  function updateWidgetVariant(widget) {
    const isMobile = window.innerWidth <= 640; // Common mobile breakpoint
    if (isMobile) {
      widget.setAttribute('variant', 'compact');
    } else {
      widget.setAttribute('variant', 'full');
    }
  }

  function updateWidgetColors(widget) {
    const isDarkMode = !document.documentElement.classList.contains('light');
    if (isDarkMode) {
      widget.setAttribute('avatar-orb-color-1', '#2E2E2E');
      widget.setAttribute('avatar-orb-color-2', '#B8B8B8');
    } else {
      widget.setAttribute('avatar-orb-color-1', '#4D9CFF');
      widget.setAttribute('avatar-orb-color-2', '#9CE6E6');
    }
  }

  // Listen for the widget's "call" event to inject client tools
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
      redirectToSupportForm: ({ subject, description, extraInfo }) => {
        const baseUrl = 'https://help.elevenlabs.io/hc/en-us/requests/new';
        const ticketFormId = '13145996177937';
        const encodedSubject = encodeURIComponent(subject);
        const encodedDescription = encodeURIComponent(description);
        const encodedExtraInfo = encodeURIComponent(extraInfo);

        const fullUrl = `${baseUrl}?ticket_form_id=${ticketFormId}&tf_subject=${encodedSubject}&tf_description=${encodedDescription}%3Cbr%3E%3Cbr%3E${encodedExtraInfo}`;

        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      },
      redirectToExternalURL: ({ url }) => {
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    };
  });

  // Attach widget to the DOM
  wrapper.appendChild(widget);
  document.body.appendChild(wrapper);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectElevenLabsWidget);
} else {
  injectElevenLabsWidget();
}
