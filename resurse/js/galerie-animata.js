window.addEventListener("load", function () {
  const poze = document.querySelectorAll(".galerie-animata .poza-galerie");
  let index = 0;

  poze[index].classList.add("show", "activ"); // prima imagine

  function schimbaPoza() {
    const pozaVeche = poze[index];
    index = (index + 1) % poze.length;
    const pozaNoua = poze[index];

    poze.forEach(p => {
      p.classList.remove("show", "activ");
      p.style.zIndex = "0";
    });

    pozaVeche.classList.add("show");
    pozaVeche.style.zIndex = "1";

    pozaNoua.classList.add("show", "activ");
    pozaNoua.style.zIndex = "2";
  }

  setInterval(schimbaPoza, 6000);
});
