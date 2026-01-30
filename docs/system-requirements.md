# System Requirements

## Minimum (CPU-only)

- **CPU**: 4 cores (x86_64 or ARM64)
- **RAM**: 8 GB
- **Storage**: 10 GB for models and dependencies
- **OS**: Linux, macOS, or Windows with WSL2

## Recommended

- **CPU**: 8+ cores
- **RAM**: 16 GB
- **GPU**: NVIDIA with 4+ GB VRAM (optional, improves speed)
- **Storage**: 20 GB SSD

## Model Sizes

**Whisper (STT):**
- tiny: ~75 MB
- small: ~500 MB
- medium: ~1.5 GB
- large-v3: ~3 GB

**Piper (TTS):**
- de_DE-thorsten-high: ~65 MB

**Ollama (Translation):**
- ministral 3b: ~2 GB

## GPU Support

GPU acceleration is automatic when CUDA is available. Set `DEVICE=cuda` or leave as `auto` for automatic detection. On GPU, `float16` compute type is used; on CPU, `int8` quantization keeps things fast.

## Network

All models run locally after initial download. No internet connection required during operation.
- Whisper model downloads on first use
- Piper voice downloads on first use
- Ollama model must be pulled once via `ollama pull`
