from fastapi import FastAPI
from routes.metrics import router as metrics_router  # import your router

app = FastAPI(title="Text Relevance Metrics API")
app.openapi_schema = None

# Include the routes
app.include_router(metrics_router, prefix="/metrics")

# Print all routes for debugging
for route in app.routes:
    print(f"Path: {route.path}  |  Name: {route.name}  |  Methods: {route.methods}")
