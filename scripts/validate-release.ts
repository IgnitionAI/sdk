import { readFile } from "node:fs/promises";

const tag = process.argv[2];
if (!tag?.startsWith("v")) throw new Error("Expected a v-prefixed release tag");
const packageJson = JSON.parse(await readFile("typescript/package.json", "utf8")) as {
  version: string;
};
if (tag !== `v${packageJson.version}`) {
  throw new Error(`Tag ${tag} does not match package version ${packageJson.version}`);
}
process.argv.push("--built");
await import("./validate-public-surface.ts");
console.log(`Validated release ${tag}`);
