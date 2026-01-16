import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string; // Optional vì sau này có thể login bằng Google

  @IsOptional()
  @IsString()
  name?: string;
}
