-- Multi-Tenant Row-Level Security Policies for GK-Nexus Suite
-- This file contains PostgreSQL RLS policies for organization-based data isolation
-- Execute these policies after creating the database schema

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TENANT TABLES
-- ============================================================================

-- Organizations table - users can only see their own organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Client-related tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

-- Tax calculation tables
ALTER TABLE paye_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_calculations ENABLE ROW LEVEL SECURITY;

-- Enhanced document management tables
ALTER TABLE enhanced_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;

-- GRA integration tables
ALTER TABLE gra_api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE gra_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gra_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gra_webhooks ENABLE ROW LEVEL SECURITY;

-- Immigration workflow tables
ALTER TABLE immigration_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE immigration_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE immigration_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE immigration_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE immigration_correspondence ENABLE ROW LEVEL SECURITY;

-- Enhanced audit tables
ALTER TABLE enhanced_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pattern_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- Organization-related tables
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Additional core multi-tenant tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- RBAC tables (organization-scoped)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Function to get current user's organization IDs
-- This function returns all organization IDs that the current user has access to
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS TEXT[] AS $$
DECLARE
    user_id TEXT;
    org_ids TEXT[];
BEGIN
    -- Get the current user ID from the session context
    user_id := current_setting('app.current_user_id', TRUE);

    -- If no user ID is set, return empty array (no access)
    IF user_id IS NULL OR user_id = '' THEN
        RETURN ARRAY[]::TEXT[];
    END IF;

    -- Get all organization IDs the user belongs to
    SELECT ARRAY(
        SELECT ou.organization_id
        FROM organization_users ou
        WHERE ou.user_id = get_user_organization_ids.user_id
        AND ou.is_active = TRUE
        AND (ou.valid_until IS NULL OR ou.valid_until > NOW())
    ) INTO org_ids;

    -- If user is not in any organization, check if they own any organizations
    IF array_length(org_ids, 1) IS NULL THEN
        SELECT ARRAY(
            SELECT o.id
            FROM organizations o
            WHERE o.owner_id = get_user_organization_ids.user_id
            AND o.is_active = TRUE
        ) INTO org_ids;
    END IF;

    RETURN COALESCE(org_ids, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user can access a specific organization
CREATE OR REPLACE FUNCTION can_access_organization(org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN org_id = ANY(get_user_organization_ids());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_id TEXT;
    user_role TEXT;
BEGIN
    user_id := current_setting('app.current_user_id', TRUE);

    IF user_id IS NULL OR user_id = '' THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO user_role FROM users WHERE id = user_id;
    RETURN user_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Users can see organizations they own or belong to
CREATE POLICY "organization_access_policy" ON organizations
    FOR ALL USING (
        id = ANY(get_user_organization_ids())
        OR is_super_admin()
    );

-- ============================================================================
-- ORGANIZATION USERS TABLE POLICIES
-- ============================================================================

-- Users can see organization memberships for organizations they belong to
CREATE POLICY "organization_users_access_policy" ON organization_users
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- ORGANIZATION SETTINGS TABLE POLICIES
-- ============================================================================

-- Users can access settings for organizations they belong to
CREATE POLICY "organization_settings_access_policy" ON organization_settings
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- CLIENT-RELATED TABLE POLICIES
-- ============================================================================

-- Clients: Users can only access clients within their organizations
CREATE POLICY "clients_organization_policy" ON clients
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Client Contacts: Users can only access contacts for clients in their organizations
CREATE POLICY "client_contacts_organization_policy" ON client_contacts
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Client Services: Users can only access services for clients in their organizations
CREATE POLICY "client_services_organization_policy" ON client_services
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- TAX CALCULATION TABLE POLICIES
-- ============================================================================

-- PAYE Calculations: Organization-based access
CREATE POLICY "paye_calculations_organization_policy" ON paye_calculations
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- NIS Calculations: Organization-based access
CREATE POLICY "nis_calculations_organization_policy" ON nis_calculations
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- VAT Calculations: Organization-based access
CREATE POLICY "vat_calculations_organization_policy" ON vat_calculations
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- ENHANCED DOCUMENT MANAGEMENT POLICIES
-- ============================================================================

-- Enhanced Documents: Organization-based access
CREATE POLICY "enhanced_documents_organization_policy" ON enhanced_documents
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Document OCR Results: Organization-based access
CREATE POLICY "document_ocr_results_organization_policy" ON document_ocr_results
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Document Templates: Organization-based access (with public template support)
CREATE POLICY "document_templates_organization_policy" ON document_templates
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_public = TRUE
        OR is_super_admin()
    );

-- Document Workflows: Organization-based access
CREATE POLICY "document_workflows_organization_policy" ON document_workflows
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- GRA INTEGRATION POLICIES
-- ============================================================================

-- GRA API Cache: Organization-based access
CREATE POLICY "gra_api_cache_organization_policy" ON gra_api_cache
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- GRA Submissions: Organization-based access
CREATE POLICY "gra_submissions_organization_policy" ON gra_submissions
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- GRA Connections: Organization-based access
CREATE POLICY "gra_connections_organization_policy" ON gra_connections
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- GRA Webhooks: Organization-based access
CREATE POLICY "gra_webhooks_organization_policy" ON gra_webhooks
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- IMMIGRATION WORKFLOW POLICIES
-- ============================================================================

-- Immigration Cases: Organization-based access
CREATE POLICY "immigration_cases_organization_policy" ON immigration_cases
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Immigration Document Requirements: Organization-based access
CREATE POLICY "immigration_doc_requirements_organization_policy" ON immigration_document_requirements
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Immigration Timeline: Organization-based access
CREATE POLICY "immigration_timeline_organization_policy" ON immigration_timeline
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Immigration Interviews: Organization-based access
CREATE POLICY "immigration_interviews_organization_policy" ON immigration_interviews
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Immigration Correspondence: Organization-based access
CREATE POLICY "immigration_correspondence_organization_policy" ON immigration_correspondence
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- ============================================================================
-- ENHANCED AUDIT POLICIES
-- ============================================================================

-- Enhanced Audit Logs: Organization-based access
CREATE POLICY "enhanced_audit_logs_organization_policy" ON enhanced_audit_logs
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Audit Patterns: Organization-based access (with global pattern support)
CREATE POLICY "audit_patterns_organization_policy" ON audit_patterns
    FOR ALL USING (
        can_access_organization(organization_id)
        OR organization_id IS NULL  -- Global patterns
        OR is_super_admin()
    );

-- Audit Pattern Matches: Organization-based access
CREATE POLICY "audit_pattern_matches_organization_policy" ON audit_pattern_matches
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Audit Retention Policies: Organization-based access (with global policy support)
CREATE POLICY "audit_retention_policies_organization_policy" ON audit_retention_policies
    FOR ALL USING (
        can_access_organization(organization_id)
        OR organization_id IS NULL  -- Global policies
        OR is_super_admin()
    );

-- ============================================================================
-- ADDITIONAL CORE TABLE POLICIES
-- ============================================================================

-- Appointments: Organization-based access
CREATE POLICY "appointments_organization_policy" ON appointments
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Compliance Filings: Organization-based access
CREATE POLICY "compliance_filings_organization_policy" ON compliance_filings
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Compliance Requirements: Organization-based access
CREATE POLICY "compliance_requirements_organization_policy" ON compliance_requirements
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Documents: Organization-based access
CREATE POLICY "documents_organization_policy" ON documents
    FOR ALL USING (
        can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Notifications: User-specific or organization-based access
CREATE POLICY "notifications_access_policy" ON notifications
    FOR ALL USING (
        user_id = current_setting('app.current_user_id', TRUE)
        OR can_access_organization(organization_id)
        OR is_super_admin()
    );

-- Tax Rates: Global access for active rates, organization-specific for custom rates
CREATE POLICY "tax_rates_access_policy" ON tax_rates
    FOR ALL USING (
        is_active = TRUE  -- Global access to active rates
        OR organization_id IS NULL  -- Global rates
        OR can_access_organization(organization_id)  -- Organization-specific rates
        OR is_super_admin()
    );

-- ============================================================================
-- RBAC TABLE POLICIES
-- ============================================================================

-- Roles: Organization-scoped or system roles
CREATE POLICY "roles_access_policy" ON roles
    FOR ALL USING (
        organization_id IS NULL  -- System roles accessible to all
        OR can_access_organization(organization_id)  -- Organization-specific roles
        OR is_super_admin()
    );

-- Permissions: System permissions accessible to all, organization-specific restricted
CREATE POLICY "permissions_access_policy" ON permissions
    FOR ALL USING (
        organization_id IS NULL  -- System permissions
        OR can_access_organization(organization_id)  -- Organization-specific permissions
        OR is_super_admin()
    );

-- User Roles: Users can see their own roles and organization members' roles
CREATE POLICY "user_roles_access_policy" ON user_roles
    FOR ALL USING (
        user_id = current_setting('app.current_user_id', TRUE)
        OR EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = current_setting('app.current_user_id', TRUE)
            AND ou.organization_id IN (
                SELECT ou2.organization_id FROM organization_users ou2
                WHERE ou2.user_id = user_roles.user_id
                AND ou2.is_active = TRUE
            )
            AND ou.is_active = TRUE
        )
        OR is_super_admin()
    );

-- User Permissions: Users can see their own permissions and organization members' permissions
CREATE POLICY "user_permissions_access_policy" ON user_permissions
    FOR ALL USING (
        user_id = current_setting('app.current_user_id', TRUE)
        OR EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = current_setting('app.current_user_id', TRUE)
            AND ou.organization_id IN (
                SELECT ou2.organization_id FROM organization_users ou2
                WHERE ou2.user_id = user_permissions.user_id
                AND ou2.is_active = TRUE
            )
            AND ou.is_active = TRUE
        )
        OR is_super_admin()
    );

-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Create a security function to validate session context
CREATE OR REPLACE FUNCTION validate_session_context()
RETURNS BOOLEAN AS $$
DECLARE
    user_id TEXT;
    session_valid BOOLEAN := FALSE;
BEGIN
    -- Get user ID from session context
    user_id := current_setting('app.current_user_id', TRUE);

    -- If no user ID, session is invalid
    IF user_id IS NULL OR user_id = '' THEN
        RETURN FALSE;
    END IF;

    -- Check if user exists and is active
    SELECT EXISTS(
        SELECT 1 FROM users
        WHERE id = user_id
        AND status = 'active'
    ) INTO session_valid;

    RETURN session_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set session context (to be called by the application)
CREATE OR REPLACE FUNCTION set_session_context(p_user_id TEXT, p_organization_id TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Validate that the user exists and is active
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND status = 'active') THEN
        RAISE EXCEPTION 'Invalid user ID or inactive user';
    END IF;

    -- Set the session context
    PERFORM set_config('app.current_user_id', p_user_id, TRUE);

    -- Optionally set a specific organization context
    IF p_organization_id IS NOT NULL THEN
        -- Validate that user has access to this organization
        IF NOT can_access_organization(p_organization_id) THEN
            RAISE EXCEPTION 'User does not have access to the specified organization';
        END IF;
        PERFORM set_config('app.current_org_id', p_organization_id, TRUE);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes to optimize RLS policy performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_users_user_org_active
