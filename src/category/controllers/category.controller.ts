import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

/**
 * Permission codes:
 *   CATEGORY_CREATE  — create a category
 *   CATEGORY_READ    — view categories
 *   CATEGORY_UPDATE  — update a category
 *   CATEGORY_DELETE  — delete a category
 */
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  @Permissions('category_create')
  @ResponseMessage('Category created successfully')
  create(
    @Body()
    dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(dto);
  }

  @Get('all')
  @Permissions('category_read')
  @ResponseMessage('Categories retrieved successfully')
  findAll() {
    return this.categoryService.findAll();
  }

  @Get('one/:id')
  @Permissions('category_read')
  @ResponseMessage('Category retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch('update/:id')
  @Permissions('category_update')
  @ResponseMessage('Category updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }
}
