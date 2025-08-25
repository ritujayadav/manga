import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter as Router,Routes,Route,Link,
  useNavigate,
  useParams,  useSearchParams,
} from "react-router-dom";
import "./App.css";

const API = "https://api.mangadex.org";

function pickTitle(titlesObj) {
  if (!titlesObj) return "Untitled";
  return (
    titlesObj.en ||
    titlesObj["ja-ro"] ||
    titlesObj.ja ||
    Object.values(titlesObj)[0] ||
    "Untitled"
  );
}

function coverUrlOf(manga) {
  const cover = manga.relationships?.find((r) => r.type === "cover_art");
  if (!cover) return "https://via.placeholder.com/240x340?text=No+Cover";
  const file = cover?.attributes?.fileName;
  return `https://uploads.mangadex.org/covers/${manga.id}/${file}.256.jpg`;
}

function typeFromLang(lang) {
  if (lang === "ja") return "Manga";
  if (lang === "ko") return "Manhwa";
  if (lang === "zh" || lang === "zh-hk" || lang === "zh-ro") return "Manhua";
  return "Manga";
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [query, setQuery] = useState(q);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("all"); 
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
         const url = q
          ? `${API}/manga?title=${encodeURIComponent(
              q
            )}&limit=24&includes[]=cover_art&availableTranslatedLanguage[]=en&contentRating[]=safe&contentRating[]=suggestive&order[relevance]=desc`
          : `${API}/manga?limit=24&includes[]=cover_art&availableTranslatedLanguage[]=en&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;

        const res = await fetch(url);
        const data = await res.json();
        if (ignore) return;
        setItems(data.data || []);
      } catch (e) {
        console.error(e);
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => (ignore = true);
  }, [q]);

 
  const filtered = useMemo(() => {
    return items.filter((m) => {
      const lang = m.attributes?.originalLanguage;
      const t = typeFromLang(lang).toLowerCase(); 
      const stat = (m.attributes?.status || "").toLowerCase();
      const okType = type === "all" || t === type;
      const okStatus = status === "all" || stat === status;
      return okType && okStatus;
    });
  }, [items, type, status]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const next = query.trim();
    if (next) setSearchParams({ q: next });
    else setSearchParams({});
  };

  return (
    <div className="app">
      <div className="header">
        <div className="brand"><Link className="link" to="/">Hexaware Book Club</Link></div>

        <form className="search-box" onSubmit={onSearchSubmit}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga…"
          />
          <button type="submit">Search</button>
        </form>

        <div className="filters">
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            title="Type"
          >
            <option value="all">All Types</option>
            <option value="manga">Manga (Japan)</option>
            <option value="manhwa">Manhwa (Korean)</option>
            
          </select>

          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            title="Status"
          >
            <option value="all">Any Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="page">
        {loading && <div className="loading">Loading…</div>}

        <div className="manga-grid">
          {filtered.map((m) => {
            const title = pickTitle(m.attributes?.title);
            const cover = coverUrlOf(m);
            const lang = typeFromLang(m.attributes?.originalLanguage);
            const year = m.attributes?.year || "—";
            return (
              <Link
                key={m.id}
                to={`/manga/${m.id}`}
                className="manga-card"
                title={title}
              >
                <img src={cover} alt={title} loading="lazy" />
                <div className="overlay">
                  <h3>{title}</h3>
                  <p className="muted">{lang} • {year} • {m.attributes?.status}</p>
                  <p className="genres">
                    {(m.attributes?.tags || []).slice(0, 3).map((t) => (
                      <span key={t.id}>{t.attributes?.name?.en || ""}</span>
                    ))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MangaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const d = await fetch(
          `${API}/manga/${id}?includes[]=cover_art`
        ).then((r) => r.json());

        const feed = await fetch(
          `${API}/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100`
        ).then((r) => r.json());

        if (ignore) return;
        setManga(d.data);
        setChapters(feed.data || []);
      } catch (e) {
        console.error(e);
        if (!ignore) {
          setManga(null);
          setChapters([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => (ignore = true);
  }, [id]);

  if (loading) return <div className="page loading">Loading…</div>;
  if (!manga) return <div className="page">Not found.</div>;

  const title = pickTitle(manga.attributes?.title);
  const cover = coverUrlOf(manga);
  const desc =
    manga.attributes?.description?.en ||
    manga.attributes?.description?.ja ||
    "No description.";
  const tags = (manga.attributes?.tags || []).map(
    (t) => t.attributes?.name?.en
  );

  return (
    <div className="page">
      <p><button className="chip" onClick={() => navigate(-1)}>← Back</button></p>

      <div className="detail">
        <img src={cover} alt={title} />
        <div>
          <h1>{title}</h1>
          <p className="muted">
            {typeFromLang(manga.attributes?.originalLanguage)} •{" "}
            {manga.attributes?.status} • {manga.attributes?.year || "—"}
          </p>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{desc}</p>
          <p className="genres">
            {tags.slice(0, 10).map((g) => (
              <span key={g} style={{ marginRight: 6, background: "#333", padding: "4px 8px", borderRadius: 12 }}>
                {g}
              </span>
            ))}
          </p>

          <div className="chapters">
            {chapters.length === 0 && <div className="muted" style={{ padding: 10 }}>No English chapters found.</div>}
            {chapters.map((c) => {
              const chap = c.attributes?.chapter || "—";
              const titleC = c.attributes?.title || "";
              return (
                <Link key={c.id} to={`/chapter/${c.id}`}>
                  Ch. {chap} {titleC ? `— ${titleC}` : ""}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chapterNo, setChapterNo] = useState("");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const home = await fetch(`${API}/at-home/server/${id}`).then((r) =>
          r.json()
        );

        const info = await fetch(`${API}/chapter/${id}`).then((r) => r.json());
        const chapNum = info?.data?.attributes?.chapter || "";
        if (!ignore) setChapterNo(chapNum);

        const base = home.baseUrl;
        const hash = home.chapter.hash;


        const files = home.chapter.dataSaver?.length
          ? home.chapter.dataSaver
          : home.chapter.data;

        const urls = files.map(
          (f) => `${base}/data-saver/${hash}/${f}`
        );

        if (!ignore) setPages(urls);
      } catch (e) {
        console.error(e);
        if (!ignore) setPages([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => (ignore = true);
  }, [id]);

  return (
    <div className="page reader">
      <div className="reader-nav">
        <button className="chip" onClick={() => navigate(-1)}>← Back</button>
        <span className="muted">Chapter {chapterNo || ""}</span>
      </div>

      {loading && <div className="loading">Loading pages…</div>}

      {pages.map((src, i) => (
        <img key={i} src={src} alt={`Page ${i + 1}`} loading="lazy" />
      ))}

      {!loading && pages.length === 0 && (
        <div className="muted">No pages available.</div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manga/:id" element={<MangaDetail />} />
        <Route path="/chapter/:id" element={<Reader />} />
      </Routes>
    </Router>
  );
}
