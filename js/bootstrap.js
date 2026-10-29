/* Fast static-host bootloader.
   Cache the larger config/app scripts by build version. Refresh the small editable content
   each page load so manual content-editor exports appear immediately without disabling the
   browser cache for the 80 KB scene code and its images. Bump BUILD_VERSION for source or image changes. */
(function () {
  'use strict';
  const BUILD_VERSION = 'portfolio-speed-20261029-1';
  const scripts = [
    { src: 'js/content.js', refresh: true },
    { src: 'js/config.js', refresh: false },
    { src: 'js/main.js', refresh: false }
  ];
  window.PORTFOLIO_ASSET_VERSION = BUILD_VERSION;
  let index = 0;
  function next() {
    if (index >= scripts.length) return;
    const item = scripts[index++];
    const version = item.refresh ? Date.now().toString(36) : BUILD_VERSION;
    const script = document.createElement('script');
    script.src = item.src + '?v=' + version;
    script.onload = next;
    script.onerror = function () {
      console.error('Portfolio could not load ' + item.src + '. Check the project folder structure and file names.');
      const status = document.createElement('div');
      status.setAttribute('role', 'alert');
      status.style.cssText = 'position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;padding:14px 18px;border-radius:12px;background:#172554;color:#fff;font:14px/1.6 system-ui,sans-serif;box-shadow:0 8px 28px #0006';
      status.textContent = 'Portfolio file not loaded: ' + item.src + '. Keep index.html beside the css, js, images and files folders.';
      document.body.appendChild(status);
    };
    document.body.appendChild(script);
  }
  next();
})();
