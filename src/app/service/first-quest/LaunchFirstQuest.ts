import { DMChannel, GuildMember, TextBasedChannels, TextChannel } from 'discord.js';
import constants from '../constants/constants';
import fqConstants from '../constants/firstQuest';
import Log, { LogUtils } from '../../utils/Log';
import dbInstance from '../../utils/MongoDbUtils';
import { Db } from 'mongodb';
import client from '../../app';
import channelIds from '../constants/channelIds';
import { getPOAPLink } from './FirstQuestPOAP';
import roleIds from '../constants/roleIds';

export const sendFqMessage = async (dmChan: TextBasedChannels | string, member: GuildMember): Promise<void> => {

	try {
		await member.roles.remove(roleIds.firstQuestWelcome);
	} catch {
		Log.debug('failed to remove role');
	}

	const dmChannel: DMChannel = await getDMChannel(member, dmChan);

	const fqMessageContent = await getMessageContentFromDb();

	const fqMessage = await retrieveFqMessage(member);

	const content = fqMessageContent[fqMessage.message_id];

	const firstQuestMessage = await dmChannel.send({ content: content.replace(/\\n/g, '\n') });

	await firstQuestMessage.react(fqMessage.emoji);

	const filter = (reaction, user) => {
		return [fqMessage.emoji].includes(reaction.emoji.name) && !user.bot;
	};

	const collector = firstQuestMessage.createReactionCollector({ filter, max: 1, time: (20000 * 60), dispose: true });

	collector.on('end', async (collected, reason) => {

		if (reason === 'limit') {
			try {
				await nextStep(member, fqMessage.end_step);

				if (!(fqMessage.end_step === fqConstants.FIRST_QUEST_STEPS.first_quest_complete)) {
					await sendFqMessage(dmChannel, member);

				} else {
					await dmChannel.send({ content: fqMessageContent[getFqMessage(fqConstants.FIRST_QUEST_STEPS.first_quest_complete).message_id].replace(/\\n/g, '\n') });

					await getPOAPLink(member);
				}
			} catch (e) {
				Log.debug(`First Quest: failed to move to next step ${e}`);
			}
			return;
		}

		// if firstQuestMessage is not the last message,
		// time out silently (user probably invoked !first-quest).
		// Otherwise, send time out notification.
		if (firstQuestMessage.id === dmChannel.lastMessage.id) {
			try {
				await dmChannel.send('The conversation timed out. ' +
				'You can restart First Quest ' +
				'using the **/first-quest start** command');
			} catch (e) {
				Log.debug(`First Quest timed out, unable to send dm, error msg: ${e}`);
			}
		}

		if (!['limit', 'time'].includes(reason)) {
			Log.debug(`First Quest reaction collector stopped for unknown reason: ${reason}`);
		}
	});
};

export const fqRescueCall = async (): Promise<void> => {
	const db: Db = await dbInstance.connect(constants.DB_NAME);

	const firstQuestTracker = await db.collection(constants.DB_COLLECTION_FIRST_QUEST_TRACKER);

	const data = await firstQuestTracker.find({}).toArray();

	for (const fqUser of data) {
		if (!(fqUser.step === fqConstants.FIRST_QUEST_STEPS.first_quest_complete) && (fqUser.doneRescueCall === false)) {

			if ((+new Date() - fqUser.timestamp) >= (1000 * 60 * 60 * 24)) {

				const filter = { _id: fqUser._id };

				const options = { upsert: false };

				const updateDoc = { $set: { doneRescueCall: true } };

				await firstQuestTracker.updateOne(filter, updateDoc, options);

				const guilds = await client.guilds.fetch();

				for (const oAuth2Guild of guilds.values()) {
					const guild = await oAuth2Guild.fetch();

					if (guild.id === fqUser.guild) {
						let fqSupportThread;

						try {
							fqSupportThread = await client.channels.fetch(channelIds.firstQuestSupport) as TextChannel;

						} catch (e) {
							fqSupportThread = null;
							LogUtils.logError(`First Quest: Failed to fetch support thread and could not send rescue call for user ${fqUser._id}`, e);
						}

						if (fqSupportThread) {
							await fqSupportThread.send({ content: `User <@${fqUser._id}> appears to be stuck in first-quest, please extend some help.` });
						}
					}
				}
			}
		}
	}
};

const getMessageContentFromDb = async (): Promise<void> => {
	const db: Db = await dbInstance.connect(constants.DB_NAME);

	const firstQuestContent = await db.collection(constants.DB_COLLECTION_FIRST_QUEST_CONTENT).find({});

	const data = await firstQuestContent.toArray();

	return data[0].messages;
};

const getDMChannel = async (member: GuildMember, dmChan: TextBasedChannels | string): Promise<DMChannel> => {
	if (dmChan === 'undefined') {
		return await member.user.createDM();

	} else {
		return dmChan as DMChannel;
	}
};

