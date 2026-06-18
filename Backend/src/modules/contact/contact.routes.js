import express from "express";
import { handleContact } from "./contact.controller.js";

const router = express.Router();

router.post("/", handleContact);

export default router;