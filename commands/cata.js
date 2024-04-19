const {
    MessageEmbed,
} = require('discord.js');

const { 
    apiKey,
    githubKey,
    githubId
} = require('../config.js');

const {
    classEmojis
} = require('./reactionRoles.js');

async function cataCommand(requestedPlayer, interaction) {
    interaction.deferReply();
    let uuid;
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
    else {
    const response0 = await fetch(`https://api.mojang.com/users/profiles/minecraft/${requestedPlayer}`);
    const json0 = await response0.json();
    uuid = json0.id;
    requestedPlayer = json0.name;
    }
  const response1 = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?key=${apiKey}&uuid=${uuid}`);
      const json1 = await response1.json();
        let cataExperience = 0;
        let level = 0;
        let classLevels = {
          healer: 0,
          mage: 0,
          berserk: 0,
          archer: 0,
          tank: 0
        }
        let classExperience = {
          healer: 0,
          mage: 0,
          berserk: 0,
          archer: 0,
          tank: 0
        }
        let secretsFound = 0;
        let profileName = '';
        let dailyRuns = 0;
        let floorCompletions = {};
        let masterCompletions = {};
        if (json1.success == true) {
        for (let profile of json1.profiles) {
          if (profile.selected === true) {
            try {
             cataExperience = profile.members[uuid].dungeons.dungeon_types.catacombs.experience;
             secretsFound = profile.members[uuid].dungeons.secrets;
             profileName = profile.cute_name;
             dailyRuns = profile.members[uuid].dungeons.daily_runs.completed_runs_count;
             floorCompletions = profile.members[uuid].dungeons.dungeon_types.catacombs.tier_completions;
             masterCompletions = profile.members[uuid].dungeons.dungeon_types.master_catacombs.tier_completions;
             level = await convertToLevel(cataExperience);
             const classes = profile.members[uuid].dungeons.player_classes;
             for (playerClass in classes) {
               classExperience[playerClass] = Math.floor(classes[playerClass].experience);
               classLevels[playerClass] = await convertToLevel(classes[playerClass].experience);
             }
            }
            catch(e) {
                console.error(e);
            }
          }
        }           
        const response2 = await fetch(`https://api.hypixel.net/v2/player?key=${apiKey}&uuid=${uuid}`);
        const json2 = await response2.json();
        let totalSecretsFound = json2.success === true && json2.profiles !== null ? json2.player.achievements.skyblock_treasure_hunter : 0;
        const cataData = {
          "uuid": uuid,
          "name": requestedPlayer,
          "profile": profileName,
          "level": level,
          "classes": classLevels,
          "experience": classExperience,
          "secrets": secretsFound,
          "totalSecrets": totalSecretsFound,
          "daily": dailyRuns,
          "floors": floorCompletions,
          "master": masterCompletions
        }
        interaction.editReply({embeds: [await cataEmbed(cataData)]});
    }
    else {
        interaction.editReply('Invalid user.');
    }
}

async function convertToLevel(experience) {
    level = Math.round(experienceToLevel.reduce((acc, val, idx) => {
        if (experience >= val && experience < experienceToLevel[idx + 1]) {
            return idx + ((experience - val) / (experienceToLevel[idx + 1] - val));
        }
        return acc;
    }) * 100) / 100;
    return level;
}

const experienceToLevel = [
    0,          50,         125,         235,         395,
  625,         955,        1425,        2095,        3045,
 4385,        6275,        8940,       12700,       17960,
25340,       35640,       50040,       70040,       97640,
135640,      188140,      259640,      356640,      488640,
668640,      911640,     1239640,     1684640,     2284640,
3084640,     4149640,     5559640,     7459640,     9959640,
13259640,    17559640,    23159640,    30359640,    39559640,
51559640,    66559640,    85559640,   109559640,   139559640,
177559640,   225559640,   285559640,   360559640,   453559640,
569809640, 686059640, 802309640, 918559640, 1034809640, 1151059640, 1267309640, 1383559640, 1499809640, 1616059640, 1732309640, 1848559640, 1964809640, 2081059640, 2197309640, 2313559640, 2429809640, 2546059640, 2662309640, 2778559640, 2894809640, 3011059640, 3127309640, 3243559640, 3359809640, 3476059640, 3592309640, 3708559640, 3824809640, 3941059640, 4057309640, 4173559640, 4289809640, 4406059640, 4522309640, 4638559640, 4754809640, 4871059640, 4987309640, 5103559640, 5219809640, 5336059640, 5452309640, 5568559640, 5684809640, 5801059640, 5917309640, 6033559640, 6149809640, 6266059640
]

