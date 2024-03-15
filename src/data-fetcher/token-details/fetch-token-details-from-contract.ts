import { Token } from "@prisma/client";
import dotenv from "dotenv";
import { Result } from "ethers";
import { prisma } from "../../services/dbClient";
import { decodeFunction } from "../../types";
import { executeCalls, prepareCall } from "../multicall";
dotenv.config();

/**
 * name, symbol, decimal
 */
const DATA_COUNT = 3;

const decodeMulticallResult: decodeFunction = (result, call) => {
  try {
    return call.decodeResult(result.returnData)[0];
  } catch (e) {
    const err = e as Error;
    console.error(
      `failed to decode ${call.functionName} of ${call.contractAddress}`
    );
    console.error(err.message);
  }
  return null;
};

function quote(val: any) {
  if (!val) return null;
  return `'${val}'`;
}

function getTokenDetailsFromExecuteCallsResult(
  tokenAddress: string[],
  executeCallsResults: Result[]
) {
  const ret = [];

  let j = 0;
  for (let i = 0; i < executeCallsResults.length; i += 3) {
    const name = executeCallsResults[i + 0];
    const symbol = executeCallsResults[i + 1];
    const decimals = executeCallsResults[i + 2];

    const token: Token = {
      id: tokenAddress[j++],
      name:
        name === null || name.toString().trim().length === 0
          ? null
          : name.toString().trim() === undefined
          ? null
          : name.toString().trim(),
      symbol:
        symbol === null || symbol.toString().trim().length === 0
          ? null
          : symbol.toString().trim() === undefined
          ? null
          : symbol.toString().trim(),
      decimals: decimals === null ? null : Number(decimals),
    };
    ret.push(token);
  }

  return ret;
}

function toDb(tokenAddresses: string[], results: ResultWithMetadata[]) {
  const ret: Token[] = [];
  for (const resultBatch of results) {
    let i = 0;

    ret.push(
      ...getTokenDetailsFromExecuteCallsResult(
        tokenAddresses.slice(
          resultBatch.start,
          resultBatch.start + resultBatch.size
        ),
        resultBatch.results
      )
    );
  }
  return ret;
}

type ResultWithMetadata = {
  results: Result[];
  start: number;
  size: number;
};

function getCallsForTokenDetails(tokenAddress: string) {
  return [
    prepareCall(
      tokenAddress,
      "name",
      "function name() public view returns (string)"
    ),
    prepareCall(
      tokenAddress,
      "symbol",
      "function symbol() public view returns (string)"
    ),
    prepareCall(
      tokenAddress,
      "decimals",
      "function decimals() public view returns (uint8)"
    ),
  ];
}

function getMulticallBatch(
  tokenAddresses: string[],
  start: number,
  size: number
): Promise<ResultWithMetadata> {
  const calls = [];
  for (let i = 0; i < size; i++) {
    calls.push(...getCallsForTokenDetails(tokenAddresses[i + start]));
  }
  const promiseOfResults = executeCalls(calls, decodeMulticallResult);

  return new Promise((resolve, reject) => {
    promiseOfResults
      .then((results) =>
        resolve({
          results: results,
          start,
          size,
        })
      )
      .catch((err) => reject(err));
  });
}

