// FHIR Helpers
export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface NewPatient {
    given: string;
    family: string;
    gender: Gender;
    birthDate: string; // YYYY-MM-DD
}

// Marks which device-side record a FHIR Patient came from; prevents duplicates on retry
export const LOCAL_ID_SYSTEM = 'urn:ohs:local-id';

export function toFhirPatient(input: NewPatient, localId: string): fhir4.Patient {
    return {
        resourceType: 'Patient',
        identifier: [{system: LOCAL_ID_SYSTEM, value: localId}],
        name: [{family: input.family.trim(), given: [input.given.trim()]}],
        gender: input.gender,
        birthDate: input.birthDate,
    };
}

export function localIdOf(p: fhir4.Patient): string | undefined {
    return p.identifier?.find((i) => i.system === LOCAL_ID_SYSTEM)?.value;
}

export function formatName(p: fhir4.Patient): string {
    const n = p.name?.[0];
    if (!n) return 'Unnamed';
    return [...(n.given ?? []), n.family].filter(Boolean).join(' ');
}