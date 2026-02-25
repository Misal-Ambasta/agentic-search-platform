# Agent Search Platform

An autonomous AI search agent that can navigate the web and your private Google Drive documents to answer complex queries with citations.

Built for the **Autonomous AI Agent Assignment**.

## Key Features

- **Autonomous Agent Loop**: Custom-built reasoning loop (Think -> Act -> Observe) without black-box frameworks.
- **Dynamic Planning**: The agent breaks down complex tasks into manageable steps.
- **Multimodal Tooling**:
    - **Web Search**: Powered by Tavily API.
    - **Web Scraper**: Extracts text from any URL.
    - **Vector Search**: Semantic search over your private documents.
    - **Drive Retrieval**: Deep access to Google Drive content.
- **Google Drive Integration**: OAuth 2.0 flow with automated ingestion and incremental indexing.
- **Polished UI**: Modern, dark-mode-first React interface built with Vite, Tailwind CSS, and Shadcn UI.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Framer Motion, Lucide React.
- **Backend**: Node.js, TypeScript, Express.
- **Database**: SQLite (Session/Token storage), ChromaDB (Vector store).
- **AI**: OpenAI (GPT-4o, Text Embeddings).

## Getting Started

### Prerequisites

1.  **Node.js** (v18 or higher).
2.  **ChromaDB**: Running locally (`docker pull chromadb/chroma` and `docker run -p 8000:8000 chromadb/chroma`).

### Installation

1.  Clone the repository.
2.  Install dependencies for both folders:
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the `backend` folder:
    ```env
    PORT=3000
    OPENAI_API_KEY=your_openai_key
    TAVILY_API_KEY=your_tavily_key
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
    CHROMA_URL=http://localhost:8000
    ```

### Running the Project

1.  **Start Backend**:
    ```bash
    cd backend
    npm run dev
    ```

2.  **Start Frontend**:
    ```bash
    cd frontend
    npm run dev -- --port 3001
    ```

## Usage

1.  Open `http://localhost:3001`.
2.  Click **Connect Google Drive** and authorize.
3.  Select a folder to start indexing (Ingestion).
4.  Once indexed, ask the agent any question in the search bar.
5.  Watch the agent plan and execute steps in real-time.