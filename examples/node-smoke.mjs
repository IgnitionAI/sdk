import { createRequire } from "node:module";
import { IgnitionAI as IgnitionAIEsm } from "../typescript/dist/esm/index.js";

const require = createRequire(import.meta.url);
const { IgnitionAI: IgnitionAICjs } = require("../typescript/dist/cjs/index.js");

for (const Client of [IgnitionAIEsm, IgnitionAICjs]) {
  const client = new Client({
    baseURL: "https://rag.example.com",
    apiKey: "ign_smoke_test_only",
  });
  if (!client.collections || !client.workflows || !client.deepResearch) {
    throw new Error("Expected SDK resources are missing");
  }
}

console.log("Node ESM and CommonJS imports are valid");
