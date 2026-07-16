import express from "express";
import {
  addComment,
  getComments,
  deleteComment,
} from "./comment.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, addComment);
router.get("/", authenticateUser, getComments);
router.delete("/:id", authenticateUser, deleteComment);

export default router;
