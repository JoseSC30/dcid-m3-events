import { Router } from "express";
import { registerEventRoutes } from "../controllers/event.controller.js";
const router = Router();
registerEventRoutes(router);
export default router;
