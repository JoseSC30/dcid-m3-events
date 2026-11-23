import { Router } from "express";
import { registerReservationRoutes } from "../controllers/reservation.controller.js";
const router = Router();
registerReservationRoutes(router);
export default router;
