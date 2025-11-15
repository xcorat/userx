// Relation Repository Interface
import type {
	UserRelation,
	CreateRelationDTO,
	UpdateRelationDTO,
	RelationStatus
} from '$lib/models';

export interface IRelationRepository {
	findAll(): Promise<UserRelation[]>;
	findById(id: string): Promise<UserRelation | null>;
	findByUsers(fromUserId: string, toUserId: string): Promise<UserRelation | null>;
	findByUserId(userId: string): Promise<UserRelation[]>;
	findByUserIdAndStatus(userId: string, status: RelationStatus): Promise<UserRelation[]>;
	create(data: CreateRelationDTO): Promise<UserRelation>;
	update(id: string, data: UpdateRelationDTO): Promise<UserRelation>;
	delete(id: string): Promise<void>;
}
