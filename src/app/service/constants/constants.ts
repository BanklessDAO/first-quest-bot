export default Object.freeze({
	DB_NAME: 'firstquest',
	
	DB_COLLECTION_FIRST_QUEST_CONTENT: 'firstQuestContent',
	DB_COLLECTION_FIRST_QUEST_TRACKER: 'firstQuestTracker',
	DB_COLLECTION_FIRST_QUEST_POAPS: 'firstQuestPOAPs',
	
	MONGODB_URI_PARTIAL: `${process.env.MONGODB_PREFIX}://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASS}@${process.env.MONGODB_CLUSTER}/`,
	MONGODB_OPTIONS: '?retryWrites=true&w=majority',
	
	EMOJIS: {
		'1': '\u0031\uFE0F\u20E3',
		'2': '\u0032\uFE0F\u20E3',
		'3': '\u0033\uFE0F\u20E3',
		'4': '\u0034\ufe0f\u20e3',
		'5': '\u0035\ufe0f\u20e3',
		'6': '\u0036\ufe0f\u20e3',
		'7': '\u0037\ufe0f\u20e3',
		'8': '\u0038\ufe0f\u20e3',
		'9': '\u0039\ufe0f\u20e3',
		plus: '\u2795\u2B1C',
		memo: String.fromCodePoint(0x1F4DD),
		cross_mark: '\u274C',
	},
	
});