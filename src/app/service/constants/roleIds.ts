const roleIds = Object.freeze({
	admin: process.env.DISCORD_ROLE_ADMIN_ROLE_ID,
	genesisSquad: process.env.DISCORD_ROLE_GENESIS_SQUAD,
	level4: process.env.DISCORD_ROLE_LVL_4,
	level3: process.env.DISCORD_ROLE_LEVEL_3,
	level2: process.env.DISCORD_ROLE_CONTRIBUTORS_LVL_2,
	firstQuestProject: process.env.DISCORD_ROLE_FIRST_QUEST_PROJECT,
	firstQuestWelcome: process.env.DISCORD_ROLE_FIRST_QUEST_WELCOME,
});

export default roleIds;