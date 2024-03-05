import { CalldataGenerator } from "./calldataGenerator";

const path = [
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "0xd46ba6d942050d489dbd938a2c909a5d5039a161",
  "0xd233d1f6fd11640081abb8db125f722b5dc729dc",
  "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
  "0x6b175474e89094c44da98b954eedeac495271d0f",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
];

class TradeExecutor {
  static async approve(
    ERC20_TOKEN: string,
    spender_address: string,
    amount: bigint,
    from_address: string
  ) {
    const tx = CalldataGenerator.approveTokens(
      ERC20_TOKEN,
      spender_address,
      amount,
      from_address
    )?.txObj;
    console.log(tx);
  }
}
