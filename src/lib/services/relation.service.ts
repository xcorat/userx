// Relation Service
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';
import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type {
	UserRelation,
	CreateRelationDTO,
	RelationStatus,
	RelationWithUser
} from '$lib/models';
import { AppError, ErrorCode } from '$lib/utils/error-handling';

export class RelationService {
	constructor(
		private relationRepo: IRelationRepository,
		private userRepo: IUserRepository
	) {}

	/**
	 * Send a friend request
	 */
	async sendRequest(fromUserId: string, toUserId: string): Promise<UserRelation> {
		if (fromUserId === toUserId) {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot send friend request to yourself');
		}

		// Check if users exist
		const [fromUser, toUser] = await Promise.all([
			this.userRepo.findById(fromUserId),
			this.userRepo.findById(toUserId)
		]);

		if (!fromUser) {
			throw new AppError(ErrorCode.NOT_FOUND, 'From user not found');
		}
		if (!toUser) {
			throw new AppError(ErrorCode.NOT_FOUND, 'To user not found');
		}

		// Check if relation already exists
		const existing = await this.relationRepo.findByUsers(fromUserId, toUserId);
		if (existing) {
			if (existing.status === 'pending') {
				throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Friend request already sent');
			} else if (existing.status === 'approved') {
				throw new AppError(ErrorCode.DUPLICATE_ERROR, 'Already friends');
			}
			// If rejected, allow resending
		}

		const data: CreateRelationDTO = {
			fromUserId,
			toUserId
		};

		return await this.relationRepo.create(data);
	}

	/**
	 * Approve a friend request
	 */
	async approveRequest(userId: string, relationId: string): Promise<UserRelation> {
		const relation = await this.relationRepo.findById(relationId);
		if (!relation) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Relation not found');
		}

		// Only the recipient can approve
		if (relation.toUserId !== userId) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Only the recipient can approve this request');
		}

		if (relation.status !== 'pending') {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Request is not pending');
		}

		return await this.relationRepo.update(relationId, { 
			status: 'approved' as RelationStatus,
			userId 
		});
	}

	/**
	 * Reject a friend request
	 */
	async rejectRequest(userId: string, relationId: string): Promise<UserRelation> {
		const relation = await this.relationRepo.findById(relationId);
		if (!relation) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Relation not found');
		}

		// Only the recipient can reject
		if (relation.toUserId !== userId) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Only the recipient can reject this request');
		}

		if (relation.status !== 'pending') {
			throw new AppError(ErrorCode.VALIDATION_ERROR, 'Request is not pending');
		}

		return await this.relationRepo.update(relationId, { 
			status: 'rejected' as RelationStatus,
			userId 
		});
	}

	/**
	 * Remove a relation (unfriend or cancel request)
	 */
	async removeRelation(userId: string, relationId: string): Promise<void> {
		const relation = await this.relationRepo.findById(relationId);
		if (!relation) {
			throw new AppError(ErrorCode.NOT_FOUND, 'Relation not found');
		}

		// Either user can remove the relation
		if (relation.fromUserId !== userId && relation.toUserId !== userId) {
			throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authorized to remove this relation');
		}

		await this.relationRepo.delete(relationId);
	}

	/**
	 * Get all friends (approved relations) for a user
	 */
	async getFriends(userId: string): Promise<RelationWithUser[]> {
		const relations = await this.relationRepo.findByUserIdAndStatus(userId, 'approved' as RelationStatus);
		
		const friendsWithUser: RelationWithUser[] = [];
		for (const relation of relations) {
			const friendId = relation.fromUserId === userId ? relation.toUserId : relation.fromUserId;
			const friend = await this.userRepo.findById(friendId);
			
				if (friend) {
				friendsWithUser.push({
					id: relation.id,
						userId: friend.publicKey || friend.id,
					username: friend.username,
					name: friend.name,
					avatarUrl: friend.avatarUrl,
					status: relation.status,
					createdAt: relation.createdAt
				});
			}
		}
		
		return friendsWithUser;
	}

	/**
	 * Get pending requests sent by a user
	 */
	async getSentRequests(userId: string): Promise<RelationWithUser[]> {
		const relations = await this.relationRepo.findByUserId(userId);
		const sentPending = relations.filter(
			r => r.fromUserId === userId && r.status === 'pending'
		);
		
		const requestsWithUser: RelationWithUser[] = [];
		for (const relation of sentPending) {
			const user = await this.userRepo.findById(relation.toUserId);
			
				if (user) {
				requestsWithUser.push({
					id: relation.id,
						userId: user.publicKey || user.id,
					username: user.username,
					name: user.name,
					avatarUrl: user.avatarUrl,
					status: relation.status,
					createdAt: relation.createdAt
				});
			}
		}
		
		return requestsWithUser;
	}

	/**
	 * Get pending requests received by a user
	 */
	async getReceivedRequests(userId: string): Promise<RelationWithUser[]> {
		const relations = await this.relationRepo.findByUserId(userId);
		const receivedPending = relations.filter(
			r => r.toUserId === userId && r.status === 'pending'
		);
		
		const requestsWithUser: RelationWithUser[] = [];
		for (const relation of receivedPending) {
			const user = await this.userRepo.findById(relation.fromUserId);
			
				if (user) {
				requestsWithUser.push({
					id: relation.id,
						userId: user.publicKey || user.id,
					username: user.username,
					name: user.name,
					avatarUrl: user.avatarUrl,
					status: relation.status,
					createdAt: relation.createdAt
				});
			}
		}
		
		return requestsWithUser;
	}

	/**
	 * Get relation status between two users
	 */
	async getRelationStatus(
		userId: string,
		otherUserId: string
	): Promise<{ status: RelationStatus | 'none'; relationId?: string; isInitiator?: boolean }> {
		if (userId === otherUserId) {
			return { status: 'none' };
		}

		const relation = await this.relationRepo.findByUsers(userId, otherUserId);
		if (!relation) {
			return { status: 'none' };
		}

		return {
			status: relation.status,
			relationId: relation.id,
			isInitiator: relation.fromUserId === userId
		};
	}
}
