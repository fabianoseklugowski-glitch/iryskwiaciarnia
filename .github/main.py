from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="AI Chatbot SaaS Generator")

# Dodajemy obsługę CORS, żeby plik HTML w przeglądarce mógł bez problemu pytać serwer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class WebsiteRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    company_context: str
    question: str

# Endpoint serwujący plik widget.js dla klientów (jedna linijka kodu do wklejenia)
@app.get("/widget.js")
async def serve_widget():
    return FileResponse("widget.js", media_type="application/javascript")

@app.post("/analyze-website")
async def analyze_website(data: WebsiteRequest):
    url = data.url
    if not url.startswith("http"):
        url = "https://" + url
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client_http:
            response = await client_http.get(url, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(response.text, "html.parser")
            for s in soup(["script", "style", "nav", "footer"]):
                s.decompose()
            text = " ".join(soup.get_text(separator=" ", strip=True).split())[:15000]
            return {"status": "success", "company_context": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_bot(data: ChatRequest):
    try:
        prompt = f"Jesteś chatbotem firmy. Odpowiadaj tylko na podstawie bazy wiedzy:\n{data.company_context}"
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": data.question}],
            temperature=0.3
        )
        return {"reply": res.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))