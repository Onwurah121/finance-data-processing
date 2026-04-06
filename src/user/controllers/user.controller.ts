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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../services/user.service';

/**
 * Permission codes used by this controller.
 * Seed these into the `permissions` table and assign them to roles as needed.
 *
 *   USER_CREATE  — create a new user
 *   USER_READ    — list / view users
 *   USER_UPDATE  — update an existing user
 *   USER_DELETE  — soft-delete a user
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Permissions('user_create')
  @ResponseMessage('User created successfully')
  create(
    @Body()
    dto: CreateUserDto,
  ) {
    return this.userService.create(dto);
  }

  @Get('all')
  @Permissions('user_read')
  @ResponseMessage('Users retrieved successfully')
  findAll() {
    return this.userService.findAll();
  }

  @Get('one/:id')
  @Permissions('user_read')
  @ResponseMessage('User retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch('update/:id')
  @Permissions('user_update')
  @ResponseMessage('User updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Delete('delete/:id')
  @Permissions('user_delete')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Get('roles/all')
  @Permissions('user_read')
  @ResponseMessage('Roles retrieved successfully')
  findAllRoles() {
    return this.userService.findAllRoles();
  }

  @Patch('role/:id')
  @Permissions('user_update')
  @ResponseMessage('User role assigned successfully')
  assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: AssignRoleDto,
  ) {
    return this.userService.assignRole(id, dto);
  }
}
