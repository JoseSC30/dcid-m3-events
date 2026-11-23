import { getEventById } from "../repositories/event.repository.js";
import { run, db } from "../config/database.js";
import { auth, internal } from "../middleware/auth.middleware.js";
import { call } from "../services/http.service.js";
import { log } from "../utils/logger.js";
export function registerEventRoutes(router) {
  router.get("/events", async (req, res, next) => {
    try {
      const x = await run(
        `SELECT e.*,COALESCE((SELECT json_agg(s ORDER BY s.id) FROM sectors s WHERE s.event_id=e.id),'[]'::json) sectores FROM events e WHERE ($1::text IS NULL OR e.estado=$1) ORDER BY e.id`,
        [req.query.estado || "publicado"],
      );
      res.json(x.rows);
    } catch (e) {
      next(e);
    }
  });
  router.get("/events/:id", async (req, res, next) => {
    try {
      const event = await getEventById(req.params.id);
      if (!event)
        return res.status(404).json({ error: "Evento no encontrado" });
      res.json(event);
    } catch (e) {
      next(e);
    }
  });
  router.post("/events", auth(["organizador"]), async (req, res, next) => {
    try {
      const { nombre, fecha, lugar, imagen = "", descripcion = "" } = req.body;
      if (!nombre || !fecha || !lugar)
        return res
          .status(400)
          .json({ error: "Nombre, fecha y lugar obligatorios" });
      const x = await run(
        "INSERT INTO events(nombre,fecha,lugar,imagen,descripcion,organizer_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        [nombre, fecha, lugar, imagen, descripcion, req.user.id],
      );
      res.status(201).json(x.rows[0]);
    } catch (e) {
      next(e);
    }
  });
  router.patch("/events/:id", auth(["organizador"]), async (req, res, next) => {
    try {
      const { nombre, fecha, lugar, imagen, descripcion, estado } = req.body;
      if (estado && !["borrador", "publicado", "cancelado"].includes(estado))
        return res.status(400).json({ error: "Estado inválido" });
      const x = await run(
        "UPDATE events SET nombre=COALESCE($1,nombre),fecha=COALESCE($2,fecha),lugar=COALESCE($3,lugar),imagen=COALESCE($4,imagen),descripcion=COALESCE($5,descripcion),estado=COALESCE($6,estado) WHERE id=$7 AND organizer_id=$8 RETURNING *",
        [
          nombre,
          fecha,
          lugar,
          imagen,
          descripcion,
          estado,
          req.params.id,
          req.user.id,
        ],
      );
      if (!x.rowCount)
        return res
          .status(404)
          .json({ error: "Evento no encontrado o sin permiso" });
      res.json(x.rows[0]);
    } catch (e) {
      next(e);
    }
  });
  router.get(
    "/events/:id/sales",
    auth(["organizador"]),
    async (req, res, next) => {
      try {
        const o = await run(
          "SELECT id FROM events WHERE id=$1 AND organizer_id=$2",
          [req.params.id, req.user.id],
        );
        if (!o.rowCount) return res.status(403).json({ error: "Sin permiso" });
        const x = await run(
          "SELECT COALESCE(SUM(r.cantidad),0)::int entradas,COALESCE(SUM(r.cantidad*s.precio),0) ingresos FROM reservations r JOIN sectors s ON s.id=r.sector_id WHERE r.event_id=$1 AND r.estado='pagada'",
          [req.params.id],
        );
        res.json({ ...x.rows[0], nota: "Ventas confirmadas por Orders" });
      } catch (e) {
        next(e);
      }
    },
  );
}
