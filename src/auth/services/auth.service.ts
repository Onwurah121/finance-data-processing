import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials.
   * Returns the user record (without password) on success, or null on failure.
   * Called by the LocalStrategy.
   */
  async validateUser(
    email: string,
    plainTextPassword: string,
  ): Promise<Omit<
    Awaited<ReturnType<typeof this.db.client.user.findFirst>>,
    'password'
  > | null> {
    const user = await this.db.client.user.findFirst({
      where: { email },
    });

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(
      plainTextPassword,
      user.password,
    );
    if (!isPasswordValid) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.validateUser(dto.email, dto.password);
      if (!user) throw new UnauthorizedException('Invalid email or password');

      const accessToken = this.generateTokens(user.id);
      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRY ?? '900',
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Error during login:', errorMessage);
      throw new BadRequestException(errorMessage);
    }
  }

  private generateTokens(userId: number) {
    const payload = { sub: userId.toString() };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRY ?? '900') as any,
    });
    return accessToken;
  }
}
