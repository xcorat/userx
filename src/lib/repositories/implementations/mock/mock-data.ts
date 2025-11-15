// Mock data for POC
import type { User, PublicQuestion, PublicAnswer, DMQuestion, DMAnswer } from '$lib/models';
import { AnswerVisibility } from '$lib/models';

export const mockUsers: User[] = [
	{
		id: 'user_1',
		username: 'alicejohnson',
		name: 'Alice Johnson',
		email: 'alice@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
		createdAt: new Date('2024-01-15')
	},
	{
		id: 'user_2',
		username: 'bobsmith',
		name: 'Bob Smith',
		email: 'bob@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
		createdAt: new Date('2024-01-20')
	},
	{
		id: 'user_3',
		username: 'caroldavis',
		name: 'Carol Davis',
		email: 'carol@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
		createdAt: new Date('2024-02-01')
	},
	{
		id: 'user_4',
		username: 'davidwilson',
		name: 'David Wilson',
		email: 'david@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
		createdAt: new Date('2024-02-10')
	},
	{
		id: 'user_5',
		username: 'emmabrown',
		name: 'Emma Brown',
		email: 'emma@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
		createdAt: new Date('2024-02-15')
	}
];

export const mockQuestions: PublicQuestion[] = [
	{
		id: 'q_1',
		text: "What's your ideal weekend activity?",
		choices: [
			{ id: 'q1_c1', text: 'Outdoor adventure', order: 0 },
			{ id: 'q1_c2', text: 'Reading at home', order: 1 },
			{ id: 'q1_c3', text: 'Social gathering', order: 2 },
			{ id: 'q1_c4', text: 'Creative projects', order: 3 }
		],
		imageHashId: 'img_weekend',
		createdBy: 'user_1',
		createdAt: new Date('2024-03-01')
	},
	{
		id: 'q_2',
		text: 'Coffee or tea?',
		choices: [
			{ id: 'q2_c1', text: 'Coffee all the way', order: 0 },
			{ id: 'q2_c2', text: 'Tea person', order: 1 },
			{ id: 'q2_c3', text: 'Both equally', order: 2 },
			{ id: 'q2_c4', text: 'Neither', order: 3 }
		],
		createdBy: 'user_2',
		createdAt: new Date('2024-03-05')
	},
	{
		id: 'q_3',
		text: 'How do you prefer to work?',
		choices: [
			{ id: 'q3_c1', text: 'Early morning', order: 0 },
			{ id: 'q3_c2', text: 'Late night', order: 1 },
			{ id: 'q3_c3', text: 'Flexible hours', order: 2 }
		],
		createdBy: 'user_1',
		createdAt: new Date('2024-03-08')
	},
	{
		id: 'q_4',
		text: 'Favorite type of music?',
		choices: [
			{ id: 'q4_c1', text: 'Rock/Pop', order: 0 },
			{ id: 'q4_c2', text: 'Classical', order: 1 },
			{ id: 'q4_c3', text: 'Hip Hop/Rap', order: 2 },
			{ id: 'q4_c4', text: 'Electronic', order: 3 },
			{ id: 'q4_c5', text: 'Jazz/Blues', order: 4 }
		],
		createdBy: 'user_3',
		createdAt: new Date('2024-03-10')
	},
	{
		id: 'q_5',
		text: 'Beach or mountains?',
		choices: [
			{ id: 'q5_c1', text: 'Beach vacation', order: 0 },
			{ id: 'q5_c2', text: 'Mountain getaway', order: 1 },
			{ id: 'q5_c3', text: 'City exploration', order: 2 }
		],
		imageHashId: 'img_nature',
		createdBy: 'user_2',
		createdAt: new Date('2024-03-12')
	},
	{
		id: 'q_6',
		text: 'How do you handle stress?',
		choices: [
			{ id: 'q6_c1', text: 'Exercise', order: 0 },
			{ id: 'q6_c2', text: 'Meditation', order: 1 },
			{ id: 'q6_c3', text: 'Talk to friends', order: 2 },
			{ id: 'q6_c4', text: 'Work through it', order: 3 }
		],
		createdBy: 'user_4',
		createdAt: new Date('2024-03-14')
	},
	{
		id: 'q_7',
		text: 'Preferred learning style?',
		choices: [
			{ id: 'q7_c1', text: 'Visual (videos, diagrams)', order: 0 },
			{ id: 'q7_c2', text: 'Reading', order: 1 },
			{ id: 'q7_c3', text: 'Hands-on practice', order: 2 },
			{ id: 'q7_c4', text: 'Discussion', order: 3 }
		],
		createdBy: 'user_5',
		createdAt: new Date('2024-03-16')
	},
	{
		id: 'q_8',
		text: 'Dogs or cats?',
		choices: [
			{ id: 'q8_c1', text: 'Dogs', order: 0 },
			{ id: 'q8_c2', text: 'Cats', order: 1 },
			{ id: 'q8_c3', text: 'Both!', order: 2 },
			{ id: 'q8_c4', text: 'Neither', order: 3 }
		],
		imageHashId: 'img_pets',
		createdBy: 'user_1',
		createdAt: new Date('2024-03-18')
	}
];

