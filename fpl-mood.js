/* Tints the page background based on how my FPL team is doing.
 * fpl.json is refreshed by a scheduled GitHub Action; score is in [-1, 1]
 * (green = beating the gameweek's global average, red = below it).
 */
(function () {
  'use strict';

  var GREEN = [46, 160, 67];
  var RED = [207, 34, 46];

  fetch('fpl.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var s = Math.max(-1, Math.min(1, d.score || 0));
      var tint = s >= 0 ? GREEN : RED;
      // A small floor so a typical 5-point miss/beat is actually visible,
      // without turning a blowout gameweek into a solid red/green wall.
      var a = Math.abs(s) < 0.02 ? 0 : Math.min(0.42, 0.14 + Math.abs(s) * 0.32);
      var mix = tint.map(function (c) { return Math.round(255 * (1 - a) + c * a); });
      var color = 'rgb(' + mix.join(',') + ')';
      document.documentElement.style.backgroundColor = color;
      document.body.style.backgroundColor = color;

      var note = document.getElementById('fpl-mood-note');
      if (note && d.event != null) {
        note.textContent = 'This page is tinted by my FPL mood \u2014 GW' + d.event +
          ': ' + d.points + ' pts vs a global average of ' + d.average + '.';
      }
    })
    .catch(function () { /* no data, no tint */ });
})();
