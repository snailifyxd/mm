const { MessageEmbed } = require('discord.js')

const reactionEmbed = new MessageEmbed()
  .setTitle('Select the floors and classes you play!')
  .setDescription('**<:m7:1223817988810215495> M7\n<:m6:1223818019411591269> M6\n<:m5:1223818054681755718> M5\n<:m4:1223818078840950906> M4\n<:healer:1223809767336579072> Healer\n<:mager:1223809819530760252> Mage\n<:berserk:1223809789839147188> Berserk\n<:archer:1223809842800492596> Archer\n<:tank:1223809742284128337> Tank**')
  .setThumbnail('https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png')
  .setColor('b93f3f')

async function reactionReady(channel) {
    fetched = await channel.messages.fetch({
        limit: 100
    });
    channel.bulkDelete(fetched);
    const sentMessage = await channel.send({
        embeds: [reactionEmbed]
    });
    for (emoji in reactionToRole) {
        await sentMessage.react(emoji);
    }
}

async function reactionAdd(reaction, user, guild, client, memberRole) {
    if (user.id == client.user.id) return;
    await reaction.users.remove(user.id);
    if (reaction.partial) {
        await reaction.fetch();
    }
    if (reaction.message.channelId == '1223280537041637396') {
        const member = await guild.members.fetch(user.id);
        let reactionRole = undefined;
        if (!member.roles.cache.has(memberRole.id)) {
            await member.roles.add(memberRole);
        }
        for (let rrole in reactionToRole) {
            if (rrole.includes(reaction.emoji.name)) {
                reactionRole = rrole;
            }
        }
        if (reactionRole == undefined) {
            reactionRole = reaction.emoji.name;
        }
        const role = await guild.roles.fetch(reactionToRole[reactionRole]);
        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            await user.send('Removed ' + role.name + '!');
            console.log('Removed ' + role.name + ' from ' + user.username);
        } else {
            await member.roles.add(role);
            await user.send('Added ' + role.name + '!');
            console.log('Added ' + role.name + ' to ' + user.username);
        }
    }
}

const classEmojis = {
    healer: '<:healer:1223809767336579072>',
    mage: '<:mager:1223809819530760252>',
    berserk: '<:berserk:1223809789839147188>',
    archer: '<:archer:1223809842800492596>',
    tank: '<:tank:1223809742284128337>'
}

const reactionToRole = {
    '<:m7:1223817988810215495>': '1223283944779415563',
    '<:m6:1223818019411591269>': '1223283892556009644',
    '<:m5:1223818054681755718>': '1223283742940991712',
    '<:m4:1223818078840950906>': '1223285190416404560',
    [classEmojis.healer]: '1223280544406831174',
    [classEmojis.mage]: '1223280364894683298',
    [classEmojis.berserk]: '1223282322200334356',
    [classEmojis.archer]: '1223282271214108682',
    [classEmojis.tank]: '1223280516640411658'
}

module.exports = { reactionReady, reactionAdd, classEmojis };