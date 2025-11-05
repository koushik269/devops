const btn = document.getElementById("learnBtn");
const info = document.getElementById("infoBox");

btn.addEventListener("click", () => {
  info.classList.toggle("hidden");
});
