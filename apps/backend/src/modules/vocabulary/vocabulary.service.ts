// apps/backend/src/modules/vocabulary/vocabulary.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import csv from 'csv-parser'; // Lib đọc CSV
import { Readable } from 'stream'; // Lib có sẵn của Node.js

// 👇 Define Interface cho các filter parameters
interface VocabFilters {
  word?: string;
  topic?: string;
  partOfSpeech?: string;
  meaning?: string;
}

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}

  // --- 1. CREATE ---
  async create(userId: string, createDto: CreateVocabularyDto) {
    return this.prisma.vocabItem.create({
      data: {
        ...createDto,
        userId,
      },
    });
  }

  // --- 2. FIND ALL (Search + Filter + Sort + Pagination) ---
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters: VocabFilters = {},
    sort: { field: string; order: 'asc' | 'desc' } = {
      field: 'createdAt',
      order: 'desc',
    }, // Default sort
    search?: string, // 👈 Global Search param
  ) {
    const skip = (page - 1) * limit;

    // Helper clean text
    const clean = (text?: string) => text?.trim();

    // 👇 Xây dựng câu query (Where Condition)
    const whereCondition: Prisma.VocabItemWhereInput = {
      userId, // Luôn filter theo user hiện tại

      // 1. Các bộ lọc riêng lẻ (AND logic)
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

      // 2. Global Search (OR logic)
      // Nếu có biến 'search', tìm nó trong Word HOẶC Meaning HOẶC Topic
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

    // 👇 Xây dựng Sort (Order By)
    const orderByInput: Prisma.VocabItemOrderByWithRelationInput[] = [];

    if (sort.field) {
      orderByInput.push({ [sort.field]: sort.order });
    }
    // Luôn add thêm id để đảm bảo thứ tự ổn định (Stable Sort)
    orderByInput.push({ id: 'asc' });

    // 👇 Execute Query
    const [items, total] = await Promise.all([
      this.prisma.vocabItem.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: orderByInput,
      }),
      this.prisma.vocabItem.count({ where: whereCondition }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // --- 3. FIND ONE ---
  async findOne(id: string, userId: string) {
    const vocab = await this.prisma.vocabItem.findFirst({
      where: { id, userId },
    });

    if (!vocab) {
      throw new NotFoundException('Vocabulary not found');
    }
    return vocab;
  }

  // --- 4. UPDATE ---
  async update(id: string, userId: string, updateDto: UpdateVocabularyDto) {
    await this.findOne(id, userId); // Check exist
    return this.prisma.vocabItem.update({
      where: { id },
      data: updateDto,
    });
  }

  // --- 5. REMOVE ---
  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check exist
    return this.prisma.vocabItem.delete({
      where: { id },
    });
  }
  // apps/backend/src/modules/vocabulary/vocabulary.service.ts

  // Update hàm create hoặc tạo một hàm mới là `upsertVocab`
  async upsertVocab(userId: string, createDto: CreateVocabularyDto) {
    // 1. Check if word exists for this user (Case insensitive)
    const existing = await this.prisma.vocabItem.findFirst({
      where: {
        userId,
        word: {
          equals: createDto.word.trim(),
          mode: 'insensitive', // Ignore case (hello == Hello)
        },
      },
    });

    if (existing) {
      // 2. Scenario: Word exists -> Update status & increment occurrence
      return this.prisma.vocabItem.update({
        where: { id: existing.id },
        data: {
          isStarred: true, // Force star
          occurrence: (existing.occurrence || 0) + 1,
          // Optional: Update meaning/example nếu user gửi cái mới lên
        },
      });
    } else {
      // 3. Scenario: Word not found -> Create new full record
      return this.prisma.vocabItem.create({
        data: {
          ...createDto,
          userId,
          isStarred: true, // Auto star khi add từ extension
        },
      });
    }
  }
  // --- 6. IMPORT CSV ---
  async importFromCsv(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const results: any[] = [];
    const stream = Readable.from(file.buffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          console.log(`📂 Parsed ${results.length} rows from CSV`);

          let successCount = 0;
          let errorCount = 0;

          for (const row of results) {
            try {
              // Mapping cột trong CSV sang Database
              await this.prisma.vocabItem.create({
                data: {
                  userId: userId,
                  word: row['Word']?.trim(),
                  topic: row['Topic']?.trim(),
                  partOfSpeech: row['Part of speech']?.trim(),
                  pronunciation: row['Pronunciation']?.trim(),
                  meaning: row['Meaning']?.trim(),
                  example: row['Example']?.trim(),
                  relatedWords: row['Related words']?.trim(),
                  occurrence: row['Occurrence']
                    ? parseInt(row['Occurrence'])
                    : 1,
                },
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
        .on('error', (error) => {
          reject(new BadRequestException('Invalid CSV file'));
        });
    });
  }
}
