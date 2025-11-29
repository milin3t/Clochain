# source venv/bin/activate

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Clothes Auth Backend is running"}

@app.get("/ping")
def ping():
    return {"pong": True}