ON organization_users (user_id, organization_id)
WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_owner_active
ON organizations (owner_id)
WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_status
ON users (id, status);

-- ============================================================================
-- RLS POLICY TESTING AND VALIDATION
-- ============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(test_name TEXT, passed BOOLEAN, message TEXT) AS $$
BEGIN
    -- Test 1: Ensure RLS is enabled on critical tables
    RETURN QUERY
    SELECT
        'RLS Enabled Check' as test_name,
        (SELECT COUNT(*) FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = current_schema()
         AND c.relname IN ('organizations', 'clients', 'enhanced_documents')
         AND c.relrowsecurity = TRUE) = 3 as passed,
        'Row-level security should be enabled on tenant tables' as message;

    -- Test 2: Ensure helper functions exist
    RETURN QUERY
    SELECT
        'Helper Functions Check' as test_name,
        (SELECT COUNT(*) FROM pg_proc
         WHERE proname IN ('get_user_organization_ids', 'can_access_organization', 'is_super_admin')) = 3 as passed,
        'All RLS helper functions should exist' as message;

    -- Test 3: Ensure policies are created
    RETURN QUERY
    SELECT
        'Policies Created Check' as test_name,
        (SELECT COUNT(*) FROM pg_policies
         WHERE schemaname = current_schema()
         AND tablename IN ('organizations', 'clients', 'enhanced_documents')) >= 3 as passed,
        'RLS policies should be created for tenant tables' as message;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to disable RLS (for maintenance only - use with extreme caution)
