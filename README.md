# Enterprise RAG Agent API (Headless Engine)

## Architecture Overview
This is a high-performance, asynchronous, and streaming AI backend built to process massive documents and serve an intelligent, context-aware LangGraph agent. It utilizes a decoupled worker architecture to prevent event-loop blocking during heavy ETL (Extract, Transform, Load) operations and leverages a custom Reciprocal Rank Fusion (Hybrid Search) algorithm for precise data retrieval.

## Core Technology Stack
* **Runtime & Framework:** Node.js, Express, TypeScript
* **Database & Vector Store:** Neon (Serverless PostgreSQL) with `pgvector`
* **Queue & Background Workers:** BullMQ, Redis (Docker)
* **AI & Orchestration:** LangGraph, LangChain, Llama 3.1 (via Groq API)
* **Embeddings:** `@xenova/transformers` (Local `all-MiniLM-L6-v2`)
* **Security:** JWT Authentication, Token Bucket Rate Limiting

## System Modules

### 1. The ETL Ingestion Pipeline (Asynchronous)
* **Upload Receiver:** Multer captures `multipart/form-data`, saves to OS temporary disk, and instantly returns HTTP 202.
* **Background Queue:** BullMQ tracks the job state and passes the file path to the worker.
* **Batch Processing:** The worker reads the PDF (`pdf-parse`), chunks it via `RecursiveCharacterTextSplitter` (1000 size / 200 overlap), extracts metadata (Author, Pages), and generates vector embeddings.
* **CPU Protection:** Embeddings are generated in batches of 10, utilizing `Promise.all` with a 100ms event-loop yield to prevent server freezing.

### 2. The Semantic Brain (Hybrid Search)
* **Dual Storage:** Text is stored as both dense vectors (`vector(384)`) and lexical tokens (`tsvector`).
* **RRF Algorithm:** Uses a custom PostgreSQL function (`match_documents_hybrid`) to execute Reciprocal Rank Fusion, merging keyword exact-matches with mathematical concept-matches.

### 3. The Agentic Chat Router
* **Semantic Caching:** Every incoming query is vectorized and checked against the `semantic_cache` table using cosine distance (`<=> < 0.05`). If a match is found, the LLM is bypassed entirely to save compute and latency.
* **LangGraph Agent:** A stateful agent initialized with `HumanMessage`. It runs safety guardrails before processing.
* **SSE Streaming:** Responses are streamed back to the client character-by-character using Server-Sent Events (`text/event-stream`).

## API Endpoints

### Authentication
* **POST** `/auth/register` - Creates user.
* **POST** `/auth/login` - Returns JWT token.

### Document Management
* **POST** `/api/upload/pdf`
  * **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
  * **Body:** `document` (File)
  * **Response:** `202 Accepted` | Returns `jobId`.
* **GET** `/api/upload/status/:jobId`
  * **Headers:** `Authorization: Bearer <token>`
  * **Response:** `200 OK` | Returns `{ jobId, state, progress, error }`.

### Chat & Inference
* **POST** `/chat`
  * **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
  * **Body:** `{ "message": "string" }`
  * **Response:** `text/event-stream` (Server-Sent Events streaming the AI response).