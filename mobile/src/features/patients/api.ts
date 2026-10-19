import {api} from '../../api/client';


export function createPatient(resource: fhir4.Patient): Promise<fhir4.Patient> {
    return api.post<fhir4.Patient>('/api/patients', resource);
}