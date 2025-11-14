// User domain model

export interface User {
	id: string;
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
	username?: string;
	name: string;
	email: string;
	password: string;
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
