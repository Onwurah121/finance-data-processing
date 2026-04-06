import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { AuthModule } from '../auth/auth.module';
import { CategoryModule } from '../category/category.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DatabaseModule } from '../database/database.module';
import { PermissionModule } from '../permission/permission.module';
import { TransactionModule } from '../transaction/transaction.module';
import { UserModule } from '../user/user.module';
import {
  GlobalExceptionFilter,
  JwtAuthGuard,
  PrismaExceptionFilter,
  TransformInterceptor,
} from '../common';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [
    /**
     * Rate limiting — two named throttlers:
     *   "default" : 100 requests / 60 s   (applied globally to all routes)
     *   "auth"    :   5 requests / 60 s   (applied to POST /auth/login via @Throttle)
     */
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 5,
      },
    ]),
    DatabaseModule,
    AuthModule,
    PermissionModule,
    UserModule,
    TransactionModule,
    CategoryModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    /**
     * ThrottlerGuard runs first — enforces the per-route rate limits.
     * Routes decorated with @SkipThrottle() are exempt.
     */
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    /**
     * JwtAuthGuard runs second — verifies the JWT on every route.
     * Use @Public() to opt out.
     */
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    /**
     * PermissionsGuard runs third — checks @Permissions(...) metadata.
     * Routes without @Permissions() are allowed through automatically.
     */
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
