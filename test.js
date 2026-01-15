const assert = require('assert');
const mockery = require('mockery');

// Enable mockery
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

// Mock Data
const MOCK_ACCESS_TOKEN = 'mock_access_token';
const MOCK_SIGNATURE = 'mock_signature_base64_encoded==';
const MOCK_EMAIL = 'service-account@project.iam.gserviceaccount.com';
const MOCK_PROJECT = 'mock-project';

// Mocks
const mockGaxios = {
    request: async (opts) => {
        console.log('Mock Gaxios Request:', opts.url);
        if (opts.url.includes('metadata.google.internal')) {
            return { data: MOCK_EMAIL };
        }
        if (opts.url === 'https://oauth2.googleapis.com/token') {
             // Verify body params if needed
             const body = new URLSearchParams(opts.body);
             if (body.get('grant_type') === 'urn:ietf:params:oauth:grant-type:jwt-bearer' && body.get('assertion')) {
                 return { data: { access_token: MOCK_ACCESS_TOKEN } };
             }
        }
        throw new Error(`Unexpected request to ${opts.url}`);
    }
};

const mockIam = {
    iam: (version) => {
        assert.strictEqual(version, 'v1');
        return {
            projects: {
                serviceAccounts: {
                    signBlob: async (params) => {
                        console.log('Mock IAM signBlob:', params.name);
                        return { data: { signature: MOCK_SIGNATURE } };
                    }
                }
            }
        };
    }
};

class MockOAuth2Client {
    setCredentials(creds) {
        this.credentials = creds;
    }
}

class MockCompute {}
class MockImpersonated {
    constructor() {
        this.targetPrincipal = MOCK_EMAIL;
    }
}
class MockJWT {
    constructor() {
        this.email = MOCK_EMAIL;
    }
}

const mockGoogleAuthLibrary = {
    Compute: MockCompute,
    Impersonated: MockImpersonated,
    JWT: MockJWT,
    OAuth2Client: MockOAuth2Client
};

// Register Mocks
mockery.registerMock('gaxios', mockGaxios);
mockery.registerMock('@googleapis/iam', mockIam);
mockery.registerMock('google-auth-library', mockGoogleAuthLibrary);

// Import the function under test
const getClient = require('./index.js');

async function runTests() {
    console.log('Running tests...');

    // Test 1: JWT Client
    console.log('Test 1: JWT Client');
    const jwtClient = new MockJWT();
    const creds1 = await getClient(jwtClient, 'user@example.com', ['https://www.googleapis.com/auth/drive']);
    assert.strictEqual(creds1.credentials.access_token, MOCK_ACCESS_TOKEN);
    console.log('  PASS');

    // Test 2: Compute Client (Metadata Server)
    console.log('Test 2: Compute Client');
    const computeClient = new MockCompute();
    const creds2 = await getClient(computeClient, 'user@example.com', ['https://www.googleapis.com/auth/drive']);
    assert.strictEqual(creds2.credentials.access_token, MOCK_ACCESS_TOKEN);
    console.log('  PASS');

    // Test 3: Impersonated Client
    console.log('Test 3: Impersonated Client');
    const impersonatedClient = new MockImpersonated();
    const creds3 = await getClient(impersonatedClient, 'user@example.com', ['https://www.googleapis.com/auth/drive']);
    assert.strictEqual(creds3.credentials.access_token, MOCK_ACCESS_TOKEN);
    console.log('  PASS');

    console.log('All tests passed!');
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
