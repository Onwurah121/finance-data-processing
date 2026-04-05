import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import {
  AssignPermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dto';
import { PermissionService } from '../services/permission.service';
import { Permissions } from '../../common';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Permissions('manage_permissions')
  @Post('create')
  @ResponseMessage('Permission created successfully')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }

  @Permissions('view_permissions')
  @Get('all')
  @ResponseMessage('Permissions retrieved successfully')
  findAll() {
    return this.permissionService.findAll();
  }

  @Permissions('view_permissions')
  @Get('users/:userId')
  @ResponseMessage('User permissions retrieved successfully')
  getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionService.getUserPermissions(userId);
  }

  @Permissions('view_permissions')
  @Get('one/:id')
  @ResponseMessage('Permission retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.findOne(id);
  }

  @Permissions('manage_permissions')
  @Patch('update/:id')
  @ResponseMessage('Permission updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, dto);
  }

  /**
   * POST /permissions/assign
   * Assigns a permission to a role. All users in that role inherit the permission.
   */
  @Permissions('manage_permissions')
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Permission assigned to role successfully')
  assignToRole(
    @Body()
    dto: AssignPermissionDto,
  ) {
    return this.permissionService.assignToRole(dto);
  }

  /**
   * DELETE /permissions/revoke
   * Revokes a permission from a role. All users in that role lose the permission.
   */
  @Permissions('manage_permissions')
  @Delete('revoke')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Permission revoked from role successfully')
  revokeFromRole(
    @Body()
    dto: AssignPermissionDto,
  ) {
    return this.permissionService.revokeFromRole(dto);
  }
}
