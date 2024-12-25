import { Test, TestingModule } from '@nestjs/testing';
import { LogdayController } from './logday.controller';
import { LogdayService } from './logday.service';

describe('LogdayController', () => {
  let controller: LogdayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogdayController],
      providers: [LogdayService],
    }).compile();

    controller = module.get<LogdayController>(LogdayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
