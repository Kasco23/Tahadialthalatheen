import fs from "fs";
import zlib from "zlib";

const sizes = fs
  .readdirSync("dist/assets")
  .filter((f) => f.endsWith(".js"))
  .map((f) => zlib.gzipSync(fs.readFileSync(`dist/assets/${f}`)).length / 1024);

const max = Math.max(...sizes);
if (max > 250) {
  console.error(`❌ Largest gzipped chunk is ${max.toFixed(1)} kB (>250)`);
  process.exit(1);
}
console.log(`✅ largest gzipped chunk: ${max.toFixed(1)} kB`);
