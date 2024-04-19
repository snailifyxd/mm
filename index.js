const {
  Client,
  Intents,
  MessageEmbed,
  ComponentType
} = require('discord.js');
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS]
});
const {
  token,
  githubKey,
  githubId
} = require('./config.js');
client.login(token);

const fs = require('fs');

const { 
    reactionReady, 
    reactionAdd 
} = require('./commands/reactionRoles.js');

const {
    verifyCommand,
    verifyCommandData
} = require('./commands/verify.js');

const {
    unverifyCommand,
    unverifyCommandData
} = require('./commands/unverify.js');

const { 
    checkVerification
} = require('./commands/checkVerification.js');

const {
    cataCommand,
    cataCommandData
} = require('./commands/cata.js');

const {
    cataCalcCommand,
    cataCalcCommandData
} = require('./commands/cataCalc.js');

const userData = new Map();

function getGuildSettings(guildId) {
  const settings = JSON.parse(fs.readFileSync('./serverconfig.json', 'utf8'));
  return settings[guildId] || {};
}

function updateGuildSettings(guildId, newSettings) {
  let settings = JSON.parse(fs.readFileSync('./serverconfig.json', 'utf8'));
  settings[guildId] = newSettings;
  fs.writeFileSync('./serverconfig.json', JSON.stringify(settings, null, 2));
}

client.on('ready', async() => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({activities: [{name: 'with my balls', type: 'PLAYING'}], status: 'dnd'})
  client.guilds.cache.forEach(async (guild) => {
    console.log(`Setting up for guild: ${guild.name}`);
  const reactionChannel = guild.channels.cache.get(getGuildSettings(guild.id).reactionChannel);
  await guild.commands.set([]);
  await guild.commands.create(cataCommandData);
  await guild.commands.create(cataCalcCommandData);
  if (getGuildSettings(guild.id).verify == true) {
    await guild.commands.create(verifyCommandData);
    await guild.commands.create(unverifyCommandData);
    setInterval(() => {
      guild.members.fetch()
          .then(members => {
              members.forEach(member => checkVerification(member, guild))
          })
    }, 3 * 60 * 60 * 1000);
  }
  if (getGuildSettings(guild.id).reactionRoles == true) reactionReady(reactionChannel);
})
});

client.on('messageReactionAdd', async(reaction, user) => {
  const guildId = reaction.message.guildId;
  const guild = await client.guilds.fetch(guildId);
  if (getGuildSettings(guild.id).reactionRoles == true) {
    const memberRole = guild.roles.cache.find(r => r.name === getGuildSettings(guild.id).memberRoleName);
    reactionAdd(reaction, user, guild, client, memberRole);
  }
});

client.on('guildMemberAdd', async(member) => {
  const guildId = member.guild.id;
  const guild = await client.guilds.fetch(guildId);
  if (getGuildSettings(guild.id).welcome == true) {
    const welcomeChannel = guild.channels.cache.get(getGuildSettings(guild.id).welcomeChannel);
    welcomeChannel.send('Welcome <@' + member.user.id + '>!');
  }
  if (getGuildSettings(guild.id).verify == true) {
    checkVerification(member, guild);
  }
});

client.on('guildMemberRemove', async(member) => {
  const guildId = member.guild.id;
  const guild = await client.guilds.fetch(guildId);
  if (getGuildSettings(guild.id).welcome == true) {
    const welcomeChannel = guild.channels.cache.get(getGuildSettings(guild.id).welcomeChannel);
    welcomeChannel.send('Goodbye ' + member.user.username);
  }
});

client.on('interactionCreate', async(interaction) => {
  if (!interaction.isCommand()) return;
  const {
      commandName,
      options
  } = interaction;
  if (commandName == 'verify') {
      const username = options.getString('username');
      verifyCommand(username, interaction);
  } 
  else if (commandName == 'unverify') {
    unverifyCommand(interaction)
  } 
  else if (commandName == 'cata') {
    const requestedPlayer = options.getString('username');
    cataCommand(requestedPlayer, interaction);
  }
  else if (commandName == 'calc') {
    let requestedPlayer = options.getString('username');
    const requestedLevel = options.getNumber('level');
    await interaction.deferReply();
    if (!requestedPlayer) {
      const response = await fetch(`https://api.github.com/gists/${githubId}`, {
          method: 'GET',
          headers: {
              'Authorization': `token ${githubKey}`,
              'Accept': 'application/vnd.github.v3+json'
          }
      });
      const gistData = await response.json();
      const users = JSON.parse(gistData.files['users.json'].content);
      const user = users.find(user => user.dcuser === interaction.user.username);
      if (user) {
          uuid = user.uuid;
          const response0 = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
          const json0 = await response0.json();
          requestedPlayer = json0.name;
      }
      else {
          interaction.editReply('Please verify with /verify to use commands without a username!');
      }
    }
    userData.set(interaction.user.id, { requestedPlayer, requestedLevel });
    msg = await cataCalcCommand(requestedPlayer, floorType = undefined, requestedFloor = undefined, requestedLevel, interaction)
    await interaction.editReply(msg);
    const message = await interaction.fetchReply();
    const filter = i => !i.user.bot;
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });
    collector.on('collect', async i => {
      if (i.user.id != message.interaction.user.id) {
        return i.reply({content: 'You cannot interact with this reply.', ephemeral: true})
      }
      if (i.customId === 'floor') {
        const selectedOption = i.values[0];
        const userDataForThisUser = userData.get(i.user.id);
        if (!userDataForThisUser) {
          return i.reply('No data found for this user.');
        }
        const { requestedPlayer, requestedLevel, i: userInteraction } = userDataForThisUser;
        await i.reply({content: 'Selected ' + selectedOption.split('_')[0].split('')[0] + selectedOption.split('_')[1], ephemeral: true})
        return interaction.editReply(await cataCalcCommand(requestedPlayer, floorType = selectedOption.split('_')[0].split('')[0], requestedFloor = selectedOption.split('_')[1], requestedLevel, userInteraction));
      }
    })
    collector.on('end', async collection => {
      message.edit({ components: [] })
    })
  }
});

module.exports = { MessageEmbed };
