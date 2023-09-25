import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CacheService } from '../cache/cache.service';

@Module({
  providers: [ChatGateway, CacheService],
})
export class ChatModule {}
