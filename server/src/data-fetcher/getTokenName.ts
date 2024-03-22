import { Contract, decodeBytes32String } from "ethers";
import {
  getsymbolAbi,
  symbolABI,
  symbolABIBytes,
  symbolABIBytes64,
  upgradableContractABI,
} from "./abis";
import { provider } from "../rpc_setup";

export const ETHER_SCAN_API = process.env.ETHER_SCAN_API;
if (!ETHER_SCAN_API)
  throw new Error("Please set the MAINNET_RPC_URL environment variable.");

const ABI_CHECK = [
  symbolABI,
  getsymbolAbi,
  upgradableContractABI,
  symbolABIBytes,
  symbolABIBytes64,
];

export async function getTokenName(tokenAddr: string) {
  let tokenName: any = "";

  try {
    const instance = new Contract(tokenAddr, symbolABI, provider);
    tokenName = await instance.symbol();
  } catch (e) {
    try {
      const bytes32instance = new Contract(tokenAddr, symbolABIBytes, provider);

      tokenName = decodeBytes32String(await bytes32instance.symbol());
    } catch (error) {
      const upgradableContractInstance = new Contract(
        tokenAddr,
        upgradableContractABI,
        provider
      );
      const addr = await upgradableContractInstance.implementation();
      tokenName = await getTokenName(addr);
    }
  }
  return tokenName;
}
