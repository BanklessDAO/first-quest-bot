import {
	CommandContext,
	CommandOptionType,
	SlashCommand,
	SlashCreator,
} from 'slash-create';
import ServiceUtils from '../../utils/ServiceUtils';
import ConfigureFirstQuest from '../../service/first-quest/ConfigureFirstQuest';
import ValidationError from '../../errors/ValidationError';
import discordServerIds from '../../service/constants/discordServerIds';
import FirstQuestPOAP from '../../service/first-quest/FirstQuestPOAP';
import { addNewUserToDb, sendFqMessage } from '../../service/first-quest/LaunchFirstQuest';
import Log, { LogUtils } from '../../utils/Log';

export default class FirstQuest extends SlashCommand {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: 'first-quest',
			description: 'First Quest commands',
			guildIDs: [discordServerIds.banklessDAO, discordServerIds.firstQuestBotTest],
			options: [
				{
					name: 'start',
					type: CommandOptionType.SUB_COMMAND,
					description: '(Re)start First Quest',
					options: [],
				},
				{
					name: 'config',
					type: CommandOptionType.SUB_COMMAND,
					description: 'Configure First Quest message content',
					options: [],
				},
				{
					name: 'poap-refill',
					type: CommandOptionType.SUB_COMMAND,
					description: 'Update POAP claim links',
					options: [
						{
							name: 'refill-type',
							type: CommandOptionType.STRING,
							description: 'Add or replace POAPs ',
							required: true,
							choices: [
								{
									name: 'add',
									value: 'ADD',
								},
								{
									name: 'replace',
									value: 'REPLACE',
								},
							],
						},
					],
				},

			],
			throttling: {
				usages: 1,
				duration: 1,
			},
			defaultPermission: true,
		});
	}

	async run(ctx: CommandContext): Promise<any> {
		LogUtils.logCommandStart(ctx);
		if (ctx.user.bot) return;
		let command: Promise<any>;
		try {
			const { guildMember } = await ServiceUtils.getGuildAndMember(ctx);
			switch (ctx.subcommands[0]) {
			case 'start':
				await ctx?.send(`Hi, ${ctx.user.mention}! First Quest was launched, please make sure DMs are active.`);

				await addNewUserToDb(guildMember);

				command = sendFqMessage('undefined', guildMember).catch(Log.error);

				break;
			case 'config':
				command = ConfigureFirstQuest(guildMember, ctx);
				break;
			// case 'poap-refill':
			// 	command = FirstQuestPOAP(guildMember, ctx);
			// 	break;
			default:
				return ctx.send(`${ctx.user.mention} Please try again.`);
			}
		} catch {
			this.handleCommandError(ctx, command);
		}
	}

	handleCommandError(ctx: CommandContext, command: Promise<any>): void {
		command.catch(e => {
			if (e instanceof ValidationError) {
				return ctx.send({ content: `${e.message}`, ephemeral: true });
			} else {
				LogUtils.logError('failed to handle first-quest command', e);
				return ServiceUtils.sendOutErrorMessage(ctx);
			}
		});
	}

}
