// apps\backend\src\modules\vocabulary\dto\update-vocabulary.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateVocabularyDto } from './create-vocabulary.dto';

export class UpdateVocabularyDto extends PartialType(CreateVocabularyDto) {}