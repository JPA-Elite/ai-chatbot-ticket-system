import joblib

# Load the saved model and vectorizer
model = joblib.load("text_classifier_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# New texts to classify
new_texts = [
    "1 + 1 equals 3",
    'may i know the salary of teachers in the school',
    'magkano ang sahod ng guro dito sa school?'
]

# Vectorize the new texts
X_new_vec = vectorizer.transform(new_texts)

# Predict labels
y_pred = model.predict(X_new_vec)
y_prob = model.predict_proba(X_new_vec)[:, 1]

for text, pred, prob in zip(new_texts, y_pred, y_prob):
    print(f"Text: {text}")
    print(f"Predicted: {pred}, Confidence: {prob*100:.2f}%\n")
