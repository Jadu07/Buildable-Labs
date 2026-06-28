import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { RegisterInput, LoginInput } from '../validators/authValidators';
import { env } from '../config/env';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterInput) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw { statusCode: 409, message: 'User with this email already exists' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const AVATAR_COLORS = [
      'E63946', '1D3557', '2A9D8F', 'D97706', '059669', '7C3AED',
      'DB2777', '4F46E5', '9333EA', 'C026D3', '0284C7', 'B45309',
      '15803D', 'BE123C', '3F6212', '0F766E'
    ];
    const randomColor = '#' + AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = await this.userRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      color: randomColor,
    });

    const token = this.generateToken(user.id);

    return { user: this.sanitizeUser(user), token };
  }

  async login(data: LoginInput) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = this.generateToken(user.id);

    return { user: this.sanitizeUser(user), token };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return this.sanitizeUser(user);
  }

  async searchUsers(userId: string, query: string) {
    if (!query || query.length < 2) return [];
    const users = await this.userRepository.searchUsers(query, userId);
    return users.map(u => this.sanitizeUser(u));
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const user = await this.userRepository.update(userId, data);
    return this.sanitizeUser(user);
  }

  async updatePassword(userId: string, data: { currentPassword?: string; newPassword?: string }) {
    if (!data.currentPassword || !data.newPassword) {
      throw { statusCode: 400, message: 'Current and new passwords are required' };
    }
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid current password' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    await this.userRepository.update(userId, { passwordHash });
  }

  private generateToken(userId: string): string {
    return jwt.sign({ id: userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
