// User domain model

export interface User {
	id: string;
	publicKey: string;
	username: string;
	name: string;
	email: string;
	avatarUrl?: string;
	birthdate?: string;
	location?: string;
	timezone?: string;
	createdAt: Date;
}

export interface CreateUserDTO {
	publicKey: string;
	encryptedPrivateKey: string;
	username?: string;
	name: string;
	email: string;
	password: string; // Used client-side only for encryption
	avatarUrl?: string;
	birthdate?: string;
	location?: string;
	timezone?: string;
}

export interface UpdateUserDTO {
	username?: string;
	name?: string;
	avatarUrl?: string;
	birthdate?: string;
	location?: string;
	timezone?: string;
}

export interface UpdateUserDTO {
	username?: string;
	name?: string;
	avatarUrl?: string;
	birthdate?: string;
	location?: string;
	timezone?: string;
}

export interface UserProfile extends User {
	publicAnswerCount: number;
	privateAnswerCount: number;
	questionsAnswered: number;
}
