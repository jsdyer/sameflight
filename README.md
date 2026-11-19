# Same Flight

[Open Same Flight](https://coolcode.ca/sameflight/) · [CoolCode](https://coolcode.ca/)

Search by carrier, flight number, airport, city or departure date. Compare distinct decisions with the individual order statements published for that departure. Filter by issue and remedy, and open an original decision number or the official table. The table includes dismissals as well as orders awarding compensation, reimbursement or a refund.

<!-- coolcode:guide -->
Flair F81100 from Montréal to Fort Lauderdale has 22 inconvenience-compensation decisions and four dismissals. On WestJet WS1877 from Kahului to Vancouver, seven decisions contain 13 order rows. Filter the issue or remedy to see how a single decision can appear in several counts.
<!-- /coolcode:guide -->

## Selected departures

The initial release covers **nine carrier/flight/date/route groups**, **79 distinct decision numbers** and **98 order rows**. Departure dates are December 23, 2023 and January 27, 2024. The selected decisions were completed between May 10, 2024 and September 15, 2026. Counts were retrieved November 19, 2026. The agency’s source table stated a reporting period of September 30, 2023 to September 30, 2026 and a quarterly update cycle. The static collection is manually refreshed.

| Flight and date | Airport pair | Decisions | Order rows |
| --- | --- | ---: | ---: |
| [F81100 · 2024-01-27](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=F81100&flightDate=2024-01-27) | YUL–FLL | 26 | 26 |
| [WS1877 · 2024-01-27](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=WS1877&flightDate=2024-01-27) | OGG–YVR | 7 | 13 |
| [WS1876 · 2024-01-27](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=WS1876&flightDate=2024-01-27) | YVR–OGG | 9 | 12 |
| [AA1516 · 2024-01-27](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=AA1516&flightDate=2024-01-27) | YUL–MIA | 8 | 9 |
| [AA1516 · 2024-01-27](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=AA1516&flightDate=2024-01-27) | YUL–TMB | 2 | 2 |
| [AT209 · 2023-12-23](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=AT209&flightDate=2023-12-23) | YUL–CMN | 9 | 12 |
| [WS2289 · 2023-12-23](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=WS2289&flightDate=2023-12-23) | SJD–YYC | 9 | 9 |
| [PD2940 · 2023-12-23](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=PD2940&flightDate=2023-12-23) | BOS–YTZ | 3 | 6 |
| [WS2747 · 2023-12-23](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions?flightNumber=WS2747&flightDate=2023-12-23) | CUN–YYZ | 6 | 9 |

## Using another departure

Open **Look up another flight or import CTA results**. Search the official portal using the flight number and date, then choose the **JSON** download below its table. Select that file in Same Flight. It replaces the current collection in memory. No file contents are transmitted or retained. **Restore selected departures** returns to the curated collection. The official search opens at the agency and sends the flight number and date entered on that form.

The importer reads the official JSON envelope (`aaData`) and checks the reported total when provided. It groups by `airlineCode`, `flightNumber`, `flightDateString` and the airport pair in `flightInfoLong`. Rows with missing identifiers, unparseable routes, or an explicit non-public flag are excluded and counted. Unknown issue or order labels remain visible. Each eligible row counts as a published order row, and each `decisionNumber` counts once inside the applicable group and filter. One decision may occur under several order statements. The official number-and-date search can include several airport pairs, as the AA1516 example shows.

## Source and reproduction

Source: Canadian Transportation Agency, [Air travel complaint decisions and orders](https://portail-portal.otc-cta.gc.ca/en/listing-8514-decisions). Same Flight publishes its own selected factual counts and example decision numbers with links to the originals. Personal circumstances and award amounts are outside these summaries. Counts describe published records for the selected groups. The portal links the [Government of Canada terms and conditions](https://www.canada.ca/en/transparency/terms.html), which distinguish non-commercial reproduction and commercial redistribution. The complete agency file is not distributed here.

The default build is offline. To review updated counts, run `node scripts/refresh.mjs` with Node 20+ and network access. It uses the same filtered export URL as the portal’s JSON button, requires all nine groups to survive validation, and replaces the snapshot atomically. Review the changes and update the above coverage before publishing. Run `node --test tests/*.test.mjs`, `python3 -m unittest discover -s tests -v`, then `python3 scripts/build.py`. Browser smoke tests use Playwright and Chromium, with `CHROMIUM_PATH` available for a system installation. GitHub Actions publishes the tested main build.
