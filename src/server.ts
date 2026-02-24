import dotenv from "dotenv";
import { connectDB } from "./config/db";
import socketConnection, { server } from "./socket/socket.connection";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();
socketConnection();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
