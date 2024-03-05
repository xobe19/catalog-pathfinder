import { UNISWAP_V2_ADDRESS } from "./constants";
import { multicall, prepareCall } from "./multicall";
// import { addressModelRef } from "./mongo-client";

export async function executeCalls(calls: ReturnType<typeof prepareCall>[]) {
  const resolverCalls = calls.map((call) => call.call);

  type Aggregate3Response = { success: boolean; returnData: string };
  const resolverResults: Aggregate3Response[] =
    await multicall.aggregate3.staticCall(resolverCalls);

  const res = resolverResults.map((resolverResult, i) => {
    return calls[i].decodeResult(resolverResult.returnData).toString();
  });

  const obj = [{}];
  obj.pop();
  res.forEach((e) => {
    obj.push({ address: e });
  });
  // await addressModelRef.insertMany(obj);
}

async function getPairAddress(startRange: number, endRange: number) {
  const calls: any = [];
  const fnName = "allPairs";
  const interfaceName =
    "function allPairs(uint) external view returns (address pair)";

  for (let i = startRange; i < endRange; i++) {
    const singleCall = prepareCall(UNISWAP_V2_ADDRESS, fnName, interfaceName, [
      BigInt(i),
    ]);
    calls.push(singleCall);
  }
  const result = await executeCalls(calls);
  return result;
}

async function createAndWriteBatch() {
  const totalReqs = 309455;
  const batchSize = 1000;

  const index = 0;
  for (let i = 0; i < totalReqs; i += batchSize) {
    const start = i;
    const end = Math.min(i + batchSize, totalReqs);
    await getPairAddress(start, end);
    console.log("batch pushed to db", i);
    i++;
  }
}

// createAndWriteBatch();
