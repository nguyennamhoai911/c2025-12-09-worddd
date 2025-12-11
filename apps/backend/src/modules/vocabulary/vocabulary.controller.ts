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
  Query, // 👈 Đảm bảo đã import Query
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

  // 👇 CẬP NHẬT HÀM FIND ALL
  @Get()
  findAll(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
    // 👇 Thêm lại tham số search chung (Quick Search dùng cái này)
    @Query('search') search: string,
    // Các Filter Params
    @Query('word') word: string,
    @Query('topic') topic: string,
    @Query('partOfSpeech') partOfSpeech: string,
    @Query('meaning') meaning: string,
    // 👇 Sort Params (Mới thêm)
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 20;

    // Gom các filter
    const filters = { word, topic, partOfSpeech, meaning };

    // Tạo object sort
    const sort = {
      field: sortBy || 'createdAt', // Default field là ngày tạo
      order: (sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc', // Default order là giảm dần (desc)
    };

    // 👇 Gọi hàm Service với ĐỦ 5 THAM SỐ
    return this.vocabularyService.findAll(
      req.user.id,
      pageNumber,
      limitNumber,
      filters,
      sort,
      search // 👈 Quan trọng: Truyền search xuống service
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