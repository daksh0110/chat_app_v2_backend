import { Router } from "express";
import { verifyUser } from "../middleware/verifyUser.middleware";
import { uploadValidator } from "../validator/upload.validator";
import { uploadController } from "../controllers/upload.controller";

const router = Router();

router.post(
  "/",
  verifyUser,
  uploadValidator.getPreSignedUrl,
  uploadController.getPreSignedUrlController,
);

router.get(
  "/get-url",
  verifyUser,
  uploadController.getGetPresignedUrlController,
);

export default router;
