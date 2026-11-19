import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarize, match, official } from "../web/model.mjs";
const curated = JSON.parse(
  readFileSync(new URL("../web/departures.json", import.meta.url)),
);
const flight = curated.departures[0];
const row = {
  flightInfoLong: flight.key,
  airlineCode: flight.carrier,
  flightNumber: flight.flight,
  flightDateString: flight.date,
  decisionNumber: "A",
  issueTier1En: "Flight Disruption",
  orderStatementEn: "Dismissed",
  completeDateString: "2024-09-10",
};
test("A decision with more than one issue and order counts once per group", () => {
  const rows = [
    row,
    { ...row, issueTier1En: "Baggage", orderStatementEn: "Order to refund" },
    { ...row, decisionNumber: "B" },
  ];
  const g = summarize({ aaData: rows });
  assert.equal(g.decisions, 2);
  assert.equal(g.orders, 3);
  assert.equal(g.departures[0].issues.length, 2);
  assert.equal(g.departures[0].all.statements[0].decisions, 2);
});
test("A different airport pair remains a distinct departure", () => {
  const g = summarize({
    aaData: [row, { ...row, flightInfoLong: flight.key.slice(0, -3) + "MIA" }],
  });
  assert.equal(g.departures.length, 2);
  assert.equal(g.decisions, 1);
});
test("Rejects paginated or malformed downloads and reports omitted rows", () => {
  assert.throws(
    () => summarize({ aaData: [row], iTotalDisplayRecords: 2 }),
    /partial/,
  );
  assert.throws(() => summarize([]), /aaData/);
  const g = summarize({ aaData: [null, { ...row, isPublic: "N" }, row] });
  assert.equal(g.skipped, 2);
});
test("Snapshot checks and source URL", () => {
  assert.equal(curated.decisions, 79);
  assert.equal(curated.orders, 98);
  assert.equal(flight.all.decisions, 26);
  assert.ok(match(flight, "montreal fll"));
  assert.equal(
    new URL(official("F81100", "2024-01-27", true)).searchParams.get(
      "ReturnAllData",
    ),
    "true",
  );
});
