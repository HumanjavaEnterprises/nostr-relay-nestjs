import { Module } from '@nestjs/common';
import { ConnectionManagerService } from './connection-manager.service';
import { Logger } from '@nestjs/common';
import { RelayQualityModule } from '../relay-quality/relay-quality.module';

@Module({
  imports: [RelayQualityModule],
  providers: [
    ConnectionManagerService,
    Logger,
  ],
  exports: [ConnectionManagerService],
})
export class ConnectionManagerModule {}
