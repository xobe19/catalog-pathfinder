import dotenv from "dotenv";
import express from "express";
import { router } from "./src/routes";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/", router);

const SERVER_PORT = parseInt(process.env.SERVER_PORT!);
if (!SERVER_PORT)
  throw new Error("Please set the SERVER_PORT environment variable.");

app.listen(SERVER_PORT, () => {
  console.log(`Server running on port: ${SERVER_PORT}`);
});
