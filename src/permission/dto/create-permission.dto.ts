import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  /**
   * Permission code in SCREAMING_SNAKE_CASE e.g. "TRANSACTION_READ"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be SCREAMING_SNAKE_CASE (e.g. TRANSACTION_READ)',
  })
  code: string;
}
