import { parseArgs } from "node:util";
import Arweave from "arweave";
import { createReadStream, readFileSync } from "fs";
import { pipeline } from "stream/promises";
import { JWKInterface } from "arweave/node/lib/wallet";
import {
  createTransactionAsync,
  uploadTransactionAsync,
} from "arweave-stream-tx";

const {
  values: { file, wallet },
} = parseArgs({
  options: {
    file: {
      type: "string",
      short: "f",
    },
    wallet: {
      type: "string",
      short: "w",
    },
  },
});

const arweave = new Arweave({
  host: "arweave.net",
  protocol: "https",
  port: 443,
  logging: false,
  timeout: 15000,
});

const loadJSON = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url)).toString());

const arweaveWallet = loadJSON(wallet) as JWKInterface;

const transaction = await pipeline(
  createReadStream(file),
  createTransactionAsync({}, arweave, arweaveWallet)
);

await arweave.transactions.sign(transaction, arweaveWallet);

console.log(`Uploading ${file} to arweave...`);
await pipeline(
  createReadStream(file),
  uploadTransactionAsync(transaction, arweave)
);
