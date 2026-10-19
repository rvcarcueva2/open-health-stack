package com.example.openhealthstack.api;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.server.exceptions.ResourceNotFoundException;
import com.example.openhealthstack.fhir.PatientService;
import org.hl7.fhir.instance.model.api.IBaseResource;
import org.hl7.fhir.r4.model.Patient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private static final String FHIR_JSON = "application/fhir+json";

    private final PatientService service;
    private final FhirContext ctx;

    public PatientController(PatientService service, FhirContext ctx) {
        this.service = service;
        this.ctx = ctx;
    }

    @GetMapping(produces = FHIR_JSON)
    public String list(@RequestParam(defaultValue = "20") int count) {
        return json(service.search(Math.min(count, 100)));
    }

    @GetMapping(value = "/{id}", produces = FHIR_JSON)
    public String get(@PathVariable String id) {
        return json(service.read(id));
    }

    @PostMapping(consumes = FHIR_JSON, produces = FHIR_JSON)
    @ResponseStatus(HttpStatus.CREATED)
    public String create(@RequestBody String body) {
        Patient patient = ctx.newJsonParser().parseResource(Patient.class, body);
        return json(service.create(patient));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Void> notFound() {
        return ResponseEntity.notFound().build();
    }

    // HAPI models don't serialize well with Jackson, so always use HAPI's own parser
    private String json(IBaseResource resource) {
        return ctx.newJsonParser().encodeResourceToString(resource);
    }
}