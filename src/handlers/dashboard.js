const express = require('express');
const path = require('path');
const settings = require('../utils/settings');

function createDashboard(client) {
  const app = express();
  const port = process.env.DASHBOARD_PORT || 3000;

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', '..', 'views'));
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Dashboard Home ──
  app.get('/', (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));

    const playerStatus = client.musicPlayer.getStatus();

    res.render('dashboard', {
      bot: {
        username: client.user?.username || 'Bot',
        avatar: client.user?.displayAvatarURL({ size: 128 }) || '',
        guilds: guilds.length,
        playing: Object.keys(playerStatus).length,
        uptime: formatUptime(client.uptime),
      },
      guilds,
      playerStatus,
      settings: settings.getAll(),
    });
  });

  // ── API: Get settings ──
  app.get('/api/settings', (req, res) => {
    const guildId = req.query.guild || null;
    res.json({
      settings: settings.getAll(guildId),
      defaults: settings.getDefaults(),
    });
  });

  // ── API: Update settings ──
  app.post('/api/settings', (req, res) => {
    const { key, value, guild } = req.body;

    if (!key) return res.status(400).json({ error: 'Missing key' });

    let parsed = value;
    if (value === 'true') parsed = true;
    else if (value === 'false') parsed = false;
    else if (!isNaN(value) && value !== '') parsed = Number(value);

    if (guild) {
      settings.setGuild(guild, key, parsed);
    } else {
      settings.set(key, parsed);
    }

    res.json({ ok: true, key, value: parsed });
  });

  // ── API: Reset settings ──
  app.post('/api/settings/reset', (req, res) => {
    const { guild } = req.body;
    if (guild) {
      settings.resetGuild(guild);
    } else {
      settings.resetAll();
    }
    res.json({ ok: true });
  });

  // ── API: Player status ──
  app.get('/api/status', (req, res) => {
    const playerStatus = client.musicPlayer.getStatus();
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));

    res.json({
      bot: {
        username: client.user?.username,
        guilds: guilds.length,
        playing: Object.keys(playerStatus).length,
        uptime: formatUptime(client.uptime),
      },
      guilds,
      playerStatus,
    });
  });

  // ── API: Player controls ──
  app.post('/api/player/:guildId/:action', (req, res) => {
    const { guildId, action } = req.params;
    const player = client.musicPlayer;
    const queue = player.getQueue(guildId);

    if (!queue) return res.status(404).json({ error: 'No active queue' });

    switch (action) {
      case 'skip': player.skip(guildId); break;
      case 'pause': player.pause(guildId); break;
      case 'resume': player.resume(guildId); break;
      case 'stop': player.destroy(guildId); break;
      case 'shuffle': player.shuffle(guildId); break;
      default: return res.status(400).json({ error: 'Unknown action' });
    }

    res.json({ ok: true, action });
  });

  app.listen(port, () => {
    console.log(`[Dashboard] Running at http://localhost:${port}`);
  });

  return app;
}

function formatUptime(ms) {
  if (!ms) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!parts.length) parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = createDashboard;
