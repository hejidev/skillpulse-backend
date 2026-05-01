export interface JwtPayloadType {
  userId: string;
  name: string;
  role: "user" | "admin";
}