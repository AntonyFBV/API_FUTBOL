import express from "express";
import fetch from "node-fetch";
import cors from "cors"; // <-- importar cors

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // <-- permitir todos los orígenes

const KEY = process.env.KEY;
const SECRET = process.env.SECRET;
const FRANCIA_ID = 2299;

let cache = {
  timestamp: 0,
  data: null
};

async function fetchLiveMatches() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < 60 * 1000) return cache.data;

  try {
    const liveUrl = `https://livescore-api.com/api-client/matches/live.json?key=${KEY}&secret=${SECRET}`;
    const res = await fetch(liveUrl);
    const json = await res.json();

    if (!json.success) return { success: false, message: "Error en la API" };

    const matches = json.data.match.filter(
      m => m.home.id === FRANCIA_ID || m.away.id === FRANCIA_ID
    );

    const matchesWithEvents = await Promise.all(matches.map(async match => {
      const eventsUrl = `https://livescore-api.com/api-client/matches/events.json?match_id=${match.id}&key=${KEY}&secret=${SECRET}`;
      const eventsRes = await fetch(eventsUrl);
      const eventsJson = await eventsRes.json();
      return {
        ...match,
        events: eventsJson.success ? eventsJson.data.event : []
      };
    }));

    const result = { success: true, matches: matchesWithEvents };
    cache = { timestamp: now, data: result };
    return result;

  } catch (err) {
    console.error(err);
    return { success: false, message: "Error al conectar con la API externa" };
  }
}

app.get("/api/matches", async (req, res) => {
  const data = await fetchLiveMatches();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
