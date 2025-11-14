// User Repository Interface
import type { User, CreateUserDTO, UpdateUserDTO } from '$lib/models';

export interface IUserRepository {
	findAll(): Promise<User[]>;
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByUsername(username: string): Promise<User | null>;
	create(data: CreateUserDTO): Promise<User>;
	update(id: string, data: UpdateUserDTO): Promise<User>;
	delete(id: string): Promise<void>;
}
