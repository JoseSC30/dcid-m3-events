import { run, db } from "../config/database.js";
import { auth, internal } from "../middleware/auth.middleware.js";
import { call } from "../services/http.service.js";
import { log } from "../utils/logger.js";
export function registerSectorRoutes(router) {
  router.post(
    "/events/:id/sectors",
    auth(["organizador"]),
    async (req, res, next) => {
      try {
        const { nombre, precio, cupo_total } = req.body;
        const owner = await run(
          "SELECT id FROM events WHERE id=$1 AND organizer_id=$2",
          [req.params.id, req.user.id],
        );
        if (!owner.rowCount)
          return res.status(403).json({ error: "Evento ajeno" });
        if (
          !nombre ||
          !(Number(precio) >= 0) ||
          !Number.isInteger(Number(cupo_total)) ||
          Number(cupo_total) < 1
        )
          return res.status(400).json({ error: "Sector inválido" });
        const x = await run(
          "INSERT INTO sectors(event_id,nombre,precio,cupo_total,cupos_disponibles) VALUES($1,$2,$3,$4,$4) RETURNING *",
          [req.params.id, nombre, precio, cupo_total],
        );
        res.status(201).json(x.rows[0]);
      } catch (e) {
        next(e);
      }
    },
  );
}
