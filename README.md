# google-dwd
Google Domain Wide Delegation Client.

## Usage
```js
const { GoogleAuth } = require('google-auth-library');
const dwd = require('google-dwd');

const auth = new GoogleAuth();
const client = await auth.getClient();

const client = await dwd(client, 'test@googleworkspace.com', [ 'https://www.googleapis.com/auth/gmail.readonly' ]);
```
