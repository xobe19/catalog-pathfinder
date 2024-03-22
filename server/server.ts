import dotenv from "dotenv";
import express from "express";
import { router } from "./src/routes";
dotenv.config();

const app = express();
app.use(express.json());

app.use("/", router);

const PORT = parseInt(process.env.PORT!);
if (!PORT) throw new Error("Please set the PORT environment variable.");

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
