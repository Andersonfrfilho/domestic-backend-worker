import { Injectable } from '@nestjs/common';

import { EnvironmentProvider } from '@config/providers/environment.provider';

interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

@Injectable()
export class KeycloakAdminProvider {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly env: EnvironmentProvider) {}

  private async getAdminToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 30000) {
      return this.token;
    }

    const url = `${this.env.keycloakBaseUrl}/realms/master/protocol/openid-connect/token`;
    const body = new URLSearchParams();
    body.append('grant_type', 'password');
    body.append('client_id', 'admin-cli');
    body.append('username', this.env.keycloakAdminUser);
    body.append('password', this.env.keycloakAdminPassword);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Keycloak token request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as KeycloakTokenResponse;
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  async updateUserEmailVerified(userId: string, emailVerified: boolean): Promise<void> {
    const token = await this.getAdminToken();
    const url = `${this.env.keycloakBaseUrl}/admin/realms/${this.env.keycloakRealm}/users/${userId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emailVerified }),
    });

    if (!response.ok) {
      throw new Error(`Keycloak update user failed: ${response.status} ${await response.text()}`);
    }
  }
}
