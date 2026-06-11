-- Xbox Live analytics — SQL sample (PostgreSQL flavor)

CREATE TABLE players (
    gamertag       TEXT PRIMARY KEY,
    gamerscore     INTEGER NOT NULL DEFAULT 0 CHECK (gamerscore >= 0),
    region         TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gamertag       TEXT NOT NULL REFERENCES players(gamertag) ON DELETE CASCADE,
    console        TEXT NOT NULL CHECK (console IN ('xbox', 'xbox-360', 'xbox-one', 'xbox-series-x')),
    started_at     TIMESTAMPTZ NOT NULL,
    ended_at       TIMESTAMPTZ,
    duration_secs  INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (ended_at - started_at))::INT) STORED
);

CREATE INDEX idx_sessions_gamertag_started ON sessions (gamertag, started_at DESC);

-- Top 10 most-played consoles in the last 30 days
WITH recent AS (
    SELECT console, duration_secs
    FROM sessions
    WHERE started_at >= now() - INTERVAL '30 days'
      AND ended_at IS NOT NULL
)
SELECT
    console,
    COUNT(*)                                AS sessions_count,
    SUM(duration_secs) / 3600               AS total_hours,
    ROUND(AVG(duration_secs) / 60, 1)       AS avg_minutes
FROM recent
GROUP BY console
ORDER BY total_hours DESC
LIMIT 10;

-- Player ranking by gamerscore with rolling window
SELECT
    gamertag,
    region,
    gamerscore,
    RANK()       OVER (PARTITION BY region ORDER BY gamerscore DESC) AS region_rank,
    DENSE_RANK() OVER (ORDER BY gamerscore DESC)                     AS global_rank,
    gamerscore - LAG(gamerscore, 1) OVER (ORDER BY gamerscore DESC)  AS delta_to_next
FROM players
WHERE gamerscore > 0
ORDER BY global_rank;
