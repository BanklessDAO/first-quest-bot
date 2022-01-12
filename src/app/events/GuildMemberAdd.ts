import { GuildMember } from 'discord.js';
import { DiscordEvent } from '../types/discord/DiscordEvent';
import Log, { LogUtils } from '../utils/Log';
import StartFirstQuestFlow from './first-quest/StartFirstQuestFlow';

export default class implements DiscordEvent {
	name = 'guildMemberAdd';
	once = false;

	async execute(member: GuildMember): Promise<any> {
		if (member.user.bot) return;
		try {
			if (member.partial) {
				member = await member.fetch();
			}
			
			await StartFirstQuestFlow(member).catch(Log.error);
			
		} catch (e) {
			LogUtils.logError('failed to process event guildMemberAdd', e);
		}
	}
}