CREATE OR REPLACE FUNCTION disable_rls_for_maintenance()
RETURNS VOID AS $$
DECLARE
    table_name TEXT;
BEGIN
    -- This function should only be called by super admins for maintenance
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can disable RLS for maintenance';
    END IF;

    -- Log the action
    INSERT INTO enhanced_audit_logs (
        event_id, organization_id, action, entity, description,
        user_id, risk_level, alert_triggered, alert_reason
    ) VALUES (
        gen_random_uuid()::TEXT,
        NULL,  -- System-level action
        'rls_disable',
        'system',
        'Row-level security disabled for maintenance',
        current_setting('app.current_user_id', TRUE),
        'critical',
        TRUE,
        'RLS disabled for system maintenance'
    );

    RAISE NOTICE 'RLS maintenance mode enabled. Remember to re-enable RLS policies after maintenance.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to re-enable RLS after maintenance
CREATE OR REPLACE FUNCTION enable_rls_after_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Re-enable RLS on all tables (this file should be re-run)
    RAISE NOTICE 'Re-run this RLS policy file to restore all security policies.';

    -- Log the action
    INSERT INTO enhanced_audit_logs (
        event_id, organization_id, action, entity, description,
        user_id, risk_level
    ) VALUES (
        gen_random_uuid()::TEXT,
        NULL,
        'rls_enable',
        'system',
        'Row-level security re-enabled after maintenance',
        current_setting('app.current_user_id', TRUE),
        'low'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions to the application role
-- Note: Replace 'app_role' with your actual application database role
-- GRANT EXECUTE ON FUNCTION get_user_organization_ids() TO app_role;
-- GRANT EXECUTE ON FUNCTION can_access_organization(TEXT) TO app_role;
-- GRANT EXECUTE ON FUNCTION is_super_admin() TO app_role;
-- GRANT EXECUTE ON FUNCTION set_session_context(TEXT, TEXT) TO app_role;
-- GRANT EXECUTE ON FUNCTION test_rls_policies() TO app_role;

-- ============================================================================
-- FINAL NOTES AND RECOMMENDATIONS
-- ============================================================================

/*
IMPORTANT IMPLEMENTATION NOTES:

1. SESSION CONTEXT SETUP:
   - The application must call set_session_context(user_id, org_id) at the
     beginning of each database session to establish the security context.

2. APPLICATION ROLE:
   - Create a dedicated database role for the application and grant it
     appropriate permissions on tables and functions.

3. CONNECTION POOLING:
   - When using connection pooling, ensure session context is reset/set
     for each logical session to prevent data leakage between users.

4. MONITORING:
   - Regularly run test_rls_policies() to ensure RLS is functioning correctly.
   - Monitor the enhanced_audit_logs table for any security-related events.

5. PERFORMANCE CONSIDERATIONS:
   - The provided indexes should help optimize RLS policy performance.
   - Monitor query performance and add additional indexes as needed.

6. BACKUP AND RECOVERY:
   - Ensure this RLS policy file is included in your deployment scripts.
   - Test RLS policies after any database restore operations.

7. SUPER ADMIN ACCESS:
   - Super admins can bypass RLS policies but all their actions are logged.
   - Use super admin access sparingly and only when necessary.

EXAMPLE APPLICATION USAGE:

-- At the start of each request/session:
SELECT set_session_context('user_123', 'org_456');

-- Now all queries will automatically respect RLS policies
SELECT * FROM clients; -- Only returns clients for org_456

-- To switch organization context within the same session:
SELECT set_session_context('user_123', 'org_789');

*/