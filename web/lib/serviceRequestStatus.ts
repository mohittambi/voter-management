/**
 * Single linear pipeline for service requests (one-way, one step at a time).
 * Keep in sync with API PATCH validation and notifications.
 */
export const SERVICE_REQUEST_STATUS_ORDER = [
  'Document Submitted',
  'Document Shared to Office',
  'Work in Progress',
  'Work Completed',
  'Closed / Delivered',
] as const;

export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUS_ORDER)[number];

export function serviceRequestStatusIndex(status: string): number {
  return SERVICE_REQUEST_STATUS_ORDER.indexOf(status as ServiceRequestStatus);
}

/** Next status in order, or null if terminal / unknown. */
export function getNextServiceRequestStatus(current: string): string | null {
  const i = serviceRequestStatusIndex(current);
  if (i < 0 || i >= SERVICE_REQUEST_STATUS_ORDER.length - 1) return null;
  return SERVICE_REQUEST_STATUS_ORDER[i + 1];
}

export function isValidServiceRequestStatusTransition(
  from: string,
  to: string
): { ok: true } | { ok: false; message: string } {
  if (from === to) return { ok: true };
  const fromIdx = serviceRequestStatusIndex(from);
  const toIdx = serviceRequestStatusIndex(to);
  if (fromIdx === -1) {
    return { ok: false, message: `Unknown current status: ${from}` };
  }
  if (toIdx === -1) {
    return { ok: false, message: `Invalid target status: ${to}` };
  }
  if (toIdx <= fromIdx) {
    return {
      ok: false,
      message: 'Cannot move to a previous status. Advance one step forward only.',
    };
  }
  if (toIdx !== fromIdx + 1) {
    return {
      ok: false,
      message: 'Status can only advance one step at a time in the defined order.',
    };
  }
  return { ok: true };
}
