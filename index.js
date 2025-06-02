const sharp = require("sharp");
const fs = require("fs");
const express = require("express");
const path = require("path");

function genereazaImaginiRedimensionate(imagineNume, caleFolder) {
  const caleOriginala = path.join(__dirname, "resurse", "imagini", "galerie", imagineNume);
  const caleMedium = path.join(__dirname, "resurse", "imagini", "galerie", "medium", imagineNume);
  const caleSmall = path.join(__dirname, "resurse", "imagini", "galerie", "small", imagineNume);

  if (!fs.existsSync(caleMedium)) {
    sharp(caleOriginala).resize({ width: 300 }).toFile(caleMedium, () => {});
  }

  if (!fs.existsSync(caleSmall)) {
    sharp(caleOriginala).resize({ width: 150 }).toFile(caleSmall, () => {});
  }
}


const app = express();


const vect_foldere = ["temp"];

vect_foldere.forEach(fld => {
    const caleFolder = path.join(__dirname, fld);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folder creat: ${caleFolder}`);
    }
});


global.obGlobal = {
  obErori: null
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function initErori() {
  const eroriRaw = fs.readFileSync(path.join(__dirname, "resurse/Json/erori.json"), "utf-8");
  const eroriJson = JSON.parse(eroriRaw);

  eroriJson.info_erori.forEach(err => {
    err.imagine = path.join(eroriJson.cale_baza, err.imagine);
  });

  eroriJson.eroare_default.imagine = path.join(eroriJson.cale_baza, eroriJson.eroare_default.imagine);

  obGlobal.obErori = eroriJson;
}

function afisareEroare(res, identificator, titlu, text, imagine) {
  let eroare = obGlobal.obErori.eroare_default;

  if (identificator) {
    const eroareCautata = obGlobal.obErori.info_erori.find(e => e.identificator == identificator);
    if (eroareCautata) {
      eroare = eroareCautata;
    }
  }

  if (titlu) eroare.titlu = titlu;
  if (text) eroare.text = text;
  if (imagine) eroare.imagine = imagine;

  const status = eroare.status ? eroare.identificator : 200;
  res.status(status).render("pagini/eroare", {
    titlu: eroare.titlu,
    text: eroare.text,
    imagine: eroare.imagine
  });
}

initErori();




app.use((req, res, next) => {
  if (req.url.includes(".ejs")) {
    afisareEroare(res, 400);
  } else {
    next();
  }
});

app.use("/resurse", express.static(path.join(__dirname, "resurse")));


app.get(["/", "/index", "/home"], (req, res) => {
  res.render("pagini/index", { ip: req.ip });
});


app.get("/interzis", function (req, res) {
  afisareEroare(res, 403);
});

app.get("/eroare-custom", function(req, res){
    afisareEroare(res, null, "Eroare Personalizată", "Aceasta este o eroare personalizată fără identificator.", "/resurse/imagini/erori/custom.png");
});

app.get("/favicon.ico", function(req, res) {
  res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

app.get("/despre", (req, res) => {
  res.render("pagini/despre");
});


app.get("/video", (req, res) => {
    res.render("pagini/video");
});



app.get("/galerie", (req, res) => {
  const caleJson = path.join(__dirname, "resurse/Json/galerie.json");
  const json = JSON.parse(fs.readFileSync(caleJson));
  json.imagini.forEach(img => {
    genereazaImaginiRedimensionate(img.fisier_imagine);
  });
  const ziuaCurenta = new Date().toLocaleDateString("ro-RO", { weekday: "long" }).toLowerCase();
  const zile = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];
  const roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"];

  let imagini = json.imagini.filter(img =>
    img.intervale?.some(([ziStart, ziEnd]) => {
      const start = zile.indexOf(ziStart.toLowerCase());
      const end = zile.indexOf(ziEnd.toLowerCase());
      const curent = zile.indexOf(ziuaCurenta);
      return curent >= start && curent <= end;
    })
  );

  if (imagini.length % 2 !== 0) {
    imagini.pop();
  }

  imagini = imagini.map((img, i) => ({
    cale: "/" + path.join(json.cale_galerie, img.fisier_imagine),
    caleMed: "/resurse/imagini/galerie/medium/" + img.fisier_imagine,
    caleMic: "/resurse/imagini/galerie/small/" + img.fisier_imagine,
    alt: img.continut_alternativ || img.nume_poză,
    title: img.descriere_poză,
    descriere: img.descriere_poză,
    indexRoman: roman[i],
    pozitie: i
  }));

  res.render("pagini/galerie", { imagini });
});


app.use("/resurse/imagini/galerie/small", express.static(path.join(__dirname, "resurse", "imagini", "galerie", "small")));
app.use("/resurse/imagini/galerie/medium", express.static(path.join(__dirname, "resurse", "imagini", "galerie", "medium")));



app.get("/*", function (req, res) {
  let numePagina = req.url.substring(1);
  if (numePagina === "") numePagina = "index";

  const caleView = "pagini/" + numePagina;

  res.render(caleView, { ip: req.ip }, function (err, html) {
    if (err) {
      console.log("EROARE RANDARE:", err);
      if (err.message.includes("Failed to lookup view")) {
        afisareEroare(res, 404);
      } else {
        afisareEroare(res);
      }
    } else {
      res.send(html);
    }
  });
});



app.listen(8080, () => {
  console.log("Serverul a pornit pe portul 8080");
});