# Building a Custom-Trained Islamic AI Model — A Realistic Path

This documents what it would actually take to replace (or supplement) the
current Claude API + offline knowledge base with a model *fine-tuned
specifically* on Islamic knowledge. It's written so you can execute it
outside of this coding session, since it requires paid cloud services and
GPU time that can't be run from here.

## Reality check first

**Claude cannot be fine-tuned by the public.** Anthropic does not offer a
self-serve fine-tuning API for Claude models (unlike OpenAI, which does).
So "training Claude on Islamic knowledge" isn't an available option at all,
regardless of budget. To get an actually-trained custom model, you fine-tune
an **open-weight model** instead — e.g. Llama 3.1, Mistral, or Qwen — and
either host it yourself or through a managed service.

## Two realistic paths

### Path A — Managed fine-tuning service (recommended to start)
Services like **Together.ai**, **Fireworks AI**, or **Predibase** let you
upload a training dataset (JSONL) and handle the GPU work for you. You get
back a hosted API endpoint you call just like the Claude API.

- Pros: no GPU management, no ML infrastructure knowledge needed, fast to try
- Cons: ongoing hosting cost per request, less control over training details
- Rough cost: a small LoRA fine-tune of a 7-8B model is often **$5-50** in
  compute for the training run itself; hosting after that is billed per
  token/request (comparable to or cheaper than Claude, depending on model size)

### Path B — Self-hosted fine-tuning
Rent a GPU (RunPod, Vast.ai, Lambda Labs — often **$1-2/hr** for an A100),
use a tool like **Axolotl** or **Unsloth** to run a LoRA/QLoRA fine-tune of
an open model, then serve it yourself with **vLLM** or **Ollama**.

- Pros: full control, cheaper at scale, no vendor lock-in
- Cons: requires ML engineering knowledge, you manage the server/uptime

## Data requirements

Domain fine-tuning (teaching a model to answer Islamic questions in a
particular style/scope) typically needs:
- **Minimum to see any effect:** ~200-1,000 high-quality instruction pairs
  (`{"prompt": "...", "response": "..."}`)
- **For robust, reliable behavior:** several thousand+ pairs, ideally
  covering edge cases and varied phrasings of the same question

**This app's `src/ai/islamicKnowledge.js`** (57 entries) is a good seed but
far too small on its own — it would need to be expanded significantly, and
each entry reformatted from the current `{keywords, topic, answer,
references}` shape into instruction-tuning format, e.g.:

```json
{"prompt": "What is Zakat?", "response": "Zakat is the third pillar of Islam..."}
```

**Important caution:** this is a religious knowledge domain. Bad or
unreviewed training data can produce a model that states incorrect fiqh
rulings *confidently*. Any dataset built for this should ideally be reviewed
by a qualified scholar before training, and the resulting model's answers
spot-checked against scholarly sources before being shown to real users.

## Step-by-step

1. **Pick a base model** — Llama 3.1 8B Instruct or Mistral 7B Instruct are
   common, capable starting points for a focused knowledge assistant.
2. **Build the dataset** — expand and reformat Islamic Q&A content into
   instruction pairs (start from `islamicKnowledge.js`, add much more,
   ideally scholar-reviewed).
3. **Choose LoRA/QLoRA** as the fine-tuning method — standard for domain
   adaptation; cheaper and faster than full fine-tuning, and what almost
   every managed service defaults to.
4. **Run the fine-tune** via a managed service (Path A) or rented GPU +
   Axolotl/Unsloth (Path B).
5. **Evaluate** the result against held-out test questions before trusting
   it — check for hallucinated rulings or citations especially.
6. **Deploy an inference endpoint** (managed service gives you one
   automatically; self-hosted needs vLLM/Ollama running on a server you
   control).
7. **Wire it into this app** — add a new client file alongside
   `src/ai/claudeClient.js` (e.g. `src/ai/customModelClient.js`) that calls
   your new endpoint, and either replace or chain it with Claude inside
   `src/ai/assistant.js`'s `getAIAnswer()` — the existing RAG retrieval step
   (`searchKnowledgeBase`) would still be useful as grounding context for
   your custom model too.

## Where this app already helps

- `src/ai/islamicKnowledge.js` is your dataset seed.
- `src/ai/assistant.js`'s `getAIAnswer()` already has the shape (retrieve →
  call a model → fall back to offline) that a custom model would slot into
  with minimal changes — you'd add a third branch trying your custom
  endpoint before or after Claude.
