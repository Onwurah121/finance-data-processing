import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class AssignRoleDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roleId: number;
}
