import {
  IsString,
  IsOptional,
  IsInt,
  Min, // Minimum value
} from 'class-validator';

export class CreateVocabularyDto {
  // Field này bắt buộc (Required), phải là String
  @IsString()
  word: string;

  // Mấy cái dưới này là Optional (có cũng được, không có cũng không sao)
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  partOfSpeech?: string; // Loại từ (noun, verb...)

  @IsOptional()
  @IsString()
  pronunciation?: string;

  @IsOptional()
  @IsString()
  meaning?: string;

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsString()
  relatedWords?: string;

  @IsOptional()
  @IsInt() // Phải là số nguyên (Integer)
  @Min(0) // Giá trị nhỏ nhất là 0
  occurrence?: number;
}
