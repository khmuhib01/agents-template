# invoice-service
Multi-tenant invoicing. Every request carries `ctx = { tenantId, userId }`. Invoice ids are sequential integers shared by all tenants.
