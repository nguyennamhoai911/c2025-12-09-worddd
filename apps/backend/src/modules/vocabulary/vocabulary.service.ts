import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface VocabFilters {
  word?: string;
  topic?: string;
  partOfSpeech?: string;
  meaning?: string;
  isStarred?: boolean;
}

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}
  // 👇 THÊM METHOD NÀY
  async addScore(id: string, userId: string, score: number) {
    // 1. Lấy từ vựng hiện tại để lấy mảng điểm cũ
    const vocab = await this.findOne(id, userId);

    // 2. Push điểm mới vào mảng
    // (PostgreSQL Prisma hỗ trợ push trực tiếp, nhưng để an toàn logic ta làm thủ công)
    const currentScores = vocab.pronunciationScores || [];
    const newScores = [...currentScores, score];

    // Optional: Giới hạn chỉ lưu 10 lần gần nhất để nhẹ DB
    if (newScores.length > 10) newScores.shift();

    return this.prisma.vocabItem.update({
      where: { id },
      data: {
        pronunciationScores: newScores,
      },
    });
  }

  // --- 1. SMART UPSERT (LOGIC TRÁNH TRÙNG LẶP) ---
  async upsertVocab(userId: string, createDto: CreateVocabularyDto) {
    const cleanWord = createDto.word.trim();
    console.log(
      `🔍 Checking existence for word: "${cleanWord}" (User: ${userId})`,
    );

    // 1. Tìm xem từ đã có chưa (Không phân biệt hoa thường)
    const existing = await this.prisma.vocabItem.findFirst({
      where: {
        userId,
        word: {
          equals: cleanWord,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      console.log(
        `✅ Word exists (ID: ${existing.id}). Updating count only...`,
      );
      // 2a. Nếu có rồi -> Chỉ tăng count & cập nhật time (BỎ TỰ ĐỘNG STAR)
      return this.prisma.vocabItem.update({
        where: { id: existing.id },
        data: {
          // isStarred: true, // 👈 ĐÃ XÓA DÒNG NÀY (Không ép star nữa)
          occurrence: (existing.occurrence || 0) + 1,
          // Nếu muốn update thêm thông tin thì uncomment dòng dưới:
          // ...createDto
        },
      });
    } else {
      console.log(`🆕 Word not found. Creating new entry...`);
      // 2b. Nếu chưa có -> Tạo mới
      return this.prisma.vocabItem.create({
        data: {
          ...createDto, // 👈 Backend sẽ dùng giá trị isStarred từ Frontend gửi lên (false)
          word: cleanWord,
          userId,
          // isStarred: true, // 👈 ĐÃ XÓA DÒNG NÀY (Để không bị override)
        },
      });
    }
  }

  // --- GIỮ LẠI HÀM CREATE GỐC ---
  async create(userId: string, createDto: CreateVocabularyDto) {
    return this.prisma.vocabItem.create({
      data: { ...createDto, userId },
    });
  }

  // --- 2. FIND ALL ---
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters: VocabFilters = {},
    sort: { field: string; order: 'asc' | 'desc' } = {
      field: 'createdAt',
      order: 'desc',
    },
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const clean = (text?: string) => text?.trim();

    const whereCondition: Prisma.VocabItemWhereInput = {
      userId,

      word: filters.word
        ? { contains: clean(filters.word), mode: 'insensitive' }
        : undefined,
      topic: filters.topic
        ? { contains: clean(filters.topic), mode: 'insensitive' }
        : undefined,
      partOfSpeech: filters.partOfSpeech
        ? { contains: clean(filters.partOfSpeech), mode: 'insensitive' }
        : undefined,
      meaning: filters.meaning
        ? { contains: clean(filters.meaning), mode: 'insensitive' }
        : undefined,
      isStarred: filters.isStarred === true ? true : undefined,

      ...(search
        ? {
            OR: [
              { word: { contains: clean(search), mode: 'insensitive' } },
              { meaning: { contains: clean(search), mode: 'insensitive' } },
              { topic: { contains: clean(search), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByInput: Prisma.VocabItemOrderByWithRelationInput[] = [];
    if (sort.field) orderByInput.push({ [sort.field]: sort.order });
    orderByInput.push({ id: 'asc' });

    const [items, total] = await Promise.all([
      this.prisma.vocabItem.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: orderByInput,
      }),
      this.prisma.vocabItem.count({ where: whereCondition }),
    ]);

    return {
      data: items,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  // --- 3. FIND ONE ---
  async findOne(id: string, userId: string) {
    const vocab = await this.prisma.vocabItem.findFirst({
      where: { id, userId },
    });
    if (!vocab) throw new NotFoundException('Vocabulary not found');
    return vocab;
  }

  // --- 4. UPDATE ---
  async update(id: string, userId: string, updateDto: UpdateVocabularyDto) {
    await this.findOne(id, userId);
    return this.prisma.vocabItem.update({ where: { id }, data: updateDto });
  }

  // --- 5. REMOVE ---
  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.vocabItem.delete({ where: { id } });
  }

  // --- 6. IMPORT CSV ---
  async importFromCsv(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const results: any[] = [];
    const stream = Readable.from(file.buffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          let successCount = 0;
          let errorCount = 0;
          for (const row of results) {
            try {
              await this.upsertVocab(userId, {
                word: row['Word']?.trim(),
                topic: row['Topic']?.trim(),
                partOfSpeech: row['Part of speech']?.trim(),
                pronunciation: row['Pronunciation']?.trim(),
                meaning: row['Meaning']?.trim(),
                example: row['Example']?.trim(),
                relatedWords: row['Related words']?.trim(),
                occurrence: row['Occurrence'] ? parseInt(row['Occurrence']) : 1,
                isStarred: false, // Import CSV cũng mặc định không Star
              });
              successCount++;
            } catch (error) {
              errorCount++;
            }
          }
          resolve({
            message: 'Import finished',
            total: results.length,
            success: successCount,
            failed: errorCount,
          });
        })
        .on('error', () => reject(new BadRequestException('Invalid CSV file')));
    });
  }
}
