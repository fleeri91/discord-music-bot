const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
  StreamType,
} = require("@discordjs/voice");
const { spawn } = require("child_process");
const play = require("play-dl");
const settings = require("./settings");

/**
 * Streams audio from a URL using yt-dlp piped through ffmpeg.
 * Outputs raw s16le PCM so discord.js can process volume + encode to Opus.
 */
function getDirectUrl(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "yt-dlp",
      [
        "-f",
        "bestaudio[ext=webm]/bestaudio/best",
        "--no-playlist",
        "--get-url",
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
      const directUrl = stdout.trim().split("\n")[0];
      if (code === 0 && directUrl) {
        resolve(directUrl);
      } else {
        reject(new Error(stderr.slice(0, 200) || "yt-dlp failed to get URL"));
      }
    });
    proc.on("error", (err) => reject(err));
  });
}

function createFfmpegStream(directUrl, volume = 1.0) {
  const volumeFilter = volume !== 1.0 ? ["-af", `volume=${volume}`] : [];

  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-i",
      directUrl,
      "-analyzeduration",
      "0",
      "-loglevel",
      "warning",
      ...volumeFilter,
      "-f",
      "s16le",
      "-ar",
      "48000",
      "-ac",
      "2",
      "pipe:1",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  // Debug: check if data is actually flowing
  let bytes = 0;
  ffmpeg.stdout.on("data", (chunk) => {
    bytes += chunk.length;
    if (bytes === chunk.length) {
      console.log("[ffmpeg] First data chunk received:", chunk.length, "bytes");
    }
  });
  ffmpeg.stdout.on("end", () => {
    console.log("[ffmpeg] Stream ended. Total bytes:", bytes);
  });

  ffmpeg.stdout.on("error", () => {});

  ffmpeg.on("error", (err) => {
    console.error("[ffmpeg] Process error:", err.message);
  });

  let stderrData = "";
  ffmpeg.stderr.on("data", (d) => (stderrData += d));
  ffmpeg.on("close", (code) => {
    if (code !== 0) {
      console.error("[ffmpeg] Exit code", code, ":", stderrData.slice(0, 300));
    }
  });

  return {
    stream: ffmpeg.stdout,
    cleanup: () => {
      try {
        ffmpeg.kill("SIGTERM");
      } catch {}
    },
  };
}

/**
 * Search YouTube using yt-dlp and return the first result URL.
 */
function ytdlpSearch(query) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "yt-dlp",
      [
        `ytsearch1:${query}`,
        "--get-url",
        "--get-title",
        "-f",
        "bestaudio",
        "--no-playlist",
        "--quiet",
        "--no-warnings",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code !== 0)
        return reject(new Error(stderr || "yt-dlp search failed"));
      const lines = stdout.trim().split("\n");
      if (lines.length >= 1) {
        resolve(lines[lines.length - 1]); // URL is last line
      } else {
        reject(new Error("No results found"));
      }
    });
    proc.on("error", (err) => {
      reject(
        new Error(
          `yt-dlp not found. Install it: https://github.com/yt-dlp/yt-dlp#installation\n${err.message}`,
        ),
      );
    });
  });
}

class GuildQueue {
  constructor(guildId, voiceChannel, textChannel) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.songs = [];
    this.history = [];
    this.current = null;
    this.volume = settings.get("defaultVolume", guildId) / 100;
    this.repeatMode = settings.get("defaultRepeatMode", guildId);
    this.playing = false;
    this.paused = false;
    this.connection = null;
    this.player = null;
    this.leaveTimeout = null;
    this.emptyTimeout = null;
  }
}

class MusicPlayer {
  constructor(client) {
    this.client = client;
    this.queues = new Map();
  }

  getQueue(guildId) {
    return this.queues.get(guildId);
  }

  async createQueue(guildId, voiceChannel, textChannel) {
    const queue = new GuildQueue(guildId, voiceChannel, textChannel);

    // Join voice channel
    queue.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    // Create audio player
    queue.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    queue.connection.subscribe(queue.player);

    // Handle player state changes
    queue.player.on(AudioPlayerStatus.Idle, () => this._onSongFinish(guildId));
    queue.player.on("error", (err) => {
      console.error(`[Player ${guildId}] Error:`, err.message);
      this._onSongFinish(guildId);
    });

    // Handle disconnection
    queue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(queue.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(queue.connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        this.destroy(guildId);
      }
    });

