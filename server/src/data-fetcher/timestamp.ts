import fs from "fs";
import path from "path";
export function updateTimeStamp() {
  const currentTime = new Date();
  const currentOffset = currentTime.getTimezoneOffset();
  const ISTTime = new Date(
    currentTime.getTime() + (330 + currentOffset) * 60000
  );
  fs.writeFileSync(
    path.join(__dirname, "../../data", "timestamp.txt"),
    ISTTime.toString()
  );
}
