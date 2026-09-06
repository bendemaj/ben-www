export interface TimeEntry {
  id: string;
  tag: string;
  start: number;
  end: number;
  duration: number;
}

export interface RunningTimer {
  tag: string;
  start: number;
}
