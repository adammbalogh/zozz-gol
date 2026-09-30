-- Saved patterns: the live cells of a board, under a unique name.
CREATE TABLE patterns (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE CHECK (length(btrim(name)) BETWEEN 1 AND 50),
    rows integer NOT NULL,
    cols integer NOT NULL,
    cells jsonb NOT NULL, -- live cells: [[row, col], ...]
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
