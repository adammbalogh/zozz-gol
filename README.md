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
- `nginx/` — a webszerver: kiszolgálja a `web/` mappát, és a `/api` kéréseket továbbítja az API-nak

## Tesztek

- a játék logikája: `npm test` (a repó gyökerében, `node --test`)
- az API: `docker compose exec api npm test`
