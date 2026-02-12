import { Response } from "express";

export const createResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: any = null,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
