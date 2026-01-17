import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('ai')
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly prisma: PrismaService
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('analyze')
    async analyze(@Body() body: { text: string; context: string }, @Req() req) {
        // Gemini Key is no longer stored per user.
        return this.aiService.analyzeVocabulary(
            body.text,
            body.context,
            '',
        );
    }
}
