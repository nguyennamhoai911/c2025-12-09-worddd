// apps/backend/src/modules/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // 👇 LOGIC MỚI: Thử lấy từ Custom Extractor trước, sau đó mới thử Header
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  // Hàm thủ công để moi Token từ Cookie
  private static extractJWT(req: Request): string | null {
    // 1. Nếu có cài cookie-parser
    if (req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      return req.cookies.token;
    }
    // 2. Nếu chưa cài cookie-parser (Parsing thủ công từ header string)
    if (req.headers.cookie) {
       const match = req.headers.cookie.match(/token=([^;]+)/);
       if (match) return match[1];
    }
    return null;
  }

  async validate(payload: any) {
    return { 
      id: payload.sub, 
      email: payload.email 
    };
  }
}