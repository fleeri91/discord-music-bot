# 🎵 Discord Music Bot

A self-hosted Discord music bot with **YouTube** and **Spotify** support, easy slash commands, and a sleek **web dashboard** running on `localhost:3000`.

---

## Features

| Feature | Details |
|---------|---------|
| 🎶 YouTube | Play songs, playlists, or search by name |
| 🟢 Spotify | Play tracks, playlists, and albums (streams via YouTube) |
| 🎛️ Dashboard | Web UI at `localhost:3000` for settings & monitoring |
| ⚙️ Settings | JSON-persisted, per-guild overrides, live-editable |
| 🔁 Repeat | Off / Track / Queue modes |
| 🔀 Shuffle | Randomize the queue |
| 🔊 Volume | 0–150% with per-server control |
| ⏱️ Auto-Leave | Configurable timeouts for empty channels / finished queues |
| 🔒 DJ Mode | Optional role-based command restrictions |

---

## Quick Start

### 1. Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **FFmpeg** — required for audio processing
  - **macOS:** `brew install ffmpeg`
  - **Ubuntu/Debian:** `sudo apt install ffmpeg`
  - **Windows:** [Download](https://ffmpeg.org/download.html) and add to PATH

### 2. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it → **Create**
3. Go to **Bot** tab → **Reset Token** → **Copy** the token
4. Under **Privileged Gateway Intents**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`
6. Copy the generated URL and invite the bot to your server

### 3. Configure

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
SPOTIFY_CLIENT_ID=your_spotify_id        # optional
SPOTIFY_CLIENT_SECRET=your_spotify_secret # optional
DASHBOARD_PORT=3000
```

**Spotify credentials** (optional): Create an app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) to enable Spotify link support.

### 4. Install & Run

```bash
npm install
npm start
```

The bot will:
- Connect to Discord
- Register slash commands globally (may take up to 1 hour to appear in all servers)
- Start the dashboard at **http://localhost:3000**

---

## Commands

| Command | Description |
|---------|-------------|
| `/play <query>` | Play a YouTube/Spotify URL or search term |
| `/pause` | Pause or resume playback |
| `/skip` | Skip the current song |
| `/stop` | Stop playback and clear queue |
| `/queue [page]` | View the current queue |
| `/nowplaying` | Show current song details |
| `/volume <0-150>` | Set playback volume |
| `/shuffle` | Shuffle the queue |
| `/repeat <off\|track\|queue>` | Set repeat mode |
| `/remove <position>` | Remove a song from queue |
| `/clear` | Clear queue (keeps current song) |

---

## Web Dashboard

Access at **http://localhost:3000** after starting the bot.

**Overview tab:**
- Live stats (servers, active players, uptime)
- Now-playing cards with remote controls (pause, skip, shuffle, stop)

**Settings tab:**
- Auto-leave timings
- Volume limits
- Queue size limits
- Repeat mode defaults
- DJ role & permissions
- All changes save automatically

**Servers tab:**
- List of all connected servers
- Active playback indicators

---

## Settings

Settings are stored in `settings.json` (auto-created). You can edit them via the dashboard or directly in the file.

Key settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `leaveOnEmpty` | `true` | Leave when voice channel empties |
| `leaveOnEmptyDelay` | `30` | Seconds to wait before leaving |
| `leaveOnFinish` | `true` | Leave when queue finishes |
| `leaveOnFinishDelay` | `120` | Seconds to wait after queue ends |
| `defaultVolume` | `80` | Default volume (0–100) |
| `maxVolume` | `150` | Max allowed volume |
| `maxQueueSize` | `200` | Max songs in queue |
| `djOnly` | `false` | Restrict commands to DJ role |
| `djRoleName` | `"DJ"` | Name of the DJ role |

---

## Project Structure

```
discord-music-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── commands/              # Slash commands
│   │   ├── play.js
│   │   ├── skip.js
│   │   ├── pause.js
│   │   ├── stop.js
│   │   ├── queue.js
│   │   ├── volume.js
│   │   ├── shuffle.js
│   │   ├── repeat.js
│   │   ├── nowplaying.js
│   │   ├── remove.js
│   │   └── clear.js
│   ├── handlers/
│   │   ├── commands.js        # Command loader & handler
│   │   └── dashboard.js       # Express web server
│   └── utils/
│       ├── player.js          # Music queue & playback
│       ├── settings.js        # Settings manager
│       ├── spotify.js         # Spotify resolver
│       └── youtube.js         # YouTube resolver
├── views/
│   └── dashboard.ejs          # Dashboard template
├── public/
│   ├── css/dashboard.css
│   └── js/dashboard.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Troubleshooting

**Commands not showing up?**
Global slash commands can take up to 1 hour to propagate. Restart the bot to force re-registration.

**No audio?**
Make sure `ffmpeg` is installed and accessible from your terminal. Run `ffmpeg -version` to verify.

**Spotify links not working?**
Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set in `.env`. The bot searches YouTube for matching tracks to play.

**Bot disconnects randomly?**
Check your network stability. The bot automatically attempts to reconnect on disconnection.

---

## License

MIT — use it however you like.
