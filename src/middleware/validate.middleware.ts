import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { validationResult, ValidationChain } from "express-validator";

export const validation = (validations: ValidationChain[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      next();
    },
  );
};
