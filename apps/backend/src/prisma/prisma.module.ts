import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Key concept: Make it global!
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export to use in other modules
})
export class PrismaModule {}
