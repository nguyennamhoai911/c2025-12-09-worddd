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
        // 1. Get User's Gemini Key from DB
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { geminiApiKey: true },
        });

        return this.aiService.analyzeVocabulary(
            body.text,
            body.context,
            user?.geminiApiKey || '',
        );
    }
}
