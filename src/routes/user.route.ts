import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", (req, res) => {
  res.json({ message: "Users fetched" });
});

export default router;
