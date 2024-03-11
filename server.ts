import dotenv from "dotenv";
import express, { Request } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { findPath } from "./find_path";
dotenv.config();

const specs = swaggerJsdoc({
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Hal Finch Path Finder",
      version: "0.1.0",
    },
  },
  apis: ["./routes/*.ts"],
});
const app = express();
app.use(express.json());
app.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

app.get("/", (req, res) => {
  res.send("Hello world");
});

interface QuoteBody {
  tokenInAddress: string;
  tokenOutAddress: string;
  amount: string;
}

/* 
{
  "tokenInAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "tokenOutAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "amount": "4000000000"
}
*/
app.post("/quote", async (req: Request<any, any, QuoteBody>, res) => {
  try {
    const {
      body: { tokenInAddress, tokenOutAddress, amount },
    } = req;
    const path = await findPath(
      tokenInAddress,
      tokenOutAddress,
      BigInt(amount)
    );
    res.json(path);
  } catch (ex) {
    console.error(ex);
    const err = ex as Error;
    res.json({ error: err.message });
  }
});

const SERVER_PORT = parseInt(process.env.SERVER_PORT!);
if (!SERVER_PORT)
  throw new Error("Please set the SERVER_PORT environment variable.");

const LOCAL_IP = process.env.LOCAL_IP;
if (!LOCAL_IP) throw new Error("Please set the LOCAL_IP environment variable.");

app.listen(SERVER_PORT, LOCAL_IP, () => {
  console.log(`Server running at http://${LOCAL_IP}:${SERVER_PORT}`);
});
