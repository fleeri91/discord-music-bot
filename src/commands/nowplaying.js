const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const queue = player.getQueue(interaction.guildId);

    if (!queue || !queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    const song = queue.current;
    const sourceColor = song.source === 'spotify' ? 0x1DB954 : 0xFF0000;

    const embed = new EmbedBuilder()
      .setColor(sourceColor)
      .setAuthor({ name: queue.paused ? '⏸️ Paused' : '♫ Now Playing' })
      .setTitle(song.title)
      .setURL(song.url)
      .setDescription(song.artist ? `by **${song.artist}**` : null)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Duration', value: song.duration || 'Live', inline: true },
        { name: 'Volume', value: `${Math.round(queue.volume * 100)}%`, inline: true },
        { name: 'Repeat', value: queue.repeatMode === 'off' ? 'Off' : queue.repeatMode === 'track' ? '🔂 Track' : '🔁 Queue', inline: true },
        { name: 'In Queue', value: `${queue.songs.length - 1} songs`, inline: true },
      )
      .setFooter({ text: `Requested by ${interaction.guild.members.cache.get(song.requestedBy)?.user?.username || 'Unknown'}` });

    await interaction.reply({ embeds: [embed] });
  },
};
