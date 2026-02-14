# v0.5 Code Review Fixes

## Status: Ready for Claude Code

Quick fixes from the code review of Claude Code's v0.5 Chat History implementation. All are small, surgical changes.

## Fix 1: docker-compose.yml — Wrong Default Model

**Problem:** `OLLAMA_MODEL` defaults to `ministral-3:3b`, but `config.py` and our benchmark results say `gemma3:4b` is the production default (9/10 accuracy vs 8/10). The env var overrides the config.

**File:** `docker-compose.yml`

**Change:**
```yaml
# Before
- OLLAMA_MODEL=${OLLAMA_MODEL:-ministral-3:3b}

# After
- OLLAMA_MODEL=${OLLAMA_MODEL:-gemma3:4b}
```

**Risk:** None — ministral was only a fallback candidate.

---

## Fix 2: architecture.md — Unclosed Code Block

**Problem:** The ASCII architecture diagram's closing ` ``` ` is missing, causing the Benchmark Table and subsequent markdown to render inside the code block.

**File:** `docs/architecture.md`

**Change:** Find the end of the ASCII diagram (after the ElevenLabs box) and ensure the closing ` ``` ` is on its own line before the `### Translation Model Benchmark Results` heading.

**Risk:** None — documentation only.

---

## Fix 3: Embedding Provider Singleton (Optional / v0.5.1)

**Problem:** `_generate_embedding()` in `pipeline.py` creates a new `OllamaEmbeddingProvider` for every message. For v0.5 this is fine (low traffic, httpx is cheap), but for production it should be a singleton in `dependencies.py` like the other providers.

**File:** `backend/dependencies.py` + `backend/routers/pipeline.py`

**Change:**
1. Add `_embedding_provider` singleton in `dependencies.py`:
   ```python
   _embedding: EmbeddingProvider | None = None

   def get_embedding() -> EmbeddingProvider:
       global _embedding
       if _embedding is None:
           s = get_settings()
           _embedding = OllamaEmbeddingProvider(
               base_url=s.embedding_url, model=s.embedding_model
           )
       return _embedding
   ```
2. In `pipeline.py` `_generate_embedding()`: replace ad-hoc creation with `get_embedding()` call.

**Risk:** Low — follows existing singleton pattern.

---

## Claude Code Prompt

```
Fix 3 issues from code review. Read docs/plans/V05-CODE-REVIEW-FIXES.md for details:

1. docker-compose.yml: Change OLLAMA_MODEL default from ministral-3:3b to gemma3:4b
2. docs/architecture.md: Fix unclosed code block before the Benchmark Table
3. backend/dependencies.py + backend/routers/pipeline.py: Make EmbeddingProvider a singleton (follow existing pattern from get_stt/get_tts/get_translate)

All are small surgical fixes. Do NOT refactor anything else.
```
