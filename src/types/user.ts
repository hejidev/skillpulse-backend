export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}


// Real database users
// Role assignment
// Permissions system (RBAC)
// Suspend / activate users
// Search users
// Real API integration
// Super Admin protection
// Audit logs
// Live stats