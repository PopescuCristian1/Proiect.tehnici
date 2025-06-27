const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { Client } = require("pg");

const caleJson = path.join(__dirname, "..", "json", "oferte.json");


const valoriReducere = [5,10,15,20,25,30,35,40,45,50];
const durataMinute = 2;

(async () => {
    const client = new Client({
        user: "pisici_user",
        password: "admin123",
        database: "pisici_site",
        host: "localhost",
        port: 5432
    });

    await client.connect();

    const rezultat = await client.query(`SELECT unnest(enum_range(NULL::categorie_mare)) AS categorie`);
    const categorii = rezultat.rows.map(r => r.categorie);
    await client.end();

    let continutJson = { oferte: [] };
    try {
        const continutFisier = await fsp.readFile(caleJson, "utf8");
        continutJson = JSON.parse(continutFisier);
    } catch (err) {
        console.log("Fișierul nu există sau nu e valid, se va crea unul nou.");
    }

    const ultimaOferta = continutJson.oferte[0];
    let categoriiValide = categorii;
    if (ultimaOferta) {
        categoriiValide = categorii.filter(cat => cat !== ultimaOferta.categorie);
    }

    const categorieAleasa = categoriiValide[Math.floor(Math.random() * categoriiValide.length)];
    const reducere = valoriReducere[Math.floor(Math.random() * valoriReducere.length)];

    const dataIncepere = new Date();
    const dataFinalizare = new Date(dataIncepere.getTime() + durataMinute * 60000);

    const nouaOferta = {
        categorie: categorieAleasa,
        "reducere": reducere,
        "data-incepere": dataIncepere.toISOString(),
        "data-finalizare": dataFinalizare.toISOString()
    };

    continutJson.oferte.unshift(nouaOferta);

    await fsp.writeFile(caleJson, JSON.stringify(continutJson, null, 2));

    console.log("Ofertă generată cu succes:", nouaOferta);
})();
