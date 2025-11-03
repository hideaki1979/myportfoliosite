import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { RecaptchaService } from './recaptcha.service';
import { MailService } from './mail.service';

/**
 * Contact Module
 * コンタクトフォーム機能を提供
 */
@Module({
  controllers: [ContactController],
  providers: [ContactService, RecaptchaService, MailService],
  exports: [ContactService],
})
export class ContactModule {}
