import { Contract, JsonRpcProvider, decodeBytes32String } from "ethers";

export const symbolABI = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const upgradableContractABI = [
  {
    constant: true,
    inputs: [],
    name: "implementation",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const symbolABIBytes = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const symbolABIBytes64 = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "bytes64" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const getsymbolAbi = [
  {
    constant: true,
    inputs: [],
    name: "getSymbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export const ABI_CHECK = [
  symbolABI,
  getsymbolAbi,
  upgradableContractABI,
  symbolABIBytes,
  symbolABIBytes64,
];

export const RPC_URL =
  "https://rpc.ankr.com/eth/7e1c03d49744facfd8f602d5defee01761144097a7b7c26549a45835ff19d13f";

export const RPCProvider = new JsonRpcProvider(RPC_URL);
export const ETHER_SCAN_API = "F7AZP3RW542TF98DJFXC6CCGIYJRUVNV8V";

export async function getTokenName(tokenAddr: string) {
  let tokenName: any = "";

  try {
    const instance = new Contract(tokenAddr, symbolABI, RPCProvider);
    tokenName = await instance.symbol();
  } catch (e) {
    try {
      const bytes32instance = new Contract(
        tokenAddr,
        symbolABIBytes,
        RPCProvider
      );

      tokenName = decodeBytes32String(await bytes32instance.symbol());
    } catch (error) {
      const upgradableContractInstance = new Contract(
        tokenAddr,
        upgradableContractABI,
        RPCProvider
      );
      const addr = await upgradableContractInstance.implementation();
      tokenName = await getTokenName(addr);
    }
  }
  return tokenName;
}
