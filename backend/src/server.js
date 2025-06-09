import app from "./app.js";
import dotenv from "dotenv";
import { logger } from "./libs/logger.js";

dotenv.config();

app.get("/", (req, res) => {
  res.send("Hello warld!");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
