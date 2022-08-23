import { OAuth2Client } from "google-auth-library";

export default function(client: OAuth2Client, subject: string, scopes: string[]): Promise<OAuth2Client>;
