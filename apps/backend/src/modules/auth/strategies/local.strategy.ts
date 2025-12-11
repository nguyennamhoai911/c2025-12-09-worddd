// apps/backend/src/modules/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Mặc định là 'username', mình đổi thành 'email' cho đúng project
    });
  }

  // Hàm này sẽ tự động chạy khi user login
  async validate(email: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    }
    return user;
  }
}
