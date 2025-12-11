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
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vocabulary')
@UseGuards(JwtAuthGuard)
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // 👇 THÊM ROUTE NÀY: Lưu điểm phát âm
  @Patch(':id/score')
  async addScore(
    @Request() req,
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.vocabularyService.addScore(id, req.user.id, score);
  }
  @Post()
  create(@Request() req, @Body() createDto: CreateVocabularyDto) {
    // 👇 UPDATE: Sử dụng upsertVocab để handle logic create hoặc update nếu đã tồn tại
    return this.vocabularyService.upsertVocab(req.user.id, createDto);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.vocabularyService.importFromCsv(req.user.id, file);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string, // Quick search (tìm chung)
    // Filter Params
    @Query('word') word: string,
    @Query('topic') topic: string,
    @Query('partOfSpeech') partOfSpeech: string,
    @Query('meaning') meaning: string,
    @Query('isStarred') isStarred: string, // Filter từ yêu thích
    // Sort Params
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 20;

    // Gom các filter criteria vào một object
    const filters = {
      word,
      topic,
      partOfSpeech,
      meaning,
      // Convert string 'true' thành boolean true, ngược lại là false/undefined
      isStarred: isStarred === 'true',
    };

    // Config sort option
    const sort = {
      field: sortBy || 'createdAt',
      order: (sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
    };

    // Call service với full arguments
    return this.vocabularyService.findAll(
      req.user.id,
      pageNumber,
      limitNumber,
      filters,
      sort,
      search,
    );
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
