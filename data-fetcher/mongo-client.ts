import mongoose, { Schema } from "mongoose";

mongoose
  .connect("mongodb://127.0.0.1:27017/")
  .then(() => console.log("Connected!"));

const addressModel = new Schema({
  address: {
    type: String,
    required: [true, "state must be provided"],
  },
});

const PairTokenSchema = new Schema({
  address: String,
  quantity: String,
  decimal: Number,
  symbol: String,
});

const PairSchema = new Schema({
  address: String,
  token0: PairTokenSchema,
  token1: PairTokenSchema,
});

export const PairSchemaRef = mongoose.model("pairs", PairSchema);
export const addressModelRef = mongoose.model("address", addressModel);

export async function pushAddress(address: string) {
  try {
    await addressModelRef.create({
      address: address,
    });
  } catch (error) {
    console.log(error);
  }
}
