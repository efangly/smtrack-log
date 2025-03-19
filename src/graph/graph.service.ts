import { BadRequestException, Injectable } from '@nestjs/common';
import { InfluxdbService } from '../influxdb/influxdb.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GraphService {
  constructor(private readonly influxdb: InfluxdbService, private readonly redis: RedisService) {}
  async findAll(sn: string, filter: string) {
    if (!sn) throw new BadRequestException('Invalid sn');
    if (!filter) throw new BadRequestException('Invalid filter');
    const cache = await this.redis.get(`graph:${sn}${filter.split(',').join("")}`);
    if (cache) return JSON.parse(cache);
    let query = `from(bucket: "${process.env.INFLUXDB_BUCKET}") `;
    switch (filter) {
      case 'day':
        query += '|> range(start: -1d) ';
        break;
      case 'week':
        query += '|> range(start: -1w) ';
        query += '|> aggregateWindow(every: 10m, fn: first, createEmpty: false) ';
        break;
      case 'month':
        query += '|> range(start: -1mo) ';
        query += '|> aggregateWindow(every: 30m, fn: first, createEmpty: false) ';
        break;
      default:
        if (!filter.includes(',')) throw new BadRequestException('Invalid filter');
        const date = filter.split(',');
        query += `|> range(start: ${date[0]}, stop: ${date[1]}) `;
        query += '|> aggregateWindow(every: 30m, fn: first, createEmpty: false) ';
    };
    query += '|> timeShift(duration: 7h, columns: ["_time"]) ';
    query += '|> filter(fn: (r) => r._measurement == "logdays") ';
    query += `|> filter(fn: (r) => r.sn == "${sn}")`;
    query += '|> filter(fn: (r) => r._field == "temp" or r._field == "humidity" or r._field == "extMemory" or r._field == "door1" ';
    query += 'or r._field == "door2" or r._field == "door3" or r._field == "battery" or r._field == "plug" or r._field == "internet") ';
    query += '|> filter(fn: (r) => r.probe == "1" or r.probe == "2") ';
    query += '|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value") ';
    query += '|> keep(columns: ["_time", "temp", "humidity", "extMemory", "door1", "door2", "door3", "probe" , "battery", "plug", "internet"]) ';
    const result = await this.influxdb.queryData(query);
    if (result.length > 0) await this.redis.set(`graph:${sn}${filter.split(',').join("")}`, JSON.stringify(result), 1800);
    return result;
  }
}
