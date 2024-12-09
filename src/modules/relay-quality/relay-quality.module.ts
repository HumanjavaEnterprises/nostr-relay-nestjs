import { Module } from '@nestjs/common';
import { RelayQualityService } from './relay-quality.service';
import { MetricModule } from '../metric/metric.module';

@Module({
  imports: [MetricModule],
  providers: [RelayQualityService],
  exports: [RelayQualityService],
})
export class RelayQualityModule {}
