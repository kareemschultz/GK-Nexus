-- GK-Nexus Database Schema Validation and Integrity Tests
-- This script validates the database schema integrity, constraints, and relationships
-- Run this after database creation and migrations to ensure everything is properly set up

-- ============================================================================
-- SCHEMA VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate all foreign key constraints
CREATE OR REPLACE FUNCTION validate_foreign_key_constraints()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
DECLARE
    r RECORD;
    constraint_exists BOOLEAN;
BEGIN
    -- Check all foreign key constraints exist and are properly defined
    FOR r IN
        SELECT
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = current_schema()
    LOOP
        -- Check if referenced table and column exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = r.foreign_table_name
            AND column_name = r.foreign_column_name
            AND table_schema = current_schema()
        ) INTO constraint_exists;

        RETURN QUERY SELECT
            'Foreign Key Validation'::TEXT,
            r.table_name,
            r.constraint_name,
            CASE WHEN constraint_exists THEN 'PASS' ELSE 'FAIL' END::TEXT,
            CASE WHEN constraint_exists
                THEN format('FK %s.%s -> %s.%s is valid', r.table_name, r.column_name, r.foreign_table_name, r.foreign_column_name)
                ELSE format('FK %s.%s -> %s.%s is invalid - target does not exist', r.table_name, r.column_name, r.foreign_table_name, r.foreign_column_name)
            END::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate organization isolation integrity
CREATE OR REPLACE FUNCTION validate_organization_isolation()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
DECLARE
    r RECORD;
    has_org_column BOOLEAN;
    has_rls_policy BOOLEAN;
BEGIN
    -- Check that all multi-tenant tables have organization_id and RLS policies
    FOR r IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = current_schema()
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT IN ('users', 'user_sessions', 'user_accounts', 'tax_rates', 'permissions', 'roles')
    LOOP
        -- Check if table has organization_id column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = r.table_name
            AND column_name = 'organization_id'
            AND table_schema = current_schema()
        ) INTO has_org_column;

        -- Check if table has RLS policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = r.table_name
            AND schemaname = current_schema()
        ) INTO has_rls_policy;

        -- Only return results for tables that should have organization isolation
        IF r.table_name NOT LIKE '%_enum%' AND r.table_name != 'schema_version' THEN
            RETURN QUERY SELECT
                'Organization Isolation'::TEXT,
                r.table_name,
                'organization_id + RLS'::TEXT,
                CASE WHEN has_org_column AND has_rls_policy THEN 'PASS'
                     WHEN has_org_column AND NOT has_rls_policy THEN 'WARN'
                     WHEN NOT has_org_column AND has_rls_policy THEN 'FAIL'
                     ELSE 'INFO'
                END::TEXT,
                CASE WHEN has_org_column AND has_rls_policy THEN 'Proper multi-tenant isolation'
                     WHEN has_org_column AND NOT has_rls_policy THEN 'Has org_id but missing RLS policy'
                     WHEN NOT has_org_column AND has_rls_policy THEN 'Has RLS but missing org_id column'
                     ELSE 'No organization isolation (may be intentional)'
                END::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate indexes for performance
CREATE OR REPLACE FUNCTION validate_critical_indexes()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
DECLARE
    r RECORD;
    index_exists BOOLEAN;
BEGIN
    -- Define critical indexes that should exist
    CREATE TEMP TABLE IF NOT EXISTS critical_indexes (
        table_name TEXT,
        column_names TEXT[],
        index_purpose TEXT
    );

    -- Insert critical index requirements
    INSERT INTO critical_indexes VALUES
        ('organizations', ARRAY['owner_id'], 'Organization ownership lookup'),
        ('clients', ARRAY['organization_id'], 'Client organization filtering'),
        ('clients', ARRAY['tin_number'], 'TIN number lookup'),
        ('paye_calculations', ARRAY['organization_id', 'tax_year'], 'PAYE calculations by org and year'),
        ('vat_calculations', ARRAY['organization_id', 'tax_year'], 'VAT calculations by org and year'),
        ('nis_calculations', ARRAY['organization_id', 'contribution_year'], 'NIS calculations by org and year'),
        ('enhanced_audit_logs', ARRAY['organization_id', 'occurred_at'], 'Audit log time-range queries'),
        ('user_roles', ARRAY['user_id', 'is_active'], 'Active user roles lookup'),
        ('organization_users', ARRAY['organization_id', 'user_id'], 'Organization membership lookup');

    -- Check each critical index
    FOR r IN SELECT * FROM critical_indexes LOOP
        -- Check if an index exists on the specified columns
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = r.table_name
            AND schemaname = current_schema()
            AND indexdef LIKE '%' || array_to_string(r.column_names, '%') || '%'
        ) INTO index_exists;

        RETURN QUERY SELECT
            'Critical Index Check'::TEXT,
            r.table_name,
            array_to_string(r.column_names, ', ')::TEXT,
            CASE WHEN index_exists THEN 'PASS' ELSE 'FAIL' END::TEXT,
            CASE WHEN index_exists
                THEN format('Index exists for %s', r.index_purpose)
                ELSE format('Missing critical index for %s', r.index_purpose)
            END::TEXT;
    END LOOP;

    DROP TABLE critical_indexes;
