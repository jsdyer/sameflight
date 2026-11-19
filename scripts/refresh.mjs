// Run with Node 20+. Download the portal's official filtered JSON exports.
import { readFile, writeFile, rename } from "node:fs/promises";
import { official, summarize } from "../web/model.mjs";
const dest = new URL("../web/departures.json", import.meta.url);
const prior = JSON.parse(await readFile(dest, "utf8"));
const keys = new Set(prior.departures.map((f) => f.key));
const rows = [];
const queries = new Set(
  prior.departures.map((f) => official(f.flight, f.date, true)),
);
for (const url of queries) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok)
    throw Error("CTA export returned " + response.status + " for " + url);
  const json = await response.json();
  if (
    !Array.isArray(json.aaData) ||
    Number(json.iTotalDisplayRecords) !== json.aaData.length
  )
    throw Error("Incomplete official export");
  rows.push(...json.aaData.filter((r) => keys.has(r.flightInfoLong)));
}
const result = summarize({ aaData: rows });
if (result.skipped || result.departures.length !== keys.size)
  throw Error("Source coverage changed. Review the official table.");
result.departures.sort(
  (a, b) =>
    prior.departures.findIndex((f) => f.key === a.key) -
    prior.departures.findIndex((f) => f.key === b.key),
);
const next = new URL("departures.tmp.json", dest);
await writeFile(
  next,
  JSON.stringify(
    { retrieved: new Date().toISOString().slice(0, 10), ...result },
    null,
    2,
  ) + "\n",
);
await rename(next, dest);
