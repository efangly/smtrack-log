import { Test, TestingModule } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import {
  BackupCountResponse,
  DailySummaryResponse,
  BackupDeleteResponse,
} from './dto';

describe('BackupController', () => {
  let controller: BackupController;
  let service: BackupService;

  const mockBackupService = {
    findAll: jest.fn(),
    getBackupCount: jest.fn(),
    getDailySummary: jest.fn(),
    remove: jest.fn(),
    deleteBackup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
      ],
    }).compile();

    controller = module.get<BackupController>(BackupController);
    service = module.get<BackupService>(BackupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return backup count', async () => {
      const expectedResponse: BackupCountResponse = { log: 10, notification: 5 };
      mockBackupService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResponse);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBackupCount', () => {
    it('should return backup count with date filter', async () => {
      const dto = { beforeDate: '2024-01-01' };
      const expectedResponse: BackupCountResponse = { log: 15, notification: 8 };
      mockBackupService.getBackupCount.mockResolvedValue(expectedResponse);

      const result = await controller.getBackupCount(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.getBackupCount).toHaveBeenCalledWith(dto);
    });

    it('should return backup count without date filter', async () => {
      const dto = {};
      const expectedResponse: BackupCountResponse = { log: 20, notification: 10 };
      mockBackupService.getBackupCount.mockResolvedValue(expectedResponse);

      const result = await controller.getBackupCount(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.getBackupCount).toHaveBeenCalledWith(dto);
    });
  });

  describe('getDailySummary', () => {
    it('should return daily summary for specified date', async () => {
      const dto = { date: '2024-01-01' };
      const expectedResponse: DailySummaryResponse = {
        date: '2024-01-01',
        totalDevices: 2,
        totalLogs: 100,
        totalNotifications: 10,
        deviceSummaries: [
          {
            deviceSerial: 'DEVICE001',
            deviceName: 'Test Device 1',
            hospital: 'Hospital A',
            ward: 'Ward 1',
            date: '2024-01-01',
            logCount: 50,
            notificationCount: 5,
            avgTemperature: 25.5,
            avgHumidity: 60.0,
            batteryLevel: 85,
            isOnline: true,
            lastSeen: new Date('2024-01-01T12:00:00Z'),
          },
          {
            deviceSerial: 'DEVICE002',
            deviceName: 'Test Device 2',
            hospital: 'Hospital A',
            ward: 'Ward 2',
            date: '2024-01-01',
            logCount: 50,
            notificationCount: 5,
            avgTemperature: 26.0,
            avgHumidity: 65.0,
            batteryLevel: 90,
            isOnline: false,
            lastSeen: new Date('2024-01-01T11:30:00Z'),
          },
        ],
      };
      mockBackupService.getDailySummary.mockResolvedValue(expectedResponse);

      const result = await controller.getDailySummary(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.getDailySummary).toHaveBeenCalledWith(dto);
    });
  });

  describe('remove', () => {
    it('should delete backup data for specified date', async () => {
      const beforeDate = '2024-01-01';
      const expectedResponse: BackupDeleteResponse = {
        deletedLogs: 100,
        deletedNotifications: 50,
        message: `Successfully deleted 100 logs and 50 notifications before ${beforeDate}`,
      };
      mockBackupService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(beforeDate);

      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith(beforeDate);
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup data with body payload', async () => {
      const dto = { beforeDate: '2024-01-01' };
      const expectedResponse: BackupDeleteResponse = {
        deletedLogs: 75,
        deletedNotifications: 25,
        message: `Successfully deleted 75 logs and 25 notifications before ${dto.beforeDate}`,
      };
      mockBackupService.deleteBackup.mockResolvedValue(expectedResponse);

      const result = await controller.deleteBackup(dto);

      expect(result).toEqual(expectedResponse);
      expect(service.deleteBackup).toHaveBeenCalledWith(dto);
    });
  });
});
