# DataFlow AI

> An AI-powered, end-to-end data analysis platform — upload a dataset, get automated cleaning, anomaly detection, and actionable insights in seconds.

![Status](https://img.shields.io/badge/status-active--development-brightgreen)
![Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20React%20%7C%20Python-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## What It Does

DataFlow AI removes the manual grunt work from data analysis. A user uploads a raw dataset (CSV or Excel), and the platform runs it through a tiered AI pipeline — each tier adding a layer of intelligence before the data reaches the analyst.

| Tier | Name | What It Does |
|------|------|--------------|
| Tier 1 | **Auto Clean** | Detects and resolves data quality issues automatically |
| Tier 2 | **Smart Detect** | Flags statistical anomalies and outliers across numeric columns |
| Tier 3 | **AI Insights** *(planned)* | LLM-generated narrative summaries and trend explanations |

---

## The AI Layer

### Tier 1 — Auto Clean
The cleaning pipeline runs a series of diagnostic checks on ingestion:

- **Missing value detection** — identifies columns with null rates above configurable thresholds
- **Type inference** — detects columns stored as wrong types (e.g. numeric data in string columns)
- **Duplicate row detection** — flags exact and near-duplicate records
- **Whitespace & formatting normalization** — strips inconsistent spacing, casing, and trailing characters
- **Date parsing** — standardizes mixed date formats across columns

All decisions are logged and returned to the user as a structured cleaning report — nothing is silently mutated.

### Tier 2 — Smart Detect
The anomaly detection pipeline applies statistical methods to surface data points that fall outside expected distributions:

- **IQR-based outlier detection** — flags values beyond 1.5× interquartile range per column
- **Z-score analysis** — surfaces extreme deviations in normally distributed columns
- **Column-level summary statistics** — mean, median, std, skew returned alongside anomaly flags
- **Severity scoring** — anomalies are ranked by degree of deviation, not just presence/absence

The output is a structured JSON response the frontend renders as an interactive anomaly report.

### Tier 3 — AI Insights *(In Design)*
The planned LLM integration will use retrieved column statistics and anomaly summaries as grounded context for an LLM prompt, generating plain-English explanations of what the data shows and what the analyst should investigate. This is intentionally RAG-inspired: the model will not speculate beyond what the data pipeline surfaces.

---

## Architecture

```
dataflow-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route definitions
│   │   ├── core/         # Config, constants, shared utilities
│   │   ├── models/       # Pydantic request/response schemas
│   │   └── services/     # Business logic — cleaning & detection pipelines
│   ├── tests/            # Unit tests for pipeline logic
│   ├── uploads/          # Temporary file storage on ingestion
│   └── requirements.txt
├── frontend/
│   └── src/              # React application
│       ├── App.js
│       └── index.js
├── docs/                 # Architecture notes and design decisions
└── README.md
```

**Why this structure?**
The `services/` layer is intentionally decoupled from the API routes. Each tier (Auto Clean, Smart Detect) is a self-contained service module — meaning tiers can be called independently, tested in isolation, and extended without touching route logic. This matters when adding Tier 3: the LLM service drops in without restructuring anything else.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn |
| Data Processing | pandas, numpy |
| Schema Validation | Pydantic v2 |
| File Handling | python-multipart, openpyxl |
| Frontend | React (Create React App) |
| Environment | python-dotenv |

---

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm start
```

App available at `http://localhost:3000`

---

## Design Decisions

**Why FastAPI over Flask or Django?**
FastAPI's async support and automatic OpenAPI documentation make it the right choice for a data pipeline API where file upload handling and response schema clarity matter. Pydantic v2 enforces strict input/output contracts at every tier.

**Why statistical methods before ML models?**
Tier 1 and Tier 2 are deliberately rule-based and statistical. This keeps the pipeline fast, explainable, and free of model dependencies for the core cleaning and detection tasks. ML models will be introduced in Tier 3 where the task (narrative generation) genuinely requires them.

**Why structure the tiers as separate services?**
Each tier solves a distinct problem. Coupling them would make the system brittle — a change to anomaly detection logic shouldn't risk breaking the cleaning pipeline. Service isolation also makes it straightforward to A/B test different detection strategies per tier.

---

## What's Next

- [ ] Tier 3: LLM-powered insight generation using column stats as RAG context
- [ ] Vector storage for dataset history and cross-dataset comparison
- [ ] User authentication and dataset session management
- [ ] Export cleaned datasets as CSV / Excel
- [ ] Dashboard UI for visual anomaly exploration

---

## Author

**Rosa** — Data Analyst & ML Engineer in Training
[LinkedIn](https://linkedin.com) · [Portfolio](#)

> *Built to scratch my own itch: too much time was going into cleaning before any real analysis could start. DataFlow AI automates the boring parts so analysts can focus on what actually matters.*