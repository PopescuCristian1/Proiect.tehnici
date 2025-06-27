CREATE TYPE CATEGORIE_MARE AS ENUM (
    'Mica',
    'Medie',
    'Mare',
    'Gigantica',
    'Exotica'
);

REASSIGN OWNED BY postgres TO pisici_user;
ALTER TABLE produse OWNER TO pisici_user;
GRANT ALL PRIVILEGES ON TABLE produse TO pisici_user;
GRANT SELECT ON TABLE asociere_set TO pisici_user;
GRANT SELECT ON TABLE produse TO pisici_user;
GRANT SELECT ON TABLE seturi TO pisici_user;



CREATE TABLE produse (
    id SERIAL PRIMARY KEY,
    nume TEXT NOT NULL,
    descriere TEXT,
    imagine TEXT,

    categorie_mare CATEGORIE_MARE NOT NULL,
    subcategorie TEXT,

    pret NUMERIC(10,2),
    greutate NUMERIC(5,2),

    data_aparitie DATE,
    
    culoare TEXT,
    medii_viata TEXT,

    hipoalergenic BOOLEAN
);


INSERT INTO produse (nume, descriere, imagine, categorie_mare, subcategorie, pret, greutate, data_aparitie, culoare, medii_viata, hipoalergenic) VALUES
('British Shorthair', 'Pisică calmă, ideală pentru apartamente.', 'british.jpg', 'Mica', 'calmă', 1500, 4.5, '2023-02-10', 'Gri', 'interior', false),
('Maine Coon', 'Pisică foarte mare și blândă.', 'mainecoon.jpg', 'Gigantica', 'blândă', 2000, 8.0, '2022-11-05', 'Gri', 'ambele', false),
('Sphynx', 'Pisică fără blană, ideală pentru alergici.', 'sphynx.jpg', 'Mica', 'jucăușă', 2500, 3.2, '2023-05-22', 'Roz', 'interior', true),
('Persană', 'Pisică cu blană lungă, extrem de elegantă.', 'persana.jpg', 'Medie', 'calmă', 1800, 4.8, '2022-09-15', 'Alb', 'interior', false),
('Ragdoll', 'Pisică relaxată, perfectă pentru copii.', 'ragdoll.jpg', 'Mare', 'blândă', 2200, 6.0, '2023-01-03', 'Alb', 'interior', false),
('Bengaleză', 'Pisică activă cu blană asemănătoare unui leopard.', 'bengaleza.jpg', 'Medie', 'activă', 2400, 5.2, '2023-03-18', 'Maro', 'ambele', false),
('Scottish Fold', 'Pisică cu urechi pliate, foarte prietenoasă.', 'scottish.jpg', 'Mica', 'prietenoasă', 1700, 4.0, '2023-04-08', 'Gri', 'interior', false),
('Chartreux', 'Pisică franceză, rară și inteligentă.', 'chartreux.png', 'Mare', 'jucăușă', 2200, 3.9, '2023-03-05', 'Gri', 'interior', false),
('Siberiană', 'Pisică robustă, adaptată la frig.', 'siberiana.png', 'Gigantica', 'jucăușă', 2400, 4.8, '2022-11-30', 'Roșcat', 'exterior', true),
('Norvegiană', 'Pisică vikingă cu blană densă.', 'norvegiana.png', 'Gigantica', 'activă', 2300, 4.5, '2022-09-15', 'Gri', 'exterior', false),
('Balineză', 'Pisică elegantă, derivată din Siameză.', 'balineza.png', 'Exotica', 'calmă', 1800, 2.6, '2023-04-10', 'Alb', 'interior', true),
('Burmese', 'Pisică sociabilă și vocală.', 'burmese.png', 'Medie', 'prietenoasă', 1700, 3.0, '2023-01-22', 'Maro', 'interior', false),
('Ocicat', 'Pisică activă, cu aspect de leopard.', 'ocicat.png', 'Exotica', 'activă', 2100, 3.2, '2023-02-18', 'Gri', 'ambele', false),
('Korat', 'Pisică rară thailandeză, simbol norocos.', 'korat.png', 'Mica', 'prietenoasă', 1600, 2.7, '2023-06-01', 'Gri', 'interior', true),
('Manx', 'Pisică fără coadă, din Insula Man.', 'manx.png', 'Medie', 'jucăușă', 1750, 3.4, '2023-02-28', 'Maro', 'exterior', true);

CREATE TABLE seturi (
    id SERIAL PRIMARY KEY,
    nume_set TEXT NOT NULL,
    descriere_set TEXT
);

CREATE TABLE asociere_set (
    id SERIAL PRIMARY KEY,
    id_set INTEGER REFERENCES seturi(id) ON DELETE CASCADE,
    id_produs INTEGER REFERENCES produse(id) ON DELETE CASCADE
);

INSERT INTO seturi (nume_set, descriere_set) VALUES
('Set Pisici Calme', 'Pisici potrivite pentru un stil de viață liniștit.'),
('Set Pisici Mari', 'Pisici din categoriile mari și gigantice.'),
('Set Exotic', 'Pisici exotice rare și elegante.'),
('Set Interior', 'Pisici ideale pentru viața în apartament.'),
('Set Activ', 'Pisici energice și jucăușe.');

-- Set Relaxare (ex: 113, 116, 123)
INSERT INTO asociere_set (id_set, id_produs) VALUES
(1, 113), (1, 116), (1, 123);

-- Set Giganți (ex: 114, 121, 122)
INSERT INTO asociere_set (id_set, id_produs) VALUES
(2, 114), (2, 121), (2, 122);

-- Set Exotice (ex: 115, 123, 125)
INSERT INTO asociere_set (id_set, id_produs) VALUES
(3, 115), (3, 123), (3, 125);

-- Set Jucăușe (ex: 115, 119, 127)
INSERT INTO asociere_set (id_set, id_produs) VALUES
(4, 115), (4, 119), (4, 127);

-- Set Exterior (ex: 121, 122, 127)
INSERT INTO asociere_set (id_set, id_produs) VALUES
(5, 121), (5, 122), (5, 127);

