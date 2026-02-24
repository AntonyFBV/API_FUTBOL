import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const KEY = process.env.KEY;
const SECRET = process.env.SECRET;

if (!KEY || !SECRET) {
  console.error("Faltan KEY o SECRET en .env");
  process.exit(1);
}

const CACHE_DURATION = 70 * 1000;

let cache = {
  timestamp: 0,
  data: null
};

async function fetchFromAPI(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error HTTP");
  return res.json();
}

async function getLiveMatches() {
  const now = Date.now();

  if (cache.data && now - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  try {

    const competitions = [25,2,244]; // Chile y Prmier Codigo Champions
    const competitionParam = competitions.join(",");

    const url = `https://livescore-api.com/api-client/matches/live.json?competition_id=${competitionParam}&key=${KEY}&secret=${SECRET}`;

    const json = await fetchFromAPI(url);

    if (!json.success || !json.data?.match) {
      return { success: true, matches: [] };
    }

    const matches = json.data.match.map(match => ({
      id: match.id,
      league: match.competition.name,
      stadium: match.location,
      status: match.status,
      minute: match.time,
      scheduled: match.scheduled,

      home: {
        name: match.home.name,
        logo: match.home.logo
      },

      away: {
        name: match.away.name,
        logo: match.away.logo
      },

      score: match.scores.score
    }));

    const result = {
      success: true,
      count: matches.length,
      matches
    };

    cache = { timestamp: now, data: result };

    return result;

  } catch (err) {
    console.error(err);
    return { success: false, matches: [] };
  }
}

app.get("/api/live", async (req, res) => {
  const data = await getLiveMatches();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});