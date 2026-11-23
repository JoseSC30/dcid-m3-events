import { run } from "../config/database.js";
export async function getEventById(id) {
  const r = await run(
    `SELECT e.*,COALESCE((SELECT json_agg(s ORDER BY s.id) FROM sectors s WHERE s.event_id=e.id),'[]'::json) sectores FROM events e WHERE e.id=$1`,
    [id],
  );
  return r.rows[0] || null;
}
