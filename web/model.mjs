export const portal = "https://portail-portal.otc-cta.gc.ca";
export const carriers = {
  F8: "Flair Airlines",
  WS: "WestJet",
  AA: "American Airlines",
  AT: "Royal Air Maroc",
  PD: "Porter Airlines",
};
export const airports = {
  YUL: "Montréal",
  FLL: "Fort Lauderdale",
  YVR: "Vancouver",
  OGG: "Kahului",
  MIA: "Miami International",
  TMB: "Miami Executive",
  CMN: "Casablanca",
  SJD: "San José del Cabo",
  YYC: "Calgary",
  BOS: "Boston",
  YTZ: "Toronto City",
  CUN: "Cancún",
  YYZ: "Toronto Pearson",
};
export const statements = {
  "Order to compensate for inconvenience": "Compensation for inconvenience",
  "Order to compensate for expenses": "Compensation for expenses",
  "Order to refund": "Refund",
  Dismissed: "Dismissed",
};
export function official(flight, date, download = false) {
  const path = download ? "/api/CRO8514Rulings" : "/en/listing-8514-decisions";
  const url = new URL(path, portal);
  if (flight) url.searchParams.set("flightNumber", flight);
  if (date) url.searchParams.set("flightDate", date);
  if (download) url.searchParams.set("ReturnAllData", "true");
  return url.href;
}
function dimensions(row) {
  const {
    flightInfoLong: key,
    airlineCode: carrier,
    flightNumber: flight,
    flightDateString: date,
  } = row;
  if (
    ![key, carrier, flight, date, row.decisionNumber].every(
      (v) => typeof v === "string" && v.trim(),
    )
  )
    return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const prefix = [carrier, flight, date].join("-") + "-";
  if (!key.startsWith(prefix)) return null;
  const route = key.slice(prefix.length);
  if (!/^[A-Z]{3}-[A-Z]{3}$/.test(route)) return null;
  const [from, to] = route.split("-");
  return { key, carrier, flight, date, from, to };
}
function count(rows) {
  const decisions = new Set(rows.map((r) => r.decisionNumber));
  return { decisions: decisions.size, orders: rows.length };
}
function breakdown(rows) {
  const byStatement = group(
    rows,
    (r) => r.orderStatementEn || "Unspecified statement",
  );
  return {
    ...count(rows),
    statements: [...byStatement]
      .map(([statement, items]) => ({
        statement,
        ...count(items),
        example: items[0].decisionNumber,
      }))
      .sort(
        (a, b) => b.orders - a.orders || a.statement.localeCompare(b.statement),
      ),
  };
}
function group(rows, keyOf) {
  const result = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(row);
  }
  return result;
}
export function summarize(data) {
  if (!data || !Array.isArray(data.aaData))
    throw Error(
      "Choose the JSON export from the CTA decisions table. Its aaData list is missing.",
    );
  if (
    data.iTotalDisplayRecords != null &&
    Number(data.iTotalDisplayRecords) !== data.aaData.length
  )
    throw Error(
      "This file contains a partial results page. Use the JSON download below the official table.",
    );
  const groups = new Map(),
    ids = new Set();
  let skipped = 0;
  for (const row of data.aaData) {
    const fields = row && dimensions(row);
    if (!fields || row.isPublic === "N") {
      skipped++;
      continue;
    }
    if (!groups.has(fields.key))
      groups.set(fields.key, { ...fields, rows: [] });
    groups.get(fields.key).rows.push(row);
    ids.add(row.decisionNumber);
  }
  const departures = [...groups.values()].map(({ rows, ...fields }) => {
    const completeDates = rows
      .map((r) => r.completeDateString)
      .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    return {
      ...fields,
      first: completeDates[0] || null,
      last: completeDates.at(-1) || null,
      all: breakdown(rows),
      issues: [
        ...group(rows, (r) => r.issueTier1En || "Unspecified issue"),
      ].map(([issue, items]) => ({ issue, ...breakdown(items) })),
    };
  });
  return {
    departures,
    decisions: ids.size,
    orders: data.aaData.length - skipped,
    skipped,
  };
}
export function match(f, input) {
  const norm = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const text = norm(
    [
      f.flight,
      f.carrier,
      carriers[f.carrier],
      f.date,
      f.from,
      f.to,
      airports[f.from],
      airports[f.to],
    ].join(" "),
  );
  return norm(input.trim())
    .split(/\s+/)
    .every((word) => text.includes(word));
}
