# Ticketing System API

## Create and Activate Virtual Environment

python -m venv venv
venv/Scripts/activate # for cmd

## Install Dependencies

python -m pip install -r requirements.txt

## Run the FastAPI Server

python -m uvicorn routes.metrics:app --reload --port 8000

## Check API DOCS

access the docs in: <http://127.0.0.1:8000/docs>