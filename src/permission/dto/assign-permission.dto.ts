import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class AssignPermissionDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  permissionId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roleId: number;
}
