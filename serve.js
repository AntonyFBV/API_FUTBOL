// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

const KEY = "4oODHCPHdZNjwjuh";
const SECRET = "ONXCkkVDK8oNx7lBw9fdM5U04IkB1OTQ";
const FRANCIA_ID = 1439;

let cache = {
  timestamp: 0,
  data: null
};

async function fetchLiveMatches() {
  const now = Date.now();
  // Refrescar cada 30 segundos
  if (cache.data && now - cache.timestamp < 30000) {
    return cache.data;
  }

  try {
    const liveUrl = `https://livescore-api.com/api-client/matches/live.json?key=${KEY}&secret=${SECRET}`;
    const res = await fetch(liveUrl);
    const json = await res.json();

    if (!json.success) return { success: false, message: "Error en la API" };

    const matches = json.data.match.filter(
      m => m.home.id === FRANCIA_ID || m.away.id === FRANCIA_ID
    );

    // Obtener eventos de cada partido
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