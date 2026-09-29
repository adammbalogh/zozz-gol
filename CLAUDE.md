# Game of Life — fejlesztői szabályok

- A felület szövegei magyarul, a kód, a nevek és a kommentek angolul.
- A felület keretrendszer nélküli: sima HTML, CSS és JavaScript a `web/` mappában. A játék logikája
  (tiszta függvények, DOM nélkül) a `web/game.js`-ben van, tesztekkel a `web/game.test.js`-ben
  (`npm test`, `node --test`); a `web/app.js` köti össze a felülettel.
- Az API (`api/`) Express; minden végpont a `/api` alatt van. Az adatbázis PostgreSQL: új tábla vagy
  oszlop csak új, sorszámozott SQL-fájllal jöhet az `api/migrations/` mappába (a meglévőket ne írd át);
  az API indításkor futtatja le őket. Az API tesztjei: `api/test/*.test.js` (`npm test` az `api`-ban).
- Maradjon egyszerű: ez egy bemutató projekt, a változás legyen jól látható és könnyen érthető.
