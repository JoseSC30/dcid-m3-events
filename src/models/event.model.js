export const EVENT_STATES = Object.freeze([
  "borrador",
  "publicado",
  "cancelado",
]);
export function validateEvent({ nombre, fecha, lugar } = {}) {
  if (
    !nombre?.trim() ||
    !lugar?.trim() ||
    !fecha ||
    !Number.isFinite(Date.parse(fecha))
  )
    throw new Error("Nombre, fecha y lugar válidos son obligatorios");
  return true;
}
export function validateSector({ nombre, precio, cupo_total } = {}) {
  if (
    !nombre?.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    !Number.isInteger(Number(cupo_total)) ||
    Number(cupo_total) < 1
  )
    throw new Error("Sector inválido");
  return true;
}
export function validateReservation({ id_orden, cantidad } = {}) {
  if (
    typeof id_orden !== "string" ||
    !id_orden.trim() ||
    !Number.isInteger(cantidad) ||
    cantidad < 1 ||
    cantidad > 6
  )
    throw new Error("Reserva inválida");
  return true;
}
