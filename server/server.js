import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
const API = "https://api.jikan.moe/v4/manga";

app.get("/api/manga", async (req, res) => {
  const q = req.query.q;
  const url = q ? `${API}?q=${encodeURIComponent(q)}&limit=24` : `${API}?limit=24`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch manga" });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
