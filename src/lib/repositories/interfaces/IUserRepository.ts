// User Repository Interface
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';

export interface IUserRepository {
	findAll(): Promise<User[]>;
	findById(publicKey: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByUsername(username: string): Promise<User | null>;
	searchUsers(query: string): Promise<User[]>;
	create(data: CreateUserDTO): Promise<User>;
	update(publicKey: string, data: UpdateUserDTO): Promise<User>;
	delete(publicKey: string): Promise<void>;
	getEncryptedPrivateKey(publicKey: string): Promise<string | null>;
}
