const { MessageEmbed } = require('discord.js')
const { 
    apiKey,
    githubKey,
    githubId
} = require('../config.js')

async function verifyCommand(username, interaction) {
  try {
      const response = await fetch('https://api.mojang.com/users/profiles/minecraft/' + username);
      const data = await response.json();
      const uuid = data.id;
      username = data.name;

      const hypixelResponse = await fetch('https://api.hypixel.net/v2/player?key=' + apiKey + '&uuid=' + uuid);
      const hypixelData = await hypixelResponse.json();

      if (hypixelData.success == true) {
          if (hypixelData.player) {
              if (interaction.user.username == hypixelData.player.socialMedia.links.DISCORD) {
                  await writeDataToFile(uuid, interaction.user.username, interaction, username);
              } else {
                await interaction.reply({embeds: [new MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Error Linking')
                    .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
                    .setDescription(`Your minecraft linked discord username did not match.\nTry this tutorial and link with \`\`${interaction.user.username}\`\`:\nhttps://www.youtube.com/watch?v=UresIQdoQHk`)]});
                  return;
              }
          } else {
              await interaction.reply({
                  embeds: [invalidEmbed]
              });
              return;
          }
      } else {
          await interaction.reply({
              embeds: [invalidEmbed]
          });
          return;
      }
  } catch (e) {
      console.error(e);
  }
}

async function writeDataToFile(uuid, dcuser, interaction, username) {
    try {
        await interaction.deferReply({
            ephemeral: false
        });
        const response = await fetch(`https://api.github.com/gists/${githubId}`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubKey}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const gistData = await response.json();
        const users = JSON.parse(gistData.files['users.json'].content);
        for (let user in users) {
            if (users[user].dcuser == dcuser) {
                interaction.editReply('You are already linked.');
                return;
            }
        }
        users.push({
            uuid: uuid,
            dcuser: dcuser
        });
        const updatedContent = JSON.stringify(users, null, 2);
        await fetch('https://api.github.com/gists/${githubId}', {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubKey}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    'users.json': {
                        content: updatedContent
                    }
                }
            })
        });
        await interaction.editReply({embeds: [new MessageEmbed()
            .setColor('#1EA863')
            .setTitle('Successfully linked')
            .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
            .setDescription('Minecraft: ' + username + ' to ' + 'Discord: ' + dcuser + '!')
        ]})
        setTimeout(async () => {
            await interaction.editReply({embeds: [
              new MessageEmbed()
              .setColor('#1EA863')
              .setTitle('Verification')
              .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
              .setDescription(`Please verify with your username to access this server.\nExample: \`\`/verify ${username}\`\` in this channel to verify.`)]});
         }, 10000);
        try {
            await interaction.member.setNickname(username);
        } catch (e) {
            console.error(e);
        }
        const role = await interaction.guild.roles.cache.find(r => r.name === 'Verified');
        await interaction.member.roles.add(role).catch(console.error);
        try {
            const response1 = await fetch('https://api.hypixel.net/v2/player?key=' + apiKey + '&uuid=' + uuid);
            const data1 = await response1.json();
            const rank = data1.player.newPackageRank;
            const role1 = await interaction.guild.roles.cache.find(r => r.name === rank.replaceAll('_PLUS', '+'));
            await interaction.member.roles.add(role1).catch(console.error);
        } catch (e) {
            console.error(e);
        }
        return;
    } catch (err) {
        console.error(err);
    }
}

const verifyCommandData = {
    name: "verify",
    description: "Links your minecraft account and discord account!",
    options: [{
        name: "username",
        type: "STRING",
        description: "username",
        required: true
    }]
}

verificationEmbed = new MessageEmbed()
  .setColor('#1EA863')
  .setTitle('Verification')
  .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
  .setDescription('Please verify with your username.\nExample: ``/verify snailify``\nhttps://www.youtube.com/watch?v=UresIQdoQHk')

unmatchedEmbed = new MessageEmbed()
  .setColor('#FF0000')
  .setTitle('Error Linking')
  .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
  .setDescription('Your minecraft linked discord username did not match.\nTry following this tutorial:\nhttps://www.youtube.com/watch?v=UresIQdoQHk')

invalidEmbed = new MessageEmbed()
  .setColor('#FF0000')
  .setTitle('Invalid Username')
  .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
  .setDescription("Player doesn't exist or doesn't play hypixel.")

module.exports = {
    verifyCommand,
    verifyCommandData
};
