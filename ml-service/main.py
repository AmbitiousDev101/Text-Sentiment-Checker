# ml-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from textblob import TextBlob

app = FastAPI()

class TextRequest(BaseModel):
    text: str

@app.post("/predict")
def predict_sentiment(request: TextRequest):
    # Perform sentiment analysis using TextBlob
    blob = TextBlob(request.text)
    polarity = blob.sentiment.polarity
    
    sentiment = "Neutral"
    if polarity > 0:
        sentiment = "Positive"
    elif polarity < 0:
        sentiment = "Negative"
        
    return {
        "text": request.text,
        "sentiment": sentiment,
        "polarity": polarity
    }

# To run: uvicorn main:app --reload --port 8000