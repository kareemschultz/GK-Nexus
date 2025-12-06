/**
 * Comprehensive unit tests for Enterprise RBAC System
 */

import { describe, expect, it } from "vitest";
import {
  canManageRole,
  checkPermission,
  getPermissionGroup,
  getRequiredPermissionForEndpoint,
  getRoleDescription,
  getRoleDisplayName,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isRoleHigherThan,
  PERMISSION_GROUPS,
  type Permission,
  PermissionSchema,
  ROLE_HIERARCHY,
  type Role,
  RoleSchema,
} from "@/lib/rbac";
import { RBAC_TEST_SCENARIOS } from "../../../../packages/api/src/test/test-helpers";

describe("Enterprise RBAC System", () => {
  describe("Schema Validation", () => {
    it("should validate all defined roles", () => {
      const validRoles: Role[] = [
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "STAFF",
        "CLIENT",
        "DEPARTMENT_HEAD",
        "ANALYST",
        "VIEWER",
      ];

      for (const role of validRoles) {
        expect(() => RoleSchema.parse(role)).not.toThrow();
      }
    });

    it("should reject invalid roles", () => {
      const invalidRoles = ["INVALID_ROLE", "super_admin", "", null, undefined];

      for (const role of invalidRoles) {
        expect(() => RoleSchema.parse(role)).toThrow();
      }
    });

    it("should validate all defined permissions", () => {
      const validPermissions: Permission[] = [
        "clients:read",
        "clients:write",
        "users:manage_roles",
        "system:admin",
        "reports:generate",
        "analytics:advanced",
        "workflow:manage",
        "compliance:audit",
      ];

      for (const permission of validPermissions) {
        expect(() => PermissionSchema.parse(permission)).not.toThrow();
      }
    });

    it("should reject invalid permissions", () => {
      const invalidPermissions = [
        "invalid:permission",
        "read:clients",
        "",
        null,
      ];

      for (const permission of invalidPermissions) {
        expect(() => PermissionSchema.parse(permission)).toThrow();
      }
    });
  });

  describe("Permission Checking", () => {
    describe("hasPermission function", () => {
      it("should grant all permissions to SUPER_ADMIN", () => {
        const allPermissions: Permission[] = [
          "clients:read",
          "clients:write",
          "clients:delete",
          "users:manage_roles",
          "system:admin",
          "financials:audit",
          "analytics:advanced",
        ];

        for (const permission of allPermissions) {
          expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
        }
      });

      it("should respect role-based permission restrictions", () => {
        // STAFF should have read/write access but not admin permissions
        expect(hasPermission("STAFF", "clients:read")).toBe(true);
        expect(hasPermission("STAFF", "clients:write")).toBe(true);
        expect(hasPermission("STAFF", "users:manage_roles")).toBe(false);
        expect(hasPermission("STAFF", "system:admin")).toBe(false);

        // CLIENT should have very limited permissions
        expect(hasPermission("CLIENT", "clients:read")).toBe(true);
        expect(hasPermission("CLIENT", "documents:read")).toBe(true);
        expect(hasPermission("CLIENT", "clients:write")).toBe(false);
        expect(hasPermission("CLIENT", "users:read")).toBe(false);
      });

      it("should validate RBAC test scenarios", () => {
        for (const scenario of Object.values(RBAC_TEST_SCENARIOS)) {
          const role = scenario.role as Role;

          // Test permissions that should be granted
          for (const permission of scenario.shouldHaveAccess) {
            expect(hasPermission(role, permission as Permission)).toBe(true);
          }

          // Test permissions that should be denied
          for (const permission of scenario.shouldNotHaveAccess) {
            expect(hasPermission(role, permission as Permission)).toBe(false);
          }
        }
      });
    });

    describe("hasAnyPermission function", () => {
      it("should return true if user has at least one permission", () => {
        const permissions: Permission[] = [
          "system:admin",
          "clients:read",
          "invalid:permission" as Permission,
        ];

        expect(hasAnyPermission("STAFF", permissions)).toBe(true); // Has clients:read
        expect(hasAnyPermission("CLIENT", permissions)).toBe(true); // Has clients:read
        expect(hasAnyPermission("SUPER_ADMIN", permissions)).toBe(true); // Has all valid ones
      });

      it("should return false if user has none of the permissions", () => {
        const permissions: Permission[] = [
          "system:admin",
          "users:manage_roles",
        ];

        expect(hasAnyPermission("CLIENT", permissions)).toBe(false);
        expect(hasAnyPermission("VIEWER", permissions)).toBe(false);
      });

      it("should handle empty permission list", () => {
        expect(hasAnyPermission("SUPER_ADMIN", [])).toBe(false);
      });
    });

    describe("hasAllPermissions function", () => {
      it("should return true if user has all requested permissions", () => {
        const permissions: Permission[] = ["clients:read", "documents:read"];

        expect(hasAllPermissions("SUPER_ADMIN", permissions)).toBe(true);
        expect(hasAllPermissions("STAFF", permissions)).toBe(true);
        expect(hasAllPermissions("CLIENT", permissions)).toBe(true);
      });

      it("should return false if user is missing any permission", () => {
        const permissions: Permission[] = ["clients:read", "system:admin"];

        expect(hasAllPermissions("STAFF", permissions)).toBe(false); // Missing system:admin
        expect(hasAllPermissions("CLIENT", permissions)).toBe(false); // Missing system:admin
      });

      it("should handle empty permission list", () => {
        expect(hasAllPermissions("CLIENT", [])).toBe(true);
      });
    });

    describe("checkPermission function", () => {
      it("should not throw for valid permissions", () => {
        expect(() => checkPermission("ADMIN", "users:read")).not.toThrow();
        expect(() => checkPermission("STAFF", "clients:write")).not.toThrow();
      });

      it("should throw error for invalid permissions", () => {
        expect(() => checkPermission("CLIENT", "system:admin")).toThrow(
          "Access denied"
        );
        expect(() => checkPermission("VIEWER", "users:write")).toThrow(
          "Access denied"
        );
      });

      it("should include required permission in error message", () => {
        try {
          checkPermission("CLIENT", "system:admin");
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect((error as Error).message).toContain("system:admin");
        }
      });
    });
  });

  describe("Role Hierarchy", () => {
    describe("Role levels", () => {
      it("should have correct hierarchy levels", () => {
        expect(ROLE_HIERARCHY.SUPER_ADMIN).toBeGreaterThan(
          ROLE_HIERARCHY.ADMIN
        );
        expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(
          ROLE_HIERARCHY.DEPARTMENT_HEAD
        );
        expect(ROLE_HIERARCHY.DEPARTMENT_HEAD).toBeGreaterThan(
          ROLE_HIERARCHY.MANAGER
        );
        expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.STAFF);
        expect(ROLE_HIERARCHY.STAFF).toBeGreaterThan(ROLE_HIERARCHY.CLIENT);
      });

      it("should place ANALYST appropriately in hierarchy", () => {
        expect(ROLE_HIERARCHY.ANALYST).toBeGreaterThan(ROLE_HIERARCHY.STAFF);
        expect(ROLE_HIERARCHY.ANALYST).toBeLessThan(ROLE_HIERARCHY.MANAGER);
      });

      it("should place VIEWER appropriately in hierarchy", () => {
        expect(ROLE_HIERARCHY.VIEWER).toBeGreaterThan(ROLE_HIERARCHY.CLIENT);
        expect(ROLE_HIERARCHY.VIEWER).toBeLessThan(ROLE_HIERARCHY.STAFF);
      });
    });

    describe("isRoleHigherThan function", () => {
      it("should correctly compare role levels", () => {
        expect(isRoleHigherThan("SUPER_ADMIN", "ADMIN")).toBe(true);
        expect(isRoleHigherThan("ADMIN", "STAFF")).toBe(true);
        expect(isRoleHigherThan("MANAGER", "CLIENT")).toBe(true);
        expect(isRoleHigherThan("CLIENT", "ADMIN")).toBe(false);
        expect(isRoleHigherThan("STAFF", "STAFF")).toBe(false); // Same level
      });
    });

    describe("canManageRole function", () => {
      it("should allow higher roles to manage lower roles", () => {
        expect(canManageRole("SUPER_ADMIN", "ADMIN")).toBe(true);
        expect(canManageRole("ADMIN", "STAFF")).toBe(true);
        expect(canManageRole("MANAGER", "CLIENT")).toBe(true);
        expect(canManageRole("DEPARTMENT_HEAD", "STAFF")).toBe(true);
      });

      it("should prevent lower roles from managing higher roles", () => {
        expect(canManageRole("STAFF", "ADMIN")).toBe(false);
        expect(canManageRole("CLIENT", "MANAGER")).toBe(false);
        expect(canManageRole("VIEWER", "STAFF")).toBe(false);
      });

      it("should prevent same-level role management", () => {
        expect(canManageRole("STAFF", "STAFF")).toBe(false);
        expect(canManageRole("ADMIN", "ADMIN")).toBe(false);
      });
    });
  });

  describe("Permission Grouping", () => {
    describe("PERMISSION_GROUPS structure", () => {
      it("should have all expected permission groups", () => {
        const expectedGroups = [
          "CLIENT_MANAGEMENT",
          "USER_MANAGEMENT",
          "DOCUMENT_MANAGEMENT",
          "FINANCIAL_MANAGEMENT",
          "SYSTEM_ADMINISTRATION",
          "REPORTING_ANALYTICS",
          "WORKFLOW_MANAGEMENT",
          "COMPLIANCE",
        ];

        for (const group of expectedGroups) {
          const groupKey = group as keyof typeof PERMISSION_GROUPS;
          expect(PERMISSION_GROUPS[groupKey]).toBeDefined();
          expect(Array.isArray(PERMISSION_GROUPS[groupKey])).toBe(true);
          expect(PERMISSION_GROUPS[groupKey].length).toBeGreaterThan(0);
        }
      });

      it("should contain valid permissions in each group", () => {
        for (const permissions of Object.values(PERMISSION_GROUPS)) {
          for (const permission of permissions) {
            expect(() => PermissionSchema.parse(permission)).not.toThrow();
          }
        }
      });
    });

    describe("getPermissionGroup function", () => {
      it("should return correct group for permissions", () => {
        expect(getPermissionGroup("clients:read")).toBe("CLIENT_MANAGEMENT");
        expect(getPermissionGroup("users:write")).toBe("USER_MANAGEMENT");
        expect(getPermissionGroup("documents:generate")).toBe(
          "DOCUMENT_MANAGEMENT"
        );
        expect(getPermissionGroup("financials:audit")).toBe(
          "FINANCIAL_MANAGEMENT"
        );
        expect(getPermissionGroup("system:admin")).toBe(
          "SYSTEM_ADMINISTRATION"
        );
        expect(getPermissionGroup("reports:generate")).toBe(
          "REPORTING_ANALYTICS"
        );
        expect(getPermissionGroup("workflow:manage")).toBe(
          "WORKFLOW_MANAGEMENT"
        );
        expect(getPermissionGroup("compliance:write")).toBe("COMPLIANCE");
      });

      it("should return null for unknown permissions", () => {
        expect(getPermissionGroup("unknown:permission" as Permission)).toBe(
          null
        );
      });
    });
  });

  describe("API Endpoint Authorization", () => {
    describe("getRequiredPermissionForEndpoint function", () => {
      it("should return correct permissions for client endpoints", () => {
        expect(getRequiredPermissionForEndpoint("GET", "/api/clients")).toBe(
          "clients:read"
        );
        expect(getRequiredPermissionForEndpoint("POST", "/api/clients")).toBe(
          "clients:write"
        );
        expect(
          getRequiredPermissionForEndpoint("PUT", "/api/clients/123")
        ).toBe("clients:write");
        expect(
          getRequiredPermissionForEndpoint("DELETE", "/api/clients/123")
        ).toBe("clients:delete");
      });

      it("should return correct permissions for user endpoints", () => {
        expect(getRequiredPermissionForEndpoint("GET", "/api/users")).toBe(
          "users:read"
        );
        expect(getRequiredPermissionForEndpoint("POST", "/api/users")).toBe(
          "users:write"
        );
        expect(
          getRequiredPermissionForEndpoint("DELETE", "/api/users/123")
        ).toBe("users:delete");
      });

      it("should return correct permissions for document endpoints", () => {
        expect(getRequiredPermissionForEndpoint("GET", "/api/documents")).toBe(
          "documents:read"
        );
        expect(getRequiredPermissionForEndpoint("POST", "/api/documents")).toBe(
          "documents:write"
        );
        expect(
          getRequiredPermissionForEndpoint("DELETE", "/api/documents/123")
        ).toBe("documents:delete");
      });

      it("should return correct permissions for financial endpoints", () => {
        expect(getRequiredPermissionForEndpoint("GET", "/api/financials")).toBe(
          "financials:read"
        );
        expect(
          getRequiredPermissionForEndpoint("POST", "/api/financials")
        ).toBe("financials:write");
        expect(
          getRequiredPermissionForEndpoint("DELETE", "/api/financials/123")
        ).toBe("financials:delete");
      });

      it("should return correct permissions for system endpoints", () => {
        expect(getRequiredPermissionForEndpoint("GET", "/api/system")).toBe(
          "system:admin"
        );
        expect(getRequiredPermissionForEndpoint("POST", "/api/system")).toBe(
          "system:admin"
        );
      });

      it("should return null for unknown endpoints", () => {
        expect(getRequiredPermissionForEndpoint("GET", "/api/unknown")).toBe(
          null
        );
        expect(getRequiredPermissionForEndpoint("POST", "/unknown/path")).toBe(
          null
        );
      });

      it("should handle case-insensitive HTTP methods", () => {
        expect(getRequiredPermissionForEndpoint("get", "/api/clients")).toBe(
          "clients:read"
        );
        expect(getRequiredPermissionForEndpoint("POST", "/api/clients")).toBe(
          "clients:write"
        );
        expect(
          getRequiredPermissionForEndpoint("delete", "/api/clients/123")
        ).toBe("clients:delete");
      });
    });
  });

  describe("Role Display Utilities", () => {
    describe("getRoleDisplayName function", () => {
      it("should return proper display names for all roles", () => {
        expect(getRoleDisplayName("SUPER_ADMIN")).toBe("Super Administrator");
        expect(getRoleDisplayName("ADMIN")).toBe("Administrator");
        expect(getRoleDisplayName("DEPARTMENT_HEAD")).toBe("Department Head");
        expect(getRoleDisplayName("MANAGER")).toBe("Manager");
        expect(getRoleDisplayName("STAFF")).toBe("Staff Member");
        expect(getRoleDisplayName("ANALYST")).toBe("Business Analyst");
        expect(getRoleDisplayName("VIEWER")).toBe("Viewer");
        expect(getRoleDisplayName("CLIENT")).toBe("Client");
      });
    });

    describe("getRoleDescription function", () => {
      it("should return meaningful descriptions for all roles", () => {
        const descriptions = [
          "SUPER_ADMIN",
          "ADMIN",
          "DEPARTMENT_HEAD",
          "MANAGER",
          "STAFF",
          "ANALYST",
          "VIEWER",
          "CLIENT",
        ].map((role) => getRoleDescription(role as Role));

        for (const description of descriptions) {
          expect(description).toBeTruthy();
          expect(description.length).toBeGreaterThan(10);
          expect(typeof description).toBe("string");
        }
      });

      it("should have distinct descriptions for each role", () => {
        const roles: Role[] = [
          "SUPER_ADMIN",
          "ADMIN",
          "MANAGER",
          "STAFF",
          "CLIENT",
        ];
        const descriptions = roles.map((role) => getRoleDescription(role));
        const uniqueDescriptions = new Set(descriptions);

        expect(uniqueDescriptions.size).toBe(roles.length);
      });
    });
  });

  describe("Permission Coverage", () => {
    it("should ensure SUPER_ADMIN has all defined permissions", () => {
      const allValidPermissions: Permission[] = [
        "clients:read",
        "clients:write",
        "clients:delete",
        "clients:export",
        "clients:manage",
        "users:read",
        "users:write",
        "users:delete",
        "users:manage_roles",
        "users:invite",
        "documents:read",
        "documents:write",
        "documents:delete",
        "documents:generate",
        "documents:download",
        "financials:read",
        "financials:write",
        "financials:delete",
        "financials:audit",
        "system:read",
        "system:admin",
        "system:audit",
        "system:settings",
        "system:monitor",
        "reports:read",
        "reports:generate",
        "reports:export",
        "reports:schedule",
        "analytics:read",
        "analytics:advanced",
        "workflow:read",
        "workflow:write",
        "workflow:manage",
        "compliance:read",
        "compliance:write",
        "compliance:audit",
      ];

      const superAdminPermissions = getRolePermissions("SUPER_ADMIN");

      for (const permission of allValidPermissions) {
        expect(superAdminPermissions).toContain(permission);
      }
    });

    it("should ensure CLIENT has minimal permissions", () => {
      const clientPermissions = getRolePermissions("CLIENT");

      // CLIENT should only have read access to their own data
      expect(clientPermissions).toContain("clients:read");
      expect(clientPermissions).toContain("documents:read");
      expect(clientPermissions).toContain("documents:download");
      expect(clientPermissions).toContain("financials:read");
      expect(clientPermissions).toContain("reports:read");
      expect(clientPermissions).toContain("workflow:read");

      // CLIENT should not have write or admin permissions
      expect(clientPermissions).not.toContain("clients:write");
      expect(clientPermissions).not.toContain("users:read");
      expect(clientPermissions).not.toContain("system:admin");
    });

    it("should ensure progressive permission expansion by role level", () => {
      const viewerPermissions = getRolePermissions("VIEWER");
      const staffPermissions = getRolePermissions("STAFF");
      const managerPermissions = getRolePermissions("MANAGER");
      const adminPermissions = getRolePermissions("ADMIN");

      // Staff should have all viewer permissions plus more
      for (const permission of viewerPermissions) {
        expect(staffPermissions).toContain(permission);
      }

      // Manager should have all staff permissions plus more
      for (const permission of staffPermissions) {
        expect(managerPermissions).toContain(permission);
      }

      // Admin should have all manager permissions plus more
      for (const permission of managerPermissions) {
        expect(adminPermissions).toContain(permission);
      }
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle undefined/null inputs gracefully", () => {
      // These should not crash, but return false or throw appropriate errors
      expect(() => hasPermission(null as any, "clients:read")).toThrow();
      expect(() => hasPermission("STAFF", null as any)).toThrow();
    });

    it("should validate permission consistency across roles", () => {
      // Ensure no role has conflicting permissions (e.g., delete without write)
      const roles: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"];

      for (const role of roles) {
        const permissions = getRolePermissions(role);

        // If role has delete permission, it should also have write permission
        if (permissions.includes("clients:delete")) {
          expect(permissions).toContain("clients:write");
        }

        if (permissions.includes("documents:delete")) {
          expect(permissions).toContain("documents:write");
        }
      }
    });
  });
});
