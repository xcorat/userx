// Mock data for POC
import type { User, PublicQuestion, PublicAnswer, DMQuestion, DMAnswer, Meme, MemeInteraction } from '$lib/models';
import { AnswerVisibility, MemeInteractionType } from '$lib/models';

// Ed25519 public keys for test users (generated with real keypairs)
const alicePublicKey = 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=';
const bobPublicKey = 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=';
const carolPublicKey = 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=';
const davidPublicKey = 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=';
const emmaPublicKey = 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=';

// Encrypted private keys (encrypted with password "password")
const testKeypairs = {
	alice: '+g0GC4s8riyOCQpHde1yHPkcBoM3ZQQ3dQw6to7V39fqKxiefwnnvNmDSsjnQJCamazoKzGPpHXM4j7kFHEp+s1jGyB7uusYZX1xF0S9AEiQ7tQwPDrwJWMm0d6NTsaj1yLlV0iFgd39jSfG',
	bob: '/NNHG8seCEpl5pMWGmuH2fsc0/zB9w7/7gmNF9r3Ms1njQKGVmsLssETtH/Q0ZK9+ttZzpUwA/u9uLJqisQ0HPVwnBPBnn+fpZkpbPuLiLLwVoquN5V+Q2nUhof+folVPj8ojLBsQm2aJa4S',
	carol: '4RFWtI9obYXxVUQ6/yFVtyl2gjLQPd+X3tVvzx0tKeerbf6zknB9Fo87U/S9FsCyk16GBeAD1pN/eXVqnfPBeJK3tG0rN6T/IY1WBWPsBSxG0p2gGG1JAn668emPRbyBb8SFk422gHiTbVz6',
	david: 'FX54Yc0rR6wnqS5QzlwOQgav7g/Gx6IKipoPSgRmufkfMSLMG7JrFwcngvkqHujjtH+nJJYVdThWlem/RZOyRdue0afkmky+MuJkotSjiOWeJPyM/0fiJFwBvhbPQNT/nIoPJvnpbDaL+ghs',
	emma: 'Yp/nu3h/q667MD2ubPaLQNhcBoXSN7H4K5360VRJRqqKGILNX/QRoW3nkvgdrG/H89Y87YGMqmaSjnTydKCCodifplC262kpdnUJTE0cwFfwh8hbip3/uZQRzBqcI0+TpHE6/fdDv4SoA28w'
};

export const mockUsers: User[] = [
	{
		publicKey: alicePublicKey,
		username: 'alicejohnson',
		name: 'Alice Johnson',
		email: 'alice@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
		createdAt: new Date('2024-01-15')
	},
	{
		publicKey: bobPublicKey,
		username: 'bobsmith',
		name: 'Bob Smith',
		email: 'bob@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
		createdAt: new Date('2024-01-20')
	},
	{
		publicKey: carolPublicKey,
		username: 'caroldavis',
		name: 'Carol Davis',
		email: 'carol@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
		createdAt: new Date('2024-02-01')
	},
	{
		publicKey: davidPublicKey,
		username: 'davidwilson',
		name: 'David Wilson',
		email: 'david@example.com',
		avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
		createdAt: new Date('2024-02-10')
	},
	{
		publicKey: emmaPublicKey,
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
		createdBy: alicePublicKey,
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
		createdBy: bobPublicKey,
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
		createdBy: alicePublicKey,
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
		createdBy: carolPublicKey,
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
		createdBy: bobPublicKey,
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
		createdBy: davidPublicKey,
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
		createdBy: emmaPublicKey,
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
		createdBy: alicePublicKey,
		createdAt: new Date('2024-03-18')
	}
];

export const mockAnswers: PublicAnswer[] = [
	{
		id: 'ans_1',
		userId: alicePublicKey,
		questionId: 'q_2',
		choiceId: 'q2_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-06')
	},
	{
		id: 'ans_2',
		userId: bobPublicKey,
		questionId: 'q_1',
		choiceId: 'q1_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-02')
	},
	{
		id: 'ans_3',
		userId: carolPublicKey,
		questionId: 'q_1',
		choiceId: 'q1_c1',
		visibility: AnswerVisibility.PRIVATE,
		createdAt: new Date('2024-03-03')
	},
	{
		id: 'ans_4',
		userId: davidPublicKey,
		questionId: 'q_1',
		choiceId: 'q1_c2',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-03')
	},
	{
		id: 'ans_5',
		userId: emmaPublicKey,
		questionId: 'q_1',
		choiceId: 'q1_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-04')
	},
	{
		id: 'ans_6',
		userId: bobPublicKey,
		questionId: 'q_2',
		choiceId: 'q2_c2',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-06')
	},
	{
		id: 'ans_7',
		userId: carolPublicKey,
		questionId: 'q_2',
		choiceId: 'q2_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-07')
	},
	{
		id: 'ans_8',
		userId: alicePublicKey,
		questionId: 'q_3',
		choiceId: 'q3_c3',
		visibility: AnswerVisibility.PRIVATE,
		createdAt: new Date('2024-03-09')
	},
	{
		id: 'ans_9',
		userId: davidPublicKey,
		questionId: 'q_2',
		choiceId: 'q2_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-07')
	},
	{
		id: 'ans_10',
		userId: emmaPublicKey,
		questionId: 'q_3',
		choiceId: 'q3_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-09')
	},
	{
		id: 'ans_11',
		userId: alicePublicKey,
		questionId: 'q_5',
		choiceId: 'q5_c2',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-13')
	},
	{
		id: 'ans_12',
		userId: bobPublicKey,
		questionId: 'q_5',
		choiceId: 'q5_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-13')
	},
	{
		id: 'ans_13',
		userId: carolPublicKey,
		questionId: 'q_5',
		choiceId: 'q5_c3',
		visibility: AnswerVisibility.PRIVATE,
		createdAt: new Date('2024-03-13')
	},
	{
		id: 'ans_14',
		userId: davidPublicKey,
		questionId: 'q_8',
		choiceId: 'q8_c1',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-19')
	},
	{
		id: 'ans_15',
		userId: emmaPublicKey,
		questionId: 'q_8',
		choiceId: 'q8_c3',
		visibility: AnswerVisibility.PUBLIC,
		createdAt: new Date('2024-03-19')
	}
];

