# CineTrack
A personal movie list tracker. Organize films into custom lists, track what you've seen, and monitor your progress across every list.

## Features
- **Multiple lists** — create and manage as many movie lists as you want
- **Progress tracking** — see seen/unseen counts and completion percentage per list
- **Global search** — find any movie across all lists instantly
- **Filter & search** — filter by seen/unseen or search within a list
- **Add movies** — type titles manually or import from a CSV file
- **Edit & delete** — rename movies, toggle seen status, or remove them
- **Drag and drop** — reorder movies within a list or reorder lists themselves
- **Persistent storage** — data saved to a local JSON file via Express

## Setup
**Requirements:** Node.js

1. Clone the repo
   ```bash
   git clone https://github.com/wmanicom10/CineTrack.git
   cd CineTrack
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the server
   ```bash
   npm start
   ```
4. Open [http://localhost:3002](http://localhost:3002)

## Data
All data is stored in `cinetrack.json` in the project root. This file is git-ignored so your personal lists stay local.