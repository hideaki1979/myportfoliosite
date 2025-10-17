import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QiitaController } from './qiita.controller';
import { QiitaService } from './qiita.service';

@Module({
  imports: [ConfigModule],
  controllers: [QiitaController],
  providers: [QiitaService],
  exports: [QiitaService],
})
export class QiitaModule {}
