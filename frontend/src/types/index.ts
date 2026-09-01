export type TicketStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'SERVING' 
  | 'COMPLETED' 
  | 'SKIPPED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: number;
  services: {
    database: string;
    redis: string;
  };
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  patientName: string;
  departmentName: string;
  doctorName?: string;
  status: TicketStatus;
  estimatedWaitMinutes: number;
  positionInQueue: number;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  rating: number;
  distanceKm: number;
  openQueues: number;
  avgWaitMinutes: number;
  emergencyAvailable: boolean;
}
