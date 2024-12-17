function inject() {
  console.log("Injecting ElevenLabs Convai widget");
  
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