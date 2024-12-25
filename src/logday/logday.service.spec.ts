import { Test, TestingModule } from '@nestjs/testing';
import { LogdayService } from './logday.service';

describe('LogdayService', () => {
  let service: LogdayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogdayService],
    }).compile();

    service = module.get<LogdayService>(LogdayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
