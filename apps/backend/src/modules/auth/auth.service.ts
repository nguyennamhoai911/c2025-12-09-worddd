// apps/backend/src/modules/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ========== REGISTER WITH EMAIL/PASSWORD ==========
  async register(email: string, password: string, name?: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0], // Default name from email
        provider: 'local',
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    };
  }

  // ========== LOGIN WITH EMAIL/PASSWORD ==========
  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    };
  }

  // ========== GOOGLE OAUTH LOGIN ==========
  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    googleId: string;
  }) {
    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user from Google
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: `${googleUser.firstName} ${googleUser.lastName}`,
          avatar: googleUser.picture,
          provider: 'google',
          googleId: googleUser.googleId,
          password: null, // Google users don't have password
        },
      });
    } else if (user.provider === 'local') {
      // Link Google to existing local account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          avatar: googleUser.picture, // Update avatar
        },
      });
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    };
  }

  // ========== VALIDATE USER (For Passport) ==========
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  // ========== GET USER BY ID ==========
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // ========== HELPER: GENERATE JWT TOKEN ==========
  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}