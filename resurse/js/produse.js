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

  const modal = document.getElementById("modal-produse");
const modalContinut = document.getElementById("continut-modal");
const btnInchide = document.getElementById("btn-inchide-modal");
if (btnInchide)
  btnInchide.onclick = () => {
    modal.style.display = "none";
  };

window.onclick = e => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};


document.querySelectorAll(".grid-produse article").forEach(art => {
  art.addEventListener("click", (e) => {
    const tag = e.target.tagName.toLowerCase();
  if (
    ["p", "h3", "a", "strong", "span", "summary", "details", "button", "svg", "use"].includes(tag) ||
    e.target.closest("a") ||
    e.target.closest("summary") ||
    e.target.hasAttribute("data-no-modal")
  ) return;
    const titlu = art.querySelector("h3")?.textContent;
    const poza = art.querySelector("img")?.src;
    const pret = art.dataset.pret;
    const categorie = art.dataset.categorie;
    const greutate = art.dataset.greutate;
    const descriere = art.querySelector(".descriere")?.textContent;

    modalContinut.innerHTML = `
      <h3>${titlu}</h3>
      <img src="${poza}" alt="Imagine ${titlu}" style="width: 100%; max-width: 300px; border-radius: 10px;">
      <p><strong>Categorie:</strong> ${categorie}</p>
      <p><strong>Preț:</strong> ${pret} lei</p>
      <p><strong>Greutate:</strong> ${greutate} kg</p>
      <p>${descriere}</p>
    `;

    modal.style.display = "flex";
  });
});

  function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}


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
      const valoareNume = normalizeText(inputNume.value);
      const valoarePret = parseFloat(inputPret.value);
      const valoareCategorie = inputCategorie.value.toLowerCase();
      const valDatalist = normalizeText(document.getElementById("inp-datalist").value);
      const valObservatii = normalizeText(document.getElementById("inp-observatii").value);


      

btnInchide.onclick = () => modal.style.display = "none";
window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};



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
        const nume = normalizeText(art.querySelector("h3")?.textContent ?? "");
        const pret = parseFloat(art.dataset.pret);
        const categorie = art.dataset.categorie?.toLowerCase() ?? "";
        const greutate = parseFloat(art.dataset.greutate);
        const medii = art.dataset.medii?.toLowerCase().split(",") ?? [];
        const culoare = art.dataset.culoare?.toLowerCase() ?? "";
        const subcategorie = normalizeText(art.dataset.subcategorie ?? "");
        const observatii = normalizeText(art.dataset.observatii ?? "");
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
      let vreunAfisat = false;

for (let art of articole) {
  if (art.style.display !== "none") vreunAfisat = true;
}

let totalAfisate = 0;
for (let art of articole) {
  if (art.style.display !== "none") totalAfisate++;
}
document.getElementById("nr-produse").textContent = totalAfisate;


const mesaj = document.getElementById("mesaj-vid");
if (mesaj) {
  mesaj.style.display = vreunAfisat ? "none" : "block";
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
    function marcheazaCeleMaiIeftineProduse() {
  const articole = document.querySelectorAll(".grid-produse article");
  const produsePeCategorii = {};

  articole.forEach(art => {
    const cat = art.dataset.categorie;
    const pret = parseFloat(art.dataset.pret);
    if (!produsePeCategorii[cat] || pret < produsePeCategorii[cat].pret) {
      produsePeCategorii[cat] = { pret, articol: art };
    }
  });

  for (const cat in produsePeCategorii) {
    const art = produsePeCategorii[cat].articol;
    const badge = document.createElement("p");
    badge.textContent = "✨ Cel mai ieftin produs din categorie ✨";
    badge.classList.add("ieftin");
    art.prepend(badge);
  }
}
marcheazaCeleMaiIeftineProduse();

// La incarcarea paginii, seteaza nr initial de produse afisate
const articoleInitiale = document.querySelectorAll(".grid-produse article");
let totalInitial = 0;
articoleInitiale.forEach(art => {
  if (art.style.display !== "none") totalInitial++;
});
document.getElementById("nr-produse").textContent = totalInitial;



});
