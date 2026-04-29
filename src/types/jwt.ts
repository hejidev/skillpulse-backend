export interface JwtPayloadType {
  userId: string;
  role: "user" | "admin";
}