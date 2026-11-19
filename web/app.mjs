import {
  airports,
  carriers,
  official,
  summarize,
  match,
  statements,
} from "./model.mjs";
const $ = (id) => document.getElementById(id);
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const choice = (value, text) => new Option(text, value);
const link = (title, href) => {
  const a = node("a", title);
  a.href = href;
  return a;
};
const date = (d) =>
  d
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(d + "T00:00:00Z"))
    : "Unknown";
let snapshot,
  current,
  key = location.hash.slice(1),
  issue = "",
  statement = "";
function list() {
  const flights = current.departures.filter((f) => match(f, $("search").value));
  $("departure").replaceChildren(
    ...flights.map((f) =>
      choice(f.key, f.flight + " · " + f.from + "–" + f.to + " · " + f.date),
    ),
  );
  if (!flights.some((f) => f.key === key)) key = flights[0]?.key || "";
  $("departure").disabled = !flights.length;
  $("departure").value = key;
  const source =
    current === snapshot
      ? "Selected collection · retrieved " + date(snapshot.retrieved)
      : "Local export";
  $("coverage").textContent =
    source +
    " · " +
    flights.length +
    " of " +
    current.departures.length +
    " departures shown · " +
    current.decisions +
    " distinct decisions and " +
    current.orders +
    " order rows in the collection.";
  render();
}
function filterControl(name, id, values, selected, cb) {
  const label = node("label", name),
    select = node("select");
  select.id = id;
  select.append(...values.map(([v, t]) => choice(v, t)));
  select.value = selected;
  select.onchange = () => cb(select.value);
  label.append(select);
  return label;
}
function render() {
  const out = $("result"),
    f = current.departures.find((item) => item.key === key);
  out.replaceChildren();
  if (!f) {
    out.append(
      node("h2", "No matching departures"),
      node(
        "p",
        "Try an airport code or a shorter search. Use the official lookup below to search beyond this collection.",
      ),
    );
    return;
  }
  if (!f.issues.some((t) => t.issue === issue)) issue = "";
  const slice = f.issues.find((t) => t.issue === issue) || f.all;
  if (!slice.statements.some((t) => t.statement === statement)) statement = "";
  const selected = slice.statements.find((t) => t.statement === statement);
  const sums = selected || slice;
  const board = node("div", undefined, "board");
  board.append(
    node(
      "p",
      (carriers[f.carrier] || f.carrier) +
        "  /  " +
        f.flight +
        "  /  " +
        date(f.date),
      "label",
    ),
  );
  const route = node("h2", undefined, "route");
  route.append(
    node("span", f.from),
    node("span", "—", "dash"),
    node("span", f.to),
  );
  board.append(
    route,
    node(
      "p",
      (airports[f.from] || f.from) + " to " + (airports[f.to] || f.to),
      "cities",
    ),
  );
  const filters = node("div", undefined, "searchline controls");
  filters.append(
    filterControl(
      "Issue",
      "issue",
      [["", "All issues"], ...f.issues.map((t) => [t.issue, t.issue])],
      issue,
      (v) => {
        issue = v;
        statement = "";
        render();
        $("issue").focus();
      },
    ),
    filterControl(
      "Order statement",
      "statement",
      [
        ["", "All order statements"],
        ...slice.statements.map((t) => [
          t.statement,
          statements[t.statement] || t.statement,
        ]),
      ],
      statement,
      (v) => {
        statement = v;
        render();
        $("statement").focus();
      },
    ),
  );
  const counts = node("div", undefined, "counts");
  for (const [v, t] of [
    [sums.decisions, "Distinct decisions"],
    [sums.orders, "Published order rows"],
  ]) {
    const cell = node("div");
    cell.append(node("strong", String(v)), node("span", t));
    counts.append(cell);
  }
  const table = node("table"),
    head = table.createTHead().insertRow();
  for (const t of ["Order statement", "Decisions", "Order rows", "Example"])
    head.append(node("th", t));
  const body = table.createTBody();
  for (const r of selected ? [selected] : slice.statements) {
    const tr = body.insertRow();
    tr.insertCell().textContent = statements[r.statement] || r.statement;
    tr.insertCell().textContent = r.decisions;
    tr.insertCell().textContent = r.orders;
    const url = new URL(official("", ""));
    url.searchParams.set("decisionNumber", r.example);
    const citation = link(r.example, url.href);
    citation.setAttribute("aria-label", "Official decision " + r.example);
    tr.insertCell().append(citation);
  }
  const refs = node("div", undefined, "refs");
  refs.append(
    link("Official filtered results", official(f.flight, f.date)),
    link("CTA JSON for this flight", official(f.flight, f.date, true)),
  );
  out.append(
    board,
    filters,
    counts,
    table,
    node(
      "p",
      "Decision dates for this departure: " +
        date(f.first) +
        " – " +
        date(f.last) +
        ". A decision can appear on more than one line.",
      "meta",
    ),
    refs,
  );
}
$("search").oninput = () => {
  if (current) list();
};
$("departure").onchange = () => {
  key = $("departure").value;
  issue = "";
  statement = "";
  if (current === snapshot) history.replaceState(null, "", "#" + key);
  render();
};
$("official-form").onsubmit = () => {
  $("flight-number").value = $("flight-number")
    .value.toUpperCase()
    .replace(/\s+/g, "");
};
let loadSequence = 0;
$("file").onchange = async () => {
  const version = ++loadSequence,
    file = $("file").files[0];
  if (!file) return;
  try {
    const imported = summarize(JSON.parse(await file.text()));
    if (version !== loadSequence) return;
    if (!imported.departures.length)
      throw Error(
        "No comparable flight groups in this export. Rows need a decision number and the full flight/date/airport pair.",
      );
    current = imported;
    key = "";
    issue = "";
    statement = "";
    $("search").value = "";
    $("reset").hidden = false;
    $("file-status").textContent =
      file.name +
      " · " +
      imported.orders +
      " eligible rows · " +
      imported.skipped +
      " rows omitted for missing fields or non-public status.";
    list();
  } catch (e) {
    if (version === loadSequence)
      $("file-status").textContent =
        "Import failed. " +
        (e instanceof SyntaxError ? "Choose a valid JSON file." : e.message);
  }
};
$("reset").onclick = () => {
  loadSequence++;
  current = snapshot;
  key = "";
  issue = "";
  statement = "";
  $("search").value = "";
  $("file").value = "";
  $("reset").hidden = true;
  $("file-status").textContent = "Selected collection restored.";
  list();
};
try {
  const response = await fetch("./departures.json");
  if (!response.ok) throw Error();
  snapshot = await response.json();
  if (!current) {
    current = snapshot;
    list();
  }
} catch {
  $("coverage").textContent =
    "The selected collection could not load. Reload the page or import an official export below.";
}
