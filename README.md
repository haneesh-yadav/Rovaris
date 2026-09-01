# ROVARIS — Mission Control Event Game

ROVARIS is a live, in-person team event software designed for a "Mission Control" experience. It requires zero cloud dependencies and runs entirely on a local venue network (LAN).

## Prerequisites
- Node.js (v16 or higher recommended)
- A dedicated host laptop/computer connected to the venue's Wi-Fi router.

## Setup Instructions

1. Clone or copy this repository to the host computer.
2. Open a terminal in the root directory.
3. Install all dependencies for both the server and the client:
   \`\`\`bash
   npm run install:all
   \`\`\`

## Running the Event

1. Start the server and client concurrently:
   \`\`\`bash
   npm run dev
   \`\`\`
2. This will start:
   - The Express/Socket.io backend on port `3001`.
   - The Vite/React frontend on port `5173`.
   - An SQLite database (`database.sqlite`) will automatically be created in the `server` directory to track states.

## LAN Deployment (Connecting Participants)

For teams to play, they must connect to the host computer's local IP address.
1. Find your host computer's IPv4 address on the venue's Wi-Fi network:
   - **Mac:** \`System Settings\` > \`Wi-Fi\` > \`Details...\` (e.g., \`192.168.1.50\`).
   - **Windows:** Open Command Prompt and type \`ipconfig\`. Look for the IPv4 Address.
2. Direct all participant tablets/laptops to open their web browser and navigate to:
   \`\`\`
   http://YOUR_LOCAL_IP:5173
   \`\`\`
   *(Example: `http://192.168.1.50:5173`)*

## Admin & Leaderboard

The host computer should open three tabs:
1. **Admin Dashboard:** `http://localhost:5173/admin`
   - Use this to monitor all teams, override timers, skip stages, manually adjust scores, and trigger global reveals.
   - Click "Export CSV" at the end of the event to download all final scores.
2. **Public Leaderboard:** `http://localhost:5173/leaderboard`
   - Cast or connect this tab to a projector for all teams to see.
3. **Team Dashboard (Optional):** `http://localhost:5173/`
   - Useful for testing or walking a team through an issue.

## Technical Notes
- **Persistence:** All state is saved to `server/database.sqlite`. If the server crashes or restarts, all team progress, timers, and scores are preserved. If you want to reset the game for a new event, simply delete `database.sqlite` before starting the server.
- **Audio:** Round 3 uses the Web Audio API. Participants must interact with the page (click a button) before the browser allows audio to play.