    this.queues.set(guildId, queue);
    this._watchEmpty(guildId);
    return queue;
  }

  async play(queue) {
    if (!queue.songs.length) {
      this._onQueueEmpty(queue.guildId);
      return;
    }

    const song = queue.songs[0];
    queue.current = song;
    queue.playing = true;
    queue.paused = false;

    // Clear any leave timeouts
    if (queue.leaveTimeout) {
      clearTimeout(queue.leaveTimeout);
      queue.leaveTimeout = null;
    }

    try {
      let streamData;
      let directUrl;
      if (song.source === "youtube") {
        console.log(`[Player] Getting direct URL for: ${song.url}`);
        directUrl = await getDirectUrl(song.url);
      } else if (song.source === "spotify") {
        const searchQuery = `${song.title} ${song.artist}`
          .replace(/\s*[-–(].*?(remaster|edition|version|deluxe).*?[)]/gi, "")
          .trim();
        console.log(`[Player] Searching yt-dlp for: ${searchQuery}`);
        directUrl = await getDirectUrl(`ytsearch1:${searchQuery}`);
      }

      console.log(`[Player] Got direct URL: ${directUrl?.slice(0, 80)}...`);
      streamData = createFfmpegStream(directUrl, queue.volume);
      console.log("[Player] ffmpeg stream created");

      // Kill previous stream processes if any
      if (queue._streamCleanup) queue._streamCleanup();
      queue._streamCleanup = streamData.cleanup;

      const resource = createAudioResource(streamData.stream, {
        inputType: StreamType.Raw,
        inlineVolume: false,
      });

      resource.volume?.setVolume(queue.volume);
      queue.resource = resource;
      queue.player.play(resource);

      if (settings.get("showNowPlaying", queue.guildId)) {
        queue.textChannel
          .send({
            embeds: [
              {
                color: 0x7c3aed,
                author: { name: "♫ Now Playing" },
                title: song.title,
                url: song.url,
                description: song.artist ? `by **${song.artist}**` : null,
                thumbnail: song.thumbnail ? { url: song.thumbnail } : null,
                fields: [
                  {
                    name: "Duration",
                    value: song.duration || "Live",
                    inline: true,
                  },
                  {
                    name: "Requested by",
                    value: `<@${song.requestedBy}>`,
                    inline: true,
                  },
                ],
                footer: {
                  text: `🔊 ${Math.round(queue.volume * 100)}% • ${queue.songs.length - 1} in queue`,
                },
              },
            ],
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error(`[Player] Play error:`, err.message);
      queue.textChannel
        .send(`❌ Failed to play **${song.title}**: ${err.message}`)
        .catch(() => {});
      queue.songs.shift();
      return this.play(queue);
    }
  }

  _onSongFinish(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    const finished = queue.songs.shift();
    if (finished) {
      queue.history.unshift(finished);
      const maxHistory = settings.get("maxHistorySize", guildId);
      if (queue.history.length > maxHistory) queue.history.pop();
    }

    // Handle repeat
    if (queue.repeatMode === "track" && finished) {
      queue.songs.unshift(finished);
    } else if (queue.repeatMode === "queue" && finished) {
      queue.songs.push(finished);
    }

    if (queue.songs.length > 0) {
      this.play(queue);
    } else {
      queue.current = null;
      queue.playing = false;
      this._onQueueEmpty(guildId);
    }
  }

  _onQueueEmpty(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    if (settings.get("leaveOnFinish", guildId)) {
      const delay = settings.get("leaveOnFinishDelay", guildId) * 1000;
      queue.leaveTimeout = setTimeout(() => {
        if (!queue.songs.length) {
          queue.textChannel
            .send("👋 Queue empty — leaving voice channel.")
            .catch(() => {});
          this.destroy(guildId);
        }
      }, delay);
    }
  }

  _watchEmpty(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue || !settings.get("leaveOnEmpty", guildId)) return;

    const check = () => {
      const q = this.queues.get(guildId);
      if (!q) return;

      // Re-fetch the channel from cache to get current members
      const guild = this.client.guilds.cache.get(guildId);
      const channel = guild?.channels.cache.get(q.voiceChannel.id);
      if (!channel) return;

      const members = channel.members.filter((m) => !m.user.bot).size;
      if (members === 0) {
        if (!q.emptyTimeout) {
          const delay = settings.get("leaveOnEmptyDelay", guildId) * 1000;
          q.emptyTimeout = setTimeout(() => {
            const ch = guild?.channels.cache.get(q.voiceChannel.id);
            const recheck = ch ? ch.members.filter((m) => !m.user.bot).size : 0;
            if (recheck === 0) {
              q.textChannel.send("👋 Channel empty — leaving.").catch(() => {});
              this.destroy(guildId);
            } else {
              q.emptyTimeout = null;
            }
          }, delay);
        }
      } else if (q.emptyTimeout) {
        clearTimeout(q.emptyTimeout);
        q.emptyTimeout = null;
      }
    };

    // Poll every 10 seconds
    queue._emptyInterval = setInterval(check, 10000);
  }

  skip(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    queue.player.stop();
    return true;
  }

  pause(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue || queue.paused) return false;
    queue.player.pause();
    queue.paused = true;
    return true;
  }

  resume(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue || !queue.paused) return false;
    queue.player.unpause();
    queue.paused = false;
    return true;
  }

  setVolume(guildId, vol) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    const max = settings.get("maxVolume", guildId);
    const clamped = Math.max(0, Math.min(vol, max));
    queue.volume = clamped / 100;
    // Volume takes effect on next song (applied via ffmpeg filter)
    return clamped;
  }

  shuffle(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue || queue.songs.length < 3) return false;
    const first = queue.songs.shift();
    for (let i = queue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
    queue.songs.unshift(first);
    return true;
  }

  setRepeat(guildId, mode) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    queue.repeatMode = mode;
    return true;
  }

  remove(guildId, index) {
    const queue = this.queues.get(guildId);
    if (!queue || index < 1 || index >= queue.songs.length) return null;
    return queue.songs.splice(index, 1)[0];
  }

  clear(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    const first = queue.songs[0];
    queue.songs = first ? [first] : [];
    return true;
  }

  destroy(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    if (queue.leaveTimeout) clearTimeout(queue.leaveTimeout);
    if (queue.emptyTimeout) clearTimeout(queue.emptyTimeout);
    if (queue._emptyInterval) clearInterval(queue._emptyInterval);
    if (queue._streamCleanup) queue._streamCleanup();

    queue.player?.stop(true);
    queue.connection?.destroy();
    this.queues.delete(guildId);
  }

  // Get status for dashboard
  getStatus() {
    const status = {};
    for (const [guildId, queue] of this.queues) {
      status[guildId] = {
        current: queue.current,
        songs: queue.songs.length,
        volume: Math.round(queue.volume * 100),
        paused: queue.paused,
        repeatMode: queue.repeatMode,
        voiceChannel: queue.voiceChannel.name,
      };
    }
    return status;
  }
}

module.exports = MusicPlayer;
