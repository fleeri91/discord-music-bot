# 🎵 MusicBot - Discord Music Playback Bot

A lightweight Discord bot that joins your voice channel and plays YouTube audio using slash commands. Built with TypeScript, [discord.js](https://discord.js.org/), and [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice).

---

## ✨ Features

- 🔗 Play YouTube audio in voice channels via `/mbplay <url>`
- ⏹️ Stop current playback with `/mbstop`
- 🔊 Join a voice channel with `/mbjoin` (without playing)
- 🚪 Leave the voice channel with `/mbleave`
- 🔁 Handles voice connection and audio player state gracefully
- ⚙️ Slash command support for easy user interaction

---

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Discord Library**: [discord.js v14](https://discord.js.org/)
- **Voice Support**: [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice)
- **YouTube Streaming**: [ytdl-core](https://www.npmjs.com/package/ytdl-core)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/musicbot.git
cd musicbot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file with your credentials

To make the bot work, you **must** provide these environment variables in a `.env` file at the root of the project:

```env
DISCORD_TOKEN=your_bot_token      # Your Discord bot token from the Developer Portal
CLIENT_ID=your_bot_client_id      # Your bot's application/client ID
GUILD_ID=your_test_server_id      # The ID of the Discord server (guild) for registering commands
```

### 4. Register slash commands

```bash
npm run deploy:commands
```

### 5. Start the bot

For development (with hot reload):

```bash
npm run dev
```

For production build and run:

```bash
npm run start
```
