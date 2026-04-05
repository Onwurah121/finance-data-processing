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
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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

  @Post()
  @Permissions('CATEGORY_CREATE')
  @ResponseMessage('Category created successfully')
  create(
    @Body(new ValidationPipe({ whitelist: true }))
    dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(dto);
  }

  @Get()
  @Permissions('CATEGORY_READ')
  @ResponseMessage('Categories retrieved successfully')
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Permissions('CATEGORY_READ')
  @ResponseMessage('Category retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Permissions('CATEGORY_UPDATE')
  @ResponseMessage('Category updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true }))
    dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('CATEGORY_DELETE')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Category deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
