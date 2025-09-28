export interface BackupCountResponse {
  log: number;
  notification: number;
}

export interface DeviceDailySummary {
  deviceSerial: string;
  deviceName: string;
  hospital: string;
  ward: string;
  date: string;
  logCount: number;
  notificationCount: number;
  avgTemperature?: number;
  avgHumidity?: number;
  batteryLevel?: number;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface DailySummaryResponse {
  date: string;
  totalDevices: number;
  totalLogs: number;
  totalNotifications: number;
  deviceSummaries: DeviceDailySummary[];
}

export interface BackupDeleteResponse {
  deletedLogs: number;
  deletedNotifications: number;
  message: string;
}
