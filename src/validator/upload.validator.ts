import { body } from "express-validator";

const getPreSignedUrl = [
  body("entity_type").isString().withMessage("Entity type is required"),
  body("asset_type").isString().withMessage("Asset type is required"),
  body("content_type").isString().withMessage("Content type is required"),
  body("entity_id")
    .optional()
    .isString()
    .withMessage("Entity ID must be a string"),
];

export const uploadValidator = {
  getPreSignedUrl,
};
