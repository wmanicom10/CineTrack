const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;
const DB_FILE = path.join(__dirname, 'cinetrack.json');

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

function load() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveToDisk(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf8');
}

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

app.get('/api/load', (req, res) => {
  res.json(load());
});

app.post('/api/save', (req, res) => {
  saveToDisk(req.body);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`CineTrack running at http://localhost:${PORT}`);
});