import { Router } from "express";
import { verifyUser } from "../middleware/verifyUser.middleware";
import { chatValidator } from "../validator/chat.validator";
import { chatController } from "../controllers/chat.controller";

const router = Router();

router.get(
  "/chat/:id",
  verifyUser,
  chatValidator.getChatById,
  chatController.getChatByIdController,
);
export default router;
