/* Portfolio bootloader: load content first, then config and the 3D app.
   A cache-busting query ensures newly exported js/content.js is picked up after replacement. */
(function () {
  'use strict';
  const scripts = ['js/content.js', 'js/config.js', 'js/main.js'];
  const version = Date.now().toString(36);
  window.PORTFOLIO_ASSET_VERSION = version;
  let index = 0;
  function next() {
    if (index >= scripts.length) return;
    const src = scripts[index++];
    const script = document.createElement('script');
    script.src = src + (src.includes('?') ? '&' : '?') + 'v=' + version;
    script.onload = next;
    script.onerror = function () {
      console.error('Portfolio could not load ' + src + '. Check the project folder structure and file names.');
      const status = document.createElement('div');
      status.setAttribute('role', 'alert');
      status.style.cssText = 'position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;padding:14px 18px;border-radius:12px;background:#172554;color:#fff;font:14px/1.6 system-ui,sans-serif;box-shadow:0 8px 28px #0006';
      status.textContent = 'Portfolio file not loaded: ' + src + '. Keep index.html beside the css, js, images and files folders.';
      document.body.appendChild(status);
    };
    document.body.appendChild(script);
  }
  next();
})();
