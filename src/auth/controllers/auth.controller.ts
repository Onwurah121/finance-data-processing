import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  @Post('login')
  async login(@Body() _loginDto: LoginDto) {
    return this.authService.login(_loginDto);
  }
}
