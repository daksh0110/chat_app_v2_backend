import { Router } from "express";
import { validation } from "../middleware/validate.middleware";
import { userValidation } from "../validator/user.validator";
import { userController } from "../controllers/user.controller";

const router = Router();

router.post(
  "/create",
  validation(userValidation.createUserValidator),
  userController.createUser,
);

export default router;
