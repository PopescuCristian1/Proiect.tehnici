const sharp = require("sharp");
const fs = require("fs");
const express = require("express");
const path = require("path");
const sass = require("sass");
const fsp = require("fs/promises");

const { Client } = require("pg");

const client = new Client({
    user: "pisici_user",
    password: "admin123",
    database: "pisici_site",
    host: "localhost",
    port: 5432
});

client.connect()
    .then(() => console.log("✔ Conectat la PostgreSQL"))
    .catch(err => console.error("❌ Eroare conectare PostgreSQL:", err));


globalThis.folderScss = path.join(__dirname, "resurse", "scss");
globalThis.folderCss = path.join(__dirname, "resurse", "css");

function compileazaScss(caleScss, caleCss) {
    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(globalThis.folderScss, caleScss);
    }

    if (!caleCss) {
        const numeFisier = path.basename(caleScss, ".scss") + ".css";
        caleCss = path.join(globalThis.folderCss, numeFisier);
    } else if (!path.isAbsolute(caleCss)) {
        caleCss = path.join(globalThis.folderCss, caleCss);
    }

    if (fs.existsSync(caleCss)) {
        try {
            const caleRelativaCss = path.relative(globalThis.folderCss, caleCss); 
            const caleBackup = path.join(__dirname, "backup", "resurse", "css", caleRelativaCss);
            const dirBackup = path.dirname(caleBackup);

            if (!fs.existsSync(dirBackup)) {
                fs.mkdirSync(dirBackup, { recursive: true });
            }

            fs.copyFileSync(caleCss, caleBackup);
            console.log(`✔ Fișier backup salvat: ${caleBackup}`);
        } catch (err) {
            console.error(`❌ Eroare la salvare backup pentru ${caleCss}:`, err.message);
        }
    }

    try {
        const rezultat = sass.compile(caleScss, {
  style: "expanded",
  loadPaths: ["node_modules"]
});

        fs.writeFileSync(caleCss, rezultat.css);
        console.log(`✔ Fișier compilat: ${caleScss} → ${caleCss}`);
    } catch (err) {
        console.error("❌ Eroare la compilare SCSS:", err.message);
    }
}

function compileazaToateScss() {
    fs.readdir(globalThis.folderScss, (err, fisiere) => {
        if (err) {
            console.error("❌ Eroare la citirea folderului SCSS:", err.message);
            return;
        }

        for (let fisier of fisiere) {
            if (path.extname(fisier) === ".scss") {
                compileazaScss(fisier);
            }
        }
    });
}

compileazaToateScss();

fs.watch(globalThis.folderScss, (eventType, filename) => {
    if (filename && path.extname(filename) === ".scss") {
        console.log(`🔁 Detectată modificare SCSS: ${filename}`);
        compileazaScss(filename);
    }
});


const foldereCreate = [
    path.join(__dirname, "temp"),
    path.join(__dirname, "backup", "resurse", "css")  
];

for (let folder of foldereCreate) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
}

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

