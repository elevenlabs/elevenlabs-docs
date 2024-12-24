const remote =
  'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/';
function initLogoVisibility() {
  function updateLogoVisibility() {
    const logoContainer = document.querySelector('.fern-logo-container');
    if (!logoContainer) return;

    const logoPathMap = {
      'conversational-ai': {
        light: `${remote}logo-light-conversational-ai.svg`,
        dark: `${remote}logo-dark-conversational-ai.svg`,
      },

      'api-reference': {
        light: `${remote}logo-light-api-reference.svg`,
        dark: `${remote}logo-dark-api-reference.svg`,
      },
      default: {
        light: `${remote}logo-light.svg`,
        dark: `${remote}logo-dark.svg`,
      },
    };

    let logoVariant = 'default';
    const currentPath = window.location.pathname;
    console.log(currentPath);
    if (currentPath.startsWith('/docs/conversational-ai')) {
      logoVariant = 'conversational-ai';
    } else if (currentPath.startsWith('/docs/api-reference')) {
      logoVariant = 'api-reference';
    }

    // Update existing logo sources if they exist
    const lightLogo = logoContainer.querySelector('.fern-logo-light');
    const darkLogo = logoContainer.querySelector('.fern-logo-dark');

    if (lightLogo) lightLogo.src = logoPathMap[logoVariant].light;
    if (darkLogo) darkLogo.src = logoPathMap[logoVariant].dark;
  }

  updateLogoVisibility();

  window.addEventListener('popstate', updateLogoVisibility);

  const observer = new MutationObserver(updateLogoVisibility);
  observer.observe(document.querySelector('body'), {
    subtree: true,
    childList: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogoVisibility);
} else {
  initLogoVisibility();
}
