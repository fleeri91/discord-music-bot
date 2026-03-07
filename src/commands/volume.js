const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume')
    .addIntegerOption(opt =>
      opt.setName('level')
        .setDescription('Volume level (0-150)')
        .setMinValue(0)
        .setMaxValue(150)
        .setRequired(true)
    ),

  async execute(interaction) {
    const player = interaction.client.musicPlayer;
    const queue = player.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }

    const level = interaction.options.getInteger('level');
    const actual = player.setVolume(interaction.guildId, level);
    const bar = '█'.repeat(Math.round(actual / 10)) + '░'.repeat(10 - Math.round(actual / 10));
    await interaction.reply(`🔊 Volume: \`${bar}\` **${actual}%**`);
  },
};
