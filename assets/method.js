document.querySelectorAll(".site-nav a").forEach((a) => {
  if (a.getAttribute("href") === "method.html") a.setAttribute("aria-current", "page");
});
window.renderMathInElement(document.getElementById("main"), {
  delimiters: [
    { left: "$$", right: "$$", display: true },
    { left: "\\(", right: "\\)", display: false },
  ],
  throwOnError: false,
  output: "htmlAndMathml",
});
document.querySelectorAll(".formula").forEach((el) => {
  el.tabIndex = 0;
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", "Formula (scroll horizontally if needed)");
});
