import { param, query } from "express-validator";

const getChatById = [param("id").isMongoId().withMessage("Invalid user id")];

export const chatValidator = {
  getChatById,
};