async function main() {
  console.log(new Date().toLocaleString());
  console.time("service time");

  try {
    const tokenAddresses = (
      await prisma.token.findMany({
        where: {
          decimals: null,
          /* prettier-ignore */
          id: {notIn: ["0x0000000000bf2686748e1c0255036e7617e7e8a5","0x0001f78c3e988e9724c68401d8b6d0330cd69420","0x07865c6e87b9f70255377e024ace6630c1eaa37f","0x0b526b549a4dec0a2ba30e394f5b0cc22556c52c","0x177e1df048ca2519f4c46c05de469d549c85af94","0x179c4b5966c43e77eaf4f1812beeaccb5d22cdad","0x1bcaa2831f9ba0335a52450e406f56396e7efac6","0x1cf07e61ba1a637d83fa8908229ae5a017276c04","0x1da4858ad385cc377165a298cc2ce3fce0c5fd31","0x24ce3bbac4fed4ddf2d1a681b955b0f2f6c3d28e","0x28c6c06298d514db089934071355e5743bf21d60","0x37f132bc67a5cc1568f978e3adb111f238112381","0x39854564a2befd968919d56e29b62a27cdb68aae","0x402e8194738952ec0df36725e47851f650e83f3a","0x4200000000000000000000000000000000000006","0x4359b786b2e51530ad004f4996183a7fb83ee49d","0x44863f234b137a395e5c98359d16057a9a1fac55","0x44ab5e4e4045d2e75c07b0e5224a0e08d804b0f0","0x49e3974459228978e68de7c9b2875e74af904bec","0x49f119079f9012e07bf97a483e761d20b5e74dd4","0x49fc06bbf04c059444bf7973ea9ded2959f7d76f","0x4f750576e32d0dcdcd9d319228ce8bfefb7c516c","0x50ad9c934075da4bf9fa662e23c602e7241ff2da","0x51c6b09799370b806427d6ff06da6874f6b3a328","0x51ea8e503ba37b6d282faa719af8feb1ce784511","0x5318558c6401e0140b690c50f0e3ece2c70a02b0","0x5955f1e13d85184804f987556db042764050c898","0x6077de7294e60f6cb5ffdb2d1d3b3d98475fe019","0x60867b79a68abecb78351b2dbb5fdec4282c5acb","0x62eef4ec8d58ad37dcf17c0ead9b8b291d93b62c","0x64c1efbaaa56136269298401f8f5b3de66178753","0x66939104e7cd8d27e97f56688afae98bb9a4f4d8","0x6704ab3cc90a5a40376786e137d2e2aa610eee96","0x6781d7e4128e89378115141943eba88c351d9e12","0x699415c4760d379beff623d3f3fbbe356b61422d","0x6abcd361e6f3538f63eb7fd2d404ab85a2ed5052","0x74d5373bc303d5133ad8f1367b341a59c0589caf","0x7612f7276c95e472809ef6193f63252c8eadbd2c","0x7ab3ab7392e7941fc9e6253fdddcf4cc032d1a7b","0x7ceb23fd6bc0add59e62ac25578270cff1b9f619","0x7e2845c165a6736b6c4b6687319315d943e7aeb1","0x808d5c1d9e9d712f39bcfce5fb08fa4c9f040f22","0x81803ca1867161c1006c0ef6279b36c9c7290430","0x82af49447d8a07e3bd95bd0d56f35241523fbab1","0x84e4e8e4a2d7302ea0cebd636c75d705a94df3c1","0x85ac7bc07868f375e4e7026ea0469a1e70ce5e83","0x86f24c739fc2740d3d0afaca5bc3b88c3e55aaa7","0x8dd66ea62da53747efe5fc994e657f5ca17c9087","0x90f73dae9148617fac4b305b6f78a1aaa5487078","0x95f1b71db73c1842d08d6a1695f687de6af065dc","0x9a2548335a639a58f4241b85b5fc6c57185c428a","0x9d88e0b90b1610010ac9c3c38b94ab00f517f5f5","0x9efbd502bb88d4dd6f6712ab085bc4dc623919d6","0x9fc047322ce878dc6e3bc7ead8377abc7534da16","0xa66d93dd8da9b122f2514f4c493eaeea3921947b","0xa6c8efc52ab20281570c4c809c300454109af946","0xaeca569968c99d607647830d8b386dcfde821f85","0xafb88295c3bef7170759cd5ea40660544022b49f","0xb1748c79709f4ba2dd82834b8c82d4a505003f27","0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6","0xb6e508d879802277a1e9efef008788fa61b44ffd","0xb82d222bfa2dae1fe8b03b47ef948764d1b9e0ab","0xb96c7d90eb0d362da23e37223f5817816e4ac240","0xba2aa7426ec6529c25a38679478645b2db5fa19b","0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c","0xc04b0d3107736c32e19f1c62b2af67be61d63a05","0xc687c13edf2e6a86356d57b1901493e51c63a5e8","0xcb26dae57e8060de26765229f7cbefd7386e874f","0xcd7665b3ba679c46982bb8f649d4d26bb8a49336","0xcef9548c918d84622325640907c768e7375726e5","0xcfe4eb08e33272d98cb31e37a7be78d5c1b740c1","0xd02a65c313f5f64595de18760916a2b8822b9bfc","0xd0f21b718705ec3a42a79deff0196ca6f47f30df","0xd2f0ec85efbe06e4a434c508364de9dc9a14ee43","0xd43edfd041366c48976e8908d918053742baef6b","0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c","0xd93206bd0062cc054e397ecccdb8436c3fa5700e","0xd9b747cd5065ff24da8a3908baa54b447d9b6288","0xda58c300f4b8884d77b62fd77fad2d5ab452bc99","0xdb3e2fd04bdde831c3d6b1cfbe23e572887c8b83","0xdb81fc2262cc8d666b6a3cd0c49870c31c733e4f","0xdc48e710b14fc1b606d2b8b62e7b42f375b31837","0xdd1c8c22593ec7dd8aacd96f914550e0d3d568fb","0xe01c9731cbdf47a75d3f6c1ed235537686be3d1e","0xe1629a9ce99ea3bea47b4feccfdea414741d7ffa","0xe3e270a97987cce85dd2fe8f21c909410829f8e0","0xe3e6a9cdb8a0ad255b9130a8cc82679a40bf40c7","0xe4dd587070929b192e14c73b820038f7e296c35c","0xe5206f89010dc694f8f3219c12b4fc550795e82e","0xe54f9e6ab80ebc28515af8b8233c1aee6506a15e","0xe9e7cea3dedca5984780bafc599bd69add087d56","0xebb255d2b8cecf8e96fb5490be4ed3086fe74ecc","0xf1dcafef6659bc4962957a5101bff7bc096e7b8f","0xf27be08e7d8cd56b67bb6738981b58d77c686b08","0xf5bf148be50f6972124f223215478519a2787c8e","0xf615f7c44efac83caa8729fd91b160de20f3942f","0xf7eb40580829efed117204cda9589927540c126b","0xf967a43a63163c7a1cedb46cc9b73da0a2c20986","0xfca5b02c12440d3d6b99e81dcda28474f3b402bf","0xfcf163b5c68be47f702432f0f54b58cd6e18d10b","0xff521b66fa220e655660f783a36a4562ad7ec503","0x55496c666781d80968e4b77fae352ba2c1efc2aa", "0xc38325f2f798b5b2b33f0fcbf0edb148e09dceb3", "0x94c1fa58495ca8726bbc63f61ee0f1da8988897a"]},
        },
        select: {
          id: true,
        },
      })
    ).map((tok) => tok.id);
    console.log(`${tokenAddresses.length} token addresses read from db`);

    // no. of contract read calls to batch into 1 RPC call
    const multicallbatchSize = 3;
    // no. of RPC calls to execute at a time
    let promiseBatchSize = 1;

    let promiseBatch: Promise<ResultWithMetadata>[] = [];
    let resCount = 0;
    console.log("Token data fetch start");
    for (let i = 0; i < tokenAddresses.length; i += multicallbatchSize) {
      const size = Math.min(multicallbatchSize, tokenAddresses.length - i);
      const res = getMulticallBatch(tokenAddresses, i, size);
      promiseBatch.push(res);
      resCount += 1;

      if (size === tokenAddresses.length - i || resCount === promiseBatchSize) {
        const results = await Promise.all(promiseBatch);
        const tokens = toDb(tokenAddresses, results);
        for (const token of tokens) {
          try {
            await prisma.token.update({
              where: { id: token.id },
              data: {
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
              },
            });
          } catch (ex) {
            const err = ex as Error;
            console.log(`error with token ${token}`);
            console.error(err.message);
          }
        }

        console.log(`updated rows in db: ${i + size}`);
        resCount = 0;
        promiseBatch = [];
      }
    }
    console.log("Token data fetch end");
  } catch (error) {
    console.error(error);
  }

  console.timeEnd("service time");
  console.log(new Date().toLocaleString());
}

main();
