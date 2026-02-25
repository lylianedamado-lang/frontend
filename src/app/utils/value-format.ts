const MISSING_TEXT_VALUES = new Set([
  '',
  'nan',
  'none',
  'null',
  'na',
  'n/a',
  'undefined'
]);

export function isMissingValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    return MISSING_TEXT_VALUES.has(value.trim().toLowerCase());
  }
  return false;
}

export function formatCellValue(value: unknown): string {
  if (isMissingValue(value)) return '—';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds()
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'string') {
    return normalizeDateLikeString(value) ?? value;
  }

  if (Array.isArray(value) || (value && typeof value === 'object')) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function normalizeDateLikeString(input: string): string | null {
  const raw = input.trim();
  if (raw.length < 6 || raw.length > 40) return null;

  const normalizedSeparators = raw.replace(/\./g, '/').replace(/\s+/g, ' ');

  // dd/mm/yyyy or dd-mm-yyyy (+ optional time)
  const dmy = normalizedSeparators.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dmy) {
    let day = Number(dmy[1]);
    let month = Number(dmy[2]);
    const year = normalizeYear(dmy[3]);
    const hour = toOptionalNumber(dmy[4]);
    const minute = toOptionalNumber(dmy[5]);
    const second = toOptionalNumber(dmy[6]);

    // If month/day are swapped, try to auto-correct.
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }

    if (isValidDateParts(year, month, day, hour, minute, second)) {
      return formatDateParts(year, month, day, hour, minute, second);
    }
  }

  // yyyy/mm/dd or yyyy-mm-dd (+ optional time)
  const ymd = normalizedSeparators.match(
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    const hour = toOptionalNumber(ymd[4]);
    const minute = toOptionalNumber(ymd[5]);
    const second = toOptionalNumber(ymd[6]);

    if (isValidDateParts(year, month, day, hour, minute, second)) {
      return formatDateParts(year, month, day, hour, minute, second);
    }
  }

  const timestamp = Date.parse(raw);
  const likelyDateText = /[\/\-:TzZ]/.test(raw);
  if (!Number.isNaN(timestamp) && likelyDateText) {
    const date = new Date(timestamp);
    return formatDateParts(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );
  }

  return null;
}

function normalizeYear(value: string): number {
  if (value.length === 2) {
    const twoDigits = Number(value);
    return twoDigits >= 70 ? 1900 + twoDigits : 2000 + twoDigits;
  }
  return Number(value);
}

function toOptionalNumber(value?: string): number | null {
  if (value === undefined) return null;
  return Number(value);
}

function isValidDateParts(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  minute: number | null,
  second: number | null
): boolean {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  if (hour !== null && (!Number.isInteger(hour) || hour < 0 || hour > 23)) return false;
  if (minute !== null && (!Number.isInteger(minute) || minute < 0 || minute > 59)) return false;
  if (second !== null && (!Number.isInteger(second) || second < 0 || second > 59)) return false;

  const date = new Date(
    year,
    month - 1,
    day,
    hour ?? 0,
    minute ?? 0,
    second ?? 0
  );
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function formatDateParts(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  minute: number | null,
  second: number | null
): string {
  const datePart = `${pad(day)}/${pad(month)}/${year}`;
  const hasTime = hour !== null && minute !== null;
  if (!hasTime) return datePart;

  const hh = pad(hour as number);
  const mm = pad(minute as number);
  if (second === null) return `${datePart} ${hh}:${mm}`;
  return `${datePart} ${hh}:${mm}:${pad(second)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
