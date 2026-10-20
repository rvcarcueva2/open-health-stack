// Spring configuration class
// It creates the two shared objects your backend needs in order to talk to the FHIR server (via OpenHIM) and makes them available to the rest of the app.
package com.example.openhealthstack.config;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ca.uhn.fhir.rest.client.interceptor.BasicAuthInterceptor;

@Configuration
public class FhirConfig {

    // FHIR version (R4 here), has the model classes for Patient, Bundle and so on, and creates JSON parsers.
    // Expensive to create, so keep it a singleton
    @Bean
    FhirContext fhirContext() {
        return FhirContext.forR4();
    }

    @Bean
    IGenericClient fhirClient( // //The HTTP client that sends FHIR requests (search, read, create) to the server. Its base URL (http://localhost:5001/fhir, the OpenHIM channel)
            FhirContext ctx,
            @Value("${fhir.base-url}") String baseUrl, // Credentials from applications.yml
            @Value("${fhir.username}") String username,
            @Value("${fhir.password}") String password) {
        IGenericClient client = ctx.newRestfulGenericClient(baseUrl);
        client.registerInterceptor(new BasicAuthInterceptor(username, password)); // BasicAuthInterceptor adds the Authorization header to every request.
        return client;
    }
}