import { OAuth2Client } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";

export default function(client: OAuth2Client | JSONClient, subject: string, scopes: string[]): Promise<OAuth2Client>;
