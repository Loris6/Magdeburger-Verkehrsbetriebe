/* MVB – kein Hineinzoomen auf der ganzen Webseite
   (Zwei-Finger-Zoom, Doppeltippen, Strg/⌘ + Mausrad oder Touchpad, Strg/⌘ + Plus/Minus/0).
   Der Viewport sperrt den Zoom auf Android; iOS ignoriert das, deshalb zusätzlich hier.
   Die Karten zoomen weiterhin selbst (MapLibre verarbeitet die Gesten vorher). */
(function () {
  'use strict';
  var stop = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
    document.addEventListener(type, stop, { passive: false });
  });
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1 || (typeof e.scale === 'number' && e.scale !== 1)) e.preventDefault();
  }, { passive: false });
  // Doppeltippen
  var last = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - last < 300 && !e.target.closest('input, textarea, select, .maplibregl-canvas-container')) e.preventDefault();
    last = now;
  }, { passive: false });
  window.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0', 'Add', 'Subtract'].indexOf(e.key) !== -1) e.preventDefault();
  });
})();
