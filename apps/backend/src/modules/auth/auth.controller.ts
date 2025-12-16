import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Response } from 'express'; // 👈 Thêm "type"

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response, // 👈 Inject Response vào đây
  ) {
    const result = await this.authService.login(body.email, body.password);

    // 👇 THÊM ĐOẠN NÀY: Gắn Cookie "token"
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true, // Bắt buộc true vì Render chạy HTTPS
      sameSite: 'none', // Bắt buộc 'none' để Extension (trang khác) đọc được
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return result;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    // 👇 THÊM ĐOẠN NÀY: Gắn Cookie "token"
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Frontend URL trên Vercel (hoặc Localhost nếu đang dev)
    const frontendUrl = `http://localhost:3000/auth/callback?token=${result.token}`;
    return res.redirect(frontendUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    return this.authService.getUserById(req.user.id);
  }
}
