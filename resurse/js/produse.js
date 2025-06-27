document.addEventListener("DOMContentLoaded", function () {
  const inputNume = document.getElementById("inp-nume");
  const inputPret = document.getElementById("inp-pret");
  const outputPret = document.getElementById("val-curent");
  const inputCategorie = document.getElementById("inp-categorie");
  const inputGreutate = document.getElementsByName("greutate");
  const inputCheckboxuri = document.getElementsByName("medii");
  const inputCulori = document.getElementById("inp-culori");
  const inputLuni = document.getElementById("inp-luni");
  const checkboxDiscount = document.getElementById("inp-discount");
  const inputComportamentRadio = document.getElementsByName("comportament-radio");

  function valideazaInputuri() {
    const nume = document.getElementById("inp-nume");
    const observatii = document.getElementById("inp-observatii");

    nume.style.border = "";
    observatii.classList.remove("is-invalid");

    let valid = true;

    if (/\d/.test(nume.value)) {
      alert("Numele nu trebuie să conțină cifre.");
      nume.style.border = "2px solid red";
      valid = false;
    }

    if (observatii.value.trim() !== "" && observatii.value.trim().length < 3) {
      observatii.classList.add("is-invalid");
      valid = false;
    }

    return valid;
  }

  if (inputPret && outputPret) {
    inputPret.oninput = function () {
      outputPret.textContent = `(${this.value})`;
    };
  }

  const btnFiltrare = document.getElementById("btn-filtrare");
  if (btnFiltrare)
    btnFiltrare.onclick = function () {
      if (!valideazaInputuri()) return;
      const articole = document.getElementsByTagName("article");
      const valoareNume = inputNume.value.toLowerCase();
      const valoarePret = parseFloat(inputPret.value);
      const valoareCategorie = inputCategorie.value.toLowerCase();
      const valDatalist = document.getElementById("inp-datalist").value.toLowerCase();
      const valObservatii = document.getElementById("inp-observatii").value.toLowerCase();

      let greutateSelectata = "toate";
      for (let radio of inputGreutate) {
        if (radio.checked) greutateSelectata = radio.value;
      }

      let mediiSelectate = Array.from(inputCheckboxuri).filter(c => c.checked).map(c => c.value.toLowerCase());
      let culoriSelectate = Array.from(inputCulori.selectedOptions).map(opt => opt.value.toLowerCase());
      let luniSelectate = Array.from(inputLuni.selectedOptions).map(opt => opt.value);
      if (luniSelectate.includes("toate")) luniSelectate = [];

      for (let art of articole) {
        let afiseaza = true;
        const nume = art.querySelector("h3")?.textContent.toLowerCase() ?? "";
        const pret = parseFloat(art.dataset.pret);
        const categorie = art.dataset.categorie?.toLowerCase() ?? "";
        const greutate = parseFloat(art.dataset.greutate);
        const medii = art.dataset.medii?.toLowerCase().split(",") ?? [];
        const culoare = art.dataset.culoare?.toLowerCase() ?? "";
        const subcategorie = art.dataset.subcategorie?.toLowerCase() ?? "";
        const observatii = art.dataset.observatii?.toLowerCase() ?? "";
        const luna = art.dataset.luna;
        const comportament = art.dataset.comportament;

        let comportamentSelectat = "toate";
        for (let r of inputComportamentRadio) if (r.checked) comportamentSelectat = r.value;

        if (!nume.includes(valoareNume)) afiseaza = false;
        if (pret < valoarePret) afiseaza = false;
        if (valoareCategorie && categorie !== valoareCategorie) afiseaza = false;
        if (valDatalist && !subcategorie.includes(valDatalist)) afiseaza = false;
        if (valObservatii && !observatii.includes(valObservatii)) afiseaza = false;
        if (checkboxDiscount.checked && pret <= 2000) afiseaza = false;
        if (comportamentSelectat !== "toate" && comportament !== comportamentSelectat) afiseaza = false;
        if (greutateSelectata !== "toate") {
          if (greutateSelectata === "usoare" && greutate >= 3) afiseaza = false;
          if (greutateSelectata === "mijlocii" && (greutate < 3 || greutate > 5)) afiseaza = false;
          if (greutateSelectata === "grele" && greutate <= 5) afiseaza = false;
        }

        if (mediiSelectate.length > 0 && !mediiSelectate.every(m => medii.includes(m))) afiseaza = false;
        if (culoriSelectate.length > 0 && !culoriSelectate.includes(culoare)) afiseaza = false;
        if (luniSelectate.length > 0 && !luniSelectate.includes(luna)) afiseaza = false;

        art.style.display = afiseaza ? "grid" : "none";
      }
    };

  const inpPret = document.getElementById("inp-pret");
  const valCurent = document.getElementById("val-curent");
  if (inpPret && valCurent) {
    inpPret.addEventListener("input", function () {
      valCurent.textContent = `(${inpPret.value} / ${inpPret.max})`;
    });
  }

  const temaSwitch = document.getElementById("tema-switch");
  const btnSwitch = document.getElementById("switch-tema");

  const body = document.body;
  const temaSalvata = localStorage.getItem("tema");

  if (temaSalvata === "dark") {
    body.classList.add("dark");
    if (temaSwitch) temaSwitch.checked = true;
    if (btnSwitch) btnSwitch.checked = true;
  }

  if (temaSwitch) {
    temaSwitch.addEventListener("change", () => {
      if (temaSwitch.checked) {
        body.classList.add("dark");
        localStorage.setItem("tema", "dark");
      } else {
        body.classList.remove("dark");
        localStorage.setItem("tema", "light");
      }
    });
  }

  if (btnSwitch) {
    btnSwitch.addEventListener("change", () => {
      if (btnSwitch.checked) {
        body.classList.add("dark");
        localStorage.setItem("tema", "dark");
      } else {
        body.classList.remove("dark");
        localStorage.setItem("tema", "light");
      }
    });
  }

  const btnReset = document.getElementById("btn-resetare");
  if (btnReset)
    btnReset.onclick = function () {
      if (confirm("Sigur vrei să resetezi toate filtrele și să anulezi sortarea?"))
        location.reload();
    };

  const btnAsc = document.getElementById("sort-asc");
  const btnDesc = document.getElementById("sort-desc");
  const btnSuma = document.getElementById("btn-suma");

  if (btnAsc)
    btnAsc.onclick = function () {
      if (!valideazaInputuri()) return;
      sorteazaArticole(true);
    };

  if (btnDesc)
    btnDesc.onclick = function () {
      if (!valideazaInputuri()) return;
      sorteazaArticole(false);
    };

  function sorteazaArticole(ascendent = true) {
    const container = document.querySelector(".grid-produse");
    if (!container) return;

    const articole = Array.from(container.getElementsByTagName("article"));
    articole.sort((a, b) => {
      const pretA = parseFloat(a.dataset.pret);
      const pretB = parseFloat(b.dataset.pret);

      if (pretA !== pretB) return ascendent ? pretA - pretB : pretB - pretA;

      const mediiA = a.dataset.medii.split(",").length;
      const mediiB = b.dataset.medii.split(",").length;

      return ascendent ? mediiA - mediiB : mediiB - mediiA;
    });

    for (let art of articole)
      container.appendChild(art);
  }

  if (btnSuma)
    btnSuma.onclick = function () {
      if (!valideazaInputuri()) return;
      let suma = 0;
      document.querySelectorAll("article").forEach(art => {
        if (art.style.display !== "none") {
          suma += parseFloat(art.dataset.pret);
        }
      });

      const div = document.createElement("div");
      div.textContent = `Suma prețurilor afișate: ${suma} lei`;
      Object.assign(div.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "#cceeff",
        padding: "1em",
        border: "2px solid #333",
        borderRadius: "10px",
        boxShadow: "0px 0px 5px black",
        fontWeight: "bold",
        zIndex: "9999"
      });
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2000);
    };
});