END;
$$ LANGUAGE plpgsql;

-- Function to validate data types and constraints
CREATE OR REPLACE FUNCTION validate_data_constraints()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
DECLARE
    r RECORD;
    constraint_count INTEGER;
BEGIN
    -- Check for NOT NULL constraints on critical columns
    FOR r IN
        SELECT t.table_name, c.column_name, c.is_nullable
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = current_schema()
        AND t.table_type = 'BASE TABLE'
        AND c.column_name IN ('id', 'organization_id', 'created_at')
        AND c.is_nullable = 'YES'
    LOOP
        RETURN QUERY SELECT
            'NOT NULL Constraints'::TEXT,
            r.table_name,
            r.column_name::TEXT,
            'FAIL'::TEXT,
            format('Critical column %s should be NOT NULL', r.column_name)::TEXT;
    END LOOP;

    -- Check for unique constraints on critical columns
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE'
    AND table_schema = current_schema()
    AND (constraint_name LIKE '%email%' OR constraint_name LIKE '%tin_number%' OR constraint_name LIKE '%slug%');

    RETURN QUERY SELECT
        'Unique Constraints'::TEXT,
        'Multiple tables'::TEXT,
        'Email/TIN/Slug uniqueness'::TEXT,
        CASE WHEN constraint_count >= 3 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('Found %s unique constraints for critical business fields', constraint_count)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to validate audit trail setup
CREATE OR REPLACE FUNCTION validate_audit_trail_setup()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
DECLARE
    r RECORD;
    has_created_by BOOLEAN;
    has_updated_by BOOLEAN;
    has_created_at BOOLEAN;
    has_updated_at BOOLEAN;
    audit_score INTEGER;
BEGIN
    -- Check each table for audit trail columns
    FOR r IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = current_schema()
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE '%_enum%'
    LOOP
        -- Check for audit trail columns
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = 'created_by') INTO has_created_by;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = 'updated_by') INTO has_updated_by;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = 'created_at') INTO has_created_at;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = 'updated_at') INTO has_updated_at;

        -- Calculate audit score
        audit_score := (CASE WHEN has_created_by THEN 1 ELSE 0 END +
                       CASE WHEN has_updated_by THEN 1 ELSE 0 END +
                       CASE WHEN has_created_at THEN 1 ELSE 0 END +
                       CASE WHEN has_updated_at THEN 1 ELSE 0 END);

        RETURN QUERY SELECT
            'Audit Trail Setup'::TEXT,
            r.table_name,
            'Audit columns'::TEXT,
            CASE WHEN audit_score = 4 THEN 'PASS'
                 WHEN audit_score >= 2 THEN 'WARN'
                 ELSE 'FAIL'
            END::TEXT,
            format('Audit trail completeness: %s/4 columns present', audit_score)::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate RLS helper functions
CREATE OR REPLACE FUNCTION validate_rls_functions()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
DECLARE
    func_count INTEGER;
BEGIN
    -- Check if RLS helper functions exist
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = current_schema()
    AND p.proname IN ('get_user_organization_ids', 'can_access_organization', 'is_super_admin', 'set_session_context');

    RETURN QUERY SELECT
        'RLS Functions'::TEXT,
        'System functions'::TEXT,
        'RLS helper functions'::TEXT,
        CASE WHEN func_count = 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Found %s/4 required RLS helper functions', func_count)::TEXT;

    -- Check if test function exists
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = current_schema()
    AND p.proname = 'test_rls_policies';

    RETURN QUERY SELECT
        'RLS Testing'::TEXT,
        'System functions'::TEXT,
        'RLS test function'::TEXT,
        CASE WHEN func_count = 1 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN func_count = 1
            THEN 'RLS test function available'
            ELSE 'RLS test function missing - run rls-policies.sql'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPREHENSIVE VALIDATION SUITE
