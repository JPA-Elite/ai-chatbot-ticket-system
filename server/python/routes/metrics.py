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
def compute_metrics(data: List[dict], threshold: float = 0.5):
    """
    Computes metrics for similarity_score vs is_relevant.
    If only one class exists in y, it will NOT error:
      - returns baseline metrics
      - uses a simple threshold rule for y_pred
      - skips logistic regression training (since it requires 2 classes)
    """
    try:
        if not data or len(data) < 2:
            return {
                "status": "success",
                "metrics": {},
                "warning": "Insufficient data to compute train/test metrics. Provide at least 2 rows."
            }

        df = pd.DataFrame(data)

        if "similarity_score" not in df.columns or "is_relevant" not in df.columns:
            return {
                "status": "error",
                "message": "Invalid payload structure"
            }

        # Ensure proper types
        df["similarity_score"] = pd.to_numeric(df["similarity_score"], errors="coerce")
        df["is_relevant"] = pd.to_numeric(df["is_relevant"], errors="coerce").fillna(0).astype(int)

        # Drop rows with invalid similarity_score
        df = df.dropna(subset=["similarity_score"]).copy()

        if len(df) < 2:
            return {
                "status": "success",
                "metrics": {},
                "warning": "Not enough valid similarity_score rows after cleaning."
            }

        X = df[["similarity_score"]]
        y = df["is_relevant"]

        unique_classes = sorted(y.unique().tolist())

        # -----------------------------
        # ✅ Single-class fallback (no error)
        # -----------------------------
        if len(unique_classes) < 2:
            only_class = int(unique_classes[0])

            # Simple heuristic predictions using threshold
            y_pred = (df["similarity_score"] >= threshold).astype(int)

            # If true labels are all 0 or all 1, use the same y as y_true
            y_true = y

            # Confusion matrix with fixed labels to keep keys stable
            cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
            tn, fp, fn, tp = cm.ravel()

            # "Confidence" here is just similarity_score scaled to [0..100]
            mean_confidence = float(df["similarity_score"].mean()) * 100.0

            return {
                "status": "success",
                "warning": f"Only one class detected in ground truth (class={only_class}). "f"Skipped LogisticRegression. Used threshold={threshold} for predictions.",
                "metrics": {
                    "accuracy": round(accuracy_score(y_true, y_pred) * 100, 2),
                    "precision": round(precision_score(y_true, y_pred, zero_division=0) * 100, 2),
                    "recall": round(recall_score(y_true, y_pred, zero_division=0) * 100, 2),
                    "f1_score": round(f1_score(y_true, y_pred, zero_division=0) * 100, 2),
                    "mean_confidence": round(mean_confidence, 2),
                    "confusion_matrix": {
                        "tn": int(tn),
                        "fp": int(fp),
                        "fn": int(fn),
                        "tp": int(tp)
                    },
                    "classes_present": unique_classes,
                    "mode": "single_class_fallback"
                }
            }

        # -----------------------------
        # ✅ Normal path (2 classes)
        # -----------------------------
        stratify_arg = y if y.value_counts().min() >= 2 else None

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=stratify_arg
        )

        model = LogisticRegression()
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()

        return {
            "status": "success",
            "metrics": {
                "accuracy": round(accuracy_score(y_test, y_pred) * 100, 2),
                "precision": round(precision_score(y_test, y_pred, zero_division=0) * 100, 2),
                "recall": round(recall_score(y_test, y_pred, zero_division=0) * 100, 2),
                "f1_score": round(f1_score(y_test, y_pred, zero_division=0) * 100, 2),
                "mean_confidence": round(float(np.mean(y_prob)) * 100, 2),
                "confusion_matrix": {
                    "tn": int(tn),
                    "fp": int(fp),
                    "fn": int(fn),
                    "tp": int(tp)
                },
                "classes_present": unique_classes,
                "mode": "logistic_regression"
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
