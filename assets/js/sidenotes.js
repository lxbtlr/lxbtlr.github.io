// On narrow screens, sidenotes cannot sit in the margin. Rather than break
// the sentence they are attached to, move each note to just after the end of
// its paragraph (or to the end of its list item or table cell), and move it
// back into place when the screen is wide again. Without JS the notes stay
// inline under the sentence, as styled in style.css.
(() => {
  const narrow = window.matchMedia("(max-width: 62rem)");

  // Original spot of each note: the wrapper holding its marker.
  const home = new Map();

  function place() {
    const notes = document.querySelectorAll(".sidenote");
    if (narrow.matches) {
      for (const note of notes) {
        const wrapper = note.closest(".sidenote-wrapper");
        if (!wrapper) continue;
        home.set(note, wrapper);
        const para = wrapper.closest("p");
        let stack;
        if (para) {
          // One stack per paragraph, right after it, notes in order.
          stack = para.nextElementSibling;
          if (!stack?.classList.contains("sidenote-stack")) {
            stack = document.createElement("div");
            stack.className = "sidenote-stack";
            para.after(stack);
          }
        } else {
          const block = wrapper.closest("li, dd, td, th, blockquote, figcaption");
          if (!block) continue;
          stack = block.querySelector(":scope > .sidenote-stack");
          if (!stack) {
            stack = document.createElement("div");
            stack.className = "sidenote-stack";
            block.append(stack);
          }
        }
        stack.append(note);
      }
    } else {
      for (const [note, wrapper] of home) wrapper.append(note);
      home.clear();
      document.querySelectorAll(".sidenote-stack").forEach((s) => s.remove());
    }
  }

  place();
  narrow.addEventListener("change", place);
})();