-- ============================================================================

-- Main validation function that runs all tests
CREATE OR REPLACE FUNCTION run_comprehensive_schema_validation()
RETURNS TABLE(test_name TEXT, table_name TEXT, constraint_name TEXT, status TEXT, message TEXT) AS $$
BEGIN
    -- Run all validation tests
    RETURN QUERY SELECT * FROM validate_foreign_key_constraints();
    RETURN QUERY SELECT * FROM validate_organization_isolation();
    RETURN QUERY SELECT * FROM validate_critical_indexes();
    RETURN QUERY SELECT * FROM validate_data_constraints();
    RETURN QUERY SELECT * FROM validate_audit_trail_setup();
    RETURN QUERY SELECT * FROM validate_rls_functions();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 1 SPECIFIC VALIDATION
-- ============================================================================

-- Function to validate Phase 1 requirements specifically
CREATE OR REPLACE FUNCTION validate_phase_1_requirements()
RETURNS TABLE(requirement TEXT, status TEXT, details TEXT) AS $$
DECLARE
    tax_tables_count INTEGER;
    org_setup_complete BOOLEAN;
    rbac_setup_complete BOOLEAN;
    audit_setup_complete BOOLEAN;
BEGIN
    -- Check tax calculation tables
    SELECT COUNT(*) INTO tax_tables_count
    FROM information_schema.tables
    WHERE table_schema = current_schema()
    AND table_name IN ('paye_calculations', 'nis_calculations', 'vat_calculations', 'tax_rates');

    RETURN QUERY SELECT
        'Tax Calculation System'::TEXT,
        CASE WHEN tax_tables_count = 4 THEN 'COMPLETE' ELSE 'INCOMPLETE' END::TEXT,
        format('Tax calculation tables: %s/4 present', tax_tables_count)::TEXT;

    -- Check multi-tenant organization setup
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('organizations', 'organization_users', 'organization_settings')
        AND table_schema = current_schema()
    ) INTO org_setup_complete;

    RETURN QUERY SELECT
        'Multi-tenant Architecture'::TEXT,
        CASE WHEN org_setup_complete THEN 'COMPLETE' ELSE 'INCOMPLETE' END::TEXT,
        CASE WHEN org_setup_complete
            THEN 'Organization tables and multi-tenancy properly configured'
            ELSE 'Missing organization tables or configuration'
        END::TEXT;

    -- Check RBAC system
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('roles', 'permissions', 'user_roles', 'user_permissions', 'role_permissions')
        AND table_schema = current_schema()
    ) INTO rbac_setup_complete;

    RETURN QUERY SELECT
        'RBAC System'::TEXT,
        CASE WHEN rbac_setup_complete THEN 'COMPLETE' ELSE 'INCOMPLETE' END::TEXT,
        CASE WHEN rbac_setup_complete
            THEN 'Role-based access control properly configured'
            ELSE 'Missing RBAC tables or configuration'
        END::TEXT;

    -- Check audit logging
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('enhanced_audit_logs', 'audit_patterns')
        AND table_schema = current_schema()
    ) INTO audit_setup_complete;

    RETURN QUERY SELECT
        'Audit Trail System'::TEXT,
        CASE WHEN audit_setup_complete THEN 'COMPLETE' ELSE 'INCOMPLETE' END::TEXT,
        CASE WHEN audit_setup_complete
            THEN 'Enhanced audit logging properly configured'
            ELSE 'Missing audit tables or configuration'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
To run the comprehensive validation:

1. Run all validations:
   SELECT * FROM run_comprehensive_schema_validation() ORDER BY test_name, status DESC;

2. Check Phase 1 specific requirements:
   SELECT * FROM validate_phase_1_requirements();

3. Run individual test categories:
   SELECT * FROM validate_foreign_key_constraints();
   SELECT * FROM validate_organization_isolation();
   SELECT * FROM validate_critical_indexes();

4. Check for any failures:
   SELECT * FROM run_comprehensive_schema_validation() WHERE status = 'FAIL';

5. Get summary by test type:
   SELECT test_name,
          COUNT(*) as total_tests,
          COUNT(*) FILTER (WHERE status = 'PASS') as passed,
          COUNT(*) FILTER (WHERE status = 'FAIL') as failed,
          COUNT(*) FILTER (WHERE status = 'WARN') as warnings
   FROM run_comprehensive_schema_validation()
   GROUP BY test_name;
*/