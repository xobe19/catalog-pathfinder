import axios from "axios";
import * as dotenv from "dotenv";
import { CalldataGenerator } from "./callDataGenerator";

dotenv.config();

const TENDERLY_ACCESS_KEY = process.env.TENDERLY_API;

const batchedSimulations = async (block_number?: number) => {
  try {
    console.time("Batch Simulation");

    const txSequences = (
      await axios.post(
        `https://api.tenderly.co/api/v1/account/vikasrushi/project/project/simulate-bundle`,
        {
          simulations: getTxSequence().map((transaction) => ({
            network_id: "1",
            save: true,
            save_if_fails: true,
            simulation_type: "full",
            ...transaction,
          })),
        },
        {
          headers: {
            "X-Access-Key": TENDERLY_ACCESS_KEY as string,
          },
        }
      )
    ).data;
    console.timeEnd("Batch Simulation");
    console.log(JSON.stringify(txSequences, null, 2));
  } catch (error) {
    console.log(error);
  }
};

function getTxSequence() {
  const transactionData = CalldataGenerator.approveTokens(
    "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    "0x5f0923323FA1b99f38Ed07254d94F15D7803D4a6",
    1000000000000,
    "0xdEAD000000000000000042069420694206942069"
  );
  const data = {
    from: transactionData?.txObj.from,
    to: transactionData?.txObj.to,
    input: transactionData?.calldata,
  };

  return [data];
}
batchedSimulations(19367388);
