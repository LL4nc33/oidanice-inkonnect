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
FROM python:3.12-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg openssl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/certs && \
    openssl req -x509 -newkey rsa:2048 -keyout /app/certs/key.pem \
    -out /app/certs/cert.pem -days 365 -nodes \
    -subj "/CN=inkonnect/O=OidaNice"

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./static/

RUN useradd -r -s /bin/false appuser && \
    chmod 644 /app/certs/key.pem /app/certs/cert.pem
USER appuser

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,ssl; urllib.request.urlopen('https://localhost:8000/api/config',context=ssl._create_unverified_context())"

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--ssl-keyfile", "/app/certs/key.pem", "--ssl-certfile", "/app/certs/cert.pem"]
