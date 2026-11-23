import { Router } from "express";
import { registerSectorRoutes } from "../controllers/sector.controller.js";
const router = Router();
registerSectorRoutes(router);
export default router;
