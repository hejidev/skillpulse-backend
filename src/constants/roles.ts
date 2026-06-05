export const ROLE_PERMISSIONS = {
  super_admin: [
    "users_management",
    "ticket_system",
    "billing_access",
    "system_settings",
    "analytics_access",
    "audit_logs",
    "role_management",
  ],

  admin: [
    "users_management",
    "ticket_system",
    "analytics_access",
  ],

  support: [
    "ticket_system",
  ],

  user: [],
};

export const SOCKET_EVENTS = {
  SYSTEM_ALERT_CREATED: "systemAlertCreated",
  SYSTEM_ALERT_UPDATED: "systemAlertUpdated",
  USER_MESSAGE: "userMessage",
  ADMIN_BROADCAST: "adminBroadcast",
  TICKET_REPLY: "ticketReply",
};
