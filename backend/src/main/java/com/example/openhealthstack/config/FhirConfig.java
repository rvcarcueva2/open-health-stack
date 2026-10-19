package com.example.openhealthstack.config;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ca.uhn.fhir.rest.client.interceptor.BasicAuthInterceptor;

@Configuration
public class FhirConfig {

    @Bean
    FhirContext fhirContext() {
        return FhirContext.forR4();   // expensive to create, so keep it a singleton
    }

    @Bean
    IGenericClient fhirClient(
            FhirContext ctx,
            @Value("${fhir.base-url}") String baseUrl,
            @Value("${fhir.username}") String username,
            @Value("${fhir.password}") String password) {
        IGenericClient client = ctx.newRestfulGenericClient(baseUrl);
        client.registerInterceptor(new BasicAuthInterceptor(username, password));
        return client;
    }
}