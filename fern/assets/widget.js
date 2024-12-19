<<<<<<< HEAD:developer-guides/widget.js
(function () {
  // Create and append the script element
  var script = document.createElement("script");
=======
function inject() {
  console.log("Injecting ElevenLabs Convai widget");
  
  var script = document.createElement('script');
>>>>>>> 6203563 (add v2 docs configuration):fern/assets/widget.js
  script.src = "https://elevenlabs.io/convai-widget/index.js";
  script.async = true;
  script.type = "text/javascript";
  document.head.appendChild(script);

<<<<<<< HEAD:developer-guides/widget.js
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
=======
  var wrapper = document.createElement('div');
  wrapper.className = "desktop";

  var widget = document.createElement('elevenlabs-convai');
  widget.setAttribute('agent-id', 'OZmXb9pmFsSkDE5dukJv');
  widget.setAttribute('avatar-orb-color-1', '#4D9CFF');
  widget.setAttribute('avatar-orb-color-2', '#9CE6E6');
  widget.innerHTML = `\
  <form slot="terms" class="prose text-sm">
    <h3>Terms and conditions</h3>
    <p>
      By clicking "Continue," I agree to the Terms of Service, acknowledge
      ElevenLabs' Privacy Policy.
    </p>
    <p>
      <label class="flex gap-2">
        <input class="h-5" required="required" type="checkbox" />
        I consent to the recording, collection and use of my voice and data
        derived from my voice to interpret my speech and provide customer
        support services.
      </label>
    </p>
    <p>
      <label class="flex gap-2">
        <input class="h-5" required="required" type="checkbox" />
        I consent to sharing my voice and data derived from my voice with 
        third-party service providers to train and improve our customer 
        support models.
      </label>
    </p>
    <p>
      <label class="flex gap-2">
        <input class="h-5" required="required" type="checkbox" />
        I understand that if I do not consent to the collection as 
        described above, ElevenLabs services cannot be provided to 
        me.
      </label>
    </p>
  </form>`;
  
>>>>>>> 6203563 (add v2 docs configuration):fern/assets/widget.js
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