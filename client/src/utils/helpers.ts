export const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    created: 'badge-pending',
    pending: 'badge-pending',
    approved: 'badge-approved',
    checked_in: 'badge-checked-in',
    checked_out: 'badge-checked-out',
    rejected: 'badge-rejected',
    cancelled: 'badge-cancelled',
  };
  return map[status] ?? 'badge-pending';
};

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    created: 'Created',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    cancelled: 'Cancelled',
  };
  return (
    map[status] ??
    (status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : '—')
  );
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0] as string;
};
