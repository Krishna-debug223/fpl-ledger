# FPL Ledger

**Live demo:** https://fpl-ledger-azure.vercel.app  
**Live forward-test ledger:** https://fpl-ledger-azure.vercel.app/ledger

FPL Ledger is the validation companion to FPL Risk. Instead of changing a model after seeing results and then backtesting the revised version, Ledger **freezes projections before the FPL deadline**, records their timestamp/model version/content hash, and only then joins the locked predictions to official results.

That creates an auditable forward-test record for the model: projected points -> actual points -> error -> next-gameweek calibration.

## Why I built it

Prediction products are easy to make look good retroactively. I wanted a system that made the forecasting process falsifiable. FPL Ledger separates **prediction time** from **evaluation time** and preserves what the model actually believed before the games were played.

## What the production system does

- Locks the full player projection set before each Gameweek deadline.
- Stores model version, lock timestamp, deadline, data-feed state and a content hash.
- Pulls official FPL scores after fixtures begin and refreshes live actuals roughly every 60 seconds.
- Computes MAE, RMSE, directional bias and within-1/2/3-point accuracy.
- Breaks error down by FPL position and tracks the largest misses.
- Produces capped, position-level calibration adjustments for the next Gameweek.
- Displays confidence/data-quality context beside each forecast.

## Verified GW3 forward-test result

The frozen GW3 snapshot was locked **27 minutes before the deadline** and was later scored against official results.

| Cohort | Players | MAE | RMSE | Bias | Within +/-2 |
|---|---:|---:|---:|---:|---:|
| All listed players | 652 | 1.308 | 2.035 | -0.220 | 80.7% |
| Active cohort | 459 | 1.798 | 2.415 | -0.253 | 72.5% |

The active cohort is the more useful accuracy view because it removes players with zero/limited participation from the headline model assessment.

## Repository contents

This repository is a **portfolio snapshot of the deployed validation/reporting layer**, assembled from frozen production artifacts. The live deployment remains the source of truth for the current application.

- `index.html` - lightweight portfolio overview.
- `ledger.html` - sample frozen projections and their evaluated outcomes.
- `report.html` - GW3 accuracy report.
- `data/gw3-report.json` - verified final GW3 error metrics.
- `data/gw3-snapshot-meta.json` - immutable snapshot metadata and sample pre-deadline projections.
- `scripts/verify-report.mjs` - integrity/metric assertions that fail if the portfolio data is changed incorrectly.

## Run locally

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Run the data-integrity check with Node:

```bash
node scripts/verify-report.mjs
```

## Relationship to FPL Risk

- **FPL Risk** is the forecasting + decision engine.
- **FPL Ledger** is the measurement + accountability layer.

Keeping them separate prevents the product interface from becoming the evaluation system for its own forecasts.

## Disclaimer

FPL Ledger is an independent project and is not affiliated with, endorsed by or sponsored by the Premier League. It uses public Fantasy Premier League data for educational/analytical purposes.
