const { githubKey, githubId, apiKey } = require('../config.js');

async function checkVerification(member, guild) {
    const response = await fetch(`https://api.github.com/gists/${githubId}`, {
        method: 'GET',
        headers: {
            'Authorization': `token ${githubKey}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    const gistData = await response.json();
    const users = JSON.parse(gistData.files['users.json'].content);
    const user = users.find(user => user.dcuser === member.user.username);
    if (user) {
        const response0 = await fetch('https://api.mojang.com/user/profile/' + user.uuid);
        const data0 = await response0.json();
        const username = data0.name;
        try {
            await member.setNickname(username);
        } catch (e) {
            console.error(e);
        }
        const role = guild.roles.cache.find(r => r.name === 'Verified');
        await member.roles.add(role).catch(console.error);
        try {
            const response1 = await fetch('https://api.hypixel.net/v2/player?key=' + apiKey + '&uuid=' + user.uuid);
            const data1 = await response1.json();
            const rank = data1.player.newPackageRank;
            const role1 = await guild.roles.cache.find(r => r.name === rank.replaceAll('_PLUS', '+'));
            await member.roles.add(role1).catch(console.error);
        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = { checkVerification };
