// UI Patient helpers
import {Gender} from './fhir';

export const genderLabel: Record<Gender, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    unknown: 'Unknown',
};

/** Local date as YYYY-MM-DD (avoids the off-by-one-day bug of toISOString in non-UTC timezones). */
export function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Age in whole years, or null for missing/partial/invalid dates. */
export function ageFromBirthDate(birthDate?: string, today = new Date()): number | null {
    if (!birthDate) return null;
    const [y, m, d] = birthDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    const todayMonth = today.getMonth() + 1;
    const hadBirthday = todayMonth > m || (todayMonth === m && today.getDate() >= d);
    const age = today.getFullYear() - y - (hadBirthday ? 0 : 1);
    return age >= 0 ? age : null;
}

export function initialsOf(p: fhir4.Patient): string {
    const n = p.name?.[0];
    const first = n?.given?.[0]?.[0] ?? '';
    const last = n?.family?.[0] ?? '';
    return (first + last).toUpperCase() || '?';
}