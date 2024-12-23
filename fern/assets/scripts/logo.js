function initLogoVisibility() {
  function updateLogoVisibility() {
    const logoContainer = document.querySelector('.fern-logo-container');
    if (!logoContainer) return;

    // Logo path mapping based on URL patterns
    const logoPathMap = {
      'conversational-ai': {
        light:
          'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/logo-light-conversational-ai.svg',
        dark: 'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/logo-dark-conversational-ai.svg',
      },

      'api-reference': {
        light:
          'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/logo-light-api-reference.svg',
        dark: 'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/logo-dark-api-reference.svg',
      },
      default: {
        light:
          'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/logo-light.svg',
        dark: 'https://raw.githubusercontent.com/elevenlabs/elevenlabs-docs/refs/heads/feat/docs-content-2-0/fern/assets/logo-dark.svg',
      },
    };

    let logoVariant = 'default';
    // Use router.pathname if available, otherwise fallback to window.location
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

  // Update on initial load
  updateLogoVisibility();

  // Listen for Next.js route changes
  if (window?.next?.router) {
    window.next.router.events.on('routeChangeComplete', updateLogoVisibility);
  }

  // Fallback to popstate event for non-Next.js navigation
  window.addEventListener('popstate', updateLogoVisibility);
}

// Run initialization when router is ready
if (window?.next?.router?.isReady) {
  initLogoVisibility();
} else {
  window?.next?.router?.events.on('routerChangeComplete', initLogoVisibility);
  // Fallback to DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoVisibility);
  } else {
    initLogoVisibility();
  }
}
