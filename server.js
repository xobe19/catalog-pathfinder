"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const routes_1 = require("./src/routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/", routes_1.router);
app.use(cors());
const PORT = parseInt(process.env.PORT);
if (!PORT)
    throw new Error("Please set the PORT environment variable.");
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
function cors() {
    throw new Error("Function not implemented.");
}
