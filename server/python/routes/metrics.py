from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import traceback

router = APIRouter()

class DataItem(BaseModel):
    similarity_score: float
    is_relevant: int

# -----------------------------
# Core computation function
# -----------------------------
def compute_metrics(data: List[dict]):
    try:
        if not data or len(data) < 2:
            return {
                "status": "error",
                "message": "Insufficient data to compute metrics"
            }

        df = pd.DataFrame(data)

        if "similarity_score" not in df or "is_relevant" not in df:
            return {
                "status": "error",
                "message": "Invalid payload structure"
            }

        # Ensure is_relevant is integer (0 or 1)
        df["is_relevant"] = df["is_relevant"].astype(int)

        if df["is_relevant"].nunique() < 2:
            return {
                "status": "error",
                "message": "Only one class detected. Cannot compute metrics."
            }

        X = df[["similarity_score"]]
        y = df["is_relevant"]

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y if y.value_counts().min() >= 2 else None
        )

        model = LogisticRegression()
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        return {
            "status": "success",
            "metrics": {
                "accuracy": round(accuracy_score(y_test, y_pred) * 100, 2),
                "precision": round(precision_score(y_test, y_pred, zero_division=0) * 100, 2),
                "recall": round(recall_score(y_test, y_pred, zero_division=0) * 100, 2),
                "f1_score": round(f1_score(y_test, y_pred, zero_division=0) * 100, 2),
                "mean_confidence": round(float(np.mean(y_prob)) * 100, 2),
                "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "metrics": {},
            "message": "Cannot compute metrics",
            "details": str(e),
            "trace": traceback.format_exc()
        }

# -----------------------------
# API endpoint
# -----------------------------
@router.post("/compute-metrics")
def compute_metrics_api(payload: List[DataItem]):
    data = [item.dict() for item in payload]
    return compute_metrics(data)

@router.post("/compute-metrics2")
def compute_metrics_api2(payload: List[DataItem]):
    # placeholder logic
    return {"status": "success", "received": [item.dict() for item in payload]}
