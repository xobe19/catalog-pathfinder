import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { router } from "./src/routes";
import processEnvSafe from "./src/safeEnv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/", router);

const PORT = parseInt(processEnvSafe("PORT")!);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
