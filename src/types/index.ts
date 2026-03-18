export type Role = "user" | "moderator" | "admin" | "super_admin";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  totalPoints: number;
  createdAt?: Date;
  image?: string | null;
}
