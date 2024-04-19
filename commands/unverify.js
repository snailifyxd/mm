const { MessageEmbed } = require('discord.js')
const { 
    githubKey,
    githubId
} = require('../config.js');

async function unverifyCommand(interaction) {
    try {
        const response = await fetch(`https://api.github.com/gists/${githubId}`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubKey}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const gistData = await response.json();
        let users = JSON.parse(gistData.files['users.json'].content);
        users = users.filter(user => user.dcuser !== interaction.user.username);
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
        interaction.reply('Unverified!');
        interaction.member.roles.cache.forEach(async(role) => {
            if (givenRoles.includes(role.name)) {
                await interaction.member.roles.remove(role).catch(console.error);
            }
        });
    } catch (e) {
        console.error(e);
    }
}

const unverifyCommandData = {
    name: "unverify",
    description: "Unlinks your minecraft and discord accounts",
}

givenRoles = [
    'VIP',
    'VIP+',
    'MVP',
    'MVP+',
    'Verified'
]
  
unverifiedEmbed = new MessageEmbed()
  .setColor('#1EA863')
  .setTitle('Success')
  .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
  .setDescription('Successfully unverified and removed your roles.')

module.exports = {
    unverifyCommand,
    unverifyCommandData
};
