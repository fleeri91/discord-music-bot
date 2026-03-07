const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue')
    .addIntegerOption(opt =>
      opt.setName('page').setDescription('Page number').setMinValue(1)
    ),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const queue = player.getQueue(interaction.guildId);

    if (!queue || !queue.songs.length) {
      return interaction.reply({ content: '📭 The queue is empty.', ephemeral: true });
    }

    const page = (interaction.options.getInteger('page') || 1) - 1;
    const pageSize = 10;
    const totalPages = Math.ceil((queue.songs.length - 1) / pageSize) || 1;
    const currentPage = Math.min(page, totalPages - 1);

    const current = queue.songs[0];
    let description = `**Now Playing:**\n🎵 [${current.title}](${current.url}) \`${current.duration}\`\n`;

    if (queue.songs.length > 1) {
      const start = currentPage * pageSize + 1;
      const end = Math.min(start + pageSize, queue.songs.length);

      description += '\n**Up Next:**\n';
      for (let i = start; i < end; i++) {
        const song = queue.songs[i];
        description += `\`${i}.\` [${song.title}](${song.url}) \`${song.duration}\`\n`;
      }
    }

    const repeatIcon = queue.repeatMode === 'track' ? '🔂' : queue.repeatMode === 'queue' ? '🔁' : '';

    const embed = new EmbedBuilder()
      .setColor(0x7C3AED)
      .setTitle('📋 Music Queue')
      .setDescription(description)
      .setFooter({
        text: `Page ${currentPage + 1}/${totalPages} • ${queue.songs.length} songs • 🔊 ${Math.round(queue.volume * 100)}% ${repeatIcon}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
};
