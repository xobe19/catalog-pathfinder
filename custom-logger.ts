import ora from "ora";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

await sleep(1000);

const data = [1, 3, 4, 5, 6, 6];
const spinner = ora("Loading unicorns").start();

setTimeout(() => {
  spinner.color = "yellow";
  spinner.text = "Loading rainbows";
}, 1000);
