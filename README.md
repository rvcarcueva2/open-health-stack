## High-level architecture

Open Health Stack is split into a local-first mobile client, a Spring Boot API, an OpenHIM interoperability gateway, and
a HAPI FHIR server:

```text
┌──────────────────────────────┐
│ Mobile (Expo / React Native) │
│                              │
│ Screens + Expo Router        │
│ React Query                  │
│ SQLite (ohs.db)              │
└──────────────┬───────────────┘
               │ FHIR JSON over HTTP
               │ POST /api/patients
               ▼
┌──────────────────────────────┐
│ Spring Boot API :8080        │
│                              │
│ PatientController            │
│ PatientService               │
│ HAPI FHIR client (R4)        │
└──────────────┬───────────────┘
               │ FHIR REST API via OpenHIM
               ▼
┌──────────────────────────────┐
│ OpenHIM HTTP channel :5001   │
│                              │
│ Interoperability gateway     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ HAPI FHIR server :8090       │
│                              │
│ FHIR Patient resources       │
│ PostgreSQL persistence       │
└──────────────────────────────┘
```

### Mobile application

- `mobile/app/_layout.tsx`, `mobile/app/(tabs)/_layout.tsx`, `mobile/app/(tabs)/index.tsx`, and
  `mobile/app/add-patient.tsx` define the Expo Router navigation surface: a Patients tab and an Add Patient modal.
- `mobile/src/features/patients/` contains the patient feature: form validation, FHIR mapping, local persistence, API
  calls, React Query hooks, and patient list rendering.
- `mobile/src/db/migrations.ts` creates the SQLite schema. The `patients` table stores the local UUID, optional server
  ID, serialized FHIR Patient resource, sync status, and the last error. `sync_meta` stores metadata such as the last
  successful upload time.
- `mobile/src/sync/syncPatients.ts` uploads pending records when the user selects **Sync now**. New records are saved
  locally first, so they remain available while offline or when an upload fails. A local UUID is written into the FHIR
  identifier `urn:ohs:local-id` to make retries idempotent.
- `mobile/src/api/client.ts` is the HTTP boundary, while `mobile/src/config.ts` resolves the API host. The client
  requests and sends `application/fhir+json`, applies a 10-second timeout, and exposes server errors to the UI. The API
  URL can be overridden with `EXPO_PUBLIC_API_URL`; otherwise Android uses `10.0.2.2:8080` and iOS uses
  `localhost:8080`.

### Backend and FHIR persistence

- `backend/src/main/java/com/example/openhealthstack/api/PatientController.java` exposes the application API at
  `/api/patients`:
    - `GET /api/patients?count=N` lists FHIR Patients (capped at 100).
    - `GET /api/patients/{id}` reads one Patient.
    - `POST /api/patients` accepts and returns FHIR JSON and responds with `201 Created`.
- `backend/src/main/java/com/example/openhealthstack/fhir/PatientService.java` is the application-to-FHIR boundary. It
  uses HAPI's `IGenericClient` for Patient search, read, and create operations. Creates with a local identifier use a
  conditional FHIR create, preventing duplicate server resources when a client retries an upload.
- `backend/src/main/java/com/example/openhealthstack/config/FhirConfig.java` creates a singleton R4 `FhirContext` and
  configures the HAPI client from `fhir.base-url` (`http://localhost:8090/fhir` by default).
- `backend/src/main/resources/application.yml` configures the Spring API port (`8080`) and HAPI FHIR base URL.
  `docker-compose.yml` runs HAPI FHIR on port `8090` and PostgreSQL with a named volume for persistence.
- The configured FHIR base URL is `http://localhost:5001/fhir`, so backend FHIR traffic uses the OpenHIM HTTP channel.
  HAPI FHIR remains directly available at `http://localhost:8090/fhir` for local administration and troubleshooting.

### Local infrastructure

The root `docker-compose.yml` starts PostgreSQL, HAPI FHIR, OpenHIM Core, and the OpenHIM administration console:

```bash
docker compose up -d
```

The services are exposed on these local ports:

