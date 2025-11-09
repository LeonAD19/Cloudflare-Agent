# Cloudflare AI Chat Agent (LLaMA 3.3 + Durable Objects)

This project is an AI-powered chat application built on **Cloudflare Workers**, **Workers AI**, **Durable Objects**, and **Vite**.  
It uses **LLaMA 3.3** as the model provider (via `env.AI` binding) and maintains **persistent chat memory** through a Durable Object.

### 🚀 Live Demo
https://agents-starter.leonaltamirano00.workers.dev

### 📦 GitHub Repo
https://github.com/LeonAD19/Cloudflare-Agent

---

## 🔥 Features

| Feature | Description |
|--------|-------------|
| **LLaMA 3.3 model** | Uses Cloudflare Workers AI (no OpenAI key required). |
| **Real chat UI** | Browser-based interface built with React + Vite. |
| **Durable Object Memory** | Conversations persist across refresh & sessions. |
| **Streaming Responses** | Assistant messages stream in real-time. |
| **Optional Tools API** | Framework supports adding custom tool calls. |
| **Dark / Light Theme Toggle** | UI theme stored in localStorage. |

---

## 🧠 Stack Overview

| Component | Technology |
|----------|------------|
| Frontend UI | React + Vite |
| Backend Runtime | Cloudflare Worker |
| LLM | Workers AI (`@cloudflare/ai`) running **LLaMA 3.3** |
| State / Memory | **Durable Objects** |
| Optional Routing / API | Wrangler |

---

## 🛠️ Local Development

Install dependencies:

```sh
cd agents-starter
npm install
npm run dev         # Starts local UI
npx wrangler dev    # Runs Workers backend (with remote AI enabled)
