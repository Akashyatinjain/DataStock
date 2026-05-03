import express from "express";
import { getProfile } from "./user.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import { uploadProfileImage } from "./user.controller.js";

const router = express.Router();

router.get("/profile", authenticateUser, getProfile);
router.post(
  "/upload-profile",
  authenticateUser,
  upload.single("file"),
  uploadProfileImage
);
export default router;