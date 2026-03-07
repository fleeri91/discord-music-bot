const { spawn } = require("child_process");
const play = require("play-dl");

function isYouTubeUrl(url) {
  return play.yt_validate(url) !== false;
}

function getYouTubeType(url) {
  return play.yt_validate(url); // 'video' | 'playlist' | false
}

async function resolveYouTubeVideo(url) {
  try {
    const info = await ytdlpInfo(url);
    return {
      title: info.title,
      artist: info.channel || info.uploader || "Unknown",
      duration: formatSeconds(info.duration),
      durationSec: info.duration,
      thumbnail: info.thumbnail || null,
      url: info.webpage_url || url,
      source: "youtube",
    };
  } catch (err) {
    console.error("[YouTube] Video resolve error:", err.message);
    throw err;
  }
}

async function resolveYouTubePlaylist(url) {
  try {
    const entries = await ytdlpPlaylistInfo(url);

    const tracks = entries.map((v) => ({
      title: v.title,
      artist: v.channel || v.uploader || "Unknown",
      duration: formatSeconds(v.duration),
      durationSec: v.duration,
      thumbnail: v.thumbnail || null,
      url: v.webpage_url || v.url || url,
      source: "youtube",
    }));

    return {
      name: entries._playlistTitle || "YouTube Playlist",
      tracks,
      thumbnail: tracks[0]?.thumbnail || null,
    };
  } catch (err) {
    console.error("[YouTube] Playlist resolve error:", err.message);
    throw err;
  }
}

async function searchYouTube(query, limit = 1) {
  try {
    const results = await play.search(query, {
      source: { youtube: "video" },
      limit,
    });

    return results.map((v) => ({
      title: v.title,
      artist: v.channel?.name || "Unknown",
      duration: formatSeconds(v.durationInSec),
      durationSec: v.durationInSec,
      thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || null,
      url: v.url,
      source: "youtube",
    }));
  } catch (err) {
    // Fallback to yt-dlp search
    try {
      const info = await ytdlpInfo(`ytsearch1:${query}`);
      return [
        {
          title: info.title,
          artist: info.channel || info.uploader || "Unknown",
          duration: formatSeconds(info.duration),
          durationSec: info.duration,
          thumbnail: info.thumbnail || null,
          url: info.webpage_url,
          source: "youtube",
        },
      ];
    } catch (e) {
      console.error("[YouTube] Search error:", e.message);
      throw e;
    }
  }
}

// ── yt-dlp helpers ──

function ytdlpInfo(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "yt-dlp",
      ["--no-playlist", "--dump-json", "--quiet", "--no-warnings", url],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (e) {
          reject(new Error("Failed to parse yt-dlp output"));
        }
      } else {
        reject(new Error(stderr.slice(0, 200) || "yt-dlp info failed"));
      }
    });
    proc.on("error", reject);
  });
}

function ytdlpPlaylistInfo(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "yt-dlp",
      [
        "--yes-playlist",
        "--flat-playlist",
        "--dump-json",
        "--quiet",
        "--no-warnings",
        url,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const lines = stdout.trim().split("\n");
          const entries = lines.map((line) => JSON.parse(line));
          resolve(entries);
        } catch (e) {
          reject(new Error("Failed to parse yt-dlp playlist output"));
        }
      } else {
        reject(new Error(stderr.slice(0, 200) || "yt-dlp playlist failed"));
      }
    });
    proc.on("error", reject);
  });
}

function formatSeconds(sec) {
  if (!sec || sec === 0) return "Live";
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${rm.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  }
  return `${m}:${r.toString().padStart(2, "0")}`;
}

module.exports = {
  isYouTubeUrl,
  getYouTubeType,
  resolveYouTubeVideo,
  resolveYouTubePlaylist,
  searchYouTube,
};
