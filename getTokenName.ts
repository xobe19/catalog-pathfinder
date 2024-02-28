import { Contract } from "ethers";
import { provider, symbolABI, upgradableContractABI } from "./rpc_setup.js";

async function getTokenName(tokenAddr: string) {
  let tokenName = "";

  try {
    const instance = new Contract(tokenAddr, symbolABI, provider);
    tokenName = await instance.symbol();
  } catch (e) {
    const upgradableContractInstance = new Contract(
      tokenAddr,
      upgradableContractABI,
      provider
    );
    const addr = await upgradableContractInstance.implementation();
    tokenName = await getTokenName(addr);
  }
  return tokenName;
}

(async function () {
  console.log(await getTokenName("0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"));
  console.log(await getTokenName("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"));
})();
