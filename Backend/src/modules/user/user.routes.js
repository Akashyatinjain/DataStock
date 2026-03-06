import express from "express";
import { getProfile } from "./user.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authenticateUser, getProfile);

export default router;