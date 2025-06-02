window.addEventListener("DOMContentLoaded", () => {
  const figuri = document.querySelectorAll('.fig-galerie');
  figuri.forEach((fig, idx) => {
    if ((Math.floor(idx / 3) + idx % 3) % 2 === 0) {
      fig.style.backgroundColor = "#fff";
    } else {
      fig.style.backgroundColor = "#000";
      fig.style.color = "#fff";
    }
  });
});
