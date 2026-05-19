# Architecture Notes

## Why a Tiered Pipeline?
Each tier solves a distinct problem and is designed to be independently testable and extendable.

## Tier 1 — Auto Clean
Rule-based and statistical. Fast, explainable, no model dependencies.

## Tier 2 — Smart Detect
IQR and Z-score based anomaly detection. Returns severity-ranked JSON output.

## Tier 3 — AI Insights (Planned)
LLM integration using column stats and anomaly summaries as grounded RAG context.
No hallucination beyond what the data pipeline surfaces.