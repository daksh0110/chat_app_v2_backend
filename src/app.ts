import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import userRoutes from "./routes/user.route";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
app.use(errorHandler);
app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/users", userRoutes);

export default app;
