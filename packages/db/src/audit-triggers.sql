-- GK-Nexus Comprehensive Audit Trail Integration
-- This script creates triggers to automatically log changes to critical tables
-- Ensures complete audit trail for compliance and security monitoring

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================

-- Generic audit trigger function that logs all changes to enhanced_audit_logs
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_action TEXT;
    audit_entity TEXT;
    entity_id TEXT;
    entity_name TEXT;
    old_values JSONB;
    new_values JSONB;
    changed_fields TEXT[];
    current_user_id TEXT;
    current_org_id TEXT;
    description_text TEXT;
    risk_assessment TEXT := 'low';
    business_process_name TEXT;
BEGIN
    -- Get current user and organization context
    current_user_id := current_setting('app.current_user_id', TRUE);
    current_org_id := current_setting('app.current_org_id', TRUE);

    -- Determine audit action
    IF TG_OP = 'DELETE' THEN
        audit_action := 'delete';
        entity_id := OLD.id;
        old_values := to_jsonb(OLD);
        new_values := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        audit_action := 'create';
        entity_id := NEW.id;
        old_values := NULL;
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        audit_action := 'update';
        entity_id := NEW.id;
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);

        -- Identify changed fields
        SELECT ARRAY(
            SELECT key FROM jsonb_each(old_values) old_kv
            WHERE NOT EXISTS (
                SELECT 1 FROM jsonb_each(new_values) new_kv
                WHERE new_kv.key = old_kv.key AND new_kv.value = old_kv.value
            )
        ) INTO changed_fields;
    END IF;

    -- Determine entity type from table name
    audit_entity := TG_TABLE_NAME;

    -- Determine entity name for better readability
    CASE TG_TABLE_NAME
        WHEN 'organizations' THEN
            entity_name := COALESCE(NEW.display_name, NEW.name, OLD.display_name, OLD.name);
        WHEN 'clients' THEN
            entity_name := COALESCE(NEW.name, NEW.business_name, OLD.name, OLD.business_name);
        WHEN 'users' THEN
            entity_name := COALESCE(NEW.name, NEW.email, OLD.name, OLD.email);
        WHEN 'paye_calculations', 'nis_calculations', 'vat_calculations' THEN
            entity_name := format('%s_%s', TG_TABLE_NAME, COALESCE(NEW.tax_year::TEXT, NEW.contribution_year::TEXT, OLD.tax_year::TEXT, OLD.contribution_year::TEXT));
        WHEN 'documents' THEN
            entity_name := COALESCE(NEW.title, NEW.file_name, OLD.title, OLD.file_name);
        ELSE
            entity_name := entity_id;
    END CASE;

    -- Determine business process context
    CASE TG_TABLE_NAME
        WHEN 'paye_calculations', 'nis_calculations', 'vat_calculations' THEN
            business_process_name := 'tax_processing';
        WHEN 'clients' THEN
            business_process_name := 'client_management';
        WHEN 'users', 'user_roles', 'user_permissions' THEN
            business_process_name := 'user_management';
        WHEN 'organizations' THEN
            business_process_name := 'organization_management';
        WHEN 'documents' THEN
            business_process_name := 'document_management';
        WHEN 'appointments' THEN
            business_process_name := 'appointment_management';
        ELSE
            business_process_name := 'general';
    END CASE;

    -- Assess risk level based on action and entity
    IF audit_action = 'delete' THEN
        risk_assessment := 'high';
    ELSIF TG_TABLE_NAME IN ('users', 'user_roles', 'user_permissions', 'organizations') THEN
        risk_assessment := 'medium';
    ELSIF TG_TABLE_NAME LIKE '%_calculations' AND audit_action IN ('update', 'delete') THEN
        risk_assessment := 'medium';
    ELSIF array_length(changed_fields, 1) > 5 THEN
        risk_assessment := 'medium';
    END IF;

    -- Create description
    IF TG_OP = 'DELETE' THEN
        description_text := format('%s deleted from %s', entity_name, TG_TABLE_NAME);
    ELSIF TG_OP = 'INSERT' THEN
        description_text := format('%s created in %s', entity_name, TG_TABLE_NAME);
    ELSIF TG_OP = 'UPDATE' THEN
        description_text := format('%s updated in %s. Changed fields: %s',
            entity_name, TG_TABLE_NAME, array_to_string(changed_fields, ', '));
    END IF;

    -- Get organization ID from the record if not set in context
    IF current_org_id IS NULL OR current_org_id = '' THEN
        -- Try to get organization_id from the record
        IF TG_OP = 'DELETE' THEN
            current_org_id := (old_values->>'organization_id');
        ELSE
            current_org_id := (new_values->>'organization_id');
        END IF;
    END IF;

    -- Insert audit log entry
    INSERT INTO enhanced_audit_logs (
        id,
        organization_id,
        event_id,
        action,
        entity,
        entity_id,
        entity_name,
        description,
        summary,
        user_id,
        client_id,
        old_values,
        new_values,
        changed_fields,
        business_process,
        risk_level,
        success,
        requires_review,
        alert_triggered,
        occurred_at,
        created_at
    ) VALUES (
        gen_random_uuid()::TEXT,
        current_org_id,
        gen_random_uuid()::TEXT,
        audit_action::enhanced_audit_action,
        audit_entity::enhanced_audit_entity,
        entity_id,
        entity_name,
        description_text,
        left(description_text, 100),
        current_user_id,
        CASE WHEN TG_TABLE_NAME = 'clients' THEN entity_id
             ELSE COALESCE(new_values->>'client_id', old_values->>'client_id')
        END,
        old_values,
        new_values,
        changed_fields,
        business_process_name,
        risk_assessment::audit_risk_level,
        TRUE,
        CASE WHEN risk_assessment IN ('high', 'critical') THEN TRUE ELSE FALSE END,
        CASE WHEN risk_assessment = 'critical' THEN TRUE ELSE FALSE END,
        NOW(),
        NOW()
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE AUDIT TRIGGERS FOR CRITICAL TABLES
-- ============================================================================

-- Organizations audit trigger
CREATE TRIGGER organizations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Users audit trigger
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Clients audit trigger
CREATE TRIGGER clients_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Tax calculations audit triggers
CREATE TRIGGER paye_calculations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON paye_calculations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER nis_calculations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON nis_calculations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER vat_calculations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON vat_calculations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- RBAC audit triggers
CREATE TRIGGER roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER user_roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER user_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Organization users audit trigger
CREATE TRIGGER organization_users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON organization_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Documents audit trigger
CREATE TRIGGER documents_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Enhanced documents audit trigger
CREATE TRIGGER enhanced_documents_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON enhanced_documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Appointments audit trigger
CREATE TRIGGER appointments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Compliance filings audit trigger
CREATE TRIGGER compliance_filings_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON compliance_filings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- GRA submissions audit trigger
CREATE TRIGGER gra_submissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gra_submissions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Immigration cases audit trigger
CREATE TRIGGER immigration_cases_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON immigration_cases
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- SENSITIVE OPERATION TRIGGERS
-- ============================================================================

-- Special trigger for sensitive permission changes
CREATE OR REPLACE FUNCTION sensitive_permission_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id TEXT;
    permission_name TEXT;
    role_name TEXT;
    is_sensitive_permission BOOLEAN;
BEGIN
    current_user_id := current_setting('app.current_user_id', TRUE);

    -- Check if this involves a sensitive permission
    IF TG_TABLE_NAME = 'user_permissions' THEN
        SELECT p.name, p.is_sensitive INTO permission_name, is_sensitive_permission
        FROM permissions p
        WHERE p.id = COALESCE(NEW.permission_id, OLD.permission_id);
    ELSIF TG_TABLE_NAME = 'role_permissions' THEN
        SELECT p.name, p.is_sensitive INTO permission_name, is_sensitive_permission
        FROM permissions p
        WHERE p.id = COALESCE(NEW.permission_id, OLD.permission_id);
    ELSIF TG_TABLE_NAME = 'user_roles' THEN
        SELECT r.name INTO role_name
        FROM roles r
        WHERE r.id = COALESCE(NEW.role_id, OLD.role_id);

        -- Check if role has sensitive permissions
        SELECT EXISTS(
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = COALESCE(NEW.role_id, OLD.role_id)
            AND p.is_sensitive = TRUE
        ) INTO is_sensitive_permission;
    END IF;

    -- If this is a sensitive permission change, create high-risk audit entry
    IF is_sensitive_permission OR role_name LIKE '%admin%' THEN
        INSERT INTO enhanced_audit_logs (
            id,
            organization_id,
            event_id,
            action,
            entity,
            entity_id,
            entity_name,
            description,
            summary,
            user_id,
            business_process,
            risk_level,
            sensitive_data_accessed,
            requires_review,
            alert_triggered,
            alert_reason,
            occurred_at,
            created_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            current_setting('app.current_org_id', TRUE),
            gen_random_uuid()::TEXT,
            CASE WHEN TG_OP = 'DELETE' THEN 'permission_revoke'::enhanced_audit_action
                 ELSE 'permission_grant'::enhanced_audit_action END,
            'permission'::enhanced_audit_entity,
            COALESCE(NEW.id, OLD.id),
            COALESCE(permission_name, role_name, 'sensitive_permission'),
            format('Sensitive permission change: %s %s %s',
                TG_OP, TG_TABLE_NAME, COALESCE(permission_name, role_name)),
            'Sensitive permission modification detected',
            current_user_id,
            'security_management',
            'critical'::audit_risk_level,
            TRUE,
            TRUE,
            TRUE,
            'Sensitive permission or role modification',
            NOW(),
            NOW()
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply sensitive permission triggers
CREATE TRIGGER user_permissions_sensitive_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION sensitive_permission_trigger();

CREATE TRIGGER role_permissions_sensitive_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION sensitive_permission_trigger();

CREATE TRIGGER user_roles_sensitive_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION sensitive_permission_trigger();

-- ============================================================================
-- LOGIN ATTEMPT TRACKING
-- ============================================================================

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_authentication_event(
    p_user_id TEXT,
    p_action TEXT, -- 'login', 'logout', 'failed_login'
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_failure_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    org_id TEXT;
BEGIN
    -- Get user's primary organization
    SELECT organization_id INTO org_id
    FROM organization_users
    WHERE user_id = p_user_id
    AND is_active = TRUE
    ORDER BY created_at
    LIMIT 1;

    -- Log authentication event
    INSERT INTO enhanced_audit_logs (
        id,
        organization_id,
        event_id,
        action,
        entity,
        entity_id,
        entity_name,
        description,
        summary,
        user_id,
        ip_address,
        user_agent,
        business_process,
        risk_level,
        success,
        requires_review,
        alert_triggered,
        alert_reason,
        occurred_at,
        created_at
    ) VALUES (
        gen_random_uuid()::TEXT,
        org_id,
        gen_random_uuid()::TEXT,
        p_action::enhanced_audit_action,
        'session'::enhanced_audit_entity,
        gen_random_uuid()::TEXT,
        p_user_id,
        CASE WHEN p_success THEN
            format('User %s: %s successful from %s', p_user_id, p_action, COALESCE(p_ip_address, 'unknown'))
        ELSE
            format('User %s: %s failed from %s. Reason: %s', p_user_id, p_action, COALESCE(p_ip_address, 'unknown'), COALESCE(p_failure_reason, 'unknown'))
        END,
        CASE WHEN p_success THEN 'Authentication successful' ELSE 'Authentication failed' END,
        p_user_id,
        p_ip_address,
        p_user_agent,
        'authentication',
        CASE WHEN NOT p_success THEN 'medium'::audit_risk_level ELSE 'low'::audit_risk_level END,
        p_success,
        CASE WHEN NOT p_success THEN TRUE ELSE FALSE END,
        CASE WHEN NOT p_success THEN TRUE ELSE FALSE END,
        CASE WHEN NOT p_success THEN format('Failed authentication: %s', COALESCE(p_failure_reason, 'unknown')) ELSE NULL END,
        NOW(),
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT TRIGGER MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to disable audit triggers (for data migrations)
CREATE OR REPLACE FUNCTION disable_audit_triggers()
RETURNS VOID AS $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Only super admins can disable audit triggers
    IF NOT EXISTS(
        SELECT 1 FROM users
        WHERE id = current_setting('app.current_user_id', TRUE)
        AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Only super administrators can disable audit triggers';
    END IF;

    -- Disable all audit triggers
    FOR trigger_record IN
        SELECT schemaname, tablename, triggername
        FROM pg_triggers
        WHERE schemaname = current_schema()
        AND triggername LIKE '%audit_trigger%'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE TRIGGER %I',
            trigger_record.schemaname, trigger_record.tablename, trigger_record.triggername);
    END LOOP;

    -- Log the action
    PERFORM log_authentication_event(
        current_setting('app.current_user_id', TRUE),
        'system_maintenance',
        NULL,
        NULL,
        TRUE,
        'Audit triggers disabled for maintenance'
    );

    RAISE NOTICE 'Audit triggers have been disabled. Remember to re-enable them after maintenance.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable audit triggers
CREATE OR REPLACE FUNCTION enable_audit_triggers()
RETURNS VOID AS $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Enable all audit triggers
    FOR trigger_record IN
        SELECT schemaname, tablename, triggername
        FROM pg_triggers
        WHERE schemaname = current_schema()
        AND triggername LIKE '%audit_trigger%'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE TRIGGER %I',
            trigger_record.schemaname, trigger_record.tablename, trigger_record.triggername);
    END LOOP;

    -- Log the action
    PERFORM log_authentication_event(
        current_setting('app.current_user_id', TRUE),
        'system_maintenance',
        NULL,
        NULL,
        TRUE,
        'Audit triggers re-enabled after maintenance'
    );

    RAISE NOTICE 'Audit triggers have been re-enabled.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check audit trigger status
CREATE OR REPLACE FUNCTION check_audit_trigger_status()
RETURNS TABLE(table_name TEXT, trigger_name TEXT, status TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tgrelid::regclass::TEXT as table_name,
        t.tgname as trigger_name,
        CASE WHEN t.tgenabled = 'O' THEN 'ENABLED'
             WHEN t.tgenabled = 'D' THEN 'DISABLED'
             ELSE 'UNKNOWN'
        END as status
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = current_schema()
    AND t.tgname LIKE '%audit_trigger%'
    ORDER BY table_name, trigger_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
AUDIT TRIGGER USAGE:

1. Check if all audit triggers are properly installed:
   SELECT * FROM check_audit_trigger_status();

2. Test audit logging by performing operations:
   INSERT INTO test_table (name) VALUES ('test');
   UPDATE test_table SET name = 'updated' WHERE name = 'test';
   DELETE FROM test_table WHERE name = 'updated';

3. View audit logs:
   SELECT * FROM enhanced_audit_logs
   WHERE occurred_at >= NOW() - INTERVAL '1 hour'
   ORDER BY occurred_at DESC;

4. Log authentication events from application:
   SELECT log_authentication_event('user_123', 'login', '192.168.1.1', 'Mozilla/5.0...');

5. For maintenance (super admin only):
   SELECT disable_audit_triggers(); -- Before maintenance
   -- Perform maintenance operations
   SELECT enable_audit_triggers();  -- After maintenance

6. Monitor sensitive permission changes:
   SELECT * FROM enhanced_audit_logs
   WHERE risk_level IN ('high', 'critical')
   AND entity = 'permission'
   ORDER BY occurred_at DESC;

IMPORTANT NOTES:
- Audit triggers automatically capture all DML operations
- Sensitive permission changes are flagged for review
- Authentication events must be logged manually from the application
- Super admin privileges required for trigger management
- All changes are captured in enhanced_audit_logs table
*/