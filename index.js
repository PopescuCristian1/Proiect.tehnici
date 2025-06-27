const sharp = require("sharp");
const fs = require("fs");
const express = require("express");
const path = require("path");
const sass = require("sass");

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
            const caleRelativaCss = path.relative(globalThis.folderCss, caleCss); // ex: "stil.css"
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

app.get("/produs/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const rezultat = await client.query("SELECT * FROM produse WHERE id = $1", [id]);
    if (rezultat.rows.length === 0)
      return res.status(404).render("pagini/eroare", { err: "Produsul nu există." });

    const prod = rezultat.rows[0];

    // formatăm data
    const date = new Date(prod.data_aparitie);
    const zile = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const luni = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

    prod.data_aparitie_form = `${date.getDate()}-${luni[date.getMonth()]}-${date.getFullYear()} (${zile[date.getDay()]})`;

    res.render("pagini/produs", { prod });
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

        res.render("pagini/produse", {
            produse: produse,
            categorie_selectata: categorie,
            optiuni: optiuni
        });
    } catch (err) {
        console.log(err);
        res.status(500).render("pagini/eroare", { err: "Eroare la interogare produse." });
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