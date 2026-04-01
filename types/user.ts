export type UserRole = "ADMIN" | "ANALYST";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface EditUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}
