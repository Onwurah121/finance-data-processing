import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   *
   * The @Public() decorator bypasses the global JwtAuthGuard.
   * The @Throttle('auth') decorator applies the stricter 5 req/60s rate limit
   * defined in the "auth" throttler to protect against brute-force attacks.
   */
  @Public()
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  @Post('login')
  async login(@Body() _loginDto: LoginDto) {
    return this.authService.login(_loginDto);
  }
}
