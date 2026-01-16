import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsString()
    googleApiKey?: string;

    @IsOptional()
    @IsString()
    googleCx?: string;

    @IsOptional()
    @IsString()
    azureSpeechKey?: string;

    @IsOptional()
    @IsString()
    azureSpeechRegion?: string;

    @IsOptional()
    @IsString()
    geminiApiKey?: string;
}