function formatDate(data) {
    const luni = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
    const zile = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const d = new Date(data);
    return `${d.getDate()}-${luni[d.getMonth()]}-${d.getFullYear()} (${zile[d.getDay()]})`;
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



app.use(async (req, res, next) => {
    try {
        const rezultat_categorii = await client.query(`SELECT unnest(enum_range(NULL::categorie_mare))`);
        res.locals.optiuni = rezultat_categorii.rows.map(c => c.unnest);
    } catch (err) {
        console.error("Eroare la preluarea optiunilor din enum:", err);
        res.locals.optiuni = [];
    }
    next();
});


app.use("/resurse/imagini/galerie/small", express.static(path.join(__dirname, "resurse", "imagini", "galerie", "small")));
app.use("/resurse/imagini/galerie/medium", express.static(path.join(__dirname, "resurse", "imagini", "galerie", "medium")));





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



app.get("/galerie-animata", async (req, res) => {
  const caleJson = path.join(__dirname, "resurse", "json", "galerie.json");
  const raw = await fsp.readFile(caleJson);
  const json = JSON.parse(raw);

  const puteri = [2, 4, 8];
  const nrPoze = puteri[Math.floor(Math.random() * puteri.length)];

  const imaginiCuIndexPar = json.imagini.filter((_, i) => i % 2 === 0);

  const imaginiGalerie = imaginiCuIndexPar
    .slice(0, nrPoze)
    .map(img => ({
      src: "/" + json.cale_galerie + img.fisier_imagine, 
      alt: img.continut_alternativ || ""
    }));

  res.render("pagini/galerie-animata", { imagini: imaginiGalerie });
});


app.get("/produs/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const rezultat = await client.query("SELECT * FROM produse WHERE id = $1", [id]);
    if (rezultat.rows.length === 0)
      return res.status(404).render("pagini/eroare", { err: "Produsul nu există." });

    const prod = rezultat.rows[0];

    // formatam data
    const date = new Date(prod.data_aparitie);
    const zile = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const luni = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
    prod.data_aparitie_form = `${date.getDate()}-${luni[date.getMonth()]}-${date.getFullYear()} (${zile[date.getDay()]})`;

    // Preluam seturile in care apare acest produs
    const query = `
      SELECT s.id AS id_set, s.nume_set, s.descriere_set,
             p.id AS id_produs, p.nume, p.imagine, p.pret
      FROM seturi s
      JOIN asociere_set a1 ON s.id = a1.id_set AND a1.id_produs = $1
      JOIN asociere_set a2 ON s.id = a2.id_set
      JOIN produse p ON p.id = a2.id_produs
      ORDER BY s.id, p.id;
    `;
    const rezultatSeturi = await client.query(query, [id]);
    const randuri = rezultatSeturi.rows;

    const seturi = {};
    for (let r of randuri) {
      if (!seturi[r.id_set]) {
        seturi[r.id_set] = {
          id: r.id_set,
          nume: r.nume_set,
          descriere: r.descriere_set,
          produse: [],
          pret: 0
        };
      }

      seturi[r.id_set].produse.push({
        id: r.id_produs,
        nume: r.nume,
        imagine: r.imagine,
        pret: parseFloat(r.pret)
      });
    }

    for (let set of Object.values(seturi)) {
      let suma = 0;
      for (let p of set.produse) {
        suma += p.pret;
      }
      const reducere = Math.min(set.produse.length, 5) * 0.05;
      set.pret = (suma * (1 - reducere)).toFixed(2);
    }

    res.render("pagini/produs", { prod, seturi: Object.values(seturi) });


  } catch (err) {
    console.log(err);
    res.status(500).render("pagini/eroare", { err: "Eroare server." });
  }
});





