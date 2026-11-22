Verbatim // Editorial Lab

Sentence-Level AI Risk Scanner & Qwen2.5-3B LoRA Text Humanizer

Verbatim Editorial Lab is a high-precision, split-manuscript web application designed to detect synthetic patterns in AI-generated text and rewrite flagged sentences into natural, organic human prose. Powered by a fine-tuned Qwen2.5-3B model using Unsloth LoRA optimization and served via FastAPI, it provides sentence-by-sentence analysis, tone adjustment, and interactive click-to-regenerate controls.

Key Features

Sentence-Level AI Probability Scanning: Pinpoints synthetic transition words, rigid structural patterns, and cliché phrases with granular confidence scores.

Fine-Tuned Qwen2.5-3B LoRA Engine: Leverages a lightweight, highly effective LoRA adapter (~29.9M trainable parameters) fine-tuned specifically for natural tone conditioning and factual preservation.

Adaptive Tone Controls: Supports multiple tone targets—General, Academic, Casual, and Professional—along with temperature controls for creative variance.

Interactive Manuscript Inspector: Click any highlighted line to view raw risk metrics, system notes, or trigger target line rewrites on demand.

Responsive Split View: Features an editorial newsprint layout with auto-stacking columns and single-pane focus toggles (Split, Source, Revision) for mobile devices.

Automatic Fallback Engine: Runs local heuristic scoring and pattern rewrites if the backend GPU tunnel is offline.

System Architecture

┌─────────────────────────┐        ngrok Tunnel         ┌─────────────────────────────┐
│  React (Vite) Frontend  │ ──────────────────────────> │ FastAPI Backend (Colab GPU) │
│  - Tailwind CSS         │                             │ - Unsloth / PyTorch         │
│  - Lucide React Icons   │ <────────────────────────── │ - Qwen2.5-3B + LoRA Adapter │
└─────────────────────────┘      JSON API Payload       └─────────────────────────────┘


Quick Start Guide

1. Backend Setup (Google Colab T4 GPU)

Open a GPU runtime on Google Colab.

Run your training/inference script or load your saved LoRA checkpoint (checkpoint-987 or Google Drive adapter directory).

Ensure your NGROK_AUTH_TOKEN is configured in Colab's Secrets panel.

Execute the FastAPI + ngrok server script:

pip install fastapi "uvicorn[standard]" pyngrok nest-asyncio pydantic unsloth


Copy the generated public URL (e.g., https://your-domain.ngrok-free.app).

2. Frontend Setup (React + Vite)

Clone this repository:

git clone https://github.com/your-username/verbatim-editorial-lab.git
cd verbatim-editorial-lab


Install dependencies:

npm install


Configure environment variables in a .env file at the project root:

VITE_API_URL=https://your-domain.ngrok-free.app


Start the development server:

npm run dev


Open http://localhost:5173 in your browser.

API Reference

POST /api/analyze

Scans raw text and returns sentence-level AI likelihood scores.

Request Body:

{
  "text": "Furthermore, it is crucial to underscore the multifaceted nature of AI."
}


Response:

[
  {
    "id": 0,
    "text": "Furthermore, it is crucial to underscore the multifaceted nature of AI.",
    "ai_score": 0.88,
    "is_ai": true
  }
]


POST /api/humanize

Rewrites target text using the fine-tuned Qwen2.5 LoRA adapter.

Request Body:

{
  "text": "Furthermore, it is crucial to underscore the multifaceted nature of AI.",
  "tone": "General",
  "temperature": 0.75
}


Response:

{
  "original_text": "Furthermore, it is crucial to underscore the multifaceted nature of AI.",
  "humanized_text": "There are many key sides to artificial intelligence.",
  "tone": "General"
}


Model Training Summary

Base Model: Qwen/Qwen2.5-3B

Fine-Tuning Framework: Unsloth (4-bit quantization, double buffering enabled)

Trainable Parameters: 29,933,568 / 3,115,872,256 (0.96%)

Dataset Size: 2,629 samples | Epochs: 3 | Total Steps: 987

Final Training Loss: 1.1597 (Step 970) / 1.2130 (Step 985)

Tech Stack

Frontend: React 18, Vite, Tailwind CSS, Lucide React

Backend: FastAPI, Uvicorn, Pydantic, Pyngrok

Machine Learning: PyTorch, Hugging Face Transformers, Unsloth, PEFT (LoRA)

License

Distributed under the MIT License. See LICENSE for details.