# Typespace

A modern, real-time collaborative rich-text editor built with Next.js, Express, and Yjs. Typespace allows multiple users to concurrently edit documents, see live cursor movements, manage permissions, and organize files in a sleek, Notion-style interface.

## Features
- **Real-Time Collaboration**: Instant synchronization and live cursors powered by WebSockets and Yjs.
- **Rich Text Editing**: Built on top of TipTap, supporting advanced text formatting, blockquotes, code blocks, and dynamic layouts.
- **Pageless Canvas**: A clean, infinitely scrolling document layout free of arbitrary page breaks.
- **Access Control**: Granular sharing permissions (Owner, Editor, Viewer) and public link sharing capabilities.
- **Templates**: Jumpstart your work with pre-built templates for Meeting Notes, Project Proposals, Resumes, and more.
- **Dark Mode**: Fully responsive, polished UI with flawless light and dark modes.

## Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS, TipTap, Yjs
- **Backend**: Node.js, Express, Socket.io, Prisma, PostgreSQL
- **Realtime**: Y-Websocket, Yjs (CRDT)

## Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. Configure your `.env` variables.
4. Run migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Configure your `.env.local` to point to your backend API.
4. Start the dev server: `npm run dev`
5. Open `http://localhost:3000` in your browser.

## License
MIT License
