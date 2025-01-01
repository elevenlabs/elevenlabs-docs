function inject() {
  var script = document.createElement('script');
  script.src = "https://elevenlabs.io/convai-widget/index.js";
  script.async = true;
  script.type = "text/javascript";
  document.head.appendChild(script);

  var wrapper = document.createElement('div');
  wrapper.className = "desktop";

  var widget = document.createElement('elevenlabs-convai');
  widget.setAttribute('agent-id', 'OZmXb9pmFsSkDE5dukJv');
  widget.setAttribute('avatar-orb-color-1', '#4D9CFF');
  widget.setAttribute('avatar-orb-color-2', '#9CE6E6');

  // Add tools to the widget
  widget.addEventListener("elevenlabs-convai:call", (event) => {
    event.detail.config.clientTools = {
      redirectToDocs: ({ path }) => {
        const router = window?.next?.router;
        router.push(path);
      },
      redirectToEmailSupport: ({ subject, body }) => {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(
          `mailto:team@elevenlabs.io?subject=${encodedSubject}&body=${encodedBody}`,
          "_blank"
        );
      },
      redirectToExternalURL: ({ url }) => {
        window.open(url, "_blank", "noopener,noreferrer");
      },
    };
  });

  widget.innerHTML = `\
  <form slot="terms" class="prose text-sm">
    <h3>Terms and conditions</h3>
    <p>
      By clicking "Continue," and each time I interact with this AI agent, I 
      consent to ElevenLabs collecting and using my voice and data derived from 
      it to interpret my speech, and provide the support services I request, and 
      to the recording, storage, and sharing of my communications with 
      third-party service providers, and as described in the 
      <a href="/terms-of-use">Privacy Policy</a>. If you do not wish to have 
      your conversations recorded, please refrain from using this service.
  </form>`;
  
  wrapper.appendChild(widget);
  document.body.appendChild(wrapper);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", function() {
		inject();
	});
} else {
	inject();
}