# Stage 1: Frontend build
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY kindle-ui/ ./kindle-ui/
WORKDIR /app/kindle-ui
RUN npm install
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + serve
FROM python:3.11-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./static/

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* && \
    mkdir -p /app/piper-voices && \
    curl -L -o /app/piper-voices/de_DE-thorsten-high.onnx \
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx" && \
    curl -L -o /app/piper-voices/de_DE-thorsten-high.onnx.json \
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx.json"

RUN useradd -r -m -s /bin/false appuser && \
    mkdir -p /app/models && \
    chown -R appuser:appuser /app/models /app/piper-voices
USER appuser

ENV HF_HOME=/app/models/huggingface

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/config')"

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
