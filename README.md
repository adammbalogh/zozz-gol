# Game of Life

Conway életjátéka a böngészőben: egy tábla, amelyen a sejtek generációról generációra élnek vagy halnak,
és egy kis API, amely a mintákat adatbázisban tárolja.

## Indítás

```bash
docker compose up
```

Az oldal: http://localhost:8090 — az API: http://localhost:8090/api/health

## Felépítés

- `web/` — a felület: statikus HTML, CSS és JavaScript (keretrendszer nélkül); a játék logikája a `web/game.js`-ben
- `api/` — Node.js (Express) API a `/api` alatt; a PostgreSQL-táblákat az `api/migrations/*.sql` fájlok hozzák létre indításkor
- mentett minták: a tábla melletti „Mentés” gomb a `POST /api/patterns` végpontra küldi az élő sejteket
  (az azonos nevű mentést felülírja); a mentések listája: `GET /api/patterns` (a legújabb elöl), egy minta
  a sejtjeivel: `GET /api/patterns/:id` — a tábla melletti „Mentett minták” listából egy kattintással betölthető
- a tábla alatt a „Generáció” számláló mutatja, hány lépést tett a tábla; mintabetöltéskor és a „Tábla törlése”
  gombbal (amely a lejátszást is megállítja) nullázódik
- mellette a „Sebesség” csúszkával 1–20 generáció/mp között állítható az automatikus lejátszás tempója
  (alapérték 5); a változás futás közben azonnal érvényes, és a böngésző megjegyzi (`localStorage`, `gol.speed`)
- `nginx/` — a webszerver: kiszolgálja a `web/` mappát, és a `/api` kéréseket továbbítja az API-nak

## Tesztek

- a játék logikája: `npm test` (a repó gyökerében, `node --test`)
- az API: `docker compose exec api npm test`
