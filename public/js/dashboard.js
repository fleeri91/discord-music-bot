// ── Tab Switching ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

// ── Settings Save ──
function saveSetting(key, value, guildId = null) {
  const body = { key, value: String(value) };
  if (guildId) body.guild = guildId;

  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) showToast(`✓ ${formatKey(key)} updated`);
      else showToast('✗ Failed to save', true);
    })
    .catch(() => showToast('✗ Connection error', true));
}

// Listen to all setting inputs
document.querySelectorAll('[data-setting]').forEach(el => {
  const key = el.dataset.setting;
  const guild = el.dataset.guild || null;

  if (el.type === 'checkbox') {
    el.addEventListener('change', () => saveSetting(key, el.checked, guild));
  } else {
    let timeout;
    el.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => saveSetting(key, el.value, guild), 500);
    });
    el.addEventListener('change', () => {
      clearTimeout(timeout);
      saveSetting(key, el.value, guild);
    });
  }
});

// ── Reset Settings ──
function resetSettings(guildId = null) {
  if (!confirm('Reset all settings to defaults?')) return;

  fetch('/api/settings/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guild: guildId || undefined }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        showToast('✓ Settings reset');
        setTimeout(() => location.reload(), 800);
      }
    })
    .catch(() => showToast('✗ Reset failed', true));
}

// ── Player Controls ──
function playerAction(guildId, action) {
  fetch(`/api/player/${guildId}/${action}`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        showToast(`✓ ${action.charAt(0).toUpperCase() + action.slice(1)}`);
        setTimeout(refreshStatus, 500);
      }
    })
    .catch(() => showToast('✗ Action failed', true));
}

// ── Auto-refresh status ──
function refreshStatus() {
  fetch('/api/status')
    .then(r => r.json())
    .then(data => {
      // Update header stats
      const uptimeEl = document.getElementById('stat-uptime');
      const playingEl = document.getElementById('stat-playing');
      if (uptimeEl) uptimeEl.textContent = data.bot.uptime;
      if (playingEl) playingEl.textContent = data.bot.playing;

      // Update now playing sections
      updateNowPlaying(data.playerStatus, data.guilds);
    })
    .catch(() => {});
}

function updateNowPlaying(playerStatus, guilds) {
  const container = document.getElementById('now-playing-list');
  if (!container) return;

  const guildMap = {};
  guilds.forEach(g => guildMap[g.id] = g);

  if (Object.keys(playerStatus).length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔇</div>
        <p>No music playing right now</p>
      </div>`;
    return;
  }

  container.innerHTML = Object.entries(playerStatus).map(([guildId, status]) => {
    const guild = guildMap[guildId] || { name: 'Unknown Server' };
    const song = status.current || {};
    return `
      <div class="now-playing">
        <img class="thumbnail" src="${song.thumbnail || '/css/placeholder.svg'}" alt="" onerror="this.style.display='none'">
        <div class="info">
          <div class="label">${guild.name} — ${status.paused ? '⏸ Paused' : '♫ Now Playing'}</div>
          <div class="title">${song.title || 'Unknown'}</div>
          <div class="artist">${song.artist || ''} · ${song.duration || ''} · 🔊 ${status.volume}%</div>
        </div>
        <div class="controls">
          <button onclick="playerAction('${guildId}','${status.paused ? 'resume' : 'pause'}')" title="${status.paused ? 'Resume' : 'Pause'}">
            ${status.paused ? '▶' : '⏸'}
          </button>
          <button onclick="playerAction('${guildId}','skip')" title="Skip">⏭</button>
          <button onclick="playerAction('${guildId}','shuffle')" title="Shuffle">🔀</button>
          <button onclick="playerAction('${guildId}','stop')" title="Stop">⏹</button>
        </div>
      </div>`;
  }).join('');
}

// ── Toast Notification ──
function showToast(msg, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.borderColor = isError ? 'var(--danger)' : 'var(--accent)';
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Helpers ──
function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

// Refresh every 10 seconds
setInterval(refreshStatus, 10000);