export const mockDMQuestions: DMQuestion[] = [
	{
		id: 'dmq_1',
		senderId: alicePublicKey,
		recipientId: bobPublicKey,
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
		senderId: bobPublicKey,
		recipientId: alicePublicKey,
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
		senderId: carolPublicKey,
		recipientId: alicePublicKey,
		text: 'How are you feeling today?',
		createdAt: new Date('2024-03-12')
	}
];

export const mockDMAnswers: DMAnswer[] = [
	{
		id: 'dmans_1',
		dmQuestionId: 'dmq_1',
		userId: bobPublicKey,
		choiceId: 'dmq1_c2',
		createdAt: new Date('2024-03-11')
	},
	{
		id: 'dmans_2',
		dmQuestionId: 'dmq_3',
		userId: davidPublicKey,
		textAnswer: "I'm doing great, thanks for asking!",
		createdAt: new Date('2024-03-12')
	}
];

// Memeball mock data
export const mockMemes: Meme[] = [
	{
		id: 'meme_1',
		contentHash: 'hash_distracted_bf',
		imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
		altText: 'Distracted Boyfriend meme - man looking at another woman while his girlfriend looks disapproving',
		submittedBy: alicePublicKey,
		submittedAt: new Date('2024-11-13T10:00:00Z'),
		width: 680,
		height: 450,
		isAnimated: false
	},
	{
		id: 'meme_2',
		contentHash: 'hash_drake_pointing',
		imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
		altText: 'Drake pointing meme - Drake rejecting something, then pointing approvingly at something else',
		submittedBy: bobPublicKey,
		submittedAt: new Date('2024-11-13T11:30:00Z'),
		width: 500,
		height: 600,
		isAnimated: false
	},
	{
		id: 'meme_3',
		contentHash: 'hash_woman_yelling_cat',
		imageUrl: 'https://i.imgflip.com/345v97.jpg',
		altText: 'Woman yelling at confused cat meme',
		submittedBy: carolPublicKey,
		submittedAt: new Date('2024-11-13T14:15:00Z'),
		width: 680,
		height: 438,
		isAnimated: false
	},
	{
		id: 'meme_4',
		contentHash: 'hash_this_is_fine',
		imageUrl: 'https://i.imgflip.com/1wz2x6.jpg',
		altText: 'This is fine dog sitting in burning room',
		submittedBy: davidPublicKey,
		submittedAt: new Date('2024-11-13T16:45:00Z'),
		width: 580,
		height: 282,
		isAnimated: false
	},
	{
		id: 'meme_5',
		contentHash: 'hash_expanding_brain',
		imageUrl: 'https://i.imgflip.com/1jwhww.jpg',
		altText: 'Expanding brain meme template',
		submittedBy: emmaPublicKey,
		submittedAt: new Date('2024-11-14T08:20:00Z'),
		width: 857,
		height: 1202,
		isAnimated: false
	}
];

export const mockMemeInteractions: MemeInteraction[] = [
	{
		id: 'interaction_1',
		userId: alicePublicKey,
		memeId: 'meme_2',
		interactionType: MemeInteractionType.PICK,
		interactedAt: new Date('2024-11-13T12:00:00Z')
	},
	{
		id: 'interaction_2',
		userId: alicePublicKey,
		memeId: 'meme_3',
		interactionType: MemeInteractionType.REJECT,
		interactedAt: new Date('2024-11-13T15:00:00Z')
	},
	{
		id: 'interaction_3',
		userId: bobPublicKey,
		memeId: 'meme_1',
		interactionType: MemeInteractionType.PICK,
		interactedAt: new Date('2024-11-13T11:00:00Z')
	},
	{
		id: 'interaction_4',
		userId: bobPublicKey,
		memeId: 'meme_4',
		interactionType: MemeInteractionType.PICK,
		interactedAt: new Date('2024-11-13T17:00:00Z')
	},
	{
		id: 'interaction_5',
		userId: carolPublicKey,
		memeId: 'meme_1',
		interactionType: MemeInteractionType.PICK,
		interactedAt: new Date('2024-11-13T11:30:00Z')
	},
	{
		id: 'interaction_6',
		userId: davidPublicKey,
		memeId: 'meme_2',
		interactionType: MemeInteractionType.REJECT,
		interactedAt: new Date('2024-11-13T13:00:00Z')
	},
	{
		id: 'interaction_7',
		userId: emmaPublicKey,
		memeId: 'meme_1',
		interactionType: MemeInteractionType.PICK,
		interactedAt: new Date('2024-11-13T12:30:00Z')
	}
];

// Export testKeypairs for MockUserRepository to use
export { testKeypairs };
