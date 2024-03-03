async function getMulticallBatch(arr: any[], start: number, size: number) {
  const calls = [];
  for (let i = 0; i < size; i++) {
    calls.push(arr[i + start]);
  }
  // execute calls
  return calls;
}

async function main() {
  // 1. get whole input
  const input = Array(3_08_509)
    .fill(0)
    .map((ele, idx) => idx + 1);

  // 2. make batch of every 1000 elements
  const multicallbatchSize = 500;
  let promiseBatchSize = 10;

  let promiseBatch = [];
  let resCount = 0;
  for (let i = 0, p = 0; i < input.length; i += multicallbatchSize) {
    const size = Math.min(multicallbatchSize, input.length - i);
    const res = getMulticallBatch(input, i, size);
    console.log(
      `${resCount}. ${res} from: ${i}, to: ${i + size - 1} (length: ${size})`
    );
    promiseBatch.push(res);
    resCount += 1;

    if (size === input.length - i || resCount === promiseBatchSize) {
      console.log(`Promise.all: ${promiseBatch}`);
      resCount = 0;
      promiseBatch = [];
    }
  }
}

main();
