import { Router } from "express";
import {
  createSupportTicket,
  getSupportTickets,
} from "../controllers/support.controller";

const router = Router();

// Public / user submit support query
router.post("/", createSupportTicket);

// Admin view all support queries in JSON
router.get("/", getSupportTickets);

export default router;

