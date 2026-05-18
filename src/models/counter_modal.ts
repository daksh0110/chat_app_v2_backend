import { model, Schema } from "mongoose";

export interface Counter {
  _id: string;

  seq: number;
}

const counterSchema = new Schema<Counter>(
  {
    _id: {
      type: String,
      required: true,
    },

    seq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

export const CounterModel = model<Counter>("Counter", counterSchema);

export async function getNextSequence(key: string): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    {
      _id: key,
    },

    {
      $inc: {
        seq: 1,
      },
    },

    {
      returnDocument: "after",
      upsert: true,
    },
  ).lean();

  return counter!.seq;
}
