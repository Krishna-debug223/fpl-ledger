# FPL Ledger

**Live site:** https://fpl-ledger-azure.vercel.app  
**Current ledger:** https://fpl-ledger-azure.vercel.app/ledger  
**Forecast engine:** https://fpl-risk-ui-refresh.vercel.app

FPL Ledger is the validation companion to FPL Risk. It separates **prediction time** from **evaluation time** so the model cannot be made to look better by changing its forecasts after the deadline.

## Current forward test: GW5

GW5 is the active public forward test.

Before the official FPL deadline, the Ledger reads the production projection export from:

`https://fpl-risk-ui-refresh.vercel.app/api/ledger/snapshot?event=5`

The public page is explicitly marked **GW5 PRE-LOCK** during this period. Values may still change before the deadline when legitimate production inputs change.

At the deadline, the workflow freezes the exact projection payload into `data/gw5-locked.json`, records the model version and lock timestamp, and computes a SHA-256 fingerprint of the source snapshot. Once that artifact exists, the website automatically switches from the live feed to the immutable lock.

If the deadline has passed but the immutable artifact is not yet present, the UI shows **LOCK PENDING** rather than falsely claiming that a live response is frozen.

## Lock artifact format

The GW5 lock is designed to use this structure:

```json
{
  "lockSchemaVersion": 1,
  "gameweek": 5,
  "lockedAt": "ISO-8601 timestamp",
  "deadlineTime": "official FPL deadline",
  "modelVersion": "model version",
  "contentHash": "sha256 of exact fetched projection payload",
  "snapshot": {}
}
```

The complete FPL Risk snapshot is preserved under `snapshot`; it is not reduced to a hand-picked sample.

## What the system records

- Full player projection set before each Gameweek deadline.
- Official Gameweek deadline and source generation time.
- Model version and projection components.
- Risk, confidence and data-quality context for each player.
- Immutable lock timestamp and SHA-256 content fingerprint.
- Historical scoring reports kept separate from current forward tests.

## Verified GW3 archive

The frozen GW3 snapshot was previously scored against official results and remains preserved as historical evidence.

| Cohort | Players | MAE | RMSE | Bias | Within +/-2 |
|---|---:|---:|---:|---:|---:|
| All listed players | 652 | 1.308 | 2.035 | -0.220 | 80.7% |
| Active cohort | 459 | 1.798 | 2.415 | -0.253 | 72.5% |

GW3 is not blended into GW5. Model revisions belong to later forward tests and do not rewrite historical reports.

## Repository contents

- `index.html` — current GW5 forward-test overview.
- `ledger.html` — live/pre-lock or frozen/locked GW5 player ledger.
- `report.html` — verified GW3 archive report.
- `app.js` — current Gameweek configuration, live/locked source selection and shared UI helpers.
- `styles.css` — shared FPL Ledger visual system.
- `data/gw3-report.json` — verified final GW3 error metrics.
- `data/gw3-snapshot-meta.json` — preserved GW3 metadata/sample artifact.
- `scripts/freeze-gw5.mjs` — deadline-safe utility that creates the immutable GW5 lock artifact.
- `scripts/verify-report.mjs` — integrity assertions for the archived GW3 report.

## Run locally

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

To verify the archived report:

```bash
node scripts/verify-report.mjs
```

The GW5 freeze script intentionally refuses to create a lock before the official deadline:

```bash
node scripts/freeze-gw5.mjs
```

## Relationship to FPL Risk

- **FPL Risk** forecasts and supports FPL decisions.
- **FPL Ledger** records, freezes, scores and audits those forecasts.

The Ledger never changes the projection calculations in FPL Risk.

## Disclaimer

FPL Ledger is an independent project and is not affiliated with, endorsed by or sponsored by the Premier League. It uses public Fantasy Premier League data for educational and analytical purposes.
