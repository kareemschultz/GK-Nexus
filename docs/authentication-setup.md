# GK-Nexus Authentication & User Management Setup

This document provides complete setup instructions for the GK-Nexus authentication system and RBAC (Role-Based Access Control).

## 📋 **Overview**

GK-Nexus uses a sophisticated authentication system with:
- **Better-auth** for session management
- **Comprehensive RBAC** with roles, permissions, and user management
- **Hierarchical role structure** with inheritance
- **Granular permissions** with resource/action/scope model
- **Temporal permissions** and approval workflows

## 🚀 **Quick Setup**

### 1. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. **Database Setup**
```bash
# Push database schema
bun run db:push

# Initialize system data (roles, permissions, super admin)
bun run init:system
```

### 3. **Start Application**
```bash
# Start all services
bun run dev

# Or start individually
bun run dev:server  # Backend on :3000
bun run dev:web     # Frontend on :3001
```

## 🔧 **Environment Variables**

### **Required Configuration**

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/gk_nexus"

# Authentication Secrets
BETTER_AUTH_SECRET="your-super-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Super Admin Credentials
SUPER_ADMIN_EMAIL="admin@gk-nexus.com"
SUPER_ADMIN_PASSWORD="SuperSecure123!"
SUPER_ADMIN_NAME="Super Administrator"
```

### **Optional Configuration**

```env
# Email (for invitations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Security
BCRYPT_ROUNDS="12"
JWT_SECRET="your-jwt-secret-key"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
```

## 👥 **Default System Roles**

The system comes with 7 pre-configured roles:

| Role | Level | Description | Key Permissions |
|------|-------|-------------|----------------|
| **Super Admin** | 0 | Full system access | ALL permissions |
| **Admin** | 1 | Administrative access | User management, system settings |
| **Manager** | 2 | Team and client management | Client oversight, reporting |
| **Senior Accountant** | 3 | Advanced tax preparation | Tax approvals, compliance |
| **Accountant** | 4 | Standard tax preparation | Tax calculations, client data |
| **Client Service** | 5 | Client communication | Appointments, basic documents |
| **Read Only** | 6 | View-only access | Limited viewing permissions |

## 🔐 **Permission System**

### **Permission Structure**
Each permission has:
- **Resource**: What it applies to (users, clients, documents, etc.)
- **Action**: What can be done (create, read, update, delete, approve)
- **Scope**: Permission level (global, department, team, personal)

### **Permission Groups**
- **User Management**: User accounts and roles
- **Client Management**: Client relationships and data
- **Document Management**: File creation and sharing
- **Tax Calculations**: Tax prep and calculations
- **Compliance & Reporting**: Regulatory compliance
- **Financial Management**: Billing and payments
- **System Administration**: System configuration

## 🛡️ **Security Features**

### **Session Management**
- Secure session tokens with expiration
- IP address and user agent tracking
- Session invalidation on logout

### **Password Security**
- BCrypt hashing with configurable rounds
- Password change tracking
- Strong password requirements

### **Permission Controls**
- Granular resource-level permissions
- Temporary permission assignments
- Permission approval workflows
- Audit trail for all permission changes

## 👤 **User Management**

### **User Registration Flow**
1. **Admin creates user** with basic info (email, name, initial role)
2. **Email invitation** sent to user (if SMTP configured)
3. **User sets password** on first login
4. **Role assignment** by admin or manager
5. **Account activation** and full access

### **Role Assignment**
```typescript
// Assign role to user
const userRole = await db.insert(userRoles).values({
  id: generateId(),
  userId: userId,
  roleId: roleId,
  assignedBy: adminUserId,
  isActive: true,
  validFrom: new Date(),
  // validUntil: future date for temporary roles
});
```

### **Permission Overrides**
```typescript
// Grant specific permission to user
const userPermission = await db.insert(userPermissions).values({
  id: generateId(),
  userId: userId,
  permissionId: permissionId,
  isGranted: true,
  reason: "Special project access",
  assignedBy: adminUserId,
});
```

## 🔄 **Database Schema**

### **Core Tables**
- `users` - User accounts and basic info
- `roles` - Role definitions and hierarchy
- `permissions` - Permission definitions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission mappings
- `user_permissions` - Individual permission overrides

### **Authentication Tables**
- `session` - Active user sessions
- `account` - External account links
- `verification` - Email verification tokens

## 🎯 **API Integration**

### **Authentication Middleware**
```typescript
// Check if user has permission
import { hasPermission } from '@/lib/rbac';

const canEditClient = await hasPermission(
  userId,
  'clients.update',
  clientId
);
```

### **Role-Based Routes**
```typescript
// Protect routes by role
export const Route = createFileRoute('/admin/users')({
  beforeLoad: async ({ context }) => {
    const hasAccess = await hasPermission(
      context.user.id,
      'users.read'
    );

    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }
  }
});
```

## 🚨 **Security Best Practices**

### **Environment Security**
1. **Never commit** `.env` files to version control
2. **Use strong passwords** for super admin account
3. **Change default credentials** after first setup
4. **Rotate secrets regularly** in production

### **Database Security**
1. **Use SSL connections** in production
2. **Limit database access** to application servers
3. **Regular backups** with encryption
4. **Monitor database access** logs

### **Application Security**
1. **Enable CORS** with specific origins
2. **Use HTTPS** in production
3. **Implement rate limiting**
4. **Log security events**

## 🔍 **Debugging & Troubleshooting**

### **Common Issues**

1. **Database Connection Errors**
   ```bash
   # Check database status
   bun run db:studio

   # Verify connection string
   echo $DATABASE_URL
   ```

2. **Authentication Failures**
   ```bash
   # Check session table
   SELECT * FROM session WHERE user_id = 'user_id';

   # Verify Better-auth configuration
   console.log(process.env.BETTER_AUTH_SECRET);
   ```

3. **Permission Errors**
   ```bash
   # Check user permissions
   SELECT p.name FROM permissions p
   JOIN role_permissions rp ON p.id = rp.permission_id
   JOIN user_roles ur ON rp.role_id = ur.role_id
   WHERE ur.user_id = 'user_id' AND ur.is_active = true;
   ```

### **Useful Commands**

```bash
# Reset super admin password
SUPER_ADMIN_PASSWORD="NewPassword123!" bun run init:system

# View all permissions for a role
bun run db:studio
# Then query: SELECT * FROM role_permissions WHERE role_id = 'role_id';

# Check active sessions
# Query: SELECT * FROM session WHERE expires_at > NOW();
```

## 📚 **Additional Resources**

- [Better-auth Documentation](https://www.better-auth.com/)
- [Drizzle ORM Guide](https://orm.drizzle.team/)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)

## 🆘 **Getting Help**

1. **Check logs** for error messages
2. **Review environment** configuration
3. **Verify database** schema and data
4. **Test permissions** with different user roles
5. **Consult documentation** for specific features

---

**Next Steps**: After setup, proceed to [User Interface Setup](./ui-setup.md) for role-based UI configuration.