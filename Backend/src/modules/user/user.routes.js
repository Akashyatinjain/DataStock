import express from "express";
import { deleteProfileImage, getProfile, updateProfile } from "./user.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import { uploadProfileImage } from "./user.controller.js";
import { updateUser } from "./user.controller.js";


const router = express.Router();

router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);
router.post(
  "/upload-profile",
  authenticateUser,
  upload.single("file"),
  uploadProfileImage
);
router.delete("/delete-profile", authenticateUser, deleteProfileImage);
router.get("/me",authenticateUser, getProfile);
router.put("/update",authenticateUser,updateUser)
export default router;
