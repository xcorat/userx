// D1 Database Adapter
// Encapsulates all D1 repositories for Cloudflare Workers production

import type { IUserRepository } from '$lib/repositories/interfaces/IUserRepository';
import type { IQuestionRepository } from '$lib/repositories/interfaces/IQuestionRepository';
import type { IAnswerRepository } from '$lib/repositories/interfaces/IAnswerRepository';
import type { IDMRepository } from '$lib/repositories/interfaces/IDMRepository';
import type { IMemeBallRepository } from '$lib/repositories/interfaces/IMemeBallRepository';
import type { IRelationRepository } from '$lib/repositories/interfaces/IRelationRepository';

import { D1UserRepository } from '$lib/server/repositories/d1/D1UserRepository';
import { D1QuestionRepository } from '$lib/server/repositories/d1/D1QuestionRepository';
import { D1AnswerRepository } from '$lib/server/repositories/d1/D1AnswerRepository';
import { D1DMRepository } from '$lib/server/repositories/d1/D1DMRepository';
import { D1MemeBallRepository } from '$lib/server/repositories/d1/D1MemeBallRepository';
import { D1RelationRepository } from '$lib/server/repositories/d1/D1RelationRepository';

/**
 * D1 Database Adapter
 * Used for Cloudflare Workers production with D1 database
 * Provides unified access to all D1 repositories
 */
export class D1Adapter {
	public readonly userRepo: IUserRepository;
	public readonly questionRepo: IQuestionRepository;
	public readonly answerRepo: IAnswerRepository;
	public readonly dmRepo: IDMRepository;
	public readonly memeRepo: IMemeBallRepository;
	public readonly relationRepo: IRelationRepository;

	private constructor(db: D1Database) {
		this.userRepo = new D1UserRepository(db);
		this.questionRepo = new D1QuestionRepository(db);
		this.answerRepo = new D1AnswerRepository(db);
		this.dmRepo = new D1DMRepository(db);
		this.memeRepo = new D1MemeBallRepository(db);
		this.relationRepo = new D1RelationRepository(db);
	}

	/**
	 * Create new D1 adapter instance
	 */
	static create(db: D1Database): D1Adapter {
		return new D1Adapter(db);
	}

	/**
	 * Get adapter type
	 */
	getType(): 'd1' {
		return 'd1';
	}
}