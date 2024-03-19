"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTimeStamp = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function updateTimeStamp() {
    const currentTime = new Date();
    const currentOffset = currentTime.getTimezoneOffset();
    const ISTTime = new Date(currentTime.getTime() + (330 + currentOffset) * 60000);
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "../data", "timestamp.txt"), ISTTime.toString());
}
exports.updateTimeStamp = updateTimeStamp;