app.get("/produse/:categorie?", async (req, res) => {
    const categorie = req.params.categorie;
    let conditie = [];
    let valori = [];

    if (categorie && categorie !== "toate") {
        conditie.push("categorie_mare = $1");
        valori.push(categorie);
    }

    

    let query = "SELECT * FROM produse";
    if (conditie.length > 0) {
        query += " WHERE " + conditie.join(" AND ");
    }

    try {
        const rezultate = await client.query(query, valori);
        const produse = rezultate.rows;

        for (let prod of produse) {
            let d = new Date(prod.data_aparitie);
            let zile = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
            let luni = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
            prod.data_aparitie_form = `${d.getDate()}-${luni[d.getMonth()]}-${d.getFullYear()} (${zile[d.getDay()]})`;

            prod.categorie = prod.categorie_mare;
        }

        let enum_categorii = await client.query("SELECT unnest(enum_range(NULL::categorie_mare)) as cat");
        let optiuni = enum_categorii.rows.map(c => c.cat);
        let pretMinim = null, pretMaxim = null;

        for (let prod of produse) {
            if (pretMinim == null || prod.pret < pretMinim) pretMinim = prod.pret;
            if (pretMaxim == null || prod.pret > pretMaxim) pretMaxim = prod.pret;
        }


        let ofertaCurenta = null;

try {
    const raw = await fsp.readFile("resurse/Json/oferte.json", "utf-8");
    const jsonOferte = JSON.parse(raw);

    const acum = new Date();
    const oraCurentaMin = acum.getHours() * 60 + acum.getMinutes();

    //ȘTERGEREA ofertelor expirate ===
    const T2 = 1; 
    const acumMinAbs = acum.getTime() / (1000 * 60);

    jsonOferte.oferte = jsonOferte.oferte.filter(oferta => {
    const [hEnd, mEnd] = oferta["ora-finalizare"].split(":").map(Number);
    const [hStart, mStart] = oferta["ora-incepere"].split(":").map(Number);

    const endDate = new Date(acum);
    const startMin = hStart * 60 + mStart;
    const endMin = hEnd * 60 + mEnd;

    if (startMin > endMin) {
        if (oraCurentaMin < endMin || oraCurentaMin >= startMin) {
            endDate.setDate(endDate.getDate() + 1);
        }
    }

    endDate.setHours(hEnd, mEnd, 0, 0);

    const endAbsMin = endDate.getTime() / (1000 * 60);
    return endAbsMin >= acumMinAbs - T2;
});


    // SELECTAREA ofertei active ===
    const oferteSortate = jsonOferte.oferte.sort((a, b) => {
        const [h1, m1] = a["ora-incepere"].split(":").map(Number);
        const [h2, m2] = b["ora-incepere"].split(":").map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
    });

    for (let oferta of oferteSortate) {
        const [hStart, mStart] = oferta["ora-incepere"].split(":").map(Number);
        const [hEnd, mEnd] = oferta["ora-finalizare"].split(":").map(Number);

        const startMin = hStart * 60 + mStart;
        const endMin = hEnd * 60 + mEnd;

        let esteInInterval = false;

        if (startMin < endMin) {
            esteInInterval = oraCurentaMin >= startMin && oraCurentaMin < endMin;
        } else {
            esteInInterval = oraCurentaMin >= startMin || oraCurentaMin < endMin;
        }

        if (esteInInterval) {
            const dataFinalizare = new Date(acum);
            if (startMin > endMin && oraCurentaMin < endMin) {
                dataFinalizare.setDate(acum.getDate() + 1);
            }
            dataFinalizare.setHours(hEnd);
            dataFinalizare.setMinutes(mEnd);
            dataFinalizare.setSeconds(0);
            dataFinalizare.setMilliseconds(0);

            ofertaCurenta = {
                ...oferta,
                minutFinalAbsolut: endMin,
                "data-finalizare": dataFinalizare.toISOString()
            };
            break;
        }
    }

    await fsp.writeFile("resurse/Json/oferte.json", JSON.stringify(jsonOferte, null, 2));
} catch (e) {
    console.log("Eroare la citirea ofertelor:", e);
}





        res.render("pagini/produse", {
            produse: produse,
            categorie_selectata: categorie,
            optiuni: optiuni,
            pretMinim,
            pretMaxim,
            ofertaCurenta
        });
    } catch (err) {
        console.log(err);
        res.status(500).render("pagini/eroare", { err: "Eroare la interogare produse." });
    }
});


app.get("/seturi", async (req, res) => {
  try {
    const query = `
      SELECT s.id AS id_set, s.nume_set, s.descriere_set, 
             p.id AS id_produs, p.nume, p.imagine, p.pret
      FROM seturi s
      JOIN asociere_set a ON s.id = a.id_set
      JOIN produse p ON a.id_produs = p.id
      ORDER BY s.id, p.id;
    `;

    const rezultat = await client.query(query);
    const randuri = rezultat.rows;

    const seturi = {};
for (let r of randuri) {
  if (!seturi[r.id_set]) {
    seturi[r.id_set] = {
      id: r.id_set,
      nume: r.nume_set,
      descriere: r.descriere_set,
      produse: [],
      pret: 0
    };
  }

  seturi[r.id_set].produse.push({
    id: r.id_produs,
    nume: r.nume,
    imagine: r.imagine,
    pret: parseFloat(r.pret)
  });
}

for (let set of Object.values(seturi)) {
  let suma = 0;
  for (let p of set.produse) {
    suma += p.pret;
  }
  const reducere = Math.min(set.produse.length, 5) * 0.05;
  set.pret = (suma * (1 - reducere)).toFixed(2); 
}

    console.log("SETURI=", seturi);
    console.log("=== PRETURI SETURI ===");
for (let s of Object.values(seturi)) {
    console.log(s.nume, "=>", s.pret);
}

    res.render("pagini/seturi", { seturi: Object.values(seturi) });
  } catch (err) {
    console.error(err);
    res.status(500).render("pagini/eroare", {
      titlu: "Eroare la afișarea seturilor",
      text: "A apărut o problemă la afișarea datelor din baza de date.",
      imagine: "/resurse/imagini/erori/default.png"
    });
  }
});



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