# google-dwd

> Google Domain Wide Delegation Client for Node.js

This library enables **Domain-Wide Delegation (DWD)** using **Service Account credentials** without requiring a local private key file. It supports:

*   **Standard Service Accounts** (via `GOOGLE_APPLICATION_CREDENTIALS`)
*   **Compute Engine / Cloud Run** default service accounts (via Metadata Server)
*   **Impersonated Credentials**

It solves the limitation where standard Google libraries require a local private key for DWD, enabling secure, keyless operation in environments like Cloud Run or GKE.

## Install

```bash
npm install google-dwd
```

## Usage

```js
const { GoogleAuth } = require('google-auth-library');
const dwd = require('google-dwd');

async function main() {
  // 1. Obtain the initial client (Must be a Service Account, Compute, or Impersonated client)
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();

  // 2. Exchange it for a DWD client acting as a specific user
  const dwdClient = await dwd(
    client, 
    'user@googleworkspace.com', // The user to impersonate
    ['https://www.googleapis.com/auth/gmail.readonly'] // Scopes required for the user
  );

  // 3. Use the new client to make requests
  const res = await dwdClient.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile' });
  console.log(res.data);
}

main().catch(console.error);
```

## Supported Credential Types

The `client` passed to `google-dwd` must be an instance of one of the following classes from `google-auth-library`:

*   `JWT` (Standard Service Account key file)
*   `Compute` (Environment-provided credentials on GCE/Cloud Run)
*   `Impersonated` (Short-lived credentials created via IAMCredentials API)

**Note:** User credentials (e.g., from `gcloud auth application-default login`) cannot be used **directly**. However, you can use them to create an `Impersonated` client (acting as a Service Account), which is supported.

## License

[Apache-2.0](LICENSE)