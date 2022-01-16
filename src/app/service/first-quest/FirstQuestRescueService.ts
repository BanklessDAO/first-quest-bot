import { fqRescueCall } from './LaunchFirstQuest';
import { checkPOAPExpiration } from './FirstQuestPOAP';
import cron from 'cron';
import Log from '../../utils/Log';
import channelIds from '../constants/channelIds';
import { TextBasedChannels } from 'discord.js';
import client from '../../app';

const dateTimeString = () => {
	const currentDate = new Date();
	const datetime = 'Cron executed: ' + currentDate.getDate() + '/'
		+ (currentDate.getMonth() + 1) + '/'
		+ currentDate.getFullYear() + ' @ '
		+ currentDate.getHours() + ':'
		+ currentDate.getMinutes() + ':'
		+ currentDate.getSeconds();
	return datetime;
};

export default async (): Promise<any> => {
	const job = new cron.CronJob('0 0 0/2 * * *', async function() {
		await fqRescueCall();
		Log.info(`First Quest: fqRescueCall() cron job executed on ${dateTimeString()}`);
	}, null, true, 'America/Los_Angeles');
	job.start();

	const job2 = new cron.CronJob('0 0 0/6 * * *', async function() {
		await checkPOAPExpiration();
		Log.info(`First Quest: checkPOAPExpiration() cron job executed on ${dateTimeString()}`);
	}, null, true, 'America/Los_Angeles');
	job2.start();

	const job3 = new cron.CronJob('0 0/30 * * * *', async function() {
		const infoChannel = await client.channels.fetch(channelIds.captchaVerification) as TextBasedChannels;
		await infoChannel.send({ content: 'to start first-quest manually, make sure DMs are enabled and run `/first-quest start` command' });
		Log.info(`First Quest: /first-quest start reminder cron job executed on ${dateTimeString()}`);
	}, null, true, 'America/Los_Angeles');
	job3.start();
};

