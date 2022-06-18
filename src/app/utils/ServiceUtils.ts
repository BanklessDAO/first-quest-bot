/**
 * Utilities for service layer
 */
import {
	AwaitMessagesOptions,
	DMChannel,
	Guild,
	GuildMember, MessageAttachment,
} from 'discord.js';
import { ButtonStyle, CommandContext, ComponentActionRow, ComponentType } from 'slash-create';
import client from '../app';
import ValidationError from '../errors/ValidationError';
import roleIds from '../service/constants/roleIds';
import discordServerIds from '../service/constants/discordServerIds';

const ServiceUtils = {
	async getGuildAndMember(ctx: CommandContext): Promise<{ guild: Guild, guildMember: GuildMember }> {
		const guild = await client.guilds.fetch(ctx.guildID);
		return {
			guild: guild,
			guildMember: await guild.members.fetch(ctx.user.id),
		};
	},

	hasRole(guildMember: GuildMember, role: string): boolean {
		return guildMember.roles.cache.some(r => r.id === role);
	},

	hasSomeRole(guildMember: GuildMember, roles: string[]): boolean {
		for (const role of roles) {
			if (ServiceUtils.hasRole(guildMember, role)) {
				return true;
			}
		}
		return false;
	},

	isAtLeastLevel2(guildMember: GuildMember): boolean {
		return ServiceUtils.hasSomeRole(guildMember, [
			roleIds.level2,
			roleIds.level3,
			roleIds.level4,
			roleIds.admin,
			roleIds.genesisSquad,
		]);
	},
	
	validateLevel2AboveMembers(guildMember: GuildMember): void {
		if (!(ServiceUtils.isAtLeastLevel2(guildMember))) {
			throw new ValidationError('Must be `level 2` or above member.');
		}
	},
	
	isBanklessDAO(guild: Guild): boolean {
		if (guild == null || guild.id == null) {
			return false;
		}
		return guild.id == discordServerIds.banklessDAO || guild.id == discordServerIds.firstQuestBotTest;
	},

	/**
	 * Returns the first message in DM channel from the user
	 * @param dmChannel direct message channel
	 * @param waitInMilli number of milliseconds the bot should wait for a reply
	 */
	async getFirstUserReply(dmChannel: DMChannel, waitInMilli?: number): Promise<any> {
		waitInMilli = (waitInMilli == null) ? 600000 : waitInMilli;
		return (await dmChannel.awaitMessages({
			max: 1,
			time: waitInMilli,
			errors: ['time'],
		})).first().content;
	},
	
	async askForLinksMessageAttachment(guildMember: GuildMember): Promise<MessageAttachment> {
		const sendOutPOAPReplyMessage = await guildMember.send({ content: 'Please upload links.txt file from POAP.' });
		const dmChannel: DMChannel = await sendOutPOAPReplyMessage.channel.fetch() as DMChannel;
		const replyOptions: AwaitMessagesOptions = {
			max: 1,
			time: 180000,
			errors: ['time'],
		};
		return (await dmChannel.awaitMessages(replyOptions)).first().attachments.first();
	},
	
	sendOutErrorMessage: async (ctx: CommandContext): Promise<any> => {
		const row: ComponentActionRow = {
			type: ComponentType.ACTION_ROW,
			components: [{
				type: ComponentType.BUTTON,
				style: ButtonStyle.LINK,
				label: 'Support',
				url: 'https://discord.gg/NRj43H83nJ',
			}],
		};
		await ctx.send({
			content: 'Something is not working. Please reach out to us and a support member will happily assist!',
			ephemeral: true,
			components: [row],
		});
	},
};

export default ServiceUtils;
