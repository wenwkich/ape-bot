import dotenv from "dotenv";
import { run } from "./run";
import fs from "fs";
import { Config } from "./types";
import path from "path";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const main = async () => {
  const configFile = fs.readFileSync(path.join(__dirname, "../config.json"));
  const config = JSON.parse(configFile.toString());
  // read config file
  const { baseToken, targetToken, options, rpcInfo } = config as Config;
  // run the whole thing
  await run(baseToken, targetToken, options, rpcInfo, PRIVATE_KEY);
};

try {
  main();
} catch (err) {
  console.error(err);
}
