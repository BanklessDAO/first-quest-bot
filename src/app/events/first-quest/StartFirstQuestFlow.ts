import channelIds from '../../service/constants/channelIds';
import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import Log from '../../utils/Log';
import { addNewUserToDb, sendFqMessage } from '../../service/first-quest/LaunchFirstQuest';
import roleIds from '../../service/constants/roleIds';

const StartFirstQuestFlow = async (guildMember: GuildMember): Promise<void> => {
	Log.debug(`starting first quest flow for new user ${guildMember.user.tag}`);

	const captcha = null;

	runSuccessAndTimeout(guildMember, captcha, false);
};

const runSuccessAndTimeout = async (guildMember: GuildMember, captcha: any, isKickOnFailureSet: boolean) => {
	Log.debug(`sending FQ message for ${guildMember.user.tag} in channel ${channelIds.captchaVerification}`);
	await addNewUserToDb(guildMember);
	await sendFqMessage('undefined', guildMember);
	const verificationChannel: TextChannel = await guildMember.guild.channels.fetch(channelIds.captchaVerification) as TextChannel;
	const message: Message = await verificationChannel.send({
		embeds: [{
			title: 'First Quest Start',
			description: 'Please enable DMs to begin your first quest. In case DMs are off, first quest can begin with the slash command `/first-quest start`',
		}],
	});
	setTimeout(async () => {
		await message.delete().catch(Log.error);
	}, 5000);

	if (!isKickOnFailureSet) {
		captcha.on('timeout', async () => {
			Log.debug(`captcha timeout for ${guildMember.user.tag}`);
			// await guildMember.kick('captcha timeout').catch(Log.error);
		});
	}
};

/*
const getCaptchaOptions = (guildMember: GuildMember, kickOnFailure: boolean) => {
	return {
		guildID: guildMember.guild.id,
		roleID: roleIds.firstQuestWelcome,
		channelID: channelIds.captchaVerification,
		kickOnFailure: kickOnFailure,
		attempts: 1,
		timeout: 180000,
		showAttemptCount: true,
		caseSensitive: true,
		sendToTextChannel: true,
		customSuccessEmbed: new MessageEmbed({
			title: 'Success',
			color: '#1e7e34',
			description: 'Please check your DMs to begin your first Quest!',
		}),
	};
};
*/

export default StartFirstQuestFlow;