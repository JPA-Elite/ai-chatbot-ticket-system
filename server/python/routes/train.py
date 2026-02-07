from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "training_data.jsonl"
MODEL_PATH = BASE_DIR / "text_classifier_model.pkl"
VECTORIZER_PATH = BASE_DIR / "vectorizer.pkl"


class TrainingItem(BaseModel):
    user_inquiry: str
    ai_response: str
    is_escalated: bool = False
    chat_id: Optional[str] = None
    user_id: Optional[str] = None
    created_at: Optional[str] = None


class PredictionItem(BaseModel):
    user_inquiry: str


def load_training_data():
    if not DATA_PATH.exists():
        return []

    records = []
    with DATA_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return records


def train_model(records):
    if len(records) < 2:
        return False, "Not enough training data"

    texts = [item.get("user_inquiry", "") for item in records]
    labels = [1 if item.get("is_escalated") else 0 for item in records]

    if len(set(labels)) < 2:
        return False, "Only one class present"

    vectorizer = TfidfVectorizer(stop_words="english")
    features = vectorizer.fit_transform(texts)

    model = LogisticRegression(max_iter=1000)
    model.fit(features, labels)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    return True, "Model trained"


@router.post("/ingest")
def ingest_training_data(payload: TrainingItem):
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATA_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload.dict()) + "\n")

    records = load_training_data()
    trained, message = train_model(records)

    print(f"Training status: {trained}, message: {message}")
    return {
        "status": "success",
        "trained": trained,
        "message": message,
        "samples": len(records)
    }


@router.post("/predict")
def predict_training_data(payload: PredictionItem):
    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        return {
            "status": "error",
            "message": "Model not trained"
        }

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)

    features = vectorizer.transform([payload.user_inquiry])
    prediction = int(model.predict(features)[0])
    confidence = float(model.predict_proba(features)[0][1])

    return {
        "status": "success",
        "prediction": {
            "is_escalated": bool(prediction),
            "confidence": round(confidence, 4)
        }
    }
