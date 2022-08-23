const { Compute, Impersonated, JWT, OAuth2Client } = require('google-auth-library');

const { request } = require('gaxios');

const google = require('@googleapis/iam');

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const unpaddedB64encode = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=*$/, '');

module.exports = async (client, subject, scopes) => {
  let iss;
  if (client instanceof JWT) {
    iss = client.email;
  } else if (client instanceof Impersonated) {
    iss = client.targetPrincipal;
  } else if (client instanceof Compute) {
    const response = await request({ url: 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', method: 'GET',
      headers: { 'Metadata-Flavor': 'Google' } });

    iss = response.data;
  }

  if (iss) {
    const now = Math.floor(new Date().getTime() / 1000);
    const expiry = now + 3600;
    const payload = JSON.stringify({
      aud: TOKEN_ENDPOINT,
      exp: expiry,
      iat: now,
      iss: iss,
      scope: scopes.join(' '),
      sub: subject,
    });

    const header = JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
    });

    const iamPayload = `${unpaddedB64encode(header)}.${unpaddedB64encode(payload)}`;

    const iam = google.iam('v1');
    const { data } = await iam.projects.serviceAccounts.signBlob({
      auth: client,
      name: `projects/-/serviceAccounts/${iss}`,
      requestBody: {
        bytesToSign: unpaddedB64encode(iamPayload)
      },
    });

    const assertion = `${iamPayload}.${data.signature.replace(/=*$/, '')}`;

    const body = new URLSearchParams({ assertion, grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer' }).toString();

    const response = await request({ url: TOKEN_ENDPOINT, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });

    const newCredentials = new OAuth2Client();
    newCredentials.setCredentials({ access_token: response.data.access_token });

    return newCredentials;
  } else {
    throw new Error('Unexpected authentication type');
  }
}