- **Spring Boot API** — `http://localhost:8080` — application API used by the mobile client.
- **HAPI FHIR** — `http://localhost:8090/fhir` — FHIR server and PostgreSQL-backed persistence.
- **OpenHIM Core API** — `http://localhost:8081` — OpenHIM management API.
- **OpenHIM HTTP channels** — `http://localhost:5001` — FHIR traffic from the backend.
- **OpenHIM HTTPS channels** — `https://localhost:5000` — TLS-enabled OpenHIM channel.
- **OpenHIM console** — `http://localhost:9000` — OpenHIM administration UI.

OpenHIM uses MongoDB for its configuration and audit data, persisted in the `ohs-openhim-mongo` named volume. HAPI FHIR
uses PostgreSQL, persisted in the `ohs-pgdata` named volume. The PostgreSQL connection values are read from the root
`.env` file; set `POSTGRES_PASSWORD` before starting the stack if it is not already defined.

The development OpenHIM console credentials are documented in [`infra/openhim/README.md`](infra/openhim/README.md). The
console is bound to loopback (`127.0.0.1`) by Docker Compose and should not be exposed publicly without changing the
deployment configuration and credentials.

After starting the stack, configure or verify the OpenHIM channel that forwards `/fhir` traffic to HAPI FHIR at
`http://hapi:8080/fhir`. The application is intentionally configured to send FHIR requests through OpenHIM rather than
directly to HAPI.

### Data flow

The patient create and upload path works as follows:

1. **Frontend accepts input** — `mobile/src/features/patients/AddPatientForm.tsx` accepts the patient's name, gender,
   and birthdate. The `useCreatePatient` mutation in `mobile/src/features/patients/hooks.ts` passes the form data to
   `insertLocalPatient`; no network request is made yet.
2. **Frontend creates and passes FHIR data** — `insertLocalPatient` in `mobile/src/features/patients/local.ts` creates a
   UUID with `expo-crypto`, then passes the form data and UUID to `toFhirPatient` in
   `mobile/src/features/patients/fhir.ts`. That function returns an R4 `Patient` containing the `urn:ohs:local-id`
   identifier. `insertLocalPatient` serializes the returned resource with `JSON.stringify`.
3. **Frontend stores and returns local state** — `mobile/src/db/migrations.ts` defines the SQLite schema.
   `mobile/src/features/patients/local.ts` inserts the serialized Patient into `patients` with `server_id = NULL` and
   `sync_status = 'pending'`. `mobile/src/features/patients/hooks.ts` then invalidates the React Query caches, and
   `mobile/src/features/patients/PatientsScreen.tsx` returns the updated local patient list while
   `mobile/src/components/SyncCard.tsx` shows the pending count.
4. **Frontend accepts a sync action** — `mobile/src/components/SyncCard.tsx` accepts the user's **Sync now** action and
   calls `useSyncNow` from `mobile/src/features/patients/hooks.ts`. The hook passes control to `syncPatients` in
   `mobile/src/sync/syncPatients.ts`, which accepts only local rows with `sync_status = 'pending'` and
   `server_id IS NULL`, then processes them sequentially.
5. **Frontend passes the HTTP request** — `mobile/src/features/patients/api.ts` passes the pending FHIR resource to
   `api.post('/api/patients', row.resource)`. `mobile/src/api/client.ts` serializes it, passes it to
   `POST http://<API host>:8080/api/patients`, sets `Content-Type` and `Accept` to `application/fhir+json`, and aborts
   after 10 seconds. It parses the HTTP result as JSON; network failures return `ApiError(status = 0)`, while HTTP
   failures return an `ApiError` containing the response status.
6. **Backend accepts and parses the request** —
   `backend/src/main/java/com/example/openhealthstack/api/PatientController.java` accepts the raw FHIR JSON request body
   at `POST /api/patients`. It passes the body to the HAPI JSON parser from
   `backend/src/main/java/com/example/openhealthstack/config/FhirConfig.java`, which parses and returns an R4 `Patient`;
   the controller then passes that Patient to `PatientService.create`.
7. **Backend passes a conditional FHIR request** —
   `backend/src/main/java/com/example/openhealthstack/fhir/PatientService.java` passes the parsed Patient through HAPI's
   `IGenericClient` to the FHIR base URL configured in `backend/src/main/resources/application.yml`. When
   `urn:ohs:local-id` exists, it passes a conditional create query using that system and UUID, so HAPI creates a new
   Patient only when no matching identifier exists. If HAPI returns no matched resource, `PatientService` searches by
   the same identifier and returns the existing Patient.
