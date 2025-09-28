import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';
import { DateUtils } from './utils/date.utils';

describe('BackupService', () => {
  let service: BackupService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    logDays: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    notifications: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    devices: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBackupCount', () => {
    it('should return backup count for today when no date provided', async () => {
      const expectedResponse = { log: 10, notification: 5 };
      mockPrismaService.$transaction.mockResolvedValue([10, 5]);

      const result = await service.getBackupCount();

      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should return backup count for specific date', async () => {
      const testDate = '2024-01-01';
      const expectedResponse = { log: 15, notification: 8 };
      mockPrismaService.$transaction.mockResolvedValue([15, 8]);

      const result = await service.getBackupCount({ beforeDate: testDate });

      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const invalidDate = 'invalid-date';

      await expect(service.getBackupCount({ beforeDate: invalidDate }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when database fails', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.getBackupCount())
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('getDailySummary', () => {
    const mockDevices = [
      {
        serial: 'DEVICE001',
        name: 'Temperature Sensor 1',
        staticName: 'TS01',
        hospital: 'Hospital A',
        ward: 'Ward 1',
        online: true,
        log: [
          {
            temp: 25.5,
            humidity: 60.0,
            battery: 85,
            sendTime: new Date('2024-01-01T10:00:00Z'),
          },
          {
            temp: 26.0,
            humidity: 62.0,
            battery: 84,
            sendTime: new Date('2024-01-01T11:00:00Z'),
          },
        ],
        notification: [
          { id: '1', message: 'Test notification 1' },
          { id: '2', message: 'Test notification 2' },
        ],
      },
      {
        serial: 'DEVICE002',
        name: null,
        staticName: 'TS02',
        hospital: 'Hospital A',
        ward: 'Ward 2',
        online: false,
        log: [],
        notification: [],
      },
    ];

    it('should return daily summary for valid date', async () => {
      const testDate = '2024-01-01';
      mockPrismaService.devices.findMany.mockResolvedValue(mockDevices);

      const result = await service.getDailySummary({ date: testDate });

      expect(result).toEqual({
        date: testDate,
        totalDevices: 2,
        totalLogs: 2,
        totalNotifications: 2,
        deviceSummaries: [
          {
            deviceSerial: 'DEVICE001',
            deviceName: 'Temperature Sensor 1',
            hospital: 'Hospital A',
            ward: 'Ward 1',
            date: testDate,
            logCount: 2,
            notificationCount: 2,
            avgTemperature: 25.75,
            avgHumidity: 61.0,
            batteryLevel: 84,
            isOnline: true,
            lastSeen: new Date('2024-01-01T11:00:00Z'),
          },
          {
            deviceSerial: 'DEVICE002',
            deviceName: 'TS02',
            hospital: 'Hospital A',
            ward: 'Ward 2',
            date: testDate,
            logCount: 0,
            notificationCount: 0,
            avgTemperature: undefined,
            avgHumidity: undefined,
            batteryLevel: undefined,
            isOnline: false,
            lastSeen: undefined,
          },
        ],
      });
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const invalidDate = 'invalid-date';

      await expect(service.getDailySummary({ date: invalidDate }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when database fails', async () => {
      mockPrismaService.devices.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getDailySummary({ date: '2024-01-01' }))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup data successfully', async () => {
      const testDate = '2024-01-01';
      const mockDeleteResult = [
        { count: 100 }, // logs deleted
        { count: 50 },  // notifications deleted
      ];
      mockPrismaService.$transaction.mockResolvedValue(mockDeleteResult);

      const result = await service.deleteBackup({ beforeDate: testDate });

      expect(result).toEqual({
        deletedLogs: 100,
        deletedNotifications: 50,
        message: `Successfully deleted 100 logs and 50 notifications before ${testDate}`,
      });
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const invalidDate = 'invalid-date';

      await expect(service.deleteBackup({ beforeDate: invalidDate }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when database fails', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteBackup({ beforeDate: '2024-01-01' }))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('findAll (backward compatibility)', () => {
    it('should call getBackupCount method', async () => {
      const expectedResponse = { log: 10, notification: 5 };
      mockPrismaService.$transaction.mockResolvedValue([10, 5]);

      const result = await service.findAll();

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('remove (backward compatibility)', () => {
    it('should call deleteBackup method', async () => {
      const testDate = '2024-01-01';
      const mockDeleteResult = [
        { count: 100 },
        { count: 50 },
      ];
      mockPrismaService.$transaction.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(testDate);

      expect(result).toEqual({
        deletedLogs: 100,
        deletedNotifications: 50,
        message: `Successfully deleted 100 logs and 50 notifications before ${testDate}`,
      });
    });
  });
});
