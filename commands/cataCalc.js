const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu
} = require('discord.js');

const { 
    apiKey,
} = require('../config.js');

const row = new MessageActionRow()
.addComponents(
    new MessageSelectMenu()
        .setCustomId('floor')
        .setPlaceholder('Floor 7')
        .addOptions([
            {
                label: 'Floor 1',
                description: '80 XP',
                value: 'floor_1',
            },
            {
                label: 'Floor 2',
                description: '160 XP',
                value: 'floor_2',
            },
            {
                label: 'Floor 3',
                description: '400 XP',
                value: 'floor_3',
            },
            {
                label: 'Floor 4',
                description: '1420 XP',
                value: 'floor_4',
            },
            {
                label: 'Floor 5',
                description: '2400 XP',
                value: 'floor_5',
            },
            {
                label: 'Floor 6',
                description: '5000 XP',
                value: 'floor_6',
            },
            {
                label: 'Floor 7',
                description: '28000 XP',
                value: 'floor_7',
            },
            {
                label: 'M1',
                description: '10000 XP',
                value: 'master_1',
            },
            {
                label: 'M2',
                description: '144444 XP',
                value: 'master_2',
            },
            {
                label: 'M3',
                description: '35000 XP',
                value: 'master_3',
            },
            {
                label: 'M4',
                description: '61111 XP',
                value: 'master_4',
            },
            {
                label: 'M5',
                description: '70000 XP',
                value: 'master_5',
            },
            {
                label: 'M6',
                description: '100000 XP',
                value: 'master_6',
            },
            {
                label: 'M7',
                description: '300000 XP',
                value: 'master_7',
            },
        ]),
);

async function cataCalcEmbed(embedData) {
    embed = new MessageEmbed()
    .setTitle(`Catacombs Calculation for ${embedData.name}`)
    .setDescription(`
    **${embedData.name}** needs **${embedData.floors} ${embedData.type}${embedData.floor}** runs to get from **${embedData.level}** to **${embedData.request}**.
    **Base XP** ${baseExp[embedData.type][embedData.floor].toLocaleString()}
    **Bonus** ${embedData.bonus}
    **Current XP** ${Math.floor(embedData.exp).toLocaleString()}
    **XP until level ${embedData.request}** ${Math.floor(experienceToLevel[embedData.request] - embedData.exp).toLocaleString()}
    `)
    .setThumbnail('https://visage.surgeplay.com/full/512/' + embedData.uuid)
    .setColor('b93f3f')
    .setFooter({ text: 'by snailify', iconURL: 'https://wiki.hypixel.net/images/e/e9/SkyBlock_items_master_skull_tier_7.png' })
    return embed;
}

async function cataCalcCommand(requestedPlayer, floorType, requestedFloor, requestedLevel) {
    let uuid;
    if (!floorType) {
        floorType = 'f';
    }
    if (!requestedFloor) {
        requestedFloor = '7';
    }
    const response0 = await fetch(`https://api.mojang.com/users/profiles/minecraft/${requestedPlayer}`);
    const json0 = await response0.json();
    uuid = json0.id;
    requestedPlayer = json0.name;
    let cataLevel = 0;
    let cataExperience = 0;
    let completionBonus = 0;
    let requiredFloors = 0;
    const response1 = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?key=${apiKey}&uuid=${uuid}`);
    const json1 = await response1.json();
    if (json1.success == true && json1.profiles != null) {
        for (let profile of json1.profiles) {
          if (profile.selected === true) {
            try {
                cataExperience = profile.members[uuid].dungeons.dungeon_types.catacombs.experience
                cataLevel = await convertToLevel(cataExperience);
                if (floorType == 'f') {
                    completionBonus = profile.members[uuid].dungeons.dungeon_types.catacombs.tier_completions[requestedFloor];
                }
                else {
                    completionBonus = profile.members[uuid].dungeons.dungeon_types.master_catacombs.tier_completions[requestedFloor];
                }
                if (!completionBonus) completionBonus = 0;
                if (!requestedLevel) {
                    requestedLevel = cataLevel + 1;
                }
                if (completionBonus > 50) {
                    completionBonus = 50;
                }
                const expDifference = experienceToLevel[requestedLevel] - cataExperience
                completionBonus = completionBonus / 100;
                completionBonus = completionBonus + 1;
                requiredFloors = Math.floor(expDifference / (baseExp[floorType][requestedFloor] * completionBonus))
            }
            catch (e) {
                console.error(e);
            }
          }
        }
    }
    const embedData = {
        "uuid": uuid,
        "name": requestedPlayer,
        "level": cataLevel,
        "request": requestedLevel,
        "exp": cataExperience,
        "floors": requiredFloors,
        "floor": requestedFloor,
        "type": floorType,
        "bonus": `${completionBonus * 100}%`
    }
    message = {embeds: [await cataCalcEmbed(embedData)], components: [row]};
    return message;
}

const cataCalcCommandData = {
    name: "calc",
    description: "Calculates required catacombs experience",
    options: [
    {
        name: "level",
        type: "NUMBER",
        description: "level",
        required: true
    },
    {
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

async function convertToLevel(experience) {
    level = Math.round(experienceToLevel.reduce((acc, val, idx) => {
        if (experience >= val && experience < experienceToLevel[idx + 1]) {
            return idx + ((experience - val) / (experienceToLevel[idx + 1] - val));
        }
        return acc;
    }) * 100) / 100;
    return level;
}

const baseExp = {
    "f": {
        "1": 80,
        "2": 160,
        "3": 400,
        "4": 1420,
        "5": 2400,
        "6": 5000,
        "7": 28000
    },
    "m": {
        "1": 10000,
        "2": 14444,
        "3": 35000,
        "4": 61111,
        "5": 70000,
        "6": 100000,
        "7": 300000
    }
};

const experienceToLevel = [
    0,             50,             125,            235,
    395,            625,             955,           1425,
   2095,           3045,            4385,           6275,
   8940,          12700,           17960,          25340,
  35640,          50040,           70040,          97640,
 135640,         188140,          259640,         356640,
 488640,         668640,          911640,        1239640,
1684640,        2284640,         3084640,        4149640,
5559640,        7459640,         9959640,       13259640,
17559640,       23159640,        30359640,       39559640,
51559640,       66559640,        85559640,      109559640,
139559640,      177559640,       225559640,      285559640,
360559640,      453559640,       569809640,      686109640,
918709640,     1383909640,      2314309640,     4175109640,
7896709640,    15339909640,     30226309640,    59999109640,
119544709640,   238635909640,    476818309640,   953183109640,
1905912709640,  3811371909640,   7622290309640, 15244127109640,
30487800709640, 60975147909640, 121949842309640
]

module.exports = {
    cataCalcCommand,
    cataCalcCommandData
};