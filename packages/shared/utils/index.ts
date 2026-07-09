import type { ServiceRequestStatus } from '../types';

export function formatDistance(kilometers: number): string {
  if (!Number.isFinite(kilometers)) return 'Unknown';
  if (kilometers < 1) return `${Math.round(kilometers * 1000)} m`;
  return `${kilometers.toFixed(1)} km`;
}

export function formatEta(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return 'ETA unavailable';
  if (minutes < 1) return 'Arriving now';
  return `${Math.round(minutes)} min`;
}

export function getRequestStatusLabel(status: ServiceRequestStatus): string {
  const labels: Record<ServiceRequestStatus, string> = {
    notified_multiple: 'Finding providers',
    accepted: 'Accepted',
    provider_enroute: 'Provider en route',
    arriving: 'Arriving',
    arrived: 'Arrived',
    in_progress: 'In progress',
    work_in_progress: 'Work in progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_ustaz_found: 'No Ustaz found',
    rejected: 'Rejected',
  };

  return labels[status];
}