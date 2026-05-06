export interface UserEmailVerifiedEvent {
  user_id: string;
  keycloak_id: string;
  email_id: string;
  email?: string;
}
