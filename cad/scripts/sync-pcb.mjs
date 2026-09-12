import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
const pcb = new URL("../../pcb/", import.meta.url);
const output = new URL("../public/pcb/", import.meta.url);
await mkdir(output, { recursive: true });
const raw = await readFile(new URL("dist/index/circuit.json", pcb), "utf8");
const circuit = JSON.parse(raw);
if (circuit.some((x) => x.type.endsWith("_error")))
  throw new Error("PCB export has errors; fix placement before syncing.");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ["geometry.json", "keepouts.json"])
  await cp(new URL(name, pcb), new URL(name, output));
await cp(new URL("dist/index/pcb.svg", pcb), new URL("placement.svg", output));
await cp(
  new URL("dist/index/schematic.svg", pcb),
  new URL("schematic.svg", output),
);
await cp(new URL("imports/", pcb), new URL("imports/", output), {
  recursive: true,
  filter: (src) => !src.endsWith(".tsx") && !src.endsWith(".step"),
});
await writeFile(new URL("circuit.json", output), raw);
await writeFile(
  new URL("provenance.json", output),
  JSON.stringify(
    {
      sha256: createHash("sha256").update(raw).digest("hex"),
      source: "pcb/index.circuit.tsx",
      routing: "disabled",
      components: circuit.filter((x) => x.type === "pcb_component").length,
    },
    null,
    2,
  ),
);
console.log("Synced validated PCB JSON, drawings and imported vendor models.");
