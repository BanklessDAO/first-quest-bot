import { Client, Guild } from 'discord.js';
import constants from '../service/constants/constants';
import { DiscordEvent } from '../types/discord/DiscordEvent';
import Log, { LogUtils } from '../utils/Log';
import MongoDbUtils from '../utils/MongoDbUtils';
// import FirstQuestRescueService from '../service/first-quest/FirstQuestRescueService';
import FirstQuestUtils from '../utils/FirstQuestUtils';

export default class implements DiscordEvent {
	name = 'ready';
	once = true;

	async execute(client: Client): Promise<any> {
		try {
			Log.info('Starting up the bot...');
			
			client.user.setActivity(process.env.DISCORD_BOT_ACTIVITY);
			client.guilds.cache.forEach((guild: Guild) => {
				Log.info(`Bot is active for: ${guild.id}, ${guild.name}`);
			});
			await MongoDbUtils.connect(constants.DB_NAME);
			Log.info(`connected to MongoDB ${constants.DB_NAME}`);
			await FirstQuestUtils.fqInit().catch(Log.error);
			// await FirstQuestRescueService().catch(Log.error);
			
			Log.info('Bot is ready!');
		} catch (e) {
			LogUtils.logError('Error processing event ready', e);
		}
	}
}
