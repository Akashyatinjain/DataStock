import express from "express";
import { deleteProfileImage, getProfile, updateProfile, getStorageActivity, getUserActivities, setupE2ee, getPublicKeyByEmail } from "./user.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";
import { upload, validateUploadedFileSize } from "../../middleware/multer.middleware.js";
import { uploadProfileImage } from "./user.controller.js";
import { updateUser } from "./user.controller.js";


const router = express.Router();

router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);
router.post(
  "/upload-profile",
  authenticateUser,
  upload.single("file"),
  validateUploadedFileSize,
  uploadProfileImage
);
router.delete("/delete-profile", authenticateUser, deleteProfileImage);
router.get("/me",authenticateUser, getProfile);
router.put("/update",authenticateUser,updateUser);
router.get("/storage-activity", authenticateUser, getStorageActivity);
router.get("/activities", authenticateUser, getUserActivities);
router.post("/setup-e2ee", authenticateUser, setupE2ee);
router.get("/public-key", authenticateUser, getPublicKeyByEmail);
export default router;
