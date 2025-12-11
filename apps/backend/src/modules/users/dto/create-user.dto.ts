export class CreateUserDto {
  email: string;
  password?: string; // Optional vì sau này có thể login bằng Google
  name?: string;
}