export const firstQuestHandleUserRemove = async (member: GuildMember): Promise<void> => {
	const db: Db = await dbInstance.connect(constants.DB_NAME);

	const firstQuestTracker = await db.collection(constants.DB_COLLECTION_FIRST_QUEST_TRACKER);

	try {
		await firstQuestTracker.deleteOne({ _id: member.user.id });
	} catch {
		Log.error(`First Quest: Could not remove user ${member.user} from firstQuestTracker collection`);
	}
};

export const nextStep = async (member: GuildMember, toStep: string): Promise<void> => {
	const guild = member.guild;

	const filter = { _id: member.user.id };

	const options = { upsert: true };

	const updateDoc = { $set: { step: toStep, doneRescueCall: false, timestamp: Date.now(), guild: guild.id } };

	const db: Db = await dbInstance.connect(constants.DB_NAME);

	const dbFirstQuestTracker = db.collection(constants.DB_COLLECTION_FIRST_QUEST_TRACKER);

	await dbFirstQuestTracker.updateOne(filter, updateDoc, options);
};

export const addNewUserToDb = async (guildMember: GuildMember): Promise<void> => {
	const guild = guildMember.guild;

	const filter = { _id: guildMember.user.id };

	const options = { upsert: true };

	const updateDoc = { $set: { step: fqConstants.FIRST_QUEST_STEPS.verified, doneRescueCall: false, timestamp: Date.now(), guild: guild.id } };

	const db: Db = await dbInstance.connect(constants.DB_NAME);

	const dbFirstQuestTracker = db.collection(constants.DB_COLLECTION_FIRST_QUEST_TRACKER);

	await dbFirstQuestTracker.updateOne(filter, updateDoc, options);
};

const retrieveFqMessage = async (member):Promise<any> => {

	const db: Db = await dbInstance.connect(constants.DB_NAME);

	const firstQuestTracker = await db.collection(constants.DB_COLLECTION_FIRST_QUEST_TRACKER);

	const data = await firstQuestTracker.find({ '_id': member.user.id }).toArray();

	return getFqMessage(data[0].step);
};

const getFqMessage = (step_name: string) => {
	switch (step_name) {
	case (fqConstants.FIRST_QUEST_STEPS.verified):
		return fqMessageFlow['verified'];
	case (fqConstants.FIRST_QUEST_STEPS.first_quest_welcome):
		return fqMessageFlow['welcome'];
	case (fqConstants.FIRST_QUEST_STEPS.first_quest_membership):
		return fqMessageFlow['membership'];
	case (fqConstants.FIRST_QUEST_STEPS.firehose):
		return fqMessageFlow['firehose'];
	case (fqConstants.FIRST_QUEST_STEPS.first_quest_scholar):
		return fqMessageFlow['scholar'];
	case (fqConstants.FIRST_QUEST_STEPS.first_quest_guest_pass):
		return fqMessageFlow['guest_pass'];
	case (fqConstants.FIRST_QUEST_STEPS.first_quest):
		return fqMessageFlow['first_quest'];
	case (fqConstants.FIRST_QUEST_STEPS.first_quest_complete):
		return fqMessageFlow['complete'];
	}
};

const fqMessageFlow = {
	verified: {
		message_id: 'fq1',
		emoji: '🏦',
		start_step: fqConstants.FIRST_QUEST_STEPS.verified,
		end_step: fqConstants.FIRST_QUEST_STEPS.first_quest_welcome,
	},
	welcome: {
		message_id: 'fq2',
		emoji: '🏦',
		start_step: fqConstants.FIRST_QUEST_STEPS.first_quest_welcome,
		end_step: fqConstants.FIRST_QUEST_STEPS.first_quest_membership,
	},
	membership: {
		message_id: 'fq3',
		emoji: '🏦',
		start_step: fqConstants.FIRST_QUEST_STEPS.first_quest_membership,
		end_step: fqConstants.FIRST_QUEST_STEPS.firehose,
	},
	firehose: {
		message_id: 'fq4',
		emoji: '✏️',
		start_step: fqConstants.FIRST_QUEST_STEPS.firehose,
		end_step: fqConstants.FIRST_QUEST_STEPS.first_quest_scholar,
	},
	scholar: {
		message_id: 'fq5',
		emoji: '✏️',
		start_step: fqConstants.FIRST_QUEST_STEPS.first_quest_scholar,
		end_step: fqConstants.FIRST_QUEST_STEPS.first_quest_guest_pass,
	},
	guest_pass: {
		message_id: 'fq6',
		emoji: '✏️',
		start_step: fqConstants.FIRST_QUEST_STEPS.first_quest_guest_pass,
		end_step: fqConstants.FIRST_QUEST_STEPS.first_quest,
	},
	first_quest: {
		message_id: 'fq7',
		emoji: '🤠',
		start_step: fqConstants.FIRST_QUEST_STEPS.first_quest,
		end_step: fqConstants.FIRST_QUEST_STEPS.first_quest_complete,
	},
	complete: {
		message_id: 'fq8',
		emoji: '',
		start_step: fqConstants.FIRST_QUEST_STEPS.first_quest_complete,
		end_step: fqConstants.FIRST_QUEST_STEPS.verified,
	},
};
