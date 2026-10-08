// Light/dark theme toggle. The inline snippet in base.njk applies the
// saved theme before first paint; this file wires up the header button.
(function () {
  var KEY = "theme";
  var root = document.documentElement;

  function save(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  function label(button, theme) {
    var next = theme === "dark" ? "light" : "dark";
    button.textContent = theme === "dark" ? "☀" : "☾";
    button.setAttribute("aria-label", "Switch to " + next + " mode");
    button.title = "Switch to " + next + " mode";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".theme-toggle");
    if (!button) return;
    label(button, root.dataset.theme);
    button.hidden = false;
    button.addEventListener("click", function () {
      var theme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = theme;
      save(theme);
      label(button, theme);
    });
  });
})();
