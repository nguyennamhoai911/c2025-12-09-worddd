// apps/backend/src/modules/vocabulary/vocabulary.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vocabulary')
@UseGuards(JwtAuthGuard) // 🔐 Require login
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateVocabularyDto) {
    return this.vocabularyService.create(req.user.id, createDto);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vocabularyService.importFromCsv(req.user.id, file);
  }

  @Get()
  findAll(@Request() req) {
    return this.vocabularyService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.vocabularyService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.vocabularyService.remove(id, req.user.id);
  }
}