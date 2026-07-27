import type { ServiceRequestStatus } from '../types';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Mirrors the DB's calculate_visiting_fee() tiers: <=5km->500, <=10km->1000, >10km->1500. */
export function estimateVisitingFee(distanceKm: number): number {
  if (distanceKm <= 5) return 500;
  if (distanceKm <= 10) return 1000;
  return 1500;
}

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