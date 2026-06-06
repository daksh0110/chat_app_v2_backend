import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import userRoutes from "./routes/user.route";
import chatRoutes from "./routes/chats.route";
import uploadRoutes from "./routes/upload.route";
import { errorHandler } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(loggerMiddleware);
app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "server is running",
  });
});
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

export default app;
