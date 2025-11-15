// Mock Relation Repository
import type { IRelationRepository } from '../../interfaces/IRelationRepository';
import type { UserRelation, CreateRelationDTO, UpdateRelationDTO, RelationStatus } from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class MockRelationRepository implements IRelationRepository {
	private relations: UserRelation[] = [];

	async findAll(): Promise<UserRelation[]> {
		return this.relations;
	}

	async findById(id: string): Promise<UserRelation | null> {
		return this.relations.find((r) => r.id === id) || null;
	}

	async findByUsers(fromUserId: string, toUserId: string): Promise<UserRelation | null> {
		return (
			this.relations.find(
				(r) =>
					(r.fromUserId === fromUserId && r.toUserId === toUserId) ||
					(r.fromUserId === toUserId && r.toUserId === fromUserId)
			) || null
		);
	}

	async findByUserId(userId: string): Promise<UserRelation[]> {
		return this.relations.filter((r) => r.fromUserId === userId || r.toUserId === userId);
	}

	async findByUserIdAndStatus(userId: string, status: RelationStatus): Promise<UserRelation[]> {
		return this.relations.filter(
			(r) => (r.fromUserId === userId || r.toUserId === userId) && r.status === status
		);
	}

	async create(data: CreateRelationDTO): Promise<UserRelation> {
		// Check if relation already exists
		const existing = await this.findByUsers(data.fromUserId, data.toUserId);
		if (existing) {
			throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Relation already exists');
		}

		const relation: UserRelation = {
			id: `rel_${Date.now()}`,
			fromUserId: data.fromUserId,
			toUserId: data.toUserId,
			status: 'pending' as RelationStatus,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		this.relations.push(relation);
		return relation;
	}

	async update(id: string, data: UpdateRelationDTO): Promise<UserRelation> {
		const index = this.relations.findIndex((r) => r.id === id);
		if (index === -1) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Relation not found');
		}

		this.relations[index] = {
			...this.relations[index],
			...data,
			updatedAt: new Date()
		};
		return this.relations[index];
	}

	async delete(id: string): Promise<void> {
		this.relations = this.relations.filter((r) => r.id !== id);
	}
}
