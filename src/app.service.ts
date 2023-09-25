import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    this.logger.log(`getHello ${this.configService.get('app.appName')}`);
    return 'Hello World!';
  }
}