8. **OpenHIM forwards the FHIR request** — The backend sends the request to the OpenHIM HTTP channel on port `5001`.
   OpenHIM applies the configured interoperability and audit controls, then forwards the request to the HAPI FHIR
   server.
9. **FHIR server accepts and persists** — The HAPI FHIR server defined in `docker-compose.yml` parses the forwarded
   resource and persists it to PostgreSQL through the named `ohs-pgdata` volume.
10. **Backend parses and returns the response** — `PatientService` returns the saved or matched Patient to
    `PatientController`. The controller passes it to HAPI's JSON encoder, which returns FHIR JSON with HTTP
    `201 Created` to the mobile client.
11. **Frontend parses and stores the returned Patient** — `mobile/src/api/client.ts` parses the response JSON and
    returns it to `syncPatients`. `markSynced` in `mobile/src/features/patients/local.ts` accepts the returned server
    `id`, passes the server resource into SQLite, changes `sync_status` to `synced`, clears `last_error`, and returns
    the updated state through React Query.
12. **Frontend accepts failures for retry** — If the backend returns an error, `markFailed` in
    `mobile/src/features/patients/local.ts` accepts the error message and leaves the row pending. If the API cannot be
    reached, `mobile/src/sync/syncPatients.ts` stops the batch while preserving local data. If HAPI accepted a request
    but the response was lost, the next frontend retry passes the same UUID and the backend conditional create returns
    the existing Patient instead of creating a duplicate.

The current mobile sync path is upload-focused: `mobile/src/sync/syncPatients.ts` currently processes pending local rows
and does not yet perform a server pull before pushing. The local repository includes `upsertFromServer` in
`mobile/src/features/patients/local.ts`, which provides the merge rules for a future pull phase: match by server ID
first, then by the local identifier, and finally insert a new local row.

### Design decisions

- Each patient gets a local UUID that is stored inside the FHIR resource as an identifier.
- If an upload succeeds but the response never reaches the phone (signal drops mid-request),
  the next sync recognizes the patient by that identifier and links it instead of creating a duplicate.
- The intended full sync sequence is pull first, then push. Pulling first is what makes that duplicate protection work;
  the current implementation is upload-focused (see above).
- A failed upload doesn’t lose anything. The patient stays marked “waiting to sync” with the error attached.

### Integration and security direction

- The intended deployment model uses Spring Boot for business
  logic and FHIR operations, with OpenHIM as the gateway for
  inter-system traffic that needs centralized tracking.

- You don't necessarily need to route every internal
  Spring Boot request through OpenHIM.
  What matters is that the traffic you need to govern
  and audit actually passes through it.

- OpenHIM - Authenticates and controls access for external
  systems connecting through the interoperability gateway.

- Spring Security - Authenticates application users and enforces
  user-level permissions and access to healthcare data.

### Client Onboarding to OpenHIM

Subsystem ──► OpenHIM ──► HAPI FHIR

1. Agree on the contract first. Settle with the subsystem owner which resources they need (for example Patient and
   Observation), whether they only read or also write, and which authentication method they can support.

2. Create the client in the console. Console access is admin-only, so this is a controlled step. In Clients → Add, set:

- Client ID: one per subsystem, such as lab-system. Never share credentials between subsystems, because that ruins both
  the audit trail and revocation.
- Roles: the groups it belongs to, such as fhir-read.
- Credential: depends on the auth method (user & pass).

3. Grant access on a channel. A channel’s Allowed roles and clients list applies when its authentication type is
   Private. You can reuse an existing channel, or create a narrower one:

| System/API| URL pattern | Methods | 	Allowed role   |
|----------|----------|----------|---|
|Lab system (read-only)  | ^/fhir/Patient.*$  |  GET  |  read-only  |

4. The subsystem sends requests to OpenHIM, never to HAPI.
```bash
curl -u lab-system:THE_PASSWORD \
  -H "Accept: application/fhir+json" \
  http://localhost:5001/fhir/Patient/1
```

5. Verify and monitor. The console’s Transaction Log shows each request with the client that made it. Test three cases: a valid call succeeds, a call with wrong credentials gets 401, and a call outside the client’s channels is rejected.

### UI

- Tabs switch between top-level sections that are always available, like Patients, Sync status or Settings.
- Stack moves you forward through a flow and back again, like the patient list leading to the Add patient form.


