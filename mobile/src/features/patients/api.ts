//  This api acts as a bridge between the application's user interface and healthcare database
//  without needing to know anything about URLs, network configurations.
import {api} from '../../api/client'; // The URL and network configuration


export function createPatient(resource: fhir4.Patient): Promise<fhir4.Patient> {
    return api.post<fhir4.Patient>('/api/patients', resource);
}