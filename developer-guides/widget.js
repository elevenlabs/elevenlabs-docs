(function () {
  // Create and append the script element
  var script = document.createElement("script");
  script.src = "https://elevenlabs.io/convai-widget/index.js";
  script.async = true;
  script.type = "text/javascript";
  document.head.appendChild(script);

  // hide convai on mobile
  var wrapper = document.createElement("div");
  wrapper.className = "hidden lg:block";

  // Create and append the widget element
  var widget = document.createElement("elevenlabs-convai");
  widget.setAttribute("agent-id", "OZmXb9pmFsSkDE5dukJv");
  widget.setAttribute("avatar-orb-color-1", "#4D9CFF");
  widget.setAttribute("avatar-orb-color-2", "#9CE6E6");

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

  // Append widget to wrapper, then wrapper to body
  wrapper.appendChild(widget);
  document.body.appendChild(wrapper);
})();