async function cataEmbed(cataData) {
    let totalFloor = 0;
    let totalMaster = 0;
    for (let i = 0; i <= 7; i++) {
        cataData.floors[i] = cataData.floors[i] || 0;
        cataData.master[i] = cataData.master[i] || 0;
    }
    for (floor in cataData.floors) {
        if (floor == 'total') break;
        totalFloor += cataData.floors[floor];
    }
    for (floor in cataData.master) {
        if (floor == 'total') break;
        totalMaster += cataData.master[floor];
    }
    cataData.secrets = cataData.secrets || 0;
    cataData.totalSecrets = cataData.totalSecrets || 0;

    embed = new MessageEmbed()
    .setTitle(cataData.name + "'s " + 'Dungeon Stats on ' + cataData.profile)
    .setDescription(`**<:cata:1224310220482809957> Catacombs** ${cataData.level}
    **<:chest:1224310196256637008> Secrets on this profile** ${cataData.secrets.toLocaleString()}
    **<:treasure:1224311822266667061> Total secrets on account** ${cataData.totalSecrets.toLocaleString()}
    **${classEmojis.healer} ${cataData.classes.healer}** (${cataData.experience.healer.toLocaleString()} XP)
    **${classEmojis.mage} ${cataData.classes.mage}** (${cataData.experience.mage.toLocaleString()} XP)
    **${classEmojis.berserk} ${cataData.classes.berserk}** (${cataData.experience.berserk.toLocaleString()} XP)
    **${classEmojis.archer} ${cataData.classes.archer}** (${cataData.experience.archer.toLocaleString()} XP)
    **${classEmojis.tank} ${cataData.classes.tank}** (${cataData.experience.tank.toLocaleString()} XP)
    **<:wither:1226007113155743754> Runs today** ${cataData.daily}`)
    .addFields({
        name: '<:entrance:1224310328284938373> The Watcher',
        value: `<:cata:1224310717872738466> ${cataData.floors[0].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m1:1224310306386350211> Bonzo',
        value: `<:cata:1224310717872738466> ${cataData.floors[1].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[1].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m2:1224310275033792663> Scarf',
        value: `<:cata:1224310717872738466> ${cataData.floors[2].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[2].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m3:1224310240649154692> Professor',
        value: `<:cata:1224310717872738466> ${cataData.floors[3].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[3].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m4:1223818078840950906> Thorn',
        value: `<:cata:1224310717872738466> ${cataData.floors[4].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[4].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m5:1223818054681755718> Livid',
        value: `<:cata:1224310717872738466> ${cataData.floors[5].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[5].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m6:1223818019411591269> Sadan',
        value: `<:cata:1224310717872738466> ${cataData.floors[6].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[6].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: '<:m7:1223817988810215495> Necron',
        value: `<:cata:1224310717872738466> ${cataData.floors[7].toLocaleString()}
                <:master:1224310693579194389> ${cataData.master[7].toLocaleString()}`,
        inline: true
    })
    .addFields({
        name: 'Total',
        value: `<:cata:1224310717872738466> ${totalFloor.toLocaleString()}
                <:master:1224310693579194389> ${totalMaster.toLocaleString()}`,
        inline: true
    })
    .setThumbnail('https://visage.surgeplay.com/full/512/' + cataData.uuid)
    .setColor('b93f3f')
    .setFooter({ text: 'by snailify', iconURL: 'https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png' })
    return embed;
}

const cataCommandData = {
    name: "cata",
    description: "Dungeons information for the requested player",
    options: [{
        name: "username",
        type: "STRING",
        description: "username",
        required: false
    },
    {
        name: "profile",
        type: "STRING",
        description: "profile",
        required: false
    }
    ]
}

module.exports = {
    cataCommand,
    cataCommandData
}