export const mockAnswers: PublicAnswer[] = [
	{
		id: 'ans_1',
		userId: 'user_1',
		questionId: 'q_2',
		choiceId: 'q2_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-06')
	},
	{
		id: 'ans_2',
		userId: 'user_2',
		questionId: 'q_1',
		choiceId: 'q1_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-02')
	},
	{
		id: 'ans_3',
		userId: 'user_3',
		questionId: 'q_1',
		choiceId: 'q1_c1',
		visibility: AnswerVisibility.PRIVATE,
		createdAt: new Date('2024-03-03')
	},
	{
		id: 'ans_4',
		userId: 'user_4',
		questionId: 'q_1',
		choiceId: 'q1_c2',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-03')
	},
	{
		id: 'ans_5',
		userId: 'user_5',
		questionId: 'q_1',
		choiceId: 'q1_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-04')
	},
	{
		id: 'ans_6',
		userId: 'user_2',
		questionId: 'q_2',
		choiceId: 'q2_c2',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-06')
	},
	{
		id: 'ans_7',
		userId: 'user_3',
		questionId: 'q_2',
		choiceId: 'q2_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-07')
	},
	{
		id: 'ans_8',
		userId: 'user_1',
		questionId: 'q_3',
		choiceId: 'q3_c3',
		visibility: AnswerVisibility.PRIVATE,
		createdAt: new Date('2024-03-09')
	},
	{
		id: 'ans_9',
		userId: 'user_4',
		questionId: 'q_2',
		choiceId: 'q2_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-07')
	},
	{
		id: 'ans_10',
		userId: 'user_5',
		questionId: 'q_3',
		choiceId: 'q3_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-09')
	},
	{
		id: 'ans_11',
		userId: 'user_1',
		questionId: 'q_5',
		choiceId: 'q5_c2',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-13')
	},
	{
		id: 'ans_12',
		userId: 'user_2',
		questionId: 'q_5',
		choiceId: 'q5_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-13')
	},
	{
		id: 'ans_13',
		userId: 'user_3',
		questionId: 'q_5',
		choiceId: 'q5_c3',
		visibility: AnswerVisibility.PRIVATE,
		createdAt: new Date('2024-03-13')
	},
	{
		id: 'ans_14',
		userId: 'user_4',
		questionId: 'q_8',
		choiceId: 'q8_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-19')
	},
	{
		id: 'ans_15',
		userId: 'user_5',
		questionId: 'q_8',
		choiceId: 'q8_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-19')
	}
];

export const mockDMQuestions: DMQuestion[] = [
	{
		id: 'dmq_1',
		senderId: 'user_1',
		recipientId: 'user_2',
		text: 'What do you think about the new project?',
		choices: [
			{ id: 'dmq1_c1', text: 'Excited!', order: 0 },
			{ id: 'dmq1_c2', text: 'Cautiously optimistic', order: 1 },
			{ id: 'dmq1_c3', text: 'Concerned', order: 2 }
		],
		createdAt: new Date('2024-03-10')
	},
	{
		id: 'dmq_2',
		senderId: 'user_2',
		recipientId: 'user_1',
		text: 'Want to grab lunch this week?',
		choices: [
			{ id: 'dmq2_c1', text: 'Yes, sounds great!', order: 0 },
			{ id: 'dmq2_c2', text: 'Maybe next week', order: 1 },
			{ id: 'dmq2_c3', text: 'Too busy right now', order: 2 }
		],
		createdAt: new Date('2024-03-11')
	},
	{
		id: 'dmq_3',
		senderId: 'user_3',
		recipientId: 'user_4',
		text: 'How are you feeling today?',
		createdAt: new Date('2024-03-12')
	}
];

export const mockDMAnswers: DMAnswer[] = [
	{
		id: 'dmans_1',
		dmQuestionId: 'dmq_1',
		userId: 'user_2',
		choiceId: 'dmq1_c2',
		createdAt: new Date('2024-03-11')
	},
	{
		id: 'dmans_2',
		dmQuestionId: 'dmq_3',
		userId: 'user_4',
		textAnswer: "I'm doing great, thanks for asking!",
		createdAt: new Date('2024-03-12')
	}
];
