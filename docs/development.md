# Development

## Prerequisites

- Python 3.12+
- Node.js 20+
- Ollama running locally (`ollama serve`)

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start development server
uvicorn backend.main:app --reload
```

The API runs at http://localhost:8000. Swagger UI at http://localhost:8000/docs.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at http://localhost:5173 with proxy to backend.

## Ollama Setup

```bash
# Install Ollama (if not installed)
curl -fsSL https://ollama.com/install.sh | sh

# Pull translation model
ollama pull ministral:3b

# Verify
ollama list
```

## Project Structure

```
dolmtschr/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py             # Pydantic settings
│   ├── models.py             # Request/response models
│   ├── dependencies.py       # Provider singletons
│   ├── providers/
│   │   ├── base.py           # Abstract interfaces
│   │   ├── stt/              # Speech-to-text providers
│   │   ├── tts/              # Text-to-speech providers
│   │   └── translate/        # Translation providers
│   └── routers/              # API endpoints
├── frontend/
│   ├── src/
│   │   ├── api/              # Backend API client
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── pages/            # Page components
│   └── public/               # PWA manifest, service worker
├── Dockerfile
├── docker-compose.yml
└── docs/
```
