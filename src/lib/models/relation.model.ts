// User Relation domain model

export enum RelationStatus {
	PENDING = 'pending',
	APPROVED = 'approved',
	REJECTED = 'rejected'
}

export interface UserRelation {
	id: string;
	fromUserId: string;
	toUserId: string;
	status: RelationStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateRelationDTO {
	fromUserId: string;
	toUserId: string;
}

export interface UpdateRelationDTO {
	status: RelationStatus;
}

export interface RelationWithUser {
	id: string;
	userId: string;
	username: string;
	name: string;
	avatarUrl?: string;
	status: RelationStatus;
	createdAt: Date;
}
