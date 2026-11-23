CREATE TABLE
    IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        fecha TIMESTAMPTZ NOT NULL,
        lugar TEXT NOT NULL,
        imagen TEXT DEFAULT '',
        descripcion TEXT DEFAULT '',
        estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'cancelado')),
        organizer_id BIGINT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS sectors (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL REFERENCES events (id),
        nombre TEXT NOT NULL,
        precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
        cupo_total INT NOT NULL CHECK (cupo_total > 0),
        cupos_disponibles INT NOT NULL CHECK (cupos_disponibles >= 0)
    );

CREATE TABLE
    IF NOT EXISTS reservations (
        order_id TEXT PRIMARY KEY,
        event_id BIGINT NOT NULL,
        sector_id BIGINT NOT NULL,
        cantidad INT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'reservada'
    );