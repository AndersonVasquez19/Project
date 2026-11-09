export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthTokenResponse {
  user: AuthenticatedUser;
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}
