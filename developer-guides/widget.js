(function() {
  // Create and append the script element
  var script = document.createElement('script');
  script.src = "https://elevenlabs.io/convai-widget/index.js";
  script.async = true;
  script.type = "text/javascript";
  document.head.appendChild(script);

  // hide convai on mobile
  var wrapper = document.createElement('div');
  wrapper.className = "hidden lg:block";

  // Create and append the widget element
  var widget = document.createElement('elevenlabs-convai');
  widget.setAttribute('agent-id', 'oapIEuaQlE30RdjtC9BX');
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
  
  // Append widget to wrapper, then wrapper to body
  wrapper.appendChild(widget);
  document.body.appendChild(wrapper);
})();