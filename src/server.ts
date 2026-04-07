import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db";
import socketConnection, { server } from "./socket/socket.connection";

const PORT = process.env.PORT || 5000;

connectDB();
socketConnection();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
