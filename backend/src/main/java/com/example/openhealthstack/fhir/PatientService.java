package com.example.openhealthstack.fhir;

import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.api.PreferReturnEnum;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Patient;
import org.hl7.fhir.r4.model.Identifier;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PatientService {

    public static final String LOCAL_ID_SYSTEM = "urn:ohs:local-id";
    private final IGenericClient fhir;

    public PatientService(IGenericClient fhir) {
        this.fhir = fhir;
    }

    public Bundle search(int count) {
        return fhir.search()
                .forResource(Patient.class)
                .count(count)
                .returnBundle(Bundle.class)
                .execute();
    }


    public Patient read(String id) {
        return fhir.read().resource(Patient.class).withId(id).execute();
    }

    public Patient create(Patient patient) {
        String localId = localIdOf(patient);

        if (localId == null) {   // no device id: plain create
            MethodOutcome plain = fhir.create()
                    .resource(patient)
                    .prefer(PreferReturnEnum.REPRESENTATION)
                    .execute();
            return (Patient) plain.getResource();
        }

        // Create only if no Patient with this device id exists yet
        MethodOutcome outcome = fhir.create()
                .resource(patient)
                .prefer(PreferReturnEnum.REPRESENTATION)
                .conditional()
                .where(Patient.IDENTIFIER.exactly().systemAndIdentifier(LOCAL_ID_SYSTEM, localId))
                .execute();

        if (outcome.getResource() instanceof Patient saved) {
            return saved;
        }
        // The match already existed and HAPI didn't echo it back: fetch it
        return findByLocalId(localId)
                .orElseThrow(() -> new IllegalStateException("Patient not found after create"));
    }

    private Optional<Patient> findByLocalId(String localId) {
        Bundle bundle = fhir.search()
                .forResource(Patient.class)
                .where(Patient.IDENTIFIER.exactly().systemAndIdentifier(LOCAL_ID_SYSTEM, localId))
                .returnBundle(Bundle.class)
                .execute();
        return bundle.getEntry().stream()
                .map(e -> (Patient) e.getResource())
                .findFirst();
    }

    private static String localIdOf(Patient p) {
        return p.getIdentifier().stream()
                .filter(i -> LOCAL_ID_SYSTEM.equals(i.getSystem()))
                .map(Identifier::getValue)
                .findFirst()
                .orElse(null);
    }
}