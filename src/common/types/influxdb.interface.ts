export interface InfluxRow {
  _time: string;
  _value: number;
  _field: string;
  _measurement: string;
  result: string;
  table: number;
  sn: string;
  probe: string;
}