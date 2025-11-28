# Sentinel AI

**A full-stack web app that detects the sentiment of your text.**

I built this project to demonstrate a **Microservices Architecture**. Instead of a standard monolithic app, I separated the system into three distinct parts: a modern frontend, an API gateway, and a dedicated AI engine.

## How to Run It Locally

1. Start the Python AI Service
```bash
cd ml-service
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
uvicorn main:app --reload --port 8000
2. Start the Node Backend
Bash

cd server
npm install
node server.js
3. Start the React Frontend
Bash

cd client
npm install
npm run dev
