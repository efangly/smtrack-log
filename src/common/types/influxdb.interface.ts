export interface InfluxRow {
  _time: string;
  _value: number;
  _field: string;
  _measurement: string;
  sn: string;
  probe: string;
}