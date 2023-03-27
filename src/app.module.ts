import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import * as path from 'path';
import { TransportTargetOptions } from 'pino';
import { Config, config } from './config';
import { NostrModule } from './nostr/nostr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      cache: true,
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      useFactory: loggerModuleFactory,
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    NostrModule,
  ],
})
export class AppModule {}

function loggerModuleFactory(configService: ConfigService<Config, true>) {
  const { dir, level } = configService.get('logger', { infer: true });
  const targets: TransportTargetOptions[] = [];
  if (dir) {
    targets.push({
      level,
      target: 'pino/file',
      options: { destination: path.join(dir, 'common.log') },
    });
  }
  targets.push({ level, target: 'pino-pretty', options: {} });
  return {
    pinoHttp: {
      transport: {
        targets,
      },
    },
  };
}
