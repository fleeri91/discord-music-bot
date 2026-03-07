const play = require("play-dl");

let spotifyInitialized = false;
let spotifyToken = null;
let tokenExpiry = 0;

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (spotifyToken && Date.now() < tokenExpiry) return spotifyToken;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);

  const data = await res.json();
  spotifyToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 1 min early
  return spotifyToken;
}

async function spotifyFetch(endpoint) {
  const token = await getSpotifyToken();
  const res = await fetch(`${SPOTIFY_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

async function initSpotify() {
  if (spotifyInitialized) return true;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret ||
    clientId === "your_spotify_client_id_here"
  ) {
    console.warn(
      "[Spotify] No credentials configured — Spotify links disabled.",
    );
    return false;
  }

  try {
    await getSpotifyToken();
    spotifyInitialized = true;
    console.log("[Spotify] Initialized successfully.");
    return true;
  } catch (err) {
    console.error("[Spotify] Init failed:", err.message);
    return false;
  }
}

function isSpotifyUrl(url) {
  return /^https?:\/\/(open\.)?spotify\.com\/(track|playlist|album)/.test(url);
}

function getSpotifyType(url) {
  if (/\/track\//.test(url)) return "track";
  if (/\/playlist\//.test(url)) return "playlist";
  if (/\/album\//.test(url)) return "album";
  return null;
}

function extractSpotifyId(url) {
  const match = url.match(/\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}

async function resolveSpotifyTrack(url) {
  try {
    const id = extractSpotifyId(url);
    const track = await spotifyFetch(`/tracks/${id}`);

    return [
      {
        title: track.name,
        artist: track.artists?.map((a) => a.name).join(", ") || "Unknown",
        duration: formatDuration(track.duration_ms),
        durationMs: track.duration_ms,
        thumbnail: track.album?.images?.[0]?.url || null,
        url: url,
        source: "spotify",
      },
    ];
  } catch (err) {
    console.error("[Spotify] Track resolve error:", err.message);
    throw err;
  }
}

async function resolveSpotifyPlaylist(url) {
  try {
    const type = getSpotifyType(url);
    const id = extractSpotifyId(url);
    const tracks = [];
    let name, thumbnail;

    if (type === "album") {
      const album = await spotifyFetch(`/albums/${id}`);
      name = album.name;
      thumbnail = album.images?.[0]?.url || null;

      for (const track of album.tracks.items) {
        tracks.push({
          title: track.name,
          artist: track.artists?.map((a) => a.name).join(", ") || "Unknown",
          duration: formatDuration(track.duration_ms),
          durationMs: track.duration_ms,
          thumbnail: thumbnail,
          url: track.external_urls?.spotify || url,
          source: "spotify",
        });
      }
    } else {
      const playlist = await spotifyFetch(`/playlists/${id}`);
      name = playlist.name;
      thumbnail = playlist.images?.[0]?.url || null;

      for (const item of playlist.tracks.items) {
        const track = item.track;
        if (!track) continue;
        tracks.push({
          title: track.name,
          artist: track.artists?.map((a) => a.name).join(", ") || "Unknown",
          duration: formatDuration(track.duration_ms),
          durationMs: track.duration_ms,
          thumbnail: track.album?.images?.[0]?.url || null,
          url: track.external_urls?.spotify || url,
          source: "spotify",
        });
      }
    }

    return { name, tracks, thumbnail };
  } catch (err) {
    console.error("[Spotify] Playlist resolve error:", err.message);
    throw err;
  }
}

function formatDuration(ms) {
  if (!ms) return "Unknown";
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

module.exports = {
  initSpotify,
  isSpotifyUrl,
  getSpotifyType,
  resolveSpotifyTrack,
  resolveSpotifyPlaylist,
};
