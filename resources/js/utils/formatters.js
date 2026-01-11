import { format, formatDistanceToNow, parseISO, isToday, isBefore } from 'date-fns';

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatNumber = (num) => {
    return new Intl.NumberFormat('en-LK').format(num);
};

export const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (time) => {
    if (!time) return '';
    return format(parseISO(`2000-01-01T${time}`), 'hh:mm a');
};

export const formatRelative = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
};

export const isTodayDate = (date) => {
    if (!date) return false;
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isToday(d);
};

export const isExpired = (date) => {
    if (!date) return false;
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(d, new Date());
};

export const getCurrentShiftStatus = () => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
        return { status: 'production', label: 'Production Shift (5AM - 12PM)', color: 'shift' };
    } else if (hours >= 12 && hours < 20) {
        return { status: 'sales', label: 'Sales Period (12PM - 8PM)', color: 'noon' };
    } else if (hours >= 20 || hours < 5) {
        return { status: 'settlement', label: 'Settlement Time', color: 'evening' };
    }
    return { status: 'closed', label: 'Closed', color: 'evening' };
};

export const getCategoryBadge = (category) => {
    switch (category) {
        case 'day_food':
            return { label: 'Day Food', className: 'badge-warning' };
        case 'packed_food':
            return { label: 'Packed', className: 'badge-info' };
        default:
            return { label: category, className: 'badge-primary' };
    }
};

export const getStatusBadge = (status) => {
    switch (status) {
        case 'in_progress':
            return { label: 'In Progress', className: 'badge-warning' };
        case 'completed':
            return { label: 'Completed', className: 'badge-success' };
        case 'open':
            return { label: 'Open', className: 'badge-info' };
        case 'verified':
            return { label: 'Verified', className: 'badge-primary' };
        case 'closed':
            return { label: 'Closed', className: 'badge-success' };
        case 'pending':
            return { label: 'Pending', className: 'badge-warning' };
        case 'settled':
            return { label: 'Settled', className: 'badge-success' };
        case 'disputed':
            return { label: 'Disputed', className: 'badge-danger' };
        default:
            return { label: status, className: 'badge-secondary' };
    }
};
