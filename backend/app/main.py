from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pandas as pd
import numpy as np
import io
import re
import os
import google.generativeai as genai

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-pro")

app = FastAPI(
    title="DataFlow AI",
    description="AI-powered end-to-end data analysis platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_dataframe(df: pd.DataFrame):
    report = []
    original_shape = df.shape

    original_cols = list(df.columns)
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(r'[^a-z0-9]+', '_', regex=True)
        .str.strip('_')
    )
    renamed = [(o, n) for o, n in zip(original_cols, df.columns) if o != n]
    if renamed:
        report.append({
            "issue": "Column Names Standardized",
            "detail": f"{len(renamed)} columns renamed to lowercase with underscores",
            "severity": "info",
            "examples": [f'"{o}" → "{n}"' for o, n in renamed[:3]]
        })

    duplicates = df.duplicated().sum()
    if duplicates > 0:
        df = df.drop_duplicates()
        report.append({
            "issue": "Duplicate Rows Removed",
            "detail": f"{duplicates} duplicate rows removed",
            "severity": "warning",
            "examples": []
        })

    str_cols = df.select_dtypes(include='object').columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()

    for col in str_cols:
        sample = df[col].dropna().head(20).astype(str)

        if sample.str.contains(r'[\$£€₦]', regex=True).any():
            df[col] = df[col].astype(str).str.replace(r'[\$£€₦,]', '', regex=True).str.strip()
            try:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                report.append({
                    "issue": "Currency Symbols Removed",
                    "detail": f'Column "{col}" cleaned and converted to numeric',
                    "severity": "info",
                    "examples": []
                })
            except:
                pass

        elif sample.str.contains(r'%', regex=True).any():
            df[col] = df[col].astype(str).str.replace('%', '', regex=False).str.strip()
            try:
                df[col] = pd.to_numeric(df[col], errors='coerce') / 100
                report.append({
                    "issue": "Percentage Signs Removed",
                    "detail": f'Column "{col}" converted to decimal',
                    "severity": "info",
                    "examples": []
                })
            except:
                pass

        elif sample.str.match(r'^[\d,]+\.?\d*$').any():
            cleaned = df[col].astype(str).str.replace(',', '', regex=False)
            converted = pd.to_numeric(cleaned, errors='coerce')
            if converted.notna().sum() > len(df) * 0.5:
                df[col] = converted
                report.append({
                    "issue": "Comma-Separated Numbers Fixed",
                    "detail": f'Column "{col}" cleaned',
                    "severity": "info",
                    "examples": []
                })

    str_cols = df.select_dtypes(include='object').columns
    for col in str_cols:
        sample = df[col].dropna().head(20).astype(str)
        date_patterns = [r'\d{4}-\d{2}-\d{2}', r'\d{2}/\d{2}/\d{4}', r'\d{2}-\d{2}-\d{4}']
        for pattern in date_patterns:
            if sample.str.match(pattern).sum() > len(sample) * 0.7:
                try:
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                    report.append({
                        "issue": "Date Column Detected & Converted",
                        "detail": f'Column "{col}" converted to datetime',
                        "severity": "info",
                        "examples": []
                    })
                except:
                    pass
                break

    str_cols = df.select_dtypes(include='object').columns
    for col in str_cols:
        converted = pd.to_numeric(df[col], errors='coerce')
        if converted.notna().sum() > len(df) * 0.9:
            df[col] = converted
            report.append({
                "issue": "Text-to-Numeric Conversion",
                "detail": f'Column "{col}" was text but contained numbers — converted',
                "severity": "info",
                "examples": []
            })

    missing_before = df.isnull().sum().sum()
    if missing_before > 0:
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].fillna(df[col].median())
                else:
                    mode = df[col].mode()
                    df[col] = df[col].fillna(mode[0] if not mode.empty else "unknown")
        report.append({
            "issue": "Missing Values Filled",
            "detail": f"{missing_before} missing values filled (numeric → median, text → mode)",
            "severity": "warning",
            "examples": []
        })

    constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
    if constant_cols:
        report.append({
            "issue": "Constant Columns Detected",
            "detail": f"{len(constant_cols)} columns have only one unique value — consider dropping them",
            "severity": "warning",
            "examples": constant_cols[:3]
        })

    final_shape = df.shape
    return df, report, original_shape, final_shape


def build_summary(df):
    summary = []
    for col in df.columns:
        col_data = df[col]
        col_info = {
            "column": col,
            "type": str(col_data.dtype),
            "missing": int(col_data.isnull().sum()),
            "missing_pct": round(col_data.isnull().sum() / len(df) * 100, 1),
        }
        if pd.api.types.is_numeric_dtype(col_data):
            col_info["mean"] = round(float(col_data.mean()), 2) if not col_data.isnull().all() else None
            col_info["min"] = round(float(col_data.min()), 2) if not col_data.isnull().all() else None
            col_info["max"] = round(float(col_data.max()), 2) if not col_data.isnull().all() else None
        else:
            col_info["mean"] = None
            col_info["min"] = None
            col_info["max"] = None
        summary.append(col_info)
    return summary


