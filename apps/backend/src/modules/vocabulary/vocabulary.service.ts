// apps\backend\src\modules\vocabulary\vocabulary.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import * as csv from 'csv-parser'; // Lib đọc CSV
import { Readable } from 'stream'; // Lib có sẵn của Node.js

const csv = require('csv-parser');
import { Readable } from 'stream';

interface VocabItemImport {
  topic: string | null;
  word: string;
  partOfSpeech: string | null;
  pronunciation: string | null;
  meaning: string | null;
  example: string | null;
  relatedWords: string | null;
  occurrence: number;
  createdAt: Date;
  userId: string;
}

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}
  // Hàm xử lý Import CSV
  async importFromCsv(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const results: any[] = [];
    const stream = Readable.from(file.buffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv()) // Tự động detect header
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          console.log(`📂 Parsed ${results.length} rows from CSV`);

          let successCount = 0;
          let errorCount = 0;

          // Loop qua từng dòng và insert vào DB
          for (const row of results) {
            try {
              // Mapping cột trong CSV (Google Sheet) sang Prisma Field
              // Lưu ý: Key bên trái (row['...']) phải khớp chính xác Header trong Google Sheet
              await this.prisma.vocabItem.create({
                data: {
                  userId: userId,
                  word: row['Word']?.trim(), // Bắt buộc
                  topic: row['Topic']?.trim(),
                  partOfSpeech: row['Part of speech']?.trim(),
                  pronunciation: row['Pronunciation']?.trim(),
                  meaning: row['Meaning']?.trim(),
                  example: row['Example']?.trim(),
                  relatedWords: row['Related words']?.trim(),
                  // Convert Occurrence sang số (nếu có), mặc định là 1
                  occurrence: row['Occurrence']
                    ? parseInt(row['Occurrence'])
                    : 1,
                  // Cột "Time" thường format khó chịu, ta tạm bỏ qua để Prisma tự lấy giờ hiện tại (default now)
                  // Nếu muốn giữ Time cũ, cần parse Date string chuẩn ISO-8601
                },
              });
              successCount++;
            } catch (error) {
              console.error(`❌ Error importing row: ${row['Word']}`, error);
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

  async create(userId: string, createDto: CreateVocabularyDto) {
    return this.prisma.vocabItem.create({
      data: {
        ...createDto,
        userId,
      },
    });
  }

  async importFromCsv(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const vocabularies: VocabItemImport[] = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(file.buffer);
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          // Xử lý Date: Convert "14/02/2025 11:52:00" sang format Date của JS
          // Nếu row.Time lỗi hoặc rỗng thì lấy thời gian hiện tại
          let createdTime = new Date();
          if (row.Time) {
            const parts = row.Time.split(' ');
            if (parts.length >= 1) {
              const dateParts = parts[0].split('/'); // [14, 02, 2025]
              // Format new Date(Year, Month - 1, Day)
              if (dateParts.length === 3) {
                createdTime = new Date(
                  parseInt(dateParts[2]),
                  parseInt(dateParts[1]) - 1,
                  parseInt(dateParts[0]),
                );
              }
            }
          }

          const vocabItem: VocabItemImport = {
            // Map đúng tên cột trong file CSV của bạn
            topic: row.Topic || null,
            word: row.Word,
            partOfSpeech: row['Part of speech'] || null,
            pronunciation: row.Pronunciation || null,
            meaning: row.Meaning || null,
            example: row.Example || null,
            relatedWords: row['Related words'] || null,
            occurrence: row.Occurrence ? parseInt(row.Occurrence) : 1,

            // Các trường hệ thống
            createdAt: createdTime,
            userId: userId,
          };

          if (vocabItem.word) {
            vocabularies.push(vocabItem);
          }
        })
        .on('end', () => resolve(true))
        .on('error', (err: Error) => reject(err));
    });

    if (vocabularies.length > 0) {
      const result = await this.prisma.vocabItem.createMany({
        data: vocabularies,
        skipDuplicates: true,
      });
      return { count: result.count };
    }
    return { count: 0 };
  }

  async findAll(userId: string) {
    return this.prisma.vocabItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const vocab = await this.prisma.vocabItem.findFirst({
      where: { id, userId },
    });

    if (!vocab) {
      throw new NotFoundException('Vocabulary not found');
    }

    return vocab;
  }

  async update(id: string, userId: string, updateDto: UpdateVocabularyDto) {
    await this.findOne(id, userId); // Check exists

    return this.prisma.vocabItem.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check exists

    return this.prisma.vocabItem.delete({
      where: { id },
    });
  }
}
