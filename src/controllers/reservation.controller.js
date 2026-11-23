import { validateReservation } from "../models/event.model.js";
import { run, db } from "../config/database.js";
import { auth, internal } from "../middleware/auth.middleware.js";
import { call } from "../services/http.service.js";
import { log } from "../utils/logger.js";
export function registerReservationRoutes(router) {
  router.post(
    "/events/:id/sectors/:sid/reservations",
    internal,
    async (req, res, next) => {
      const c = await db.connect();
      try {
        await c.query("BEGIN");
        const { id_orden, cantidad } = req.body;
        validateReservation({ id_orden, cantidad });
        if (
          !id_orden ||
          !Number.isInteger(cantidad) ||
          cantidad < 1 ||
          cantidad > 6
        )
          throw Object.assign(new Error("Reserva inválida"), { status: 400 });
        const a = await c.query(
          "SELECT s.*,e.estado FROM sectors s JOIN events e ON e.id=s.event_id WHERE s.id=$1 AND e.id=$2 FOR UPDATE OF s",
          [req.params.sid, req.params.id],
        );
        if (!a.rowCount || a.rows[0].estado !== "publicado")
          throw Object.assign(new Error("Evento o sector no disponible"), {
            status: 400,
          });
        if (a.rows[0].cupos_disponibles < cantidad)
          throw Object.assign(new Error("Agotado"), { status: 409 });
        await c.query(
          "UPDATE sectors SET cupos_disponibles=cupos_disponibles-$1 WHERE id=$2",
          [cantidad, req.params.sid],
        );
        await c.query(
          "INSERT INTO reservations(order_id,event_id,sector_id,cantidad) VALUES($1,$2,$3,$4)",
          [id_orden, req.params.id, req.params.sid, cantidad],
        );
        await c.query("COMMIT");
        res
          .status(201)
          .json({
            id_orden,
            cantidad,
            precio: a.rows[0].precio,
            estado: "reservada",
          });
      } catch (e) {
        await c.query("ROLLBACK");
        next(e);
      } finally {
        c.release();
      }
    },
  );
  router.patch(
    "/events/:id/sectors/:sid/reservations/:oid/confirm",
    internal,
    async (req, res, next) => {
      try {
        const x = await run(
          "UPDATE reservations SET estado='pagada' WHERE order_id=$1 AND event_id=$2 AND sector_id=$3 AND estado IN ('reservada','pagada') RETURNING *",
          [req.params.oid, req.params.id, req.params.sid],
        );
        if (!x.rowCount)
          return res.status(404).json({ error: "Reserva inexistente" });
        res.json({ estado: "pagada" });
      } catch (e) {
        next(e);
      }
    },
  );
  router.patch(
    "/events/:id/sectors/:sid/reservations/:oid/release",
    internal,
    async (req, res, next) => {
      const c = await db.connect();
      try {
        await c.query("BEGIN");
        const x = await c.query(
          "SELECT * FROM reservations WHERE order_id=$1 AND event_id=$2 AND sector_id=$3 FOR UPDATE",
          [req.params.oid, req.params.id, req.params.sid],
        );
        if (!x.rowCount)
          throw Object.assign(new Error("Reserva no encontrada"), {
            status: 404,
          });
        if (x.rows[0].estado === "reservada") {
          await c.query(
            "UPDATE sectors SET cupos_disponibles=cupos_disponibles+$1 WHERE id=$2",
            [x.rows[0].cantidad, req.params.sid],
          );
          await c.query(
            "UPDATE reservations SET estado='liberada' WHERE order_id=$1",
            [req.params.oid],
          );
        }
        await c.query("COMMIT");
        res.json({ estado: "liberada" });
      } catch (e) {
        await c.query("ROLLBACK");
        next(e);
      } finally {
        c.release();
      }
    },
  );
}