def smart_detect(df: pd.DataFrame):
    findings = []

    for col in df.columns:
        col_data = df[col].dropna()

        if df[col].dtype == object and df[col].nunique() < 50:
            values = df[col].dropna().astype(str)
            lower_counts = values.str.lower().value_counts()
            original_counts = values.value_counts()
            for val in lower_counts.index:
                variants = [v for v in original_counts.index if v.lower() == val]
                if len(variants) > 1:
                    findings.append({
                        "type": "inconsistent_categories",
                        "column": col,
                        "severity": "warning",
                        "title": f'Inconsistent Categories in "{col}"',
                        "detail": f'Found {len(variants)} variants of the same value: {", ".join(variants[:5])}',
                        "suggestion": "Standardize to one consistent format (e.g. all lowercase or title case)"
                    })
                    break

        if pd.api.types.is_numeric_dtype(df[col]) and len(col_data) > 10:
            Q1 = col_data.quantile(0.25)
            Q3 = col_data.quantile(0.75)
            IQR = Q3 - Q1
            if IQR > 0:
                lower = Q1 - 1.5 * IQR
                upper = Q3 + 1.5 * IQR
                outlier_count = ((col_data < lower) | (col_data > upper)).sum()
                if outlier_count > 0:
                    pct = round(outlier_count / len(df) * 100, 1)
                    findings.append({
                        "type": "outliers",
                        "column": col,
                        "severity": "warning" if pct < 5 else "error",
                        "title": f'Outliers Detected in "{col}"',
                        "detail": f'{outlier_count} outliers ({pct}%) outside range [{round(lower, 2)}, {round(upper, 2)}]',
                        "suggestion": "Review these values. Consider capping, removing, or transforming them."
                    })

        if df[col].nunique() <= 1:
            findings.append({
                "type": "constant_column",
                "column": col,
                "severity": "info",
                "title": f'Constant Column: "{col}"',
                "detail": "This column has only one unique value and adds no analytical value.",
                "suggestion": "Consider dropping this column before analysis."
            })

        elif pd.api.types.is_numeric_dtype(df[col]):
            negative_keywords = ['age', 'price', 'quantity', 'qty', 'amount', 'count', 'salary', 'revenue', 'cost']
            if any(kw in col.lower() for kw in negative_keywords):
                neg_count = (col_data < 0).sum()
                if neg_count > 0:
                    findings.append({
                        "type": "impossible_values",
                        "column": col,
                        "severity": "error",
                        "title": f'Impossible Negative Values in "{col}"',
                        "detail": f'{neg_count} negative values found in a column that should only be positive.',
                        "suggestion": "Review these rows. They may be data entry errors."
                    })

            skewness = col_data.skew()
            if abs(skewness) > 2:
                direction = "right" if skewness > 0 else "left"
                findings.append({
                    "type": "skewed_column",
                    "column": col,
                    "severity": "info",
                    "title": f'Highly Skewed Column: "{col}"',
                    "detail": f'Skewness = {round(skewness, 2)} ({direction}-skewed). This can distort averages and ML models.',
                    "suggestion": "Consider applying a log or square root transformation for analysis."
                })

    return findings


def build_ai_prompt(df: pd.DataFrame, filename: str) -> str:
    summary_lines = []
    for col in df.columns:
        col_data = df[col]
        if pd.api.types.is_numeric_dtype(col_data):
            summary_lines.append(
                f"- {col} (numeric): min={col_data.min():.2f}, max={col_data.max():.2f}, "
                f"mean={col_data.mean():.2f}, missing={col_data.isnull().sum()}"
            )
        else:
            top_vals = col_data.value_counts().head(3).index.tolist()
            summary_lines.append(
                f"- {col} (text): {col_data.nunique()} unique values, "
                f"top values: {', '.join(str(v) for v in top_vals)}, "
                f"missing={col_data.isnull().sum()}"
            )

    prompt = f"""You are a senior data analyst. A user has uploaded a dataset called "{filename}" with {len(df)} rows and {len(df.columns)} columns.

Here is a summary of the columns:
{chr(10).join(summary_lines)}

Write a smart, professional AI analysis of this dataset in 4–6 sentences. Cover:
1. What this dataset likely represents
2. Key patterns or trends you notice
3. Any data quality concerns
4. One actionable recommendation

Write in plain English, no bullet points, no markdown. Sound like an expert analyst speaking directly to the user."""

    return prompt


@app.get("/")
def root():
    return {"message": "DataFlow AI backend is running", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy", "version": "0.1.0"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    summary = build_summary(df)
    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "preview": df.head(5).fillna("").to_dict(orient="records"),
        "summary": summary
    }

@app.post("/clean")
async def clean_file(file: UploadFile = File(...)):
    contents = await file.read()
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    cleaned_df, report, original_shape, final_shape = clean_dataframe(df)
    summary = build_summary(cleaned_df)

    output = io.BytesIO()
    cleaned_df.to_csv(output, index=False)
    csv_bytes = output.getvalue()

    return {
        "filename": file.filename,
        "original_rows": original_shape[0],
        "original_columns": original_shape[1],
        "cleaned_rows": final_shape[0],
        "cleaned_columns": final_shape[1],
        "report": report,
        "summary": summary,
        "preview": cleaned_df.head(5).fillna("").to_dict(orient="records"),
        "columns": list(cleaned_df.columns),
        "csv": csv_bytes.decode("utf-8")
    }

@app.post("/detect")
async def detect_issues(file: UploadFile = File(...)):
    contents = await file.read()
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    findings = smart_detect(df)

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "total_findings": len(findings),
        "findings": findings
    }

@app.post("/insights")
async def ai_insights(file: UploadFile = File(...)):
    contents = await file.read()
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    try:
        prompt = build_ai_prompt(df, file.filename)
        response = gemini_model.generate_content(prompt)
        insight_text = response.text.strip()
    except Exception as e:
        insight_text = f"AI insights unavailable: {str(e)}"

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "insight": insight_text
    }