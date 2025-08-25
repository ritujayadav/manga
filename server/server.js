import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API = "https://api.mangadex.org";

app.get("/api/manga", async (req, res) => {
  const q = req.query.q;
  const url = q
    ? `${API}/manga?title=${encodeURIComponent(q)}&limit=24&includes[]=cover_art&availableTranslatedLanguage[]=en&contentRating[]=safe&contentRating[]=suggestive&order[relevance]=desc`
    : `${API}/manga?limit=24&includes[]=cover_art&availableTranslatedLanguage[]=en&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch manga" });
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
