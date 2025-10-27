# HEALIGRAM — Heart prediction service

This repository contains a small Flask API that loads a pre-trained model (`logistic_model.pkl`) and exposes a `/predict` POST endpoint.

## Quick install

1. Create a virtual environment and install dependencies (unix/mac):

```bash
# create venv and install deps
./install_deps.sh myenv
# activate
source myenv/bin/activate
```

Or manually:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run the API

```bash
python app.py
```

The server runs in debug mode by default (see `app.py`).

## Test the `/predict` endpoint

Example curl (adjust feature names/values to your model's `features`):

```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"age":63, "sex":1, "cp":3, "trestbps":145, "chol":233, "fbs":1, "restecg":0, "thalach":150, "exang":0, "oldpeak":2.3, "slope":0, "ca":0, "thal":1}'
```

The response will be JSON with `prediction` (0/1) and `confidence` (percentage).

## Notes

- `requirements.txt` includes the runtime libs needed to run `app.py` (Flask, flask-cors, pandas, numpy, scikit-learn).
- If you prefer system-wide install (not recommended), run `pip install -r requirements.txt` in your environment.
