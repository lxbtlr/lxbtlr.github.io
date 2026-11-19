// Turns each build-time plot (<figure class="dbplot">, from lib/dbplot.js)
// into a live Vega-Lite chart. The static SVG stays until the chart is ready,
// and stays for good if the scripts fail to load. Every plot includes this
// file, so it guards against running twice.
(function () {
  if (window.__dbplot) return;
  window.__dbplot = true;

  var LIBS = ["/assets/vendor/vega.min.js",
              "/assets/vendor/vega-lite.min.js",
              "/assets/vendor/vega-embed.min.js"];

  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("could not load " + src)); };
      document.head.appendChild(s);
    });
  }

  function start() {
    var figures = document.querySelectorAll("figure.dbplot");
    if (!figures.length) return;
    // In order: vega-lite and vega-embed attach to the vega global.
    LIBS.reduce(function (p, src) { return p.then(function () { return load(src); }); },
                Promise.resolve())
      .then(function () {
        figures.forEach(function (fig) {
          var json = fig.querySelector("script.dbplot-spec");
          var host = fig.querySelector(".dbplot-chart");
          if (!json || !host) return;
          var spec = JSON.parse(json.textContent);
          // Render in place (container-sized specs need a width), then
          // drop the static copy.
          var stale = Array.prototype.slice.call(host.childNodes);
          var live = document.createElement("div");
          host.appendChild(live);
          vegaEmbed(live, spec, { actions: false, renderer: "svg" })
            .then(function () { stale.forEach(function (n) { n.remove(); }); })
            .catch(function (e) { console.warn("dbplot:", e); });
        });
      })
      .catch(function (e) { console.warn("dbplot:", e); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
