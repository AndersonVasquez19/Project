import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { AuthService, type JwtClaims } from '../services/auth.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    ip: { limit: 10, ttl: 3_600_000 },
    credential: { limit: 3, ttl: 3_600_000 },
  })
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  /** Renueva el token mientras la sesión esté activa (ver AuthService.refresh). */
  @Post('refresh')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({
    ip: { limit: 120, ttl: 60_000 },
    credential: { limit: 30, ttl: 60_000 },
  })
  refresh(@Req() request: AuthenticatedRequest) {
    return this.authService.refresh(request.auth);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.auth);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: AuthenticatedRequest) {
    const revoked = await this.authService.logout(request.auth);
    if (!revoked) {
      throw new UnauthorizedException({
        message: 'La sesión ya no es válida.',
      });
    }

    return { message: 'Sesión JWT cerrada.' };
  }
}
