import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import joblib
import numpy as np
import nltk
from typing import List

from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env




# Groq API
from groq import Groq
# from groq import ChatCompletionMessage

nltk.download("punkt")
from nltk.tokenize import sent_tokenize

# Load your emotion model & tokenizer
# Load emotion model & tokenizer
model = load_model("emotion_model.h5")
tokenizer = joblib.load("tokenizer.pkl")

# Groq client setup
# GROQ_API_KEY = "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"
# if not GROQ_API_KEY:
#     raise ValueError("Please set GROQ_API_KEY in environment variables")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("Please set GROQ_API_KEY in environment variables")

groq_client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title="Emotion + RAG w/ Groq API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EventInput(BaseModel):
    event_details: str
    user_input: str

def predict_sentence_emotion(sentence: str) -> str:
    seq = tokenizer.texts_to_sequences([sentence])
    pad = pad_sequences(seq, maxlen=20, padding="post")
    pred = model.predict(pad)
    emotions = ["joy", "joy", "love", "anger", "fear", "surprise"]
    return emotions[np.argmax(pred)]

@app.post("/rag-groq")
def rag_with_groq(input: EventInput):
    try:
        chat_completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",  # you can also try "llama3-8b-8192"
            messages=[
                {"role": "system", "content": "You are an assistant that answers using event details and user input."},
                {"role": "user", "content": f"Event Details: {input.event_details}\nUser: {input.user_input}"}
            ],
            temperature=0.7,
            max_tokens=200,
        )

        generated_text = chat_completion.choices[0].message.content

        sentences = sent_tokenize(generated_text)
        emotions = [predict_sentence_emotion(s) for s in sentences]

        return {
            "generated_text": generated_text,
            "sentences": sentences,
            "emotions": emotions,
        }

    except Exception as e:
        return {"error": str(e)}
