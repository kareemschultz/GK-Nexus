CREATE TYPE "public"."report_category" AS ENUM('financial', 'compliance', 'operational', 'client_management', 'business_intelligence', 'regulatory', 'audit', 'performance');--> statement-breakpoint
CREATE TYPE "public"."report_frequency" AS ENUM('on_demand', 'daily', 'weekly', 'monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'generating', 'completed', 'failed', 'cancelled', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('financial_summary', 'tax_compliance', 'client_activity', 'revenue_analysis', 'expense_tracking', 'profit_loss', 'cash_flow', 'balance_sheet', 'tax_liability', 'client_profitability', 'service_performance', 'compliance_status', 'audit_trail', 'custom_analytics');--> statement-breakpoint
CREATE TYPE "public"."visualization_type" AS ENUM('table', 'chart_line', 'chart_bar', 'chart_pie', 'chart_scatter', 'chart_area', 'heatmap', 'dashboard', 'kpi_metrics');--> statement-breakpoint
CREATE TYPE "public"."appointment_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."service_department" AS ENUM('GCMC', 'KAJ', 'COMPLIANCE', 'ADVISORY');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('PAYE_FILING', 'VAT_RETURN', 'INCOME_TAX_RETURN', 'NIS_SUBMISSION', 'BUSINESS_REGISTRATION', 'TAX_CONSULTATION', 'COMPLIANCE_REVIEW', 'DOCUMENT_PREPARATION', 'AUDIT_SUPPORT', 'ADVISORY_MEETING', 'VISA_APPLICATION', 'LEGAL_CONSULTATION');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'password_change', 'permission_change', 'export', 'import', 'approve', 'reject', 'submit', 'cancel', 'archive', 'restore', 'share', 'download');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('user', 'client', 'document', 'compliance_requirement', 'compliance_filing', 'tax_calculation', 'session', 'system', 'report', 'setting', 'permission', 'role');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TYPE "public"."backup_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."backup_storage" AS ENUM('LOCAL', 'S3', 'GCS', 'AZURE', 'FTP');--> statement-breakpoint
CREATE TYPE "public"."backup_type" AS ENUM('FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'SETTINGS', 'DOCUMENTS', 'SELECTIVE');--> statement-breakpoint
CREATE TYPE "public"."restore_status" AS ENUM('PENDING', 'VALIDATING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK');--> statement-breakpoint
CREATE TYPE "public"."business_appointment_status" AS ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."business_compliance_status" AS ENUM('GOOD', 'WARNING', 'EXPIRED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."business_doc_status" AS ENUM('active', 'archived', 'deleted', 'pending');--> statement-breakpoint
CREATE TYPE "public"."business_document_type" AS ENUM('IDENTIFICATION', 'TAX_COMPLIANCE', 'NIS_COMPLIANCE', 'BUSINESS_REGISTRATION', 'FINANCIAL_STATEMENT', 'LEGAL_DOCUMENT', 'IMMIGRATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."business_entity_type" AS ENUM('INDIVIDUAL', 'COMPANY', 'PARTNERSHIP', 'SOLE_TRADER', 'TRUST', 'NON_PROFIT');--> statement-breakpoint
CREATE TYPE "public"."business_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT', 'DEPARTMENT_HEAD', 'ANALYST', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."business_tax_type" AS ENUM('VAT', 'PAYE', 'NIS', 'CORPORATE_TAX', 'WITHHOLDING_TAX');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_status" AS ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_type" AS ENUM('TAX_DEADLINE', 'LICENSE_RENEWAL', 'DOCUMENT_EXPIRY', 'REGULATORY_CHANGE', 'FILING_REMINDER', 'COMPLIANCE_REVIEW', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."ocr_job_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ocr_job_status_extended" AS ENUM('QUEUED', 'PENDING', 'PROCESSING', 'COMPLETED', 'VALIDATED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('active', 'inactive', 'suspended', 'pending_approval', 'archived');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('GOOD', 'WARNING', 'CRITICAL', 'PENDING_REVIEW', 'OVERDUE', 'EXEMPT');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('INDIVIDUAL', 'COMPANY', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP', 'LIMITED_LIABILITY_COMPANY', 'CORPORATION', 'TRUST', 'ESTATE', 'NON_PROFIT', 'GOVERNMENT');--> statement-breakpoint
CREATE TYPE "public"."immigration_status_type" AS ENUM('PENDING', 'IN_PROGRESS', 'APPROVED', 'DENIED', 'EXPIRED', 'RENEWAL_REQUIRED');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."visa_type" AS ENUM('H1B', 'L1', 'O1', 'EB1', 'EB2', 'EB3', 'F1', 'J1', 'B1', 'B2', 'E2', 'TN', 'PERM', 'GREEN_CARD', 'CITIZENSHIP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."compliance_filing_status" AS ENUM('not_started', 'in_progress', 'under_review', 'completed', 'filed', 'overdue', 'rejected', 'amended');--> statement-breakpoint
CREATE TYPE "public"."compliance_type" AS ENUM('tax_filing', 'vat_return', 'paye_return', 'nis_return', 'annual_return', 'audit', 'review', 'compilation', 'regulatory_filing', 'license_renewal');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."tax_period" AS ENUM('monthly', 'quarterly', 'semi_annually', 'annually', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."enhanced_document_type" AS ENUM('paye_certificate', 'vat_return', 'corporate_tax_return', 'withholding_tax_certificate', 'nis_contribution_record', 'tax_assessment', 'tax_clearance_certificate', 'financial_statement', 'balance_sheet', 'income_statement', 'cash_flow_statement', 'bank_statement', 'bank_reconciliation', 'trial_balance', 'invoice', 'receipt', 'purchase_order', 'delivery_note', 'credit_note', 'debit_note', 'quotation', 'contract', 'agreement', 'audit_report', 'compliance_certificate', 'license', 'permit', 'registration_certificate', 'incorporation_document', 'memorandum_of_association', 'articles_of_association', 'passport', 'visa', 'work_permit', 'residence_permit', 'birth_certificate', 'marriage_certificate', 'police_certificate', 'medical_certificate', 'educational_certificate', 'employment_letter', 'power_of_attorney', 'affidavit', 'statutory_declaration', 'court_order', 'legal_opinion', 'email', 'letter', 'memo', 'notice', 'circular', 'audit_working_paper', 'tax_working_paper', 'analysis', 'calculation', 'identification', 'supporting_document', 'miscellaneous');--> statement-breakpoint
CREATE TYPE "public"."ocr_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'manual_review_required', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."processing_priority" AS ENUM('low', 'normal', 'high', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."storage_tier" AS ENUM('hot', 'warm', 'cold', 'archive', 'glacier');--> statement-breakpoint
CREATE TYPE "public"."access_level" AS ENUM('public', 'internal', 'restricted', 'confidential', 'top_secret');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'under_review', 'approved', 'rejected', 'archived', 'expired');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('tax_return', 'financial_statement', 'audit_report', 'bank_statement', 'invoice', 'receipt', 'contract', 'legal_document', 'compliance_certificate', 'correspondence', 'working_paper', 'supporting_document', 'identification', 'incorporation_document', 'license', 'other');--> statement-breakpoint
CREATE TYPE "public"."audit_risk_level" AS ENUM('very_low', 'low', 'medium', 'high', 'very_high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."compliance_framework" AS ENUM('sox', 'gdpr', 'iso_27001', 'nist', 'coso', 'gra_compliance', 'internal_controls', 'data_retention', 'privacy', 'security', 'custom');--> statement-breakpoint
CREATE TYPE "public"."enhanced_audit_action" AS ENUM('create', 'read', 'update', 'delete', 'bulk_update', 'bulk_delete', 'login', 'logout', 'failed_login', 'password_change', 'password_reset_request', 'password_reset', 'mfa_enable', 'mfa_disable', 'mfa_verify', 'session_expire', 'session_terminate', 'role_assign', 'role_revoke', 'permission_grant', 'permission_revoke', 'access_denied', 'privilege_escalation', 'document_upload', 'document_download', 'document_view', 'document_share', 'document_unshare', 'document_version_create', 'document_archive', 'document_restore', 'document_encrypt', 'document_decrypt', 'tax_calculate', 'tax_submit', 'tax_approve', 'tax_reject', 'payment_process', 'payment_refund', 'invoice_generate', 'invoice_send', 'gra_submit', 'gra_status_check', 'gra_response_receive', 'gra_amendment', 'gra_appeal', 'case_create', 'case_update_status', 'case_assign', 'interview_schedule', 'interview_complete', 'document_verify', 'document_reject', 'backup_create', 'backup_restore', 'system_maintenance', 'configuration_change', 'integration_sync', 'cache_clear', 'export', 'import', 'migrate', 'purge', 'anonymize', 'workflow_start', 'workflow_advance', 'workflow_complete', 'workflow_cancel', 'approve', 'reject', 'email_send', 'notification_send', 'alert_trigger', 'reminder_send', 'compliance_check', 'audit_trail_access', 'data_retention_policy_apply', 'privacy_request_process', 'api_key_create', 'api_key_revoke', 'api_rate_limit_exceed', 'webhook_trigger', 'custom', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."enhanced_audit_entity" AS ENUM('organization', 'user', 'client', 'client_contact', 'client_service', 'document', 'document_template', 'document_workflow', 'ocr_result', 'tax_calculation', 'paye_calculation', 'nis_calculation', 'vat_calculation', 'tax_rate', 'gra_submission', 'gra_connection', 'gra_webhook', 'gra_api_cache', 'immigration_case', 'immigration_interview', 'immigration_correspondence', 'immigration_document_requirement', 'immigration_timeline', 'role', 'permission', 'user_role', 'user_permission', 'session', 'audit_log', 'system_event', 'notification', 'setting', 'backup', 'compliance_requirement', 'compliance_filing', 'audit_trail', 'api_key', 'webhook', 'integration', 'report', 'dashboard', 'custom');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('critical', 'warning', 'info', 'low');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('active', 'acknowledged', 'resolved', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."monitoring_metric_type" AS ENUM('system_cpu', 'system_memory', 'system_disk', 'system_network', 'application_response_time', 'application_throughput', 'application_error_rate', 'database_connections', 'database_query_time', 'api_request_count', 'api_error_count', 'user_session_count', 'business_kpi');--> statement-breakpoint
CREATE TYPE "public"."expediting_priority" AS ENUM('STANDARD', 'PRIORITY', 'URGENT', 'RUSH');--> statement-breakpoint
CREATE TYPE "public"."expediting_request_type" AS ENUM('DOCUMENT_SUBMISSION', 'DOCUMENT_COLLECTION', 'APPLICATION_FOLLOW_UP', 'CERTIFICATE_RENEWAL', 'COMPLIANCE_CLEARANCE', 'PERMIT_APPLICATION', 'LICENSE_APPLICATION', 'TAX_CLEARANCE', 'REGISTRATION', 'INQUIRY', 'GENERAL_EXPEDITING');--> statement-breakpoint
CREATE TYPE "public"."expediting_status" AS ENUM('PENDING', 'ASSIGNED', 'IN_QUEUE', 'AT_AGENCY', 'PROCESSING', 'AWAITING_RESPONSE', 'DOCUMENTS_READY', 'COMPLETED', 'FAILED', 'CANCELLED', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "public"."government_agency" AS ENUM('GRA', 'NIS', 'DEEDS_REGISTRY', 'LANDS_SURVEYS', 'BUSINESS_REGISTRY', 'IMMIGRATION', 'MINISTRY_OF_LABOUR', 'MINISTRY_OF_LEGAL_AFFAIRS', 'MINISTRY_OF_HOME_AFFAIRS', 'MINISTRY_OF_NATURAL_RESOURCES', 'EPA', 'GUYANA_ENERGY', 'GNBS', 'GPL', 'GWI', 'GTT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."gra_api_endpoint" AS ENUM('authentication', 'taxpayer_info', 'filing_submit', 'filing_status', 'payment_info', 'tax_rates', 'compliance_check', 'document_upload', 'amendment', 'refund_request', 'penalty_info', 'certificate_request');--> statement-breakpoint
CREATE TYPE "public"."gra_filing_type" AS ENUM('paye_monthly', 'paye_annual', 'vat_monthly', 'vat_quarterly', 'vat_annual', 'corporate_tax', 'withholding_tax', 'nis_monthly', 'nis_annual', 'stamp_duty', 'land_tax', 'customs_declaration', 'excise_tax', 'other');--> statement-breakpoint
CREATE TYPE "public"."gra_submission_status" AS ENUM('draft', 'validating', 'validated', 'submitting', 'submitted', 'processing', 'accepted', 'rejected', 'amended', 'cancelled', 'error');--> statement-breakpoint
CREATE TYPE "public"."case_priority" AS ENUM('routine', 'expedited', 'urgent', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."document_requirement_status" AS ENUM('not_required', 'required', 'submitted', 'verified', 'rejected', 'expired', 'waived');--> statement-breakpoint
CREATE TYPE "public"."immigration_case_status" AS ENUM('draft', 'submitted', 'under_review', 'additional_docs_required', 'interview_scheduled', 'interview_completed', 'decision_pending', 'approved', 'approved_with_conditions', 'refused', 'withdrawn', 'cancelled', 'expired', 'appealed', 'appeal_pending', 'appeal_approved', 'appeal_refused', 'reactivated', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."immigration_case_type" AS ENUM('work_permit_initial', 'work_permit_renewal', 'work_permit_extension', 'work_permit_amendment', 'temporary_residence', 'permanent_residence', 'residence_renewal', 'residence_extension', 'investor_visa', 'business_permit', 'entrepreneur_permit', 'business_registration', 'family_reunification', 'spousal_visa', 'dependent_visa', 'adoption_visa', 'naturalization', 'citizenship_by_descent', 'citizenship_certificate', 'student_visa', 'research_permit', 'volunteer_permit', 'diplomatic_visa', 'transit_visa', 'status_change', 'appeal', 'judicial_review', 'reactivation', 'document_authentication', 'verification_service', 'travel_document', 'other');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('eligibility_assessment', 'background_verification', 'document_verification', 'compliance_check', 'appeal_hearing', 'follow_up', 'virtual', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."lc_compliance_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLIANT', 'NON_COMPLIANT', 'EXEMPTION_REQUESTED', 'EXEMPTION_GRANTED', 'REMEDIATION_REQUIRED');--> statement-breakpoint
CREATE TYPE "public"."lc_registration_type" AS ENUM('CONTRACTOR', 'SUBCONTRACTOR', 'SERVICE_PROVIDER', 'SUPPLIER', 'JOINT_VENTURE');--> statement-breakpoint
CREATE TYPE "public"."local_content_category" AS ENUM('GOODS', 'SERVICES', 'EMPLOYMENT', 'TRAINING', 'TECHNOLOGY_TRANSFER', 'MANAGEMENT', 'OWNERSHIP', 'FINANCING', 'INSURANCE', 'LEGAL_SERVICES', 'RESEARCH_DEVELOPMENT');--> statement-breakpoint
CREATE TYPE "public"."report_period_type" AS ENUM('QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'PROJECT_BASED');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('in_app', 'email', 'sms', 'push', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'document_uploaded', 'document_signed', 'invoice_generated', 'payment_received', 'payment_overdue', 'task_assigned', 'task_completed', 'compliance_alert', 'system_maintenance', 'user_welcome', 'password_reset', 'security_alert', 'custom');--> statement-breakpoint
CREATE TYPE "public"."ocr_confidence_level" AS ENUM('very_high', 'high', 'medium', 'low', 'very_low');--> statement-breakpoint
CREATE TYPE "public"."ocr_document_type" AS ENUM('receipt', 'invoice', 'bank_statement', 'payslip', 'tax_certificate', 'contract', 'id_document', 'passport', 'drivers_license', 'utility_bill', 'financial_statement', 'business_registration', 'tax_return', 'customs_declaration', 'other');--> statement-breakpoint
CREATE TYPE "public"."ocr_processing_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'cancelled', 'retry', 'manual_review');--> statement-breakpoint
CREATE TYPE "public"."ocr_quality" AS ENUM('excellent', 'good', 'acceptable', 'poor', 'unusable');--> statement-breakpoint
CREATE TYPE "public"."business_sector" AS ENUM('agriculture', 'mining', 'oil_and_gas', 'forestry', 'manufacturing', 'construction', 'retail', 'hospitality', 'healthcare', 'education', 'financial_services', 'professional_services', 'technology', 'transportation', 'utilities', 'government', 'non_profit', 'other');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'inactive', 'suspended', 'pending_setup', 'trial', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('basic', 'professional', 'enterprise', 'custom');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('PROSPECT', 'PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('LAW_FIRM', 'ACCOUNTING_FIRM', 'BANK', 'INSURANCE_COMPANY', 'REAL_ESTATE', 'IMMIGRATION_CONSULTANT', 'BUSINESS_CONSULTANT', 'IT_SERVICES', 'TRAINING_PROVIDER', 'GOVERNMENT_LIAISON', 'NOTARY_PUBLIC', 'COURT_MARSHAL', 'LAND_SURVEYOR', 'VALUATOR', 'CUSTOMS_BROKER', 'SHIPPING_AGENT', 'TRANSLATOR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."partnership_tier" AS ENUM('BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'STRATEGIC');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive', 'on_leave', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."payroll_run_status" AS ENUM('draft', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lease_status" AS ENUM('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED', 'RENEWED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'EMERGENCY');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS', 'COMPLETED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE', 'PENDING_LEASE', 'SOLD', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND', 'MIXED_USE', 'AGRICULTURAL');--> statement-breakpoint
CREATE TYPE "public"."rent_payment_status" AS ENUM('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."job_priority" AS ENUM('critical', 'high', 'normal', 'low', 'background');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'retry', 'delayed');--> statement-breakpoint
CREATE TYPE "public"."queue_type" AS ENUM('gra_submission', 'ocr_processing', 'report_generation', 'email_delivery', 'document_processing', 'data_export', 'backup_operations', 'system_maintenance', 'notification_delivery', 'file_processing', 'analytics_calculation', 'integration_sync');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('create', 'read', 'update', 'delete', 'approve', 'reject', 'submit', 'cancel', 'archive', 'restore', 'export', 'import', 'share', 'download', 'manage_permissions', 'view_sensitive');--> statement-breakpoint
CREATE TYPE "public"."permission_scope" AS ENUM('global', 'department', 'team', 'personal', 'client_specific');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('users', 'clients', 'documents', 'tax_calculations', 'compliance', 'appointments', 'reports', 'audit_logs', 'settings', 'billing', 'tasks', 'communications');--> statement-breakpoint
CREATE TYPE "public"."search_entity_type" AS ENUM('client', 'document', 'invoice', 'appointment', 'user', 'task', 'note', 'compliance_item', 'tax_calculation');--> statement-breakpoint
CREATE TYPE "public"."business_entity" AS ENUM('GREEN_CRESCENT', 'KAJ_FINANCIAL', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."fee_structure_type" AS ENUM('FIXED', 'HOURLY', 'PERCENTAGE', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM', 'FREE');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('TRAINING', 'CONSULTANCY', 'PARALEGAL', 'IMMIGRATION', 'BUSINESS_PROPOSALS', 'NETWORKING', 'TAX_RETURNS', 'COMPLIANCE', 'PAYE_SERVICES', 'FINANCIAL_STATEMENTS', 'AUDIT_SERVICES', 'NIS_SERVICES', 'DOCUMENT_PREPARATION', 'CLIENT_PORTAL');--> statement-breakpoint
CREATE TYPE "public"."service_offering_status" AS ENUM('ACTIVE', 'INACTIVE', 'COMING_SOON', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "public"."calculation_status" AS ENUM('draft', 'calculated', 'verified', 'submitted', 'paid', 'overdue', 'amended');--> statement-breakpoint
CREATE TYPE "public"."nis_class" AS ENUM('class_1', 'class_2', 'class_3');--> statement-breakpoint
CREATE TYPE "public"."paye_frequency" AS ENUM('weekly', 'bi_weekly', 'monthly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."tax_period_type" AS ENUM('monthly', 'quarterly', 'annually', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('paye', 'nis', 'vat', 'corporate_tax', 'withholding_tax', 'land_tax', 'stamp_duty', 'customs_duty', 'excise_tax');--> statement-breakpoint
CREATE TYPE "public"."vat_rate_type" AS ENUM('standard', 'zero_rated', 'exempt');--> statement-breakpoint
CREATE TYPE "public"."certificate_status" AS ENUM('PENDING', 'ISSUED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('DRAFT', 'PUBLISHED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."delivery_mode" AS ENUM('IN_PERSON', 'VIRTUAL', 'HYBRID', 'SELF_PACED', 'WORKSHOP', 'WEBINAR', 'CONFERENCE');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."training_category" AS ENUM('FINANCIAL_LITERACY', 'TAX_COMPLIANCE', 'BUSINESS_REGISTRATION', 'PAYROLL_MANAGEMENT', 'NIS_COMPLIANCE', 'IMMIGRATION_PROCEDURES', 'PARALEGAL', 'COMPUTER_APPLICATIONS', 'PROFESSIONAL_DEVELOPMENT', 'LEADERSHIP', 'CUSTOMER_SERVICE', 'WORKPLACE_SAFETY', 'INDUSTRY_SPECIFIC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'admin', 'manager', 'accountant', 'client_service', 'read_only');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'pending');--> statement-breakpoint
CREATE TABLE "analytics_dashboards" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"dashboard_name" text NOT NULL,
	"description" text,
	"category" "report_category" NOT NULL,
	"layout" jsonb,
	"widgets" jsonb NOT NULL,
	"refresh_interval" integer DEFAULT 300 NOT NULL,
	"auto_refresh" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"access_level" text DEFAULT 'organization' NOT NULL,
	"allowed_roles" jsonb,
	"allowed_users" jsonb,
	"cache_settings" jsonb,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp,
	"average_load_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "dashboards_org_name_unique" UNIQUE("organization_id","dashboard_name")
);
--> statement-breakpoint
CREATE TABLE "analytics_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_type" text NOT NULL,
	"category" text NOT NULL,
	"dimension" text,
	"period_type" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"value" text NOT NULL,
	"count" integer,
	"metadata" jsonb,
	"parent_metric_id" text,
	"hierarchy_level" integer DEFAULT 0 NOT NULL,
	"computation_time" integer,
	"is_precomputed" boolean DEFAULT true NOT NULL,
	"source_data_timestamp" timestamp,
	"staleness_threshold" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_metrics_org_name_period_unique" UNIQUE("organization_id","metric_name","dimension","period_start")
);
--> statement-breakpoint
CREATE TABLE "generated_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text,
	"template_id" text,
	"report_title" text NOT NULL,
	"report_type" "report_type" NOT NULL,
	"category" "report_category" NOT NULL,
	"parameters" jsonb,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"generation_time" integer,
	"report_data" jsonb,
	"summary_metrics" jsonb,
	"total_records" integer,
	"data_hash" text,
	"output_files" jsonb,
	"is_shared" boolean DEFAULT false NOT NULL,
	"share_token" text,
	"share_expires_at" timestamp,
	"emailed_to" jsonb,
	"error_message" text,
	"error_details" jsonb,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"cache_key" text,
	"cache_expires_at" timestamp,
	"resource_usage" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" text NOT NULL,
	"requested_by" text
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"schedule_name" text NOT NULL,
	"description" text,
	"template_id" text NOT NULL,
	"frequency" "report_frequency" NOT NULL,
	"schedule_config" jsonb,
	"default_parameters" jsonb,
	"distribution_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"successful_runs" integer DEFAULT 0 NOT NULL,
	"failed_runs" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "report_schedules_org_name_unique" UNIQUE("organization_id","schedule_name")
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"template_name" text NOT NULL,
	"description" text,
	"report_type" "report_type" NOT NULL,
	"category" "report_category" NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"data_source_config" jsonb NOT NULL,
	"report_structure" jsonb NOT NULL,
	"output_formats" jsonb,
	"is_public" boolean DEFAULT false NOT NULL,
	"access_level" text DEFAULT 'organization' NOT NULL,
	"allowed_roles" jsonb,
	"allowed_users" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"average_generation_time" integer,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "report_templates_org_name_version_unique" UNIQUE("organization_id","template_name","version")
);
--> statement-breakpoint
CREATE TABLE "appointment_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"appointment_id" text NOT NULL,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"document_type" text,
	"description" text,
	"is_client_accessible" boolean DEFAULT false,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" text
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"appointment_number" text NOT NULL,
	"client_id" text NOT NULL,
	"service_id" text NOT NULL,
	"assigned_to" text,
	"scheduled_at" timestamp NOT NULL,
	"estimated_end_time" timestamp NOT NULL,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"status" "appointment_status" DEFAULT 'SCHEDULED' NOT NULL,
	"priority" "appointment_priority" DEFAULT 'MEDIUM' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"meeting_link" text,
	"client_notes" text,
	"internal_notes" text,
	"requires_follow_up" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_completed" boolean DEFAULT false,
	"is_chargeable" boolean DEFAULT true,
	"charged_amount" numeric(10, 2),
	"payment_status" text DEFAULT 'PENDING',
	"reminder_sent" boolean DEFAULT false,
	"reminder_sent_at" timestamp,
	"confirmation_sent" boolean DEFAULT false,
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"cancelled_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "appointments_appointment_number_unique" UNIQUE("appointment_number")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"department" "service_department" NOT NULL,
	"service_type" "service_type" NOT NULL,
	"base_price" numeric(10, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 60,
	"buffer_time_minutes" integer DEFAULT 15,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false,
	"max_advance_booking_days" integer DEFAULT 30,
	"required_documents" text,
	"prerequisites" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity" "audit_entity" NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"user_id" text,
	"client_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"endpoint" text,
	"method" text,
	"old_values" text,
	"new_values" text,
	"changed_fields" text,
	"severity" "audit_severity" DEFAULT 'info' NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"duration" text,
	"metadata" text,
	"tags" text,
	"correlation_id" text,
	"retention_period" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"success" boolean NOT NULL,
	"user_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"failure_reason" text,
	"attempts" text,
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"blocked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"event_name" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"severity" "audit_severity" DEFAULT 'info' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration" text,
	"details" text,
	"error_message" text,
	"error_code" text,
	"related_user_id" text,
	"related_entity_type" text,
	"related_entity_id" text,
	"server_name" text,
	"process_id" text,
	"version" text,
	"environment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"backup_id" text,
	"restore_operation_id" text,
	"schedule_id" text,
	"action" text NOT NULL,
	"action_details" jsonb,
	"previous_status" text,
	"new_status" text,
	"performed_by" text,
	"performed_by_system" boolean DEFAULT false NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_encryption_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"algorithm" text DEFAULT 'AES-256-GCM' NOT NULL,
	"key_fingerprint" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"rotated_at" timestamp,
	"previous_key_id" text,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "backup_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"backup_type" "backup_type" DEFAULT 'FULL' NOT NULL,
	"storage_location" "backup_storage" DEFAULT 'LOCAL' NOT NULL,
	"cron_expression" text NOT NULL,
	"timezone" text DEFAULT 'America/Guyana' NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"max_backups" integer DEFAULT 10,
	"include_tables" jsonb,
	"exclude_tables" jsonb,
	"include_documents" boolean DEFAULT true NOT NULL,
	"include_audit_logs" boolean DEFAULT true NOT NULL,
	"is_encrypted" boolean DEFAULT true NOT NULL,
	"encryption_key_id" text,
	"compression_enabled" boolean DEFAULT true NOT NULL,
	"compression_level" integer DEFAULT 6,
	"storage_config" jsonb,
	"notify_on_success" boolean DEFAULT false NOT NULL,
	"notify_on_failure" boolean DEFAULT true NOT NULL,
	"notification_emails" jsonb,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"last_backup_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "backup_table_details" (
	"id" text PRIMARY KEY NOT NULL,
	"backup_id" text NOT NULL,
	"table_name" text NOT NULL,
	"schema_name" text DEFAULT 'public' NOT NULL,
	"record_count" integer,
	"size_bytes" text,
	"changed_records" integer,
	"deleted_records" integer,
	"inserted_records" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"status" text DEFAULT 'pending',
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text,
	"name" text NOT NULL,
	"description" text,
	"backup_type" "backup_type" NOT NULL,
	"status" "backup_status" DEFAULT 'PENDING' NOT NULL,
	"storage_location" "backup_storage" NOT NULL,
	"storage_path" text,
	"storage_config" jsonb,
	"included_tables" jsonb,
	"excluded_tables" jsonb,
	"includes_documents" boolean DEFAULT false NOT NULL,
	"includes_audit_logs" boolean DEFAULT false NOT NULL,
	"size_bytes" text,
	"compressed_size_bytes" text,
	"record_count" integer,
	"table_count" integer,
	"checksum" text,
	"checksum_algorithm" text DEFAULT 'SHA-256',
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"parent_backup_id" text,
	"base_backup_id" text,
	"error_message" text,
	"error_details" jsonb,
	"retry_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_expired" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"database_version" text,
	"application_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "restore_operations" (
	"id" text PRIMARY KEY NOT NULL,
	"backup_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "restore_status" DEFAULT 'PENDING' NOT NULL,
	"restore_type" text DEFAULT 'full' NOT NULL,
	"selected_tables" jsonb,
	"restore_documents" boolean DEFAULT true NOT NULL,
	"restore_audit_logs" boolean DEFAULT true NOT NULL,
	"target_database" text,
	"target_schema" text,
	"overwrite_existing" boolean DEFAULT false NOT NULL,
	"pre_restore_backup_id" text,
	"create_pre_restore_backup" boolean DEFAULT true NOT NULL,
	"validation_status" text,
	"validation_errors" jsonb,
	"checksum_verified" boolean DEFAULT false,
	"total_tables" integer,
	"restored_tables" integer DEFAULT 0,
	"total_records" integer,
	"restored_records" integer DEFAULT 0,
	"progress_percent" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"error_details" jsonb,
	"rollback_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"initiated_by" text NOT NULL,
	"approved_by" text
);
--> statement-breakpoint
CREATE TABLE "restore_table_details" (
	"id" text PRIMARY KEY NOT NULL,
	"restore_operation_id" text NOT NULL,
	"table_name" text NOT NULL,
	"schema_name" text DEFAULT 'public' NOT NULL,
	"status" text DEFAULT 'pending',
	"record_count" integer,
	"restored_count" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"skipped_records" integer DEFAULT 0,
	"conflict_records" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings_backup" (
	"id" text PRIMARY KEY NOT NULL,
	"backup_id" text,
	"category" text NOT NULL,
	"settings_data" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"scheduled_date" timestamp NOT NULL,
	"duration" integer DEFAULT 60,
	"location" varchar(255),
	"meeting_link" text,
	"status" "business_appointment_status" DEFAULT 'SCHEDULED',
	"notes" text,
	"reminder_sent" boolean DEFAULT false,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_entity" varchar(100) NOT NULL,
	"target_id" varchar(255),
	"old_values" text,
	"new_values" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"service_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" varchar(50) DEFAULT 'ACTIVE',
	"assigned_staff_id" text,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" "compliance_alert_type" NOT NULL,
	"severity" "compliance_alert_severity" DEFAULT 'MEDIUM',
	"status" "compliance_alert_status" DEFAULT 'ACTIVE',
	"due_date" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"due_date" timestamp,
	"renewal_date" timestamp,
	"status" "business_compliance_status" DEFAULT 'PENDING',
	"is_recurring" boolean DEFAULT false,
	"recurring_interval" varchar(50),
	"last_updated_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"folder_id" uuid,
	"name" varchar(255) NOT NULL,
	"type" "business_document_type" NOT NULL,
	"description" text,
	"file_name" varchar(255),
	"file_path" text,
	"file_url" text,
	"file_size" integer,
	"mime_type" varchar(100),
	"reference_number" varchar(100),
	"status" "business_doc_status" DEFAULT 'active' NOT NULL,
	"is_confidential" boolean DEFAULT false,
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"is_required" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"verified_by" text,
	"verified_at" timestamp,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_folder_id" uuid,
	"path" text,
	"color" varchar(7),
	"icon" varchar(50),
	"is_system_folder" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gra_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"form_type" varchar(50) NOT NULL,
	"period" varchar(20) NOT NULL,
	"submission_data" text,
	"gra_reference" varchar(100),
	"status" varchar(30) DEFAULT 'DRAFT',
	"submitted_at" timestamp,
	"processed_at" timestamp,
	"error_message" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"organization_id" text,
	"invoice_number" varchar(50) NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"vat_amount" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"currency" varchar(3) DEFAULT 'GYD' NOT NULL,
	"items" jsonb,
	"notes" text,
	"terms_and_conditions" text,
	"paid_at" timestamp,
	"paid_amount" numeric(15, 2),
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "ocr_processing_job" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"client_id" text,
	"batch_id" text,
	"document_type" varchar(50),
	"status" varchar(20) DEFAULT 'QUEUED' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL',
	"extracted_text" text,
	"confidence" numeric(5, 4),
	"confidence_score" numeric(5, 4),
	"extraction_options" text,
	"metadata" text,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"processed_by" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ocr_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processing_id" text NOT NULL,
	"extracted_text" text,
	"extracted_data" text,
	"confidence_score" numeric(5, 4),
	"processing_metadata" text,
	"validated_by" text,
	"validation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"period" varchar(20) NOT NULL,
	"gross_salary" numeric(15, 2) NOT NULL,
	"allowances" numeric(15, 2) DEFAULT '0',
	"deductions" numeric(15, 2) DEFAULT '0',
	"paye_tax" numeric(15, 2) DEFAULT '0',
	"nis_employee" numeric(15, 2) DEFAULT '0',
	"nis_employer" numeric(15, 2) DEFAULT '0',
	"net_salary" numeric(15, 2) NOT NULL,
	"payment_date" timestamp,
	"payment_status" varchar(20) DEFAULT 'PENDING',
	"metadata" text,
	"processed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"price" numeric(10, 2),
	"duration" integer,
	"is_active" boolean DEFAULT true,
	"requires_documents" boolean DEFAULT false,
	"required_document_types" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_calculation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"tax_type" "business_tax_type",
	"calculation_type" varchar(50),
	"calculation_period" varchar(50),
	"period" varchar(50),
	"gross_amount" numeric(15, 2),
	"taxable_amount" numeric(15, 2),
	"tax_rate" numeric(5, 4),
	"tax_amount" numeric(15, 2),
	"net_amount" numeric(15, 2),
	"deductions" numeric(15, 2) DEFAULT '0',
	"allowances" numeric(15, 2) DEFAULT '0',
	"metadata" text,
	"input_data" text,
	"result_data" text,
	"calculated_by" text NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"is_submitted" boolean DEFAULT false,
	"submitted_at" timestamp,
	"submitted_by" text
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" "business_role" DEFAULT 'CLIENT' NOT NULL,
	"phone" varchar(20),
	"address" text,
	"department" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"invited_by" text,
	"invite_token" varchar(255),
	"invite_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"email" text,
	"phone_number" text,
	"mobile_number" text,
	"department" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "client_services" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"service_name" text NOT NULL,
	"service_type" text NOT NULL,
	"description" text,
	"frequency" text,
	"fee_structure" text,
	"fee_amount" numeric(10, 2),
	"currency" text DEFAULT 'BBD' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_to" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_number" text NOT NULL,
	"business_name" text,
	"first_name" text,
	"last_name" text,
	"entity_type" "entity_type" NOT NULL,
	"tin_number" text,
	"nis_number" text,
	"vat_number" text,
	"registration_number" text,
	"passport_number" text,
	"is_local_content_qualified" boolean DEFAULT false,
	"name" text NOT NULL,
	"email" text,
	"phone_number" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text DEFAULT 'Guyana' NOT NULL,
	"status" "client_status" DEFAULT 'pending_approval' NOT NULL,
	"compliance_status" "compliance_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"compliance_score" integer DEFAULT 100,
	"risk_level" "risk_level" DEFAULT 'medium' NOT NULL,
	"estimated_annual_revenue" numeric(15, 2),
	"employee_count" integer,
	"incorporation_date" timestamp,
	"fiscal_year_end" text,
	"client_since" timestamp,
	"last_review_date" timestamp,
	"next_review_date" timestamp,
	"assigned_accountant" text,
	"assigned_manager" text,
	"primary_contact" text,
	"notes" text,
	"tags" jsonb,
	"custom_fields" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "clients_client_number_unique" UNIQUE("client_number"),
	CONSTRAINT "clients_tin_number_unique" UNIQUE("tin_number"),
	CONSTRAINT "clients_nis_number_unique" UNIQUE("nis_number")
);
--> statement-breakpoint
CREATE TABLE "immigration_status" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"current_status" "immigration_status_type" DEFAULT 'PENDING' NOT NULL,
	"visa_type" "visa_type",
	"application_date" timestamp,
	"expiry_date" timestamp,
	"documents" jsonb,
	"notes" jsonb,
	"next_action" text,
	"next_action_date" timestamp,
	"assigned_officer" text,
	"case_number" text,
	"priority" text DEFAULT 'medium',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "immigration_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"status" "immigration_status_type" NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "compliance_filings" (
	"id" text PRIMARY KEY NOT NULL,
	"requirement_id" text NOT NULL,
	"client_id" text NOT NULL,
	"filing_period" text NOT NULL,
	"period_start_date" date,
	"period_end_date" date,
	"due_date" date NOT NULL,
	"status" "compliance_filing_status" DEFAULT 'not_started' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" text,
	"reviewed_by" text,
	"prepared_by" text,
	"percent_complete" numeric(5, 2) DEFAULT '0',
	"actual_hours" numeric(5, 2),
	"started_at" timestamp,
	"completed_at" timestamp,
	"filed_at" timestamp,
	"fee_charged" numeric(10, 2),
	"penalties" numeric(10, 2),
	"interest" numeric(10, 2),
	"reference_number" text,
	"confirmation_number" text,
	"filing_method" text,
	"notes" text,
	"internal_notes" text,
	"attachments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "compliance_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"filing_id" text NOT NULL,
	"reminder_type" text NOT NULL,
	"reminder_date" timestamp NOT NULL,
	"message" text,
	"sent_at" timestamp,
	"sent_to" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"compliance_type" "compliance_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"frequency" "tax_period" NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"next_due_date" date,
	"reminder_days" text,
	"assigned_to" text,
	"reviewed_by" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_automatic" boolean DEFAULT false NOT NULL,
	"estimated_hours" numeric(5, 2),
	"fee_amount" numeric(10, 2),
	"notes" text,
	"dependencies" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "document_ocr_results" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"ocr_provider" text NOT NULL,
	"ocr_model" text,
	"processing_started" timestamp NOT NULL,
	"processing_completed" timestamp,
	"processing_duration" integer,
	"status" "ocr_status" DEFAULT 'pending' NOT NULL,
	"confidence_score" numeric(5, 4),
	"raw_text" text,
	"structured_data" jsonb,
	"document_class" text,
	"classification_confidence" numeric(5, 4),
	"language" text DEFAULT 'en',
	"page_count" integer,
	"text_quality" text,
	"image_quality" text,
	"skew_angle" numeric(5, 2),
	"preprocessing_steps" jsonb,
	"is_human_verified" boolean DEFAULT false NOT NULL,
	"verification_notes" text,
	"corrections_made" jsonb,
	"error_message" text,
	"error_code" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"processing_cost" numeric(10, 4),
	"cost_currency" text DEFAULT 'USD',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_by" text,
	"verified_by" text
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"document_type" "enhanced_document_type" NOT NULL,
	"template_content" text,
	"template_variables" jsonb,
	"gra_form_code" text,
	"gra_version" text,
	"is_gra_approved" boolean DEFAULT false NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"validation_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "document_templates_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "document_workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"workflow_name" text NOT NULL,
	"current_stage" text NOT NULL,
	"previous_stage" text,
	"next_stage" text,
	"status" text DEFAULT 'active' NOT NULL,
	"completed_stages" jsonb,
	"assigned_to" text,
	"assigned_role" text,
	"escalated_to" text,
	"escalation_reason" text,
	"due_date" timestamp,
	"escalation_date" timestamp,
	"completed_at" timestamp,
	"total_processing_time" integer,
	"workflow_data" jsonb,
	"auto_advance" boolean DEFAULT false NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"notification_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "enhanced_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"document_number" text,
	"external_reference" text,
	"document_type" "enhanced_document_type" NOT NULL,
	"sub_category" text,
	"business_context" text,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_extension" text,
	"title" text NOT NULL,
	"description" text,
	"summary" text,
	"tags" jsonb,
	"document_date" timestamp,
	"received_date" timestamp,
	"issued_date" timestamp,
	"effective_date" timestamp,
	"expiration_date" timestamp,
	"fiscal_year" integer,
	"fiscal_period" text,
	"tax_year" integer,
	"storage_path" text NOT NULL,
	"storage_provider" text DEFAULT 's3' NOT NULL,
	"storage_region" text,
	"storage_tier" "storage_tier" DEFAULT 'hot' NOT NULL,
	"content_url" text,
	"thumbnail_url" text,
	"checksum" text NOT NULL,
	"encryption_key" text,
	"is_encrypted" boolean DEFAULT true NOT NULL,
	"access_level" text DEFAULT 'internal' NOT NULL,
	"processing_priority" "processing_priority" DEFAULT 'normal' NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"workflow_stage" text,
	"assigned_to" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"parent_document_id" text,
	"is_latest_version" boolean DEFAULT true NOT NULL,
	"superseded_by" text,
	"retention_period" integer,
	"legal_hold" boolean DEFAULT false NOT NULL,
	"confidentiality_level" text DEFAULT 'internal' NOT NULL,
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'GYD',
	"counterparty" text,
	"department" text,
	"project" text,
	"cost_center" text,
	"custom_fields" jsonb,
	"business_data" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE "document_access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"user_id" text,
	"share_id" text,
	"action" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"shared_with_user_id" text,
	"shared_with_email" text,
	"shared_by_user_id" text NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"can_download" boolean DEFAULT false NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_share" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"password_required" boolean DEFAULT false NOT NULL,
	"share_token" text,
	"access_count" integer DEFAULT 0 NOT NULL,
	"max_access_count" integer,
	"last_accessed_at" timestamp,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_shares_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"compliance_filing_id" text,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"document_type" "document_type" NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"title" text,
	"description" text,
	"category" text,
	"tags" text,
	"document_date" timestamp,
	"fiscal_period" text,
	"access_level" "access_level" DEFAULT 'internal' NOT NULL,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key" text,
	"password_protected" boolean DEFAULT false NOT NULL,
	"storage_path" text NOT NULL,
	"storage_provider" text DEFAULT 'local' NOT NULL,
	"checksum" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"parent_document_id" text,
	"is_latest_version" boolean DEFAULT true NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"approved_by" text,
	"approved_at" timestamp,
	"review_notes" text,
	"retention_period" integer,
	"expiry_date" timestamp,
	"archive_date" timestamp,
	"delete_after_date" timestamp,
	"custom_fields" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "audit_pattern_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"pattern_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"matched_events" jsonb,
	"match_score" numeric(5, 4),
	"match_reason" text,
	"alert_triggered" boolean DEFAULT false NOT NULL,
	"alert_sent_at" timestamp,
	"response_required" boolean DEFAULT false NOT NULL,
	"response_status" text,
	"investigated_by" text,
	"investigated_at" timestamp,
	"investigation_notes" text,
	"resolution" text,
	"action_taken" text,
	"affected_users" jsonb,
	"affected_entities" jsonb,
	"time_window" jsonb,
	"risk_level" "audit_risk_level" NOT NULL,
	"potential_impact" text,
	"business_impact" text,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"follow_up_date" timestamp,
	"follow_up_assigned_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"pattern_name" text NOT NULL,
	"pattern_type" text NOT NULL,
	"description" text,
	"conditions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"alert_enabled" boolean DEFAULT true NOT NULL,
	"alert_threshold" integer DEFAULT 1 NOT NULL,
	"escalation_enabled" boolean DEFAULT false NOT NULL,
	"escalation_threshold" integer,
	"notify_users" jsonb,
	"notify_roles" jsonb,
	"notification_channels" jsonb,
	"total_matches" integer DEFAULT 0 NOT NULL,
	"last_match_at" timestamp,
	"false_positive_rate" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "audit_patterns_org_name_unique" UNIQUE("organization_id","pattern_name")
);
--> statement-breakpoint
CREATE TABLE "audit_retention_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"policy_name" text NOT NULL,
	"description" text,
	"compliance_framework" "compliance_framework",
	"retention_period" integer NOT NULL,
	"archive_period" integer,
	"purge_after" integer,
	"applies_to" jsonb,
	"legal_hold_override" boolean DEFAULT true NOT NULL,
	"compliance_override" boolean DEFAULT true NOT NULL,
	"exceptions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_executed" timestamp,
	"next_execution" timestamp,
	"records_processed" integer DEFAULT 0,
	"records_archived" integer DEFAULT 0,
	"records_purged" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "audit_retention_policies_org_name_unique" UNIQUE("organization_id","policy_name")
);
--> statement-breakpoint
CREATE TABLE "enhanced_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_id" text NOT NULL,
	"parent_event_id" text,
	"correlation_id" text,
	"transaction_id" text,
	"action" "enhanced_audit_action" NOT NULL,
	"entity" "enhanced_audit_entity" NOT NULL,
	"entity_id" text,
	"entity_name" text,
	"description" text NOT NULL,
	"summary" text,
	"user_id" text,
	"client_id" text,
	"session_id" text,
	"impersonated_by" text,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"endpoint" text,
	"http_method" text,
	"http_status_code" integer,
	"referer" text,
	"location" jsonb,
	"device_info" jsonb,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"change_size" integer,
	"data_classification" text,
	"business_process" text,
	"workflow_stage" text,
	"business_impact" text,
	"compliance_frameworks" jsonb,
	"risk_level" "audit_risk_level" DEFAULT 'low' NOT NULL,
	"security_flags" jsonb,
	"sensitive_data_accessed" boolean DEFAULT false NOT NULL,
	"sensitive_fields" jsonb,
	"success" boolean DEFAULT true NOT NULL,
	"error_code" text,
	"error_message" text,
	"error_details" jsonb,
	"duration" integer,
	"response_size" integer,
	"resources_used" jsonb,
	"retention_period" integer,
	"legal_hold" boolean DEFAULT false NOT NULL,
	"privacy_impact" boolean DEFAULT false NOT NULL,
	"regulatory_relevance" jsonb,
	"requires_review" boolean DEFAULT false NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"escalation_level" integer DEFAULT 0,
	"metadata" jsonb,
	"tags" jsonb,
	"custom_fields" jsonb,
	"external_references" jsonb,
	"alert_triggered" boolean DEFAULT false NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"alert_reason" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"archive_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enhanced_audit_logs_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "active_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"alert_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" "alert_severity" NOT NULL,
	"status" "alert_status" DEFAULT 'active' NOT NULL,
	"trigger_value" text NOT NULL,
	"trigger_timestamp" timestamp NOT NULL,
	"trigger_metrics" jsonb,
	"first_seen" timestamp NOT NULL,
	"last_seen" timestamp NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" text,
	"resolved_at" timestamp,
	"resolved_by" text,
	"resolution_note" text,
	"affected_services" jsonb,
	"affected_users" integer,
	"business_impact" text,
	"assigned_to" text,
	"escalation_level" integer DEFAULT 0 NOT NULL,
	"escalation_history" jsonb,
	"notifications_sent" jsonb,
	"parent_alert_id" text,
	"correlation_key" text,
	"suppressed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "active_alerts_alert_key_unique" UNIQUE("alert_key")
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"metric_query" jsonb NOT NULL,
	"conditions" jsonb NOT NULL,
	"evaluation_interval" integer DEFAULT 60 NOT NULL,
	"alert_cooldown" integer DEFAULT 300 NOT NULL,
	"auto_resolve" boolean DEFAULT true NOT NULL,
	"auto_resolve_timeout" integer DEFAULT 3600,
	"notification_channels" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_evaluated" timestamp,
	"evaluation_count" integer DEFAULT 0 NOT NULL,
	"alert_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "alert_rules_org_name_unique" UNIQUE("organization_id","rule_name")
);
--> statement-breakpoint
CREATE TABLE "capacity_planning" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"current_capacity" text NOT NULL,
	"current_utilization" text NOT NULL,
	"utilization_percentage" integer NOT NULL,
	"projected_growth_rate" text,
	"forecast_period" text,
	"projected_utilization" jsonb,
	"warning_threshold" integer DEFAULT 70 NOT NULL,
	"critical_threshold" integer DEFAULT 85 NOT NULL,
	"estimated_exhaustion_date" timestamp,
	"recommendations" jsonb,
	"forecast_accuracy" integer,
	"model_type" text,
	"model_version" text,
	"last_model_update" timestamp,
	"analysis_date" timestamp NOT NULL,
	"data_window_start" timestamp NOT NULL,
	"data_window_end" timestamp NOT NULL,
	"sample_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capacity_planning_resource_analysis_unique" UNIQUE("resource_type","resource_id","analysis_date")
);
--> statement-breakpoint
CREATE TABLE "performance_baselines" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"metric_name" text NOT NULL,
	"source" text NOT NULL,
	"time_frame" text NOT NULL,
	"day_of_week" integer,
	"hour_of_day" integer,
	"mean_value" text NOT NULL,
	"median_value" text,
	"standard_deviation" text,
	"percentile_95" text,
	"percentile_99" text,
	"min_value" text,
	"max_value" text,
	"upper_bound" text NOT NULL,
	"lower_bound" text NOT NULL,
	"anomaly_threshold" text DEFAULT '2.5' NOT NULL,
	"sample_size" integer NOT NULL,
	"confidence_level" integer,
	"last_calculated" timestamp NOT NULL,
	"calculation_period_start" timestamp NOT NULL,
	"calculation_period_end" timestamp NOT NULL,
	"seasonality_detected" boolean DEFAULT false NOT NULL,
	"seasonal_pattern" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "performance_baselines_metric_source_timeframe_unique" UNIQUE("metric_name","source","time_frame","day_of_week","hour_of_day")
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" text NOT NULL,
	"detector" text,
	"user_id" text,
	"source_ip" text,
	"user_agent" text,
	"target_resource" text,
	"target_type" text,
	"event_data" jsonb NOT NULL,
	"risk_score" integer,
	"confidence" integer,
	"geo_location" jsonb,
	"network_context" jsonb,
	"investigation_status" text DEFAULT 'new',
	"assigned_to" text,
	"response_actions" jsonb,
	"correlation_id" text,
	"parent_event_id" text,
	"event_timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_monitoring" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_type" "monitoring_metric_type" NOT NULL,
	"source" text NOT NULL,
	"tags" jsonb,
	"value" text NOT NULL,
	"unit" text,
	"timestamp" timestamp NOT NULL,
	"aggregation_period" text,
	"min_value" text,
	"max_value" text,
	"avg_value" text,
	"sum_value" text,
	"sample_count" integer,
	"thresholds" jsonb,
	"collection_method" text,
	"data_quality" integer,
	"collector_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"agency" "government_agency" NOT NULL,
	"department_name" text,
	"office_name" text,
	"address" text,
	"city" text,
	"region" text,
	"gps_coordinates" jsonb,
	"contact_name" text,
	"contact_title" text,
	"phone" text,
	"alternate_phone" text,
	"email" text,
	"website" text,
	"operating_hours" jsonb,
	"public_days" jsonb,
	"services_offered" jsonb,
	"documents_processed" jsonb,
	"processing_times" jsonb,
	"fees" jsonb,
	"tips" text,
	"common_issues" jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_verified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "expediting_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"activity_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"agency_visited" "government_agency",
	"department_visited" text,
	"officer_met" text,
	"queue_number" text,
	"wait_time" integer,
	"previous_status" "expediting_status",
	"new_status" "expediting_status",
	"documents_submitted" jsonb,
	"documents_collected" jsonb,
	"receipts_obtained" jsonb,
	"expense_amount" numeric(15, 2),
	"expense_type" text,
	"expense_receipt" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_notes" text,
	"images" jsonb,
	"attachments" jsonb,
	"performed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expediting_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"queue_date" timestamp NOT NULL,
	"agency" "government_agency" NOT NULL,
	"expeditor_id" text NOT NULL,
	"request_ids" jsonb NOT NULL,
	"request_count" integer DEFAULT 0,
	"planned_start_time" timestamp,
	"planned_end_time" timestamp,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"status" text DEFAULT 'planned',
	"route_notes" text,
	"completion_notes" text,
	"requests_completed" integer DEFAULT 0,
	"requests_pending" integer DEFAULT 0,
	"transport_expense" numeric(15, 2),
	"other_expenses" numeric(15, 2),
	"total_expenses" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expediting_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"request_number" text NOT NULL,
	"request_type" "expediting_request_type" NOT NULL,
	"agency" "government_agency" NOT NULL,
	"status" "expediting_status" DEFAULT 'PENDING' NOT NULL,
	"priority" "expediting_priority" DEFAULT 'STANDARD' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"agency_reference_number" text,
	"agency_department" text,
	"agency_contact_person" text,
	"agency_contact_phone" text,
	"documents_required" jsonb,
	"documents_provided" jsonb,
	"documents_received" jsonb,
	"requested_date" timestamp DEFAULT now() NOT NULL,
	"target_completion_date" timestamp,
	"actual_completion_date" timestamp,
	"estimated_processing_days" integer,
	"assigned_to_id" text,
	"expeditor_name" text,
	"expeditor_phone" text,
	"government_fee" numeric(15, 2),
	"service_fee" numeric(15, 2),
	"total_fee" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"is_paid" boolean DEFAULT false,
	"payment_reference" text,
	"outcome" text,
	"result_documents" jsonb,
	"metadata" jsonb,
	"notes" text,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_id" text,
	"actor_type" text DEFAULT 'user' NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text,
	"old_data" text,
	"new_data" text,
	"ip_address" text,
	"user_agent" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gra_api_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"endpoint" "gra_api_endpoint" NOT NULL,
	"request_method" text NOT NULL,
	"request_url" text NOT NULL,
	"request_hash" text NOT NULL,
	"request_headers" jsonb,
	"request_body" jsonb,
	"request_params" jsonb,
	"response_status" integer NOT NULL,
	"response_headers" jsonb,
	"response_data" jsonb,
	"response_size" integer,
	"cache_key" text NOT NULL,
	"ttl" integer NOT NULL,
	"cached_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_accessed_at" timestamp DEFAULT now(),
	"access_count" integer DEFAULT 0 NOT NULL,
	"requested_by" text,
	"client_id" text,
	"is_error" boolean DEFAULT false NOT NULL,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gra_api_cache_org_hash_unique" UNIQUE("organization_id","request_hash")
);
--> statement-breakpoint
CREATE TABLE "gra_api_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"api_key" text NOT NULL,
	"api_secret" text,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"permissions" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gra_api_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"sync_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"records_processed" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_message" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gra_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"connection_name" text NOT NULL,
	"environment" text NOT NULL,
	"base_url" text NOT NULL,
	"client_id" text,
	"client_secret" text,
	"api_key" text,
	"certificate_path" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"connection_status" text DEFAULT 'disconnected' NOT NULL,
	"last_connected_at" timestamp,
	"last_connection_attempt" timestamp,
	"connection_failures" integer DEFAULT 0 NOT NULL,
	"rate_limit_per_minute" integer DEFAULT 60,
	"rate_limit_per_day" integer DEFAULT 1000,
	"current_usage_today" integer DEFAULT 0,
	"quota_reset_date" timestamp,
	"health_check_interval" integer DEFAULT 300,
	"last_health_check" timestamp,
	"health_status" text DEFAULT 'unknown',
	"health_check_failures" integer DEFAULT 0,
	"configuration" jsonb,
	"last_error" text,
	"last_error_at" timestamp,
	"error_history" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "gra_connections_org_name_unique" UNIQUE("organization_id","connection_name")
);
--> statement-breakpoint
CREATE TABLE "gra_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"filing_type" "gra_filing_type" NOT NULL,
	"tax_year" integer NOT NULL,
	"tax_period" text,
	"reference_number" text,
	"gra_reference_number" text,
	"submission_data" jsonb NOT NULL,
	"original_data" jsonb,
	"validation_results" jsonb,
	"status" "gra_submission_status" DEFAULT 'draft' NOT NULL,
	"submission_attempts" integer DEFAULT 0 NOT NULL,
	"last_submission_attempt" timestamp,
	"submitted_at" timestamp,
	"processed_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"gra_response" jsonb,
	"payment_required" boolean DEFAULT false NOT NULL,
	"payment_amount" text,
	"payment_due_date" timestamp,
	"payment_status" text,
	"payment_reference" text,
	"payment_confirmation" jsonb,
	"is_amendment" boolean DEFAULT false NOT NULL,
	"original_submission_id" text,
	"amendment_reason" text,
	"amendment_notes" text,
	"due_date" timestamp,
	"is_late" boolean DEFAULT false NOT NULL,
	"penalty_amount" text,
	"interest_amount" text,
	"penalty_waived" boolean DEFAULT false NOT NULL,
	"waiver_reason" text,
	"attached_documents" jsonb,
	"processing_notes" text,
	"internal_notes" text,
	"review_required" boolean DEFAULT false NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"submitted_by" text
);
--> statement-breakpoint
CREATE TABLE "gra_webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"submission_id" text,
	"payload" jsonb NOT NULL,
	"signature" text,
	"headers" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"processing_error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"source_ip" text,
	"user_agent" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immigration_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"case_number" text NOT NULL,
	"internal_reference" text,
	"government_file_number" text,
	"previous_case_id" text,
	"case_type" "immigration_case_type" NOT NULL,
	"sub_category" text,
	"priority" "case_priority" DEFAULT 'routine' NOT NULL,
	"status" "immigration_case_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"summary" text,
	"objectives" text,
	"primary_applicant_id" text,
	"dependent_applicants" jsonb,
	"purpose_of_application" text,
	"intended_stay_duration" text,
	"employer_information" jsonb,
	"application_date" date,
	"submission_date" date,
	"acknowledgment_date" date,
	"target_decision_date" date,
	"actual_decision_date" date,
	"visa_expiry_date" date,
	"passport_expiry_date" date,
	"processing_time" integer,
	"standard_processing_time" integer,
	"is_expedited" boolean DEFAULT false NOT NULL,
	"expedition_reason" text,
	"government_department" text,
	"processing_office" text,
	"assigned_officer" text,
	"officer_contact_info" text,
	"decision_made" boolean DEFAULT false NOT NULL,
	"decision_type" text,
	"decision_reason" text,
	"decision_notes" text,
	"conditions" jsonb,
	"is_appealable" boolean DEFAULT false NOT NULL,
	"appeal_deadline" date,
	"appeal_filed" boolean DEFAULT false NOT NULL,
	"appeal_case_id" text,
	"application_fee" text,
	"expedite_fee" text,
	"additional_fees" jsonb,
	"total_fees_paid" text,
	"currency" text DEFAULT 'GYD',
	"assigned_to" text,
	"assigned_team" text,
	"consulting_lawyer" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"internal_notes" text,
	"client_communication" text,
	"government_correspondence" text,
	"compliance_checks" jsonb,
	"monitoring_required" boolean DEFAULT false NOT NULL,
	"next_monitoring_date" date,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"risk_factors" jsonb,
	"custom_fields" jsonb,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"archived_at" timestamp,
	"archived_by" text,
	CONSTRAINT "immigration_cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "immigration_correspondence" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"correspondence_type" text NOT NULL,
	"direction" text NOT NULL,
	"subject" text NOT NULL,
	"content" text,
	"summary" text,
	"from_party" text NOT NULL,
	"to_party" text NOT NULL,
	"cc_parties" jsonb,
	"is_government_correspondence" boolean DEFAULT false,
	"government_officer" text,
	"sent_date_time" timestamp,
	"received_date_time" timestamp,
	"delivery_method" text,
	"tracking_number" text,
	"attachment_ids" jsonb,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"requires_response" boolean DEFAULT false NOT NULL,
	"response_deadline" date,
	"has_been_responded" boolean DEFAULT false NOT NULL,
	"response_id" text,
	"in_response_to_id" text,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"read_by" text,
	"read_at" timestamp,
	"processed_by" text,
	"processed_at" timestamp,
	"impact_on_case" text,
	"action_required" boolean DEFAULT false NOT NULL,
	"action_taken" text,
	"tags" jsonb,
	"is_confidential" boolean DEFAULT false NOT NULL,
	"is_client_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "immigration_document_requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"document_type" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"instructions" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_conditional" boolean DEFAULT false NOT NULL,
	"conditional_logic" text,
	"status" "document_requirement_status" DEFAULT 'required' NOT NULL,
	"submitted_document_id" text,
	"alternate_documents" jsonb,
	"verified_by" text,
	"verified_at" timestamp,
	"verification_notes" text,
	"rejection_reason" text,
	"accepted_formats" jsonb,
	"max_file_size" integer,
	"expiry_validation_required" boolean DEFAULT false,
	"minimum_validity_period" integer,
	"due_date" date,
	"submitted_at" timestamp,
	"last_request_date" date,
	"reminder_sent_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "immigration_doc_req_case_type_unique" UNIQUE("case_id","document_type")
);
--> statement-breakpoint
CREATE TABLE "immigration_interviews" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"interview_type" "interview_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"purpose" text,
	"scheduled_date_time" timestamp NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"location" text,
	"is_virtual" boolean DEFAULT false NOT NULL,
	"meeting_link" text,
	"meeting_password" text,
	"interviewer" text,
	"interviewer_title" text,
	"interviewer_contact" text,
	"attendees" jsonb,
	"required_documents" jsonb,
	"preparation_instructions" text,
	"language_support" text,
	"special_accommodations" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"actual_duration" integer,
	"outcome" text,
	"interview_notes" text,
	"interviewer_recommendation" text,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"follow_up_date" date,
	"follow_up_notes" text,
	"additional_docs_required" jsonb,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"cancellation_reason" text,
	"rescheduled_from_id" text,
	"rescheduled_to_id" text,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp,
	"confirmation_received" boolean DEFAULT false NOT NULL,
	"confirmation_received_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "immigration_timeline" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_title" text NOT NULL,
	"event_description" text,
	"previous_status" "immigration_case_status",
	"new_status" "immigration_case_status",
	"status_reason" text,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"scheduled_date" timestamp,
	"is_scheduled" boolean DEFAULT false NOT NULL,
	"is_completed" boolean DEFAULT true NOT NULL,
	"is_milestone" boolean DEFAULT false NOT NULL,
	"document_ids" jsonb,
	"related_communication" text,
	"external_reference" text,
	"performed_by" text,
	"involved_parties" jsonb,
	"impact" text,
	"next_steps" text,
	"action_required" boolean DEFAULT false NOT NULL,
	"action_due_date" date,
	"responsible_person" text,
	"government_correspondence" boolean DEFAULT false,
	"client_notified" boolean DEFAULT false NOT NULL,
	"client_notified_at" timestamp,
	"internal_note" text,
	"public_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_content_checklists" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"registration_id" text NOT NULL,
	"category" "local_content_category" NOT NULL,
	"item_code" text NOT NULL,
	"item_description" text NOT NULL,
	"requirement" text,
	"legal_reference" text,
	"target_value" numeric(15, 2),
	"target_percent" numeric(5, 2),
	"target_unit" text,
	"actual_value" numeric(15, 2),
	"actual_percent" numeric(5, 2),
	"is_compliant" boolean,
	"compliance_notes" text,
	"evidence_provided" boolean DEFAULT false,
	"evidence_documents" jsonb,
	"due_date" timestamp,
	"completed_date" timestamp,
	"priority" text DEFAULT 'medium',
	"is_mandatory" boolean DEFAULT true,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "local_content_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"registration_id" text NOT NULL,
	"client_id" text NOT NULL,
	"plan_number" text NOT NULL,
	"plan_title" text NOT NULL,
	"status" "lc_compliance_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"submission_deadline" timestamp,
	"submitted_date" timestamp,
	"overall_local_content_target" numeric(5, 2),
	"goods_target" numeric(5, 2),
	"services_target" numeric(5, 2),
	"employment_target" numeric(5, 2),
	"training_target" numeric(5, 2),
	"total_budget" numeric(15, 2),
	"local_budget_allocation" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"procurement_plan" jsonb,
	"employment_plan" jsonb,
	"training_plan" jsonb,
	"technology_transfer_plan" jsonb,
	"succession_plan" jsonb,
	"ministry_status" text,
	"ministry_comments" text,
	"approved_date" timestamp,
	"approved_by" text,
	"plan_document_url" text,
	"supporting_documents" jsonb,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "local_content_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"registration_type" "lc_registration_type" NOT NULL,
	"registration_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"status" "lc_compliance_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"company_name" text NOT NULL,
	"trading_name" text,
	"business_registration_number" text,
	"tin_number" text,
	"nis_number" text,
	"guyanese_ownership_percent" numeric(5, 2),
	"ownership_details" jsonb,
	"directors" jsonb,
	"shareholders" jsonb,
	"industry_category" text,
	"primary_services" jsonb,
	"operating_regions" jsonb,
	"years_in_operation" integer,
	"total_employees" integer,
	"guyanese_employees" integer,
	"local_employment_percent" numeric(5, 2),
	"local_content_certificate_number" text,
	"certificate_issue_date" timestamp,
	"certificate_expiry_date" timestamp,
	"certificate_document_url" text,
	"supporting_documents" jsonb,
	"ministry_reference_number" text,
	"assigned_officer" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "local_content_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"registration_id" text NOT NULL,
	"plan_id" text,
	"client_id" text NOT NULL,
	"report_number" text NOT NULL,
	"report_title" text NOT NULL,
	"report_period_type" "report_period_type" NOT NULL,
	"status" "lc_compliance_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"submission_deadline" timestamp,
	"submitted_date" timestamp,
	"actual_local_content_percent" numeric(5, 2),
	"goods_actual" numeric(5, 2),
	"services_actual" numeric(5, 2),
	"employment_actual" numeric(5, 2),
	"training_actual" numeric(5, 2),
	"total_expenditure" numeric(15, 2),
	"local_expenditure" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"procurement_report" jsonb,
	"employment_report" jsonb,
	"training_report" jsonb,
	"vendor_payments" jsonb,
	"employee_details" jsonb,
	"variance_analysis" jsonb,
	"correction_actions" jsonb,
	"ministry_status" text,
	"ministry_comments" text,
	"reviewed_date" timestamp,
	"reviewed_by" text,
	"compliance_score" numeric(5, 2),
	"report_document_url" text,
	"supporting_documents" jsonb,
	"evidence_documents" jsonb,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "local_content_vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"vendor_code" text NOT NULL,
	"vendor_name" text NOT NULL,
	"trading_name" text,
	"vendor_type" text NOT NULL,
	"business_registration_number" text,
	"tin_number" text,
	"local_content_certificate_number" text,
	"certificate_expiry_date" timestamp,
	"is_guyanese_owned" boolean DEFAULT false,
	"guyanese_ownership_percent" numeric(5, 2),
	"ownership_evidence" jsonb,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"region" text,
	"products_services" jsonb,
	"industries" jsonb,
	"employee_count" integer,
	"guyanese_employee_count" integer,
	"annual_capacity" text,
	"is_verified" boolean DEFAULT false,
	"verified_date" timestamp,
	"verified_by" text,
	"verification_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_approved" boolean DEFAULT false,
	"supporting_documents" jsonb,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"notification_id" text NOT NULL,
	"delivery_method" "delivery_method" NOT NULL,
	"status" text NOT NULL,
	"attempt_count" text DEFAULT '0' NOT NULL,
	"max_attempts" text DEFAULT '3' NOT NULL,
	"external_id" text,
	"provider_response" jsonb,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"enable_email_notifications" boolean DEFAULT true NOT NULL,
	"enable_in_app_notifications" boolean DEFAULT true NOT NULL,
	"enable_push_notifications" boolean DEFAULT true NOT NULL,
	"enable_sms_notifications" boolean DEFAULT false NOT NULL,
	"type_preferences" jsonb DEFAULT '{}'::jsonb,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"quiet_hours_timezone" text,
	"digest_enabled" boolean DEFAULT false NOT NULL,
	"digest_frequency" text DEFAULT 'daily',
	"digest_time" text DEFAULT '09:00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"delivery_method" "delivery_method" NOT NULL,
	"subject" text,
	"html_content" text,
	"text_content" text,
	"variables" jsonb,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" "notification_priority" DEFAULT 'normal' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"archived_at" timestamp,
	"metadata" jsonb,
	"action_url" text,
	"action_text" text,
	"related_entity_type" text,
	"related_entity_id" text,
	"scheduled_for" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "ocr_accuracy_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"processing_id" text NOT NULL,
	"ground_truth_text" text,
	"ground_truth_data" jsonb,
	"text_accuracy" integer,
	"word_accuracy" integer,
	"field_accuracy" jsonb,
	"structural_accuracy" integer,
	"common_errors" jsonb,
	"corrections_made" jsonb,
	"validated_by" text,
	"validation_method" text,
	"validation_confidence" integer,
	"used_for_training" boolean DEFAULT false NOT NULL,
	"training_weight" integer DEFAULT 1 NOT NULL,
	"feedback_incorporated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"validated_at" timestamp,
	CONSTRAINT "ocr_accuracy_processing_unique" UNIQUE("processing_id")
);
--> statement-breakpoint
CREATE TABLE "ocr_engine_configurations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"engine_name" text NOT NULL,
	"engine_version" text,
	"configuration_name" text NOT NULL,
	"description" text,
	"engine_config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"average_processing_time" integer,
	"average_accuracy" integer,
	"average_confidence" integer,
	"cost_per_page" integer,
	"daily_quota" integer,
	"monthly_quota" integer,
	"current_daily_usage" integer DEFAULT 0 NOT NULL,
	"current_monthly_usage" integer DEFAULT 0 NOT NULL,
	"quota_reset_date" timestamp,
	"error_rate" integer,
	"last_error" text,
	"last_error_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"last_used_at" timestamp,
	CONSTRAINT "ocr_engines_org_name_unique" UNIQUE("organization_id","configuration_name")
);
--> statement-breakpoint
CREATE TABLE "ocr_extraction_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"template_name" text NOT NULL,
	"description" text,
	"document_type" "ocr_document_type" NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"extraction_rules" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_rate" integer,
	"average_confidence" integer,
	"last_used_at" timestamp,
	"training_data_count" integer DEFAULT 0 NOT NULL,
	"last_trained_at" timestamp,
	"model_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "ocr_templates_org_name_version_unique" UNIQUE("organization_id","template_name","version")
);
--> statement-breakpoint
CREATE TABLE "ocr_processing_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text,
	"document_id" text NOT NULL,
	"original_file_name" text NOT NULL,
	"document_type" "ocr_document_type" NOT NULL,
	"file_size" integer NOT NULL,
	"file_format" text NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"processing_engine" text DEFAULT 'tesseract' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"enable_structured_extraction" boolean DEFAULT true NOT NULL,
	"extraction_template_id" text,
	"status" "ocr_processing_status" DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"processing_attempts" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_attempt_at" timestamp,
	"estimated_processing_time" integer,
	"extracted_text" text,
	"structured_data" jsonb,
	"overall_confidence" integer,
	"confidence_level" "ocr_confidence_level",
	"quality_score" integer,
	"quality" "ocr_quality",
	"page_results" jsonb,
	"error_message" text,
	"error_code" text,
	"error_details" jsonb,
	"debug_info" jsonb,
	"requires_review" boolean DEFAULT false NOT NULL,
	"review_reason" text,
	"review_assigned_to" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"review_approved" boolean,
	"processing_cost" integer,
	"engine_usage" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"processed_by" text
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"category" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"data_type" text NOT NULL,
	"display_name" text,
	"description" text,
	"is_required" boolean DEFAULT false,
	"is_encrypted" boolean DEFAULT false,
	"validation_rules" jsonb,
	"environment" text DEFAULT 'production',
	"feature_flag" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "organization_settings_org_category_key_unique" UNIQUE("organization_id","category","key")
);
--> statement-breakpoint
CREATE TABLE "organization_users" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"title" text,
	"department" text,
	"permissions" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"invite_token" text,
	"invite_expires_at" timestamp,
	"invited_by" text,
	"joined_at" timestamp,
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "organization_users_org_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"slug" text NOT NULL,
	"gra_tin_number" text,
	"nis_employer_number" text,
	"company_registration_number" text,
	"business_sector" "business_sector",
	"entity_type" text,
	"established_date" timestamp,
	"fiscal_year_end" text,
	"primary_email" text,
	"secondary_email" text,
	"phone_number" text,
	"fax_number" text,
	"street_address" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"country" text DEFAULT 'Guyana' NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'basic' NOT NULL,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"billing_email" text,
	"payment_terms" integer DEFAULT 30,
	"max_users" integer DEFAULT 5 NOT NULL,
	"max_clients" integer DEFAULT 100 NOT NULL,
	"max_storage_gb" integer DEFAULT 10 NOT NULL,
	"features" jsonb,
	"gra_integration_enabled" boolean DEFAULT false,
	"gra_api_credentials" jsonb,
	"logo_url" text,
	"primary_color" text,
	"secondary_color" text,
	"custom_domain" text,
	"data_retention_years" integer DEFAULT 7 NOT NULL,
	"encryption_enabled" boolean DEFAULT true NOT NULL,
	"two_factor_required" boolean DEFAULT false NOT NULL,
	"ip_whitelist" jsonb,
	"status" "organization_status" DEFAULT 'pending_setup' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'America/Guyana' NOT NULL,
	"locale" text DEFAULT 'en-GY' NOT NULL,
	"currency" text DEFAULT 'GYD' NOT NULL,
	"owner_id" text NOT NULL,
	"parent_organization_id" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	"deleted_at" timestamp,
	"deleted_by" text,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_gra_tin_number_unique" UNIQUE("gra_tin_number"),
	CONSTRAINT "organizations_nis_employer_number_unique" UNIQUE("nis_employer_number"),
	CONSTRAINT "organizations_company_registration_number_unique" UNIQUE("company_registration_number")
);
--> statement-breakpoint
CREATE TABLE "partner_agreements" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"partner_id" text NOT NULL,
	"agreement_number" text NOT NULL,
	"agreement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"renewal_date" timestamp,
	"auto_renewal" boolean DEFAULT false,
	"status" text DEFAULT 'draft',
	"terms_and_conditions" text,
	"commission_terms" text,
	"exclusivity_terms" text,
	"termination_terms" text,
	"confidentiality_terms" text,
	"our_signatory" text,
	"our_signature_date" timestamp,
	"partner_signatory" text,
	"partner_signature_date" timestamp,
	"document_url" text,
	"signed_document_url" text,
	"attachments" jsonb,
	"last_review_date" timestamp,
	"next_review_date" timestamp,
	"review_notes" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "partner_communications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"partner_id" text NOT NULL,
	"referral_id" text,
	"communication_type" text NOT NULL,
	"direction" text NOT NULL,
	"subject" text,
	"content" text,
	"our_contact_id" text,
	"partner_contact_name" text,
	"partner_contact_email" text,
	"scheduled_at" timestamp,
	"duration" integer,
	"meeting_location" text,
	"requires_follow_up" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_completed" boolean DEFAULT false,
	"attachments" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"referral_number" text NOT NULL,
	"status" "referral_status" DEFAULT 'PENDING' NOT NULL,
	"referring_partner_id" text NOT NULL,
	"receiving_partner_id" text NOT NULL,
	"client_id" text,
	"client_name" text,
	"client_contact" text,
	"service_category" text NOT NULL,
	"service_description" text,
	"requirements" text,
	"urgency" text DEFAULT 'normal',
	"deadline" timestamp,
	"estimated_value" numeric(15, 2),
	"actual_value" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"commission_percent" numeric(5, 2),
	"commission_amount" numeric(15, 2),
	"commission_paid" boolean DEFAULT false,
	"commission_paid_date" timestamp,
	"referral_date" timestamp DEFAULT now() NOT NULL,
	"accepted_date" timestamp,
	"completed_date" timestamp,
	"outcome" text,
	"successful_conversion" boolean,
	"referrer_feedback" text,
	"referrer_rating" integer,
	"receiver_feedback" text,
	"receiver_rating" integer,
	"client_feedback" text,
	"client_rating" integer,
	"communication_log" jsonb,
	"documents" jsonb,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "partner_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"partner_id" text NOT NULL,
	"referral_id" text,
	"reviewer_type" text NOT NULL,
	"reviewer_name" text,
	"reviewer_user_id" text,
	"reviewer_client_id" text,
	"overall_rating" integer NOT NULL,
	"service_quality_rating" integer,
	"communication_rating" integer,
	"timelines_rating" integer,
	"value_rating" integer,
	"title" text,
	"review" text,
	"pros" text,
	"cons" text,
	"is_public" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"partner_response" text,
	"response_date" timestamp,
	"status" text DEFAULT 'pending',
	"moderated_by" text,
	"moderated_date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"partner_code" text NOT NULL,
	"partner_type" "partner_type" NOT NULL,
	"status" "partner_status" DEFAULT 'PROSPECT' NOT NULL,
	"tier" "partnership_tier" DEFAULT 'BASIC' NOT NULL,
	"company_name" text NOT NULL,
	"trading_name" text,
	"business_registration_number" text,
	"tin_number" text,
	"year_established" integer,
	"primary_contact_name" text NOT NULL,
	"primary_contact_title" text,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone" text,
	"additional_contacts" jsonb,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"region" text,
	"country" text DEFAULT 'Guyana',
	"postal_code" text,
	"general_email" text,
	"general_phone" text,
	"fax" text,
	"website" text,
	"linkedin" text,
	"facebook" text,
	"instagram" text,
	"services_offered" jsonb,
	"specializations" jsonb,
	"industries_served" jsonb,
	"geographic_coverage" jsonb,
	"licenses" jsonb,
	"certifications" jsonb,
	"professional_bodies" jsonb,
	"insurance_coverage" jsonb,
	"partner_since" timestamp,
	"agreement_date" timestamp,
	"agreement_expiry_date" timestamp,
	"agreement_document_url" text,
	"referral_commission_percent" numeric(5, 2),
	"accepts_referrals" boolean DEFAULT true,
	"referral_categories" jsonb,
	"total_referrals_sent" integer DEFAULT 0,
	"total_referrals_received" integer DEFAULT 0,
	"total_referral_value" numeric(15, 2) DEFAULT '0',
	"average_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"verified_date" timestamp,
	"verified_by" text,
	"logo_url" text,
	"description" text,
	"tagline" text,
	"is_featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"internal_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"department" varchar(100),
	"position" varchar(100),
	"salary" numeric(15, 2) DEFAULT '0',
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"start_date" timestamp,
	"tin_number" varchar(20),
	"nis_number" varchar(20),
	"bank_account" text,
	"emergency_contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"period" varchar(20) NOT NULL,
	"pay_period_start" timestamp NOT NULL,
	"pay_period_end" timestamp NOT NULL,
	"pay_date" timestamp,
	"status" "payroll_run_status" DEFAULT 'draft' NOT NULL,
	"employee_count" integer DEFAULT 0,
	"total_gross" numeric(15, 2) DEFAULT '0',
	"total_net" numeric(15, 2) DEFAULT '0',
	"total_tax" numeric(15, 2) DEFAULT '0',
	"total_nis" numeric(15, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"processed_by" text
);
--> statement-breakpoint
CREATE TABLE "leases" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"property_id" text NOT NULL,
	"unit_id" text,
	"tenant_id" text NOT NULL,
	"lease_number" text NOT NULL,
	"status" "lease_status" DEFAULT 'DRAFT' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"renewal_date" timestamp,
	"move_in_date" timestamp,
	"move_out_date" timestamp,
	"monthly_rent" numeric(15, 2) NOT NULL,
	"security_deposit" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"payment_due_day" integer DEFAULT 1 NOT NULL,
	"grace_period_days" integer DEFAULT 5,
	"late_fee_amount" numeric(15, 2),
	"late_fee_percent" numeric(5, 2),
	"rent_escalation_percent" numeric(5, 2),
	"next_escalation_date" timestamp,
	"utilities_included" jsonb,
	"parking_included" boolean DEFAULT false,
	"pets_allowed" boolean DEFAULT false,
	"terms" text,
	"special_conditions" text,
	"lease_document_url" text,
	"signed_document_url" text,
	"signed_date" timestamp,
	"previous_lease_id" text,
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"property_id" text NOT NULL,
	"unit_id" text,
	"tenant_id" text,
	"lease_id" text,
	"request_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"priority" "maintenance_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "maintenance_status" DEFAULT 'REPORTED' NOT NULL,
	"location" text,
	"access_instructions" text,
	"assigned_to_id" text,
	"assigned_vendor" text,
	"vendor_contact" text,
	"reported_date" timestamp DEFAULT now() NOT NULL,
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"estimated_cost" numeric(15, 2),
	"actual_cost" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"charge_to_tenant" boolean DEFAULT false,
	"images" jsonb,
	"attachments" jsonb,
	"resolution" text,
	"tenant_feedback" text,
	"tenant_rating" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reported_by" text
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"owner_id" text,
	"property_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"property_type" "property_type" NOT NULL,
	"status" "property_status" DEFAULT 'AVAILABLE' NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"region" text,
	"country" text DEFAULT 'Guyana' NOT NULL,
	"postal_code" text,
	"gps_coordinates" jsonb,
	"total_area" numeric(15, 2),
	"usable_area" numeric(15, 2),
	"area_unit" text DEFAULT 'sq_ft',
	"bedrooms" integer,
	"bathrooms" integer,
	"floors" integer,
	"year_built" integer,
	"purchase_price" numeric(15, 2),
	"current_value" numeric(15, 2),
	"monthly_rent" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"amenities" jsonb,
	"features" jsonb,
	"images" jsonb,
	"title_deed_number" text,
	"transport_number" text,
	"manager_id" text,
	"management_fee_percent" numeric(5, 2),
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "property_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"property_id" text NOT NULL,
	"unit_id" text,
	"lease_id" text,
	"inspection_type" text NOT NULL,
	"inspection_number" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"inspector_id" text NOT NULL,
	"tenant_present" boolean DEFAULT false,
	"overall_condition" text,
	"checklist" jsonb,
	"findings" jsonb,
	"images" jsonb,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_notes" text,
	"inspector_signature" text,
	"tenant_signature" text,
	"report_url" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_units" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"unit_number" text NOT NULL,
	"unit_name" text,
	"floor" integer,
	"status" "property_status" DEFAULT 'AVAILABLE' NOT NULL,
	"area" numeric(15, 2),
	"area_unit" text DEFAULT 'sq_ft',
	"bedrooms" integer,
	"bathrooms" integer,
	"monthly_rent" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"amenities" jsonb,
	"features" jsonb,
	"images" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rent_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"lease_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"payment_number" text NOT NULL,
	"status" "rent_payment_status" DEFAULT 'PENDING' NOT NULL,
	"rent_amount" numeric(15, 2) NOT NULL,
	"late_fee" numeric(15, 2) DEFAULT '0',
	"other_charges" numeric(15, 2) DEFAULT '0',
	"total_amount" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) DEFAULT '0',
	"balance" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"payment_method" text,
	"payment_reference" text,
	"receipt_number" text,
	"receipt_url" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_by" text
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text,
	"tenant_code" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"alternate_phone" text,
	"id_type" text,
	"id_number" text,
	"tin" text,
	"employer" text,
	"employer_address" text,
	"job_title" text,
	"monthly_income" numeric(15, 2),
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"rating" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "job_execution_history" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"job_id" text NOT NULL,
	"job_name" text NOT NULL,
	"job_type" text NOT NULL,
	"queue_type" "queue_type" NOT NULL,
	"execution_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"worker_id" text,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"execution_time" integer,
	"queue_wait_time" integer,
	"status" "job_status" NOT NULL,
	"result" jsonb,
	"error_message" text,
	"error_type" text,
	"resource_usage" jsonb,
	"execution_context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"job_name" text NOT NULL,
	"job_type" text NOT NULL,
	"queue_type" "queue_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"options" jsonb,
	"priority" "job_priority" DEFAULT 'normal' NOT NULL,
	"scheduled_for" timestamp,
	"delayed_until" timestamp,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"processing_started" timestamp,
	"processing_completed" timestamp,
	"processing_time" integer,
	"worker_id" text,
	"worker_pid" integer,
	"worker_hostname" text,
	"attempt_number" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp,
	"next_retry_at" timestamp,
	"result" jsonb,
	"error_message" text,
	"error_stack" text,
	"error_details" jsonb,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"progress_message" text,
	"progress_data" jsonb,
	"parent_job_id" text,
	"child_job_ids" jsonb,
	"dependency_job_ids" jsonb,
	"workflow_id" text,
	"resource_usage" jsonb,
	"created_by" text,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_configurations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"queue_name" text NOT NULL,
	"queue_type" "queue_type" NOT NULL,
	"description" text,
	"max_concurrency" integer DEFAULT 5 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"default_timeout" integer DEFAULT 300000 NOT NULL,
	"retry_backoff_strategy" text DEFAULT 'exponential' NOT NULL,
	"fifo_mode" boolean DEFAULT false NOT NULL,
	"deduplicate" boolean DEFAULT false NOT NULL,
	"deduplication_key" text,
	"rate_limit_enabled" boolean DEFAULT false NOT NULL,
	"max_jobs_per_minute" integer,
	"max_jobs_per_hour" integer,
	"max_jobs_per_day" integer,
	"dead_letter_queue_enabled" boolean DEFAULT true NOT NULL,
	"dead_letter_after_attempts" integer DEFAULT 5 NOT NULL,
	"alerting_enabled" boolean DEFAULT true NOT NULL,
	"alert_rules" jsonb,
	"auto_scaling_enabled" boolean DEFAULT false NOT NULL,
	"min_workers" integer DEFAULT 1 NOT NULL,
	"max_workers" integer DEFAULT 10 NOT NULL,
	"scale_up_threshold" integer DEFAULT 80 NOT NULL,
	"scale_down_threshold" integer DEFAULT 20 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"paused_reason" text,
	"paused_at" timestamp,
	"total_jobs_processed" integer DEFAULT 0 NOT NULL,
	"total_jobs_failed" integer DEFAULT 0 NOT NULL,
	"average_processing_time" integer,
	"last_processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	CONSTRAINT "queue_configs_org_name_unique" UNIQUE("organization_id","queue_name")
);
--> statement-breakpoint
CREATE TABLE "queue_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"metric_date" timestamp NOT NULL,
	"queue_type" "queue_type" NOT NULL,
	"aggregation_period" text NOT NULL,
	"jobs_queued" integer DEFAULT 0 NOT NULL,
	"jobs_processed" integer DEFAULT 0 NOT NULL,
	"jobs_succeeded" integer DEFAULT 0 NOT NULL,
	"jobs_failed" integer DEFAULT 0 NOT NULL,
	"jobs_cancelled" integer DEFAULT 0 NOT NULL,
	"avg_queue_wait_time" integer,
	"avg_processing_time" integer,
	"max_processing_time" integer,
	"min_processing_time" integer,
	"p95_processing_time" integer,
	"p99_processing_time" integer,
	"avg_queue_depth" integer,
	"max_queue_depth" integer,
	"error_rate" integer,
	"timeout_rate" integer,
	"retry_rate" integer,
	"avg_cpu_usage" integer,
	"avg_memory_usage" integer,
	"total_resource_cost" integer,
	"avg_workers_active" integer,
	"max_workers_active" integer,
	"worker_efficiency" integer,
	"jobs_per_minute" integer,
	"jobs_per_hour" integer,
	"unique_job_types" integer,
	"unique_workers" integer,
	"sample_size" integer NOT NULL,
	"data_completeness" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "queue_metrics_date_type_period_unique" UNIQUE("metric_date","queue_type","aggregation_period")
);
--> statement-breakpoint
CREATE TABLE "queue_workers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"worker_id" text NOT NULL,
	"worker_name" text,
	"hostname" text NOT NULL,
	"pid" integer NOT NULL,
	"queue_types" jsonb NOT NULL,
	"max_concurrency" integer DEFAULT 5 NOT NULL,
	"current_jobs" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"last_heartbeat" timestamp NOT NULL,
	"health_score" integer DEFAULT 100 NOT NULL,
	"jobs_processed" integer DEFAULT 0 NOT NULL,
	"jobs_succeeded" integer DEFAULT 0 NOT NULL,
	"jobs_failed" integer DEFAULT 0 NOT NULL,
	"total_processing_time" integer DEFAULT 0 NOT NULL,
	"average_job_time" integer,
	"cpu_usage" integer,
	"memory_usage" integer,
	"disk_usage" integer,
	"worker_config" jsonb,
	"last_error" text,
	"last_error_at" timestamp,
	"consecutive_errors" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp NOT NULL,
	"stopped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "queue_workers_worker_id_unique" UNIQUE("worker_id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"permission_id" text NOT NULL,
	"group_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "permission_group_memberships_permission_group_unique" UNIQUE("permission_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_system_group" boolean DEFAULT false NOT NULL,
	"sort_order" text DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "permission_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"resource" "resource_type" NOT NULL,
	"action" "action_type" NOT NULL,
	"scope" "permission_scope" DEFAULT 'global' NOT NULL,
	"is_system_permission" boolean DEFAULT false NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"is_sensitive" boolean DEFAULT false NOT NULL,
	"conditions" text,
	"constraints" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name"),
	CONSTRAINT "permissions_resource_action_scope_unique" UNIQUE("resource","action","scope")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"is_granted" boolean DEFAULT true NOT NULL,
	"is_inherited" boolean DEFAULT false NOT NULL,
	"is_denied" boolean DEFAULT false NOT NULL,
	"conditions" text,
	"constraints" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "role_permissions_role_permission_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"parent_role_id" text,
	"level" text DEFAULT '0' NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"is_custom_role" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"max_users" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"is_granted" boolean DEFAULT true NOT NULL,
	"is_denied" boolean DEFAULT false NOT NULL,
	"overrides_role" boolean DEFAULT false NOT NULL,
	"reason" text NOT NULL,
	"conditions" text,
	"constraints" text,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"assigned_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_permissions_user_permission_unique" UNIQUE("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_temporary" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"assigned_by" text NOT NULL,
	"assignment_reason" text,
	"approved_by" text,
	"approved_at" timestamp,
	"approval_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_role_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"query" text NOT NULL,
	"filters" jsonb,
	"sort_by" text DEFAULT 'relevance',
	"sort_order" text DEFAULT 'desc',
	"entity_types" "search_entity_type"[],
	"date_range" jsonb,
	"last_used_at" timestamp,
	"use_count" text DEFAULT '0',
	"is_shared" boolean DEFAULT false NOT NULL,
	"shared_with" text[],
	"enable_alerts" boolean DEFAULT false NOT NULL,
	"alert_frequency" text DEFAULT 'daily',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text DEFAULT 'day' NOT NULL,
	"total_searches" text DEFAULT '0',
	"unique_users" text DEFAULT '0',
	"successful_searches" text DEFAULT '0',
	"avg_response_time" text DEFAULT '0',
	"avg_result_count" text DEFAULT '0',
	"top_queries" jsonb,
	"top_entity_types" jsonb,
	"top_filters" jsonb,
	"slow_queries" jsonb,
	"failed_queries" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text,
	"query" text NOT NULL,
	"filters" jsonb,
	"entity_types" "search_entity_type"[],
	"result_count" text DEFAULT '0',
	"clicked_results" text[],
	"time_to_first_click" text,
	"search_duration" text,
	"source" text DEFAULT 'web',
	"user_agent" text,
	"ip_address" text,
	"was_successful" boolean,
	"refinement_count" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_index" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" "search_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[],
	"searchable_text" text NOT NULL,
	"metadata" jsonb,
	"visibility" text DEFAULT 'private' NOT NULL,
	"owner_id" text,
	"team_ids" text[],
	"file_type" text,
	"file_size" text,
	"language" text DEFAULT 'en',
	"relevance_score" text DEFAULT '0',
	"last_accessed_at" timestamp,
	"access_count" text DEFAULT '0',
	"is_indexed" boolean DEFAULT false NOT NULL,
	"indexed_at" timestamp,
	"last_modified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"category" text,
	"display_text" text NOT NULL,
	"frequency" text DEFAULT '1',
	"success_rate" text DEFAULT '0',
	"last_used_at" timestamp,
	"entity_type" "search_entity_type",
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_communication_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"project_id" text,
	"communication_type" text NOT NULL,
	"direction" text NOT NULL,
	"subject" text,
	"content" text,
	"staff_user_id" text,
	"client_contact_name" text,
	"client_contact_email" text,
	"scheduled_at" timestamp,
	"duration" integer,
	"requires_follow_up" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_completed" boolean DEFAULT false,
	"attachment_ids" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"service_catalog_id" text NOT NULL,
	"project_number" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_entity" "business_entity" NOT NULL,
	"status" "project_status" DEFAULT 'DRAFT' NOT NULL,
	"priority" text DEFAULT 'medium',
	"start_date" timestamp,
	"target_end_date" timestamp,
	"actual_end_date" timestamp,
	"agreed_price" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"discount_percent" numeric(5, 2),
	"discount_reason" text,
	"progress_percent" integer DEFAULT 0,
	"current_milestone_id" text,
	"lead_consultant_id" text,
	"team_member_ids" jsonb,
	"related_document_ids" jsonb,
	"parent_project_id" text,
	"linked_project_ids" jsonb,
	"internal_notes" text,
	"client_visible_notes" text,
	"total_billed" numeric(15, 2) DEFAULT '0',
	"total_paid" numeric(15, 2) DEFAULT '0',
	"billing_status" text DEFAULT 'pending',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"status" "milestone_status" DEFAULT 'PENDING' NOT NULL,
	"start_date" timestamp,
	"due_date" timestamp,
	"completed_date" timestamp,
	"required_documents" jsonb,
	"required_approvals" jsonb,
	"depends_on_milestones" jsonb,
	"assigned_to_id" text,
	"notes" text,
	"client_visible_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"full_description" text,
	"business_entity" "business_entity" NOT NULL,
	"category" "service_category" NOT NULL,
	"subcategory" text,
	"fee_structure" "fee_structure_type" DEFAULT 'FIXED' NOT NULL,
	"base_price" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"min_price" numeric(15, 2),
	"max_price" numeric(15, 2),
	"estimated_duration_days" integer,
	"estimated_hours" numeric(10, 2),
	"required_documents" jsonb,
	"prerequisites" jsonb,
	"eligibility_criteria" jsonb,
	"default_workflow_id" text,
	"milestone_templates" jsonb,
	"gra_integration" boolean DEFAULT false,
	"nis_integration" boolean DEFAULT false,
	"immigration_integration" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"icon_name" text,
	"color_code" text,
	"is_featured" boolean DEFAULT false,
	"is_popular" boolean DEFAULT false,
	"status" "service_offering_status" DEFAULT 'ACTIVE' NOT NULL,
	"tags" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "service_document_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_entity" "business_entity" NOT NULL,
	"category" "service_category" NOT NULL,
	"template_type" text NOT NULL,
	"template_content" text,
	"template_file_url" text,
	"variable_definitions" jsonb,
	"applicable_services" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_latest" boolean DEFAULT true NOT NULL,
	"status" "service_offering_status" DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "service_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_entity" "business_entity" NOT NULL,
	"included_service_ids" jsonb NOT NULL,
	"package_price" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'GYD' NOT NULL,
	"savings_percent" numeric(5, 2),
	"valid_from" timestamp,
	"valid_until" timestamp,
	"display_order" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"status" "service_offering_status" DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text,
	"milestone_id" text,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"hours" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"is_billable" boolean DEFAULT true NOT NULL,
	"hourly_rate" numeric(10, 2),
	"total_amount" numeric(15, 2),
	"is_billed" boolean DEFAULT false NOT NULL,
	"invoice_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nis_calculations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"contribution_year" integer NOT NULL,
	"contribution_month" integer,
	"pay_period" text,
	"nis_class" "nis_class" NOT NULL,
	"total_earnings" numeric(15, 2) NOT NULL,
	"insutable_earnings" numeric(15, 2) NOT NULL,
	"contribution_rate" numeric(5, 4),
	"employee_contribution" numeric(15, 2) NOT NULL,
	"employer_contribution" numeric(15, 2) NOT NULL,
	"total_contribution" numeric(15, 2) NOT NULL,
	"previously_paid" numeric(15, 2) DEFAULT '0',
	"contribution_due" numeric(15, 2) NOT NULL,
	"status" "calculation_status" DEFAULT 'draft' NOT NULL,
	"submission_date" date,
	"payment_date" date,
	"due_date" date NOT NULL,
	"employee_count" integer,
	"notes" text,
	"calculation_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "paye_calculations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"tax_year" integer NOT NULL,
	"tax_month" integer,
	"pay_period" text,
	"frequency" "paye_frequency" NOT NULL,
	"employee_count" integer NOT NULL,
	"total_gross_pay" numeric(15, 2) NOT NULL,
	"total_taxable_income" numeric(15, 2) NOT NULL,
	"personal_allowances" numeric(15, 2) DEFAULT '0',
	"pension_contributions" numeric(15, 2) DEFAULT '0',
	"other_deductions" numeric(15, 2) DEFAULT '0',
	"taxable_amount" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 4),
	"tax_calculated" numeric(15, 2) NOT NULL,
	"previously_paid" numeric(15, 2) DEFAULT '0',
	"tax_due" numeric(15, 2) NOT NULL,
	"status" "calculation_status" DEFAULT 'draft' NOT NULL,
	"submission_date" date,
	"payment_date" date,
	"due_date" date NOT NULL,
	"notes" text,
	"calculation_details" text,
	"amendments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"tax_type" "tax_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rate" numeric(5, 4) NOT NULL,
	"min_income" numeric(15, 2),
	"max_income" numeric(15, 2),
	"fixed_amount" numeric(15, 2),
	"effective_from" date NOT NULL,
	"effective_to" date,
	"tax_year" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"country" text DEFAULT 'Guyana' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "vat_calculations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"tax_year" integer NOT NULL,
	"tax_quarter" integer,
	"tax_month" integer,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_sales" numeric(15, 2) NOT NULL,
	"standard_rated_sales" numeric(15, 2) DEFAULT '0',
	"zero_rated_sales" numeric(15, 2) DEFAULT '0',
	"exempt_sales" numeric(15, 2) DEFAULT '0',
	"output_vat" numeric(15, 2) NOT NULL,
	"total_purchases" numeric(15, 2) NOT NULL,
	"standard_rated_purchases" numeric(15, 2) DEFAULT '0',
	"zero_rated_purchases" numeric(15, 2) DEFAULT '0',
	"exempt_purchases" numeric(15, 2) DEFAULT '0',
	"input_vat" numeric(15, 2) NOT NULL,
	"net_vat" numeric(15, 2) NOT NULL,
	"vat_rate" numeric(5, 4) DEFAULT '0.14',
	"adjustments" numeric(15, 2) DEFAULT '0',
	"penalties_interest" numeric(15, 2) DEFAULT '0',
	"total_vat_due" numeric(15, 2) NOT NULL,
	"status" "calculation_status" DEFAULT 'draft' NOT NULL,
	"submission_date" date,
	"payment_date" date,
	"due_date" date NOT NULL,
	"vat_registration_number" text,
	"return_type" text DEFAULT 'standard' NOT NULL,
	"notes" text,
	"calculation_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "training_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"registration_id" text NOT NULL,
	"course_id" text NOT NULL,
	"session_id" text NOT NULL,
	"certificate_number" text NOT NULL,
	"status" "certificate_status" DEFAULT 'PENDING' NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_email" text,
	"recipient_organization" text,
	"course_title" text NOT NULL,
	"completion_date" timestamp NOT NULL,
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"final_score" numeric(5, 2),
	"grade" text,
	"cpd_points" integer,
	"hours_completed" numeric(10, 2),
	"instructor_name" text,
	"instructor_signature" text,
	"authorized_signatory" text,
	"authorized_signature" text,
	"certificate_url" text,
	"verification_url" text,
	"verification_code" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"issued_by" text
);
--> statement-breakpoint
CREATE TABLE "training_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"course_code" text NOT NULL,
	"title" text NOT NULL,
	"short_description" text,
	"full_description" text,
	"category" "training_category" NOT NULL,
	"status" "course_status" DEFAULT 'DRAFT' NOT NULL,
	"delivery_mode" "delivery_mode" NOT NULL,
	"duration_hours" numeric(10, 2),
	"duration_days" integer,
	"max_participants" integer,
	"min_participants" integer,
	"learning_objectives" jsonb,
	"target_audience" text,
	"prerequisites" text,
	"skills_gained" jsonb,
	"price" numeric(15, 2),
	"early_bird_price" numeric(15, 2),
	"group_discount_percent" numeric(5, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"syllabus" jsonb,
	"materials" jsonb,
	"resources" jsonb,
	"assessment_methods" jsonb,
	"certificate_awarded" boolean DEFAULT true,
	"certificate_template" text,
	"certificate_validity_months" integer,
	"cpd_points" integer,
	"default_instructor_id" text,
	"instructor_requirements" text,
	"thumbnail_url" text,
	"featured_image" text,
	"is_public" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"tags" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "training_instructors" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"title" text,
	"biography" text,
	"specializations" jsonb,
	"qualifications" jsonb,
	"certifications" jsonb,
	"years_experience" integer,
	"teaching_categories" jsonb,
	"profile_image_url" text,
	"linkedin_url" text,
	"hourly_rate" numeric(15, 2),
	"daily_rate" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"availability_notes" text,
	"total_sessions_taught" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_external" boolean DEFAULT false,
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "training_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"session_id" text NOT NULL,
	"client_id" text,
	"registration_number" text NOT NULL,
	"status" "registration_status" DEFAULT 'PENDING' NOT NULL,
	"participant_name" text NOT NULL,
	"participant_email" text NOT NULL,
	"participant_phone" text,
	"participant_organization" text,
	"participant_title" text,
	"dietary_requirements" text,
	"accessibility_requirements" text,
	"special_requests" text,
	"amount_due" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) DEFAULT '0',
	"discount_applied" numeric(15, 2) DEFAULT '0',
	"discount_reason" text,
	"currency" text DEFAULT 'GYD' NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"payment_reference" text,
	"invoice_number" text,
	"attendance_status" text,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"attendance_percentage" numeric(5, 2),
	"assessment_score" numeric(5, 2),
	"assessment_passed" boolean,
	"assessment_notes" text,
	"certificate_issued" boolean DEFAULT false,
	"certificate_id" text,
	"certificate_issued_date" timestamp,
	"feedback_provided" boolean DEFAULT false,
	"feedback_rating" integer,
	"feedback_comments" text,
	"group_booking_id" text,
	"is_group_leader" boolean DEFAULT false,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"registered_by" text
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"course_id" text NOT NULL,
	"session_code" text NOT NULL,
	"title" text,
	"status" "course_status" DEFAULT 'SCHEDULED' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"start_time" text,
	"end_time" text,
	"timezone" text DEFAULT 'America/Guyana' NOT NULL,
	"schedule_notes" text,
	"delivery_mode" "delivery_mode" NOT NULL,
	"venue_name" text,
	"venue_address" text,
	"room_number" text,
	"virtual_meeting_url" text,
	"virtual_platform" text,
	"meeting_id" text,
	"meeting_password" text,
	"max_participants" integer,
	"min_participants" integer,
	"current_enrollment" integer DEFAULT 0,
	"waitlist_count" integer DEFAULT 0,
	"registration_opens" timestamp,
	"registration_closes" timestamp,
	"early_bird_deadline" timestamp,
	"is_registration_open" boolean DEFAULT true,
	"price_override" numeric(15, 2),
	"currency" text DEFAULT 'GYD' NOT NULL,
	"instructor_id" text,
	"co_instructor_ids" jsonb,
	"session_materials" jsonb,
	"recording_url" text,
	"internal_notes" text,
	"public_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'read_only' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"permissions" text,
	"department" text,
	"phone_number" text,
	"last_login_at" timestamp,
	"password_changed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_parent_metric_id_analytics_metrics_id_fk" FOREIGN KEY ("parent_metric_id") REFERENCES "public"."analytics_metrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_template_id_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_documents" ADD CONSTRAINT "appointment_documents_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_documents" ADD CONSTRAINT "appointment_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_audit_log" ADD CONSTRAINT "backup_audit_log_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_audit_log" ADD CONSTRAINT "backup_audit_log_restore_operation_id_restore_operations_id_fk" FOREIGN KEY ("restore_operation_id") REFERENCES "public"."restore_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_audit_log" ADD CONSTRAINT "backup_audit_log_schedule_id_backup_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."backup_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_audit_log" ADD CONSTRAINT "backup_audit_log_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_encryption_keys" ADD CONSTRAINT "backup_encryption_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_schedules" ADD CONSTRAINT "backup_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_table_details" ADD CONSTRAINT "backup_table_details_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_schedule_id_backup_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."backup_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restore_operations" ADD CONSTRAINT "restore_operations_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restore_operations" ADD CONSTRAINT "restore_operations_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restore_operations" ADD CONSTRAINT "restore_operations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restore_table_details" ADD CONSTRAINT "restore_table_details_restore_operation_id_restore_operations_id_fk" FOREIGN KEY ("restore_operation_id") REFERENCES "public"."restore_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings_backup" ADD CONSTRAINT "system_settings_backup_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_staff_id_user_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_service" ADD CONSTRAINT "client_service_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_service" ADD CONSTRAINT "client_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_service" ADD CONSTRAINT "client_service_assigned_staff_id_user_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_service" ADD CONSTRAINT "client_service_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_alert" ADD CONSTRAINT "compliance_alert_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_alert" ADD CONSTRAINT "compliance_alert_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_item" ADD CONSTRAINT "compliance_item_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_item" ADD CONSTRAINT "compliance_item_last_updated_by_user_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folder" ADD CONSTRAINT "document_folder_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folder" ADD CONSTRAINT "document_folder_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submission" ADD CONSTRAINT "gra_submission_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submission" ADD CONSTRAINT "gra_submission_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_job" ADD CONSTRAINT "ocr_processing_job_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_job" ADD CONSTRAINT "ocr_processing_job_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_job" ADD CONSTRAINT "ocr_processing_job_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_job" ADD CONSTRAINT "ocr_processing_job_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_result" ADD CONSTRAINT "ocr_result_processing_id_ocr_processing_job_id_fk" FOREIGN KEY ("processing_id") REFERENCES "public"."ocr_processing_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_result" ADD CONSTRAINT "ocr_result_validated_by_user_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_record" ADD CONSTRAINT "payroll_record_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_record" ADD CONSTRAINT "payroll_record_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculation" ADD CONSTRAINT "tax_calculation_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculation" ADD CONSTRAINT "tax_calculation_calculated_by_user_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_calculation" ADD CONSTRAINT "tax_calculation_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_accountant_users_id_fk" FOREIGN KEY ("assigned_accountant") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_manager_users_id_fk" FOREIGN KEY ("assigned_manager") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status" ADD CONSTRAINT "immigration_status_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status" ADD CONSTRAINT "immigration_status_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status" ADD CONSTRAINT "immigration_status_assigned_officer_users_id_fk" FOREIGN KEY ("assigned_officer") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status" ADD CONSTRAINT "immigration_status_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status" ADD CONSTRAINT "immigration_status_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status_history" ADD CONSTRAINT "immigration_status_history_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_status_history" ADD CONSTRAINT "immigration_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_requirement_id_compliance_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."compliance_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_prepared_by_users_id_fk" FOREIGN KEY ("prepared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reminders" ADD CONSTRAINT "compliance_reminders_filing_id_compliance_filings_id_fk" FOREIGN KEY ("filing_id") REFERENCES "public"."compliance_filings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ocr_results" ADD CONSTRAINT "document_ocr_results_document_id_enhanced_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."enhanced_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ocr_results" ADD CONSTRAINT "document_ocr_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ocr_results" ADD CONSTRAINT "document_ocr_results_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ocr_results" ADD CONSTRAINT "document_ocr_results_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_document_id_enhanced_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."enhanced_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_escalated_to_users_id_fk" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_parent_document_id_enhanced_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."enhanced_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_superseded_by_enhanced_documents_id_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."enhanced_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_documents" ADD CONSTRAINT "enhanced_documents_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_share_id_document_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."document_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_by_user_id_users_id_fk" FOREIGN KEY ("shared_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_compliance_filing_id_compliance_filings_id_fk" FOREIGN KEY ("compliance_filing_id") REFERENCES "public"."compliance_filings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_document_id_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_pattern_matches" ADD CONSTRAINT "audit_pattern_matches_pattern_id_audit_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."audit_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_pattern_matches" ADD CONSTRAINT "audit_pattern_matches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_pattern_matches" ADD CONSTRAINT "audit_pattern_matches_investigated_by_users_id_fk" FOREIGN KEY ("investigated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_pattern_matches" ADD CONSTRAINT "audit_pattern_matches_follow_up_assigned_to_users_id_fk" FOREIGN KEY ("follow_up_assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_patterns" ADD CONSTRAINT "audit_patterns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_patterns" ADD CONSTRAINT "audit_patterns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_patterns" ADD CONSTRAINT "audit_patterns_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_retention_policies" ADD CONSTRAINT "audit_retention_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_retention_policies" ADD CONSTRAINT "audit_retention_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_retention_policies" ADD CONSTRAINT "audit_retention_policies_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_impersonated_by_users_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_rule_id_alert_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_parent_alert_id_active_alerts_id_fk" FOREIGN KEY ("parent_alert_id") REFERENCES "public"."active_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_alerts" ADD CONSTRAINT "active_alerts_suppressed_by_active_alerts_id_fk" FOREIGN KEY ("suppressed_by") REFERENCES "public"."active_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_planning" ADD CONSTRAINT "capacity_planning_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_baselines" ADD CONSTRAINT "performance_baselines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_parent_event_id_security_events_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."security_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_monitoring" ADD CONSTRAINT "system_monitoring_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_contacts" ADD CONSTRAINT "agency_contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_contacts" ADD CONSTRAINT "agency_contacts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_activities" ADD CONSTRAINT "expediting_activities_request_id_expediting_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."expediting_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_activities" ADD CONSTRAINT "expediting_activities_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_queue" ADD CONSTRAINT "expediting_queue_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_queue" ADD CONSTRAINT "expediting_queue_expeditor_id_users_id_fk" FOREIGN KEY ("expeditor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_requests" ADD CONSTRAINT "expediting_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_requests" ADD CONSTRAINT "expediting_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_requests" ADD CONSTRAINT "expediting_requests_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediting_requests" ADD CONSTRAINT "expediting_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_api_cache" ADD CONSTRAINT "gra_api_cache_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_api_cache" ADD CONSTRAINT "gra_api_cache_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_api_cache" ADD CONSTRAINT "gra_api_cache_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_api_credential" ADD CONSTRAINT "gra_api_credential_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_api_credential" ADD CONSTRAINT "gra_api_credential_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_api_sync" ADD CONSTRAINT "gra_api_sync_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_connections" ADD CONSTRAINT "gra_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_connections" ADD CONSTRAINT "gra_connections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_connections" ADD CONSTRAINT "gra_connections_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_original_submission_id_gra_submissions_id_fk" FOREIGN KEY ("original_submission_id") REFERENCES "public"."gra_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_submissions" ADD CONSTRAINT "gra_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_webhooks" ADD CONSTRAINT "gra_webhooks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gra_webhooks" ADD CONSTRAINT "gra_webhooks_submission_id_gra_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."gra_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_primary_applicant_id_clients_id_fk" FOREIGN KEY ("primary_applicant_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_cases" ADD CONSTRAINT "immigration_cases_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_correspondence" ADD CONSTRAINT "immigration_correspondence_case_id_immigration_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."immigration_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_correspondence" ADD CONSTRAINT "immigration_correspondence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_correspondence" ADD CONSTRAINT "immigration_correspondence_read_by_users_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_correspondence" ADD CONSTRAINT "immigration_correspondence_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_correspondence" ADD CONSTRAINT "immigration_correspondence_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_correspondence" ADD CONSTRAINT "immigration_correspondence_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_document_requirements" ADD CONSTRAINT "immigration_document_requirements_case_id_immigration_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."immigration_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_document_requirements" ADD CONSTRAINT "immigration_document_requirements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_document_requirements" ADD CONSTRAINT "immigration_document_requirements_submitted_document_id_enhanced_documents_id_fk" FOREIGN KEY ("submitted_document_id") REFERENCES "public"."enhanced_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_document_requirements" ADD CONSTRAINT "immigration_document_requirements_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_document_requirements" ADD CONSTRAINT "immigration_document_requirements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_document_requirements" ADD CONSTRAINT "immigration_document_requirements_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_interviews" ADD CONSTRAINT "immigration_interviews_case_id_immigration_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."immigration_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_interviews" ADD CONSTRAINT "immigration_interviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_interviews" ADD CONSTRAINT "immigration_interviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_interviews" ADD CONSTRAINT "immigration_interviews_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_timeline" ADD CONSTRAINT "immigration_timeline_case_id_immigration_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."immigration_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_timeline" ADD CONSTRAINT "immigration_timeline_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_timeline" ADD CONSTRAINT "immigration_timeline_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_timeline" ADD CONSTRAINT "immigration_timeline_responsible_person_users_id_fk" FOREIGN KEY ("responsible_person") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immigration_timeline" ADD CONSTRAINT "immigration_timeline_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_checklists" ADD CONSTRAINT "local_content_checklists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_checklists" ADD CONSTRAINT "local_content_checklists_registration_id_local_content_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."local_content_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_checklists" ADD CONSTRAINT "local_content_checklists_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_plans" ADD CONSTRAINT "local_content_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_plans" ADD CONSTRAINT "local_content_plans_registration_id_local_content_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."local_content_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_plans" ADD CONSTRAINT "local_content_plans_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_plans" ADD CONSTRAINT "local_content_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_registrations" ADD CONSTRAINT "local_content_registrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_registrations" ADD CONSTRAINT "local_content_registrations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_registrations" ADD CONSTRAINT "local_content_registrations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_reports" ADD CONSTRAINT "local_content_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_reports" ADD CONSTRAINT "local_content_reports_registration_id_local_content_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."local_content_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_reports" ADD CONSTRAINT "local_content_reports_plan_id_local_content_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."local_content_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_reports" ADD CONSTRAINT "local_content_reports_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_reports" ADD CONSTRAINT "local_content_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_vendors" ADD CONSTRAINT "local_content_vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_content_vendors" ADD CONSTRAINT "local_content_vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_accuracy_tracking" ADD CONSTRAINT "ocr_accuracy_tracking_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_accuracy_tracking" ADD CONSTRAINT "ocr_accuracy_tracking_processing_id_ocr_processing_queue_id_fk" FOREIGN KEY ("processing_id") REFERENCES "public"."ocr_processing_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_accuracy_tracking" ADD CONSTRAINT "ocr_accuracy_tracking_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_engine_configurations" ADD CONSTRAINT "ocr_engine_configurations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_engine_configurations" ADD CONSTRAINT "ocr_engine_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_engine_configurations" ADD CONSTRAINT "ocr_engine_configurations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_extraction_templates" ADD CONSTRAINT "ocr_extraction_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_extraction_templates" ADD CONSTRAINT "ocr_extraction_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_extraction_templates" ADD CONSTRAINT "ocr_extraction_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_queue" ADD CONSTRAINT "ocr_processing_queue_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_queue" ADD CONSTRAINT "ocr_processing_queue_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_queue" ADD CONSTRAINT "ocr_processing_queue_review_assigned_to_users_id_fk" FOREIGN KEY ("review_assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_queue" ADD CONSTRAINT "ocr_processing_queue_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocr_processing_queue" ADD CONSTRAINT "ocr_processing_queue_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_organization_id_organizations_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_communications" ADD CONSTRAINT "partner_communications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_communications" ADD CONSTRAINT "partner_communications_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_communications" ADD CONSTRAINT "partner_communications_referral_id_partner_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."partner_referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_communications" ADD CONSTRAINT "partner_communications_our_contact_id_users_id_fk" FOREIGN KEY ("our_contact_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_referring_partner_id_partners_id_fk" FOREIGN KEY ("referring_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_receiving_partner_id_partners_id_fk" FOREIGN KEY ("receiving_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_referral_id_partner_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."partner_referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reviews" ADD CONSTRAINT "partner_reviews_reviewer_client_id_clients_id_fk" FOREIGN KEY ("reviewer_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_unit_id_property_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."property_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_unit_id_property_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."property_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_clients_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_unit_id_property_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."property_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_units" ADD CONSTRAINT "property_units_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_execution_history" ADD CONSTRAINT "job_execution_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_execution_history" ADD CONSTRAINT "job_execution_history_job_id_job_queue_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_queue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_parent_job_id_job_queue_id_fk" FOREIGN KEY ("parent_job_id") REFERENCES "public"."job_queue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_configurations" ADD CONSTRAINT "queue_configurations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_configurations" ADD CONSTRAINT "queue_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_configurations" ADD CONSTRAINT "queue_configurations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_metrics" ADD CONSTRAINT "queue_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_workers" ADD CONSTRAINT "queue_workers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_memberships" ADD CONSTRAINT "permission_group_memberships_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_memberships" ADD CONSTRAINT "permission_group_memberships_group_id_permission_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_memberships" ADD CONSTRAINT "permission_group_memberships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_role_id_roles_id_fk" FOREIGN KEY ("parent_role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_index" ADD CONSTRAINT "search_index_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_communication_log" ADD CONSTRAINT "client_communication_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_communication_log" ADD CONSTRAINT "client_communication_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_communication_log" ADD CONSTRAINT "client_communication_log_project_id_client_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."client_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_communication_log" ADD CONSTRAINT "client_communication_log_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_service_catalog_id_service_catalog_id_fk" FOREIGN KEY ("service_catalog_id") REFERENCES "public"."service_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_lead_consultant_id_users_id_fk" FOREIGN KEY ("lead_consultant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_client_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."client_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_catalog" ADD CONSTRAINT "service_catalog_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_document_templates" ADD CONSTRAINT "service_document_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_document_templates" ADD CONSTRAINT "service_document_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_client_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."client_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_milestone_id_project_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nis_calculations" ADD CONSTRAINT "nis_calculations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nis_calculations" ADD CONSTRAINT "nis_calculations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nis_calculations" ADD CONSTRAINT "nis_calculations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nis_calculations" ADD CONSTRAINT "nis_calculations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paye_calculations" ADD CONSTRAINT "paye_calculations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paye_calculations" ADD CONSTRAINT "paye_calculations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paye_calculations" ADD CONSTRAINT "paye_calculations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paye_calculations" ADD CONSTRAINT "paye_calculations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vat_calculations" ADD CONSTRAINT "vat_calculations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vat_calculations" ADD CONSTRAINT "vat_calculations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vat_calculations" ADD CONSTRAINT "vat_calculations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vat_calculations" ADD CONSTRAINT "vat_calculations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_registration_id_training_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."training_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_default_instructor_id_users_id_fk" FOREIGN KEY ("default_instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_registrations" ADD CONSTRAINT "training_registrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_registrations" ADD CONSTRAINT "training_registrations_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_registrations" ADD CONSTRAINT "training_registrations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_registrations" ADD CONSTRAINT "training_registrations_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboards_org_id_idx" ON "analytics_dashboards" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "dashboards_category_idx" ON "analytics_dashboards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "dashboards_is_public_idx" ON "analytics_dashboards" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "dashboards_last_viewed_idx" ON "analytics_dashboards" USING btree ("last_viewed_at");--> statement-breakpoint
CREATE INDEX "analytics_metrics_org_id_idx" ON "analytics_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "analytics_metrics_name_idx" ON "analytics_metrics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "analytics_metrics_type_idx" ON "analytics_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "analytics_metrics_category_idx" ON "analytics_metrics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "analytics_metrics_period_idx" ON "analytics_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "analytics_metrics_parent_idx" ON "analytics_metrics" USING btree ("parent_metric_id");--> statement-breakpoint
CREATE INDEX "analytics_metrics_hierarchy_idx" ON "analytics_metrics" USING btree ("hierarchy_level");--> statement-breakpoint
CREATE INDEX "generated_reports_org_id_idx" ON "generated_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "generated_reports_client_id_idx" ON "generated_reports" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "generated_reports_template_id_idx" ON "generated_reports" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "generated_reports_type_idx" ON "generated_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "generated_reports_status_idx" ON "generated_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "generated_reports_scheduled_for_idx" ON "generated_reports" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "generated_reports_completed_at_idx" ON "generated_reports" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "generated_reports_share_token_idx" ON "generated_reports" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "generated_reports_cache_key_idx" ON "generated_reports" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "generated_reports_generated_by_idx" ON "generated_reports" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "report_schedules_org_id_idx" ON "report_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "report_schedules_template_id_idx" ON "report_schedules" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "report_schedules_frequency_idx" ON "report_schedules" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "report_schedules_is_active_idx" ON "report_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "report_schedules_next_run_at_idx" ON "report_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "report_schedules_last_run_at_idx" ON "report_schedules" USING btree ("last_run_at");--> statement-breakpoint
CREATE INDEX "report_templates_org_id_idx" ON "report_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "report_templates_type_idx" ON "report_templates" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "report_templates_category_idx" ON "report_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "report_templates_is_active_idx" ON "report_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "report_templates_is_public_idx" ON "report_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "report_templates_last_used_idx" ON "report_templates" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "appointment_documents_appointment_id_idx" ON "appointment_documents" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "appointment_documents_document_type_idx" ON "appointment_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "appointment_documents_uploaded_by_idx" ON "appointment_documents" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "appointments_client_id_idx" ON "appointments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "appointments_service_id_idx" ON "appointments" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "appointments_assigned_to_idx" ON "appointments" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_priority_idx" ON "appointments" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "appointments_appointment_number_idx" ON "appointments" USING btree ("appointment_number");--> statement-breakpoint
CREATE INDEX "appointments_payment_status_idx" ON "appointments" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "appointments_follow_up_date_idx" ON "appointments" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "services_department_idx" ON "services" USING btree ("department");--> statement-breakpoint
CREATE INDEX "services_service_type_idx" ON "services" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "services_is_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "services_created_by_idx" ON "services" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_client_id_idx" ON "audit_logs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "audit_logs_success_idx" ON "audit_logs" USING btree ("success");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_ip_address_idx" ON "audit_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "audit_logs_correlation_id_idx" ON "audit_logs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "audit_logs_is_archived_idx" ON "audit_logs" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "audit_logs_session_id_idx" ON "audit_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_attempts_user_id_idx" ON "login_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_address_idx" ON "login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "login_attempts_success_idx" ON "login_attempts" USING btree ("success");--> statement-breakpoint
CREATE INDEX "login_attempts_created_at_idx" ON "login_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_is_suspicious_idx" ON "login_attempts" USING btree ("is_suspicious");--> statement-breakpoint
CREATE INDEX "login_attempts_blocked_until_idx" ON "login_attempts" USING btree ("blocked_until");--> statement-breakpoint
CREATE INDEX "system_events_event_type_idx" ON "system_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "system_events_status_idx" ON "system_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "system_events_severity_idx" ON "system_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "system_events_created_at_idx" ON "system_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_events_related_user_id_idx" ON "system_events" USING btree ("related_user_id");--> statement-breakpoint
CREATE INDEX "system_events_environment_idx" ON "system_events" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "backup_audit_log_backup_idx" ON "backup_audit_log" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "backup_audit_log_restore_idx" ON "backup_audit_log" USING btree ("restore_operation_id");--> statement-breakpoint
CREATE INDEX "backup_audit_log_action_idx" ON "backup_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "backup_audit_log_created_at_idx" ON "backup_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "backup_encryption_keys_active_idx" ON "backup_encryption_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "backup_encryption_keys_default_idx" ON "backup_encryption_keys" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "backup_schedules_enabled_idx" ON "backup_schedules" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "backup_schedules_next_run_idx" ON "backup_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "backup_schedules_type_idx" ON "backup_schedules" USING btree ("backup_type");--> statement-breakpoint
CREATE INDEX "backup_table_details_backup_idx" ON "backup_table_details" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "backup_table_details_table_idx" ON "backup_table_details" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "backups_schedule_idx" ON "backups" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "backups_status_idx" ON "backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "backups_type_idx" ON "backups" USING btree ("backup_type");--> statement-breakpoint
CREATE INDEX "backups_created_at_idx" ON "backups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "backups_expires_at_idx" ON "backups" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "backups_parent_idx" ON "backups" USING btree ("parent_backup_id");--> statement-breakpoint
CREATE INDEX "backups_storage_idx" ON "backups" USING btree ("storage_location");--> statement-breakpoint
CREATE INDEX "restore_operations_backup_idx" ON "restore_operations" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "restore_operations_status_idx" ON "restore_operations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "restore_operations_created_at_idx" ON "restore_operations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "restore_operations_initiated_by_idx" ON "restore_operations" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "restore_table_details_operation_idx" ON "restore_table_details" USING btree ("restore_operation_id");--> statement-breakpoint
CREATE INDEX "restore_table_details_table_idx" ON "restore_table_details" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "system_settings_backup_backup_idx" ON "system_settings_backup" USING btree ("backup_id");--> statement-breakpoint
CREATE INDEX "system_settings_backup_category_idx" ON "system_settings_backup" USING btree ("category");--> statement-breakpoint
CREATE INDEX "appointment_client_idx" ON "appointment" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "appointment_staff_idx" ON "appointment" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "appointment_date_idx" ON "appointment" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "appointment_status_idx" ON "appointment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_entity","target_id");--> statement-breakpoint
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "client_service_client_idx" ON "client_service" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_service_service_idx" ON "client_service" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "client_service_staff_idx" ON "client_service" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "client_service_status_idx" ON "client_service" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_alert_client_idx" ON "compliance_alert" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "compliance_alert_type_idx" ON "compliance_alert" USING btree ("type");--> statement-breakpoint
CREATE INDEX "compliance_alert_severity_idx" ON "compliance_alert" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "compliance_alert_status_idx" ON "compliance_alert" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_alert_due_date_idx" ON "compliance_alert" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "compliance_item_client_idx" ON "compliance_item" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "compliance_item_category_idx" ON "compliance_item" USING btree ("category");--> statement-breakpoint
CREATE INDEX "compliance_item_due_date_idx" ON "compliance_item" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "compliance_item_status_idx" ON "compliance_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_client_idx" ON "document" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "document_folder_idx" ON "document" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "document_type_idx" ON "document" USING btree ("type");--> statement-breakpoint
CREATE INDEX "document_status_idx" ON "document" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_confidential_idx" ON "document" USING btree ("is_confidential");--> statement-breakpoint
CREATE INDEX "document_expiry_idx" ON "document" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "document_reference_idx" ON "document" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "document_uploaded_at_idx" ON "document" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "document_folder_client_idx" ON "document_folder" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "document_folder_parent_idx" ON "document_folder" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "document_folder_path_idx" ON "document_folder" USING btree ("path");--> statement-breakpoint
CREATE INDEX "document_folder_name_idx" ON "document_folder" USING btree ("name");--> statement-breakpoint
CREATE INDEX "gra_submission_client_idx" ON "gra_submission" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "gra_submission_form_type_idx" ON "gra_submission" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX "gra_submission_period_idx" ON "gra_submission" USING btree ("period");--> statement-breakpoint
CREATE INDEX "gra_submission_status_idx" ON "gra_submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gra_submission_gra_ref_idx" ON "gra_submission" USING btree ("gra_reference");--> statement-breakpoint
CREATE INDEX "invoice_client_idx" ON "invoice" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "invoice_organization_idx" ON "invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_number_idx" ON "invoice" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_issue_date_idx" ON "invoice" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "invoice_due_date_idx" ON "invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "ocr_job_document_idx" ON "ocr_processing_job" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "ocr_job_client_idx" ON "ocr_processing_job" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ocr_job_batch_idx" ON "ocr_processing_job" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "ocr_job_status_idx" ON "ocr_processing_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ocr_job_priority_idx" ON "ocr_processing_job" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "ocr_job_created_idx" ON "ocr_processing_job" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ocr_result_processing_idx" ON "ocr_result" USING btree ("processing_id");--> statement-breakpoint
CREATE INDEX "ocr_result_confidence_idx" ON "ocr_result" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "payroll_record_client_idx" ON "payroll_record" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payroll_record_employee_idx" ON "payroll_record" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_record_period_idx" ON "payroll_record" USING btree ("period");--> statement-breakpoint
CREATE INDEX "payroll_record_payment_status_idx" ON "payroll_record" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "service_category_idx" ON "service" USING btree ("category");--> statement-breakpoint
CREATE INDEX "service_active_idx" ON "service" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tax_calculation_client_idx" ON "tax_calculation" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "tax_calculation_type_idx" ON "tax_calculation" USING btree ("tax_type");--> statement-breakpoint
CREATE INDEX "tax_calculation_calc_type_idx" ON "tax_calculation" USING btree ("calculation_type");--> statement-breakpoint
CREATE INDEX "tax_calculation_period_idx" ON "tax_calculation" USING btree ("calculation_period");--> statement-breakpoint
CREATE INDEX "tax_calculation_period2_idx" ON "tax_calculation" USING btree ("period");--> statement-breakpoint
CREATE INDEX "tax_calculation_submitted_idx" ON "tax_calculation" USING btree ("is_submitted");--> statement-breakpoint
CREATE INDEX "user_profile_role_idx" ON "user_profile" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_profile_department_idx" ON "user_profile" USING btree ("department");--> statement-breakpoint
CREATE INDEX "client_contacts_organization_id_idx" ON "client_contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "client_contacts_client_id_idx" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_contacts_email_idx" ON "client_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_contacts_is_primary_idx" ON "client_contacts" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "client_services_organization_id_idx" ON "client_services" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "client_services_client_id_idx" ON "client_services" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_services_service_type_idx" ON "client_services" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "client_services_assigned_to_idx" ON "client_services" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "client_services_is_active_idx" ON "client_services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "clients_organization_id_idx" ON "clients" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clients_client_number_idx" ON "clients" USING btree ("client_number");--> statement-breakpoint
CREATE INDEX "clients_entity_type_idx" ON "clients" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clients_compliance_status_idx" ON "clients" USING btree ("compliance_status");--> statement-breakpoint
CREATE INDEX "clients_risk_level_idx" ON "clients" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "clients_assigned_accountant_idx" ON "clients" USING btree ("assigned_accountant");--> statement-breakpoint
CREATE INDEX "clients_assigned_manager_idx" ON "clients" USING btree ("assigned_manager");--> statement-breakpoint
CREATE INDEX "clients_created_by_idx" ON "clients" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "clients_tin_number_idx" ON "clients" USING btree ("tin_number");--> statement-breakpoint
CREATE INDEX "clients_nis_number_idx" ON "clients" USING btree ("nis_number");--> statement-breakpoint
CREATE INDEX "clients_business_name_idx" ON "clients" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "clients_first_name_idx" ON "clients" USING btree ("first_name");--> statement-breakpoint
CREATE INDEX "clients_last_name_idx" ON "clients" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX "clients_local_content_qualified_idx" ON "clients" USING btree ("is_local_content_qualified");--> statement-breakpoint
CREATE INDEX "clients_org_status_idx" ON "clients" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "clients_org_entity_type_idx" ON "clients" USING btree ("organization_id","entity_type");--> statement-breakpoint
CREATE INDEX "clients_status_compliance_idx" ON "clients" USING btree ("status","compliance_status");--> statement-breakpoint
CREATE INDEX "clients_entity_local_content_idx" ON "clients" USING btree ("entity_type","is_local_content_qualified");--> statement-breakpoint
CREATE INDEX "immigration_status_organization_id_idx" ON "immigration_status" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "immigration_status_client_id_idx" ON "immigration_status" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "immigration_status_current_status_idx" ON "immigration_status" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "immigration_status_visa_type_idx" ON "immigration_status" USING btree ("visa_type");--> statement-breakpoint
CREATE INDEX "immigration_status_expiry_date_idx" ON "immigration_status" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "immigration_status_assigned_officer_idx" ON "immigration_status" USING btree ("assigned_officer");--> statement-breakpoint
CREATE INDEX "immigration_status_history_client_id_idx" ON "immigration_status_history" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "immigration_status_history_changed_at_idx" ON "immigration_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "compliance_filings_requirement_id_idx" ON "compliance_filings" USING btree ("requirement_id");--> statement-breakpoint
CREATE INDEX "compliance_filings_client_id_idx" ON "compliance_filings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "compliance_filings_status_idx" ON "compliance_filings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_filings_due_date_idx" ON "compliance_filings" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "compliance_filings_assigned_to_idx" ON "compliance_filings" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "compliance_filings_period_idx" ON "compliance_filings" USING btree ("filing_period");--> statement-breakpoint
CREATE INDEX "compliance_filings_reference_number_idx" ON "compliance_filings" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "compliance_reminders_filing_id_idx" ON "compliance_reminders" USING btree ("filing_id");--> statement-breakpoint
CREATE INDEX "compliance_reminders_date_idx" ON "compliance_reminders" USING btree ("reminder_date");--> statement-breakpoint
CREATE INDEX "compliance_reminders_status_idx" ON "compliance_reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_requirements_client_id_idx" ON "compliance_requirements" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "compliance_requirements_type_idx" ON "compliance_requirements" USING btree ("compliance_type");--> statement-breakpoint
CREATE INDEX "compliance_requirements_due_date_idx" ON "compliance_requirements" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "compliance_requirements_assigned_to_idx" ON "compliance_requirements" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "compliance_requirements_priority_idx" ON "compliance_requirements" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "compliance_requirements_status_idx" ON "compliance_requirements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "document_ocr_results_document_id_idx" ON "document_ocr_results" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_ocr_results_org_id_idx" ON "document_ocr_results" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_ocr_results_status_idx" ON "document_ocr_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_ocr_results_provider_idx" ON "document_ocr_results" USING btree ("ocr_provider");--> statement-breakpoint
CREATE INDEX "document_ocr_results_confidence_idx" ON "document_ocr_results" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "document_ocr_results_document_class_idx" ON "document_ocr_results" USING btree ("document_class");--> statement-breakpoint
CREATE INDEX "document_ocr_results_verification_idx" ON "document_ocr_results" USING btree ("is_human_verified");--> statement-breakpoint
CREATE INDEX "document_ocr_results_created_at_idx" ON "document_ocr_results" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "document_ocr_results_processing_completed_idx" ON "document_ocr_results" USING btree ("processing_completed");--> statement-breakpoint
CREATE INDEX "document_templates_org_id_idx" ON "document_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_templates_category_idx" ON "document_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "document_templates_document_type_idx" ON "document_templates" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "document_templates_gra_form_code_idx" ON "document_templates" USING btree ("gra_form_code");--> statement-breakpoint
CREATE INDEX "document_templates_is_active_idx" ON "document_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "document_templates_is_public_idx" ON "document_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "document_workflows_document_id_idx" ON "document_workflows" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_workflows_org_id_idx" ON "document_workflows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_workflows_current_stage_idx" ON "document_workflows" USING btree ("current_stage");--> statement-breakpoint
CREATE INDEX "document_workflows_status_idx" ON "document_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_workflows_assigned_to_idx" ON "document_workflows" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "document_workflows_due_date_idx" ON "document_workflows" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "document_workflows_created_at_idx" ON "document_workflows" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enhanced_documents_org_id_idx" ON "enhanced_documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "enhanced_documents_client_id_idx" ON "enhanced_documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "enhanced_documents_type_idx" ON "enhanced_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "enhanced_documents_business_context_idx" ON "enhanced_documents" USING btree ("business_context");--> statement-breakpoint
CREATE INDEX "enhanced_documents_document_date_idx" ON "enhanced_documents" USING btree ("document_date");--> statement-breakpoint
CREATE INDEX "enhanced_documents_fiscal_year_idx" ON "enhanced_documents" USING btree ("fiscal_year");--> statement-breakpoint
CREATE INDEX "enhanced_documents_tax_year_idx" ON "enhanced_documents" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX "enhanced_documents_storage_tier_idx" ON "enhanced_documents" USING btree ("storage_tier");--> statement-breakpoint
CREATE INDEX "enhanced_documents_processing_status_idx" ON "enhanced_documents" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "enhanced_documents_assigned_to_idx" ON "enhanced_documents" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "enhanced_documents_parent_id_idx" ON "enhanced_documents" USING btree ("parent_document_id");--> statement-breakpoint
CREATE INDEX "enhanced_documents_checksum_idx" ON "enhanced_documents" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "enhanced_documents_status_idx" ON "enhanced_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enhanced_documents_created_at_idx" ON "enhanced_documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enhanced_documents_deleted_at_idx" ON "enhanced_documents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "document_access_logs_document_id_idx" ON "document_access_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_access_logs_user_id_idx" ON "document_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "document_access_logs_action_idx" ON "document_access_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "document_access_logs_created_at_idx" ON "document_access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "document_access_logs_success_idx" ON "document_access_logs" USING btree ("success");--> statement-breakpoint
CREATE INDEX "document_shares_document_id_idx" ON "document_shares" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_shares_shared_with_user_idx" ON "document_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "document_shares_shared_by_user_idx" ON "document_shares" USING btree ("shared_by_user_id");--> statement-breakpoint
CREATE INDEX "document_shares_share_token_idx" ON "document_shares" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "document_shares_expires_at_idx" ON "document_shares" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "documents_client_id_idx" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "documents_filing_id_idx" ON "documents" USING btree ("compliance_filing_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_access_level_idx" ON "documents" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX "documents_created_by_idx" ON "documents" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "documents_document_date_idx" ON "documents" USING btree ("document_date");--> statement-breakpoint
CREATE INDEX "documents_fiscal_period_idx" ON "documents" USING btree ("fiscal_period");--> statement-breakpoint
CREATE INDEX "documents_parent_id_idx" ON "documents" USING btree ("parent_document_id");--> statement-breakpoint
CREATE INDEX "documents_storage_path_idx" ON "documents" USING btree ("storage_path");--> statement-breakpoint
CREATE INDEX "documents_expiry_date_idx" ON "documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_pattern_id_idx" ON "audit_pattern_matches" USING btree ("pattern_id");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_org_id_idx" ON "audit_pattern_matches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_alert_triggered_idx" ON "audit_pattern_matches" USING btree ("alert_triggered");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_response_status_idx" ON "audit_pattern_matches" USING btree ("response_status");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_risk_level_idx" ON "audit_pattern_matches" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_investigated_by_idx" ON "audit_pattern_matches" USING btree ("investigated_by");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_follow_up_required_idx" ON "audit_pattern_matches" USING btree ("follow_up_required");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_created_at_idx" ON "audit_pattern_matches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_pattern_matches_resolved_at_idx" ON "audit_pattern_matches" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "audit_patterns_org_id_idx" ON "audit_patterns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_patterns_pattern_type_idx" ON "audit_patterns" USING btree ("pattern_type");--> statement-breakpoint
CREATE INDEX "audit_patterns_is_active_idx" ON "audit_patterns" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "audit_patterns_alert_enabled_idx" ON "audit_patterns" USING btree ("alert_enabled");--> statement-breakpoint
CREATE INDEX "audit_patterns_last_match_at_idx" ON "audit_patterns" USING btree ("last_match_at");--> statement-breakpoint
CREATE INDEX "audit_retention_policies_org_id_idx" ON "audit_retention_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_retention_policies_compliance_framework_idx" ON "audit_retention_policies" USING btree ("compliance_framework");--> statement-breakpoint
CREATE INDEX "audit_retention_policies_is_active_idx" ON "audit_retention_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "audit_retention_policies_next_execution_idx" ON "audit_retention_policies" USING btree ("next_execution");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_org_id_idx" ON "enhanced_audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_user_id_idx" ON "enhanced_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_client_id_idx" ON "enhanced_audit_logs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_action_idx" ON "enhanced_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_entity_idx" ON "enhanced_audit_logs" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_entity_id_idx" ON "enhanced_audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_event_id_idx" ON "enhanced_audit_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_correlation_id_idx" ON "enhanced_audit_logs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_parent_event_id_idx" ON "enhanced_audit_logs" USING btree ("parent_event_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_risk_level_idx" ON "enhanced_audit_logs" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_sensitive_data_idx" ON "enhanced_audit_logs" USING btree ("sensitive_data_accessed");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_business_process_idx" ON "enhanced_audit_logs" USING btree ("business_process");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_success_idx" ON "enhanced_audit_logs" USING btree ("success");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_ip_address_idx" ON "enhanced_audit_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_session_id_idx" ON "enhanced_audit_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_created_at_idx" ON "enhanced_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_occurred_at_idx" ON "enhanced_audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_alert_triggered_idx" ON "enhanced_audit_logs" USING btree ("alert_triggered");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_requires_review_idx" ON "enhanced_audit_logs" USING btree ("requires_review");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_legal_hold_idx" ON "enhanced_audit_logs" USING btree ("legal_hold");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_is_archived_idx" ON "enhanced_audit_logs" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_org_action_idx" ON "enhanced_audit_logs" USING btree ("organization_id","action");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_org_entity_idx" ON "enhanced_audit_logs" USING btree ("organization_id","entity");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_user_action_idx" ON "enhanced_audit_logs" USING btree ("user_id","action");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_risk_alert_idx" ON "enhanced_audit_logs" USING btree ("risk_level","alert_triggered");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_time_range_idx" ON "enhanced_audit_logs" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "enhanced_audit_logs_entity_action_time_idx" ON "enhanced_audit_logs" USING btree ("entity","action","occurred_at");--> statement-breakpoint
CREATE INDEX "active_alerts_org_id_idx" ON "active_alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "active_alerts_rule_id_idx" ON "active_alerts" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "active_alerts_severity_idx" ON "active_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "active_alerts_status_idx" ON "active_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "active_alerts_trigger_timestamp_idx" ON "active_alerts" USING btree ("trigger_timestamp");--> statement-breakpoint
CREATE INDEX "active_alerts_assigned_to_idx" ON "active_alerts" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "active_alerts_correlation_key_idx" ON "active_alerts" USING btree ("correlation_key");--> statement-breakpoint
CREATE INDEX "active_alerts_parent_alert_idx" ON "active_alerts" USING btree ("parent_alert_id");--> statement-breakpoint
CREATE INDEX "alert_rules_org_id_idx" ON "alert_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alert_rules_category_idx" ON "alert_rules" USING btree ("category");--> statement-breakpoint
CREATE INDEX "alert_rules_is_active_idx" ON "alert_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "alert_rules_last_evaluated_idx" ON "alert_rules" USING btree ("last_evaluated");--> statement-breakpoint
CREATE INDEX "capacity_planning_org_id_idx" ON "capacity_planning" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "capacity_planning_resource_type_idx" ON "capacity_planning" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "capacity_planning_resource_id_idx" ON "capacity_planning" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "capacity_planning_utilization_percentage_idx" ON "capacity_planning" USING btree ("utilization_percentage");--> statement-breakpoint
CREATE INDEX "capacity_planning_exhaustion_date_idx" ON "capacity_planning" USING btree ("estimated_exhaustion_date");--> statement-breakpoint
CREATE INDEX "capacity_planning_analysis_date_idx" ON "capacity_planning" USING btree ("analysis_date");--> statement-breakpoint
CREATE INDEX "performance_baselines_org_id_idx" ON "performance_baselines" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "performance_baselines_metric_name_idx" ON "performance_baselines" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "performance_baselines_source_idx" ON "performance_baselines" USING btree ("source");--> statement-breakpoint
CREATE INDEX "performance_baselines_time_frame_idx" ON "performance_baselines" USING btree ("time_frame");--> statement-breakpoint
CREATE INDEX "performance_baselines_last_calculated_idx" ON "performance_baselines" USING btree ("last_calculated");--> statement-breakpoint
CREATE INDEX "security_events_org_id_idx" ON "security_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "security_events_event_type_idx" ON "security_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "security_events_severity_idx" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_events_category_idx" ON "security_events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "security_events_user_id_idx" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "security_events_source_ip_idx" ON "security_events" USING btree ("source_ip");--> statement-breakpoint
CREATE INDEX "security_events_event_timestamp_idx" ON "security_events" USING btree ("event_timestamp");--> statement-breakpoint
CREATE INDEX "security_events_investigation_status_idx" ON "security_events" USING btree ("investigation_status");--> statement-breakpoint
CREATE INDEX "security_events_assigned_to_idx" ON "security_events" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "security_events_correlation_id_idx" ON "security_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "security_events_risk_score_idx" ON "security_events" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "system_monitoring_org_id_idx" ON "system_monitoring" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "system_monitoring_metric_name_idx" ON "system_monitoring" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "system_monitoring_metric_type_idx" ON "system_monitoring" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "system_monitoring_source_idx" ON "system_monitoring" USING btree ("source");--> statement-breakpoint
CREATE INDEX "system_monitoring_timestamp_idx" ON "system_monitoring" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "system_monitoring_aggregation_period_idx" ON "system_monitoring" USING btree ("aggregation_period");--> statement-breakpoint
CREATE INDEX "system_monitoring_metric_time_idx" ON "system_monitoring" USING btree ("metric_name","source","timestamp");--> statement-breakpoint
CREATE INDEX "agency_contacts_org_idx" ON "agency_contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agency_contacts_agency_idx" ON "agency_contacts" USING btree ("agency");--> statement-breakpoint
CREATE INDEX "agency_contacts_active_idx" ON "agency_contacts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "agency_contacts_city_idx" ON "agency_contacts" USING btree ("city");--> statement-breakpoint
CREATE INDEX "expediting_activities_request_idx" ON "expediting_activities" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "expediting_activities_date_idx" ON "expediting_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "expediting_activities_type_idx" ON "expediting_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "expediting_activities_performed_by_idx" ON "expediting_activities" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "expediting_queue_org_idx" ON "expediting_queue" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expediting_queue_date_idx" ON "expediting_queue" USING btree ("queue_date");--> statement-breakpoint
CREATE INDEX "expediting_queue_agency_idx" ON "expediting_queue" USING btree ("agency");--> statement-breakpoint
CREATE INDEX "expediting_queue_expeditor_idx" ON "expediting_queue" USING btree ("expeditor_id");--> statement-breakpoint
CREATE INDEX "expediting_queue_status_idx" ON "expediting_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expediting_requests_org_idx" ON "expediting_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "expediting_requests_client_idx" ON "expediting_requests" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "expediting_requests_status_idx" ON "expediting_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expediting_requests_agency_idx" ON "expediting_requests" USING btree ("agency");--> statement-breakpoint
CREATE INDEX "expediting_requests_type_idx" ON "expediting_requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "expediting_requests_number_idx" ON "expediting_requests" USING btree ("request_number");--> statement-breakpoint
CREATE INDEX "expediting_requests_assigned_idx" ON "expediting_requests" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "expediting_requests_priority_idx" ON "expediting_requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "activity_log_org_idx" ON "activity_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "activity_log_actor_idx" ON "activity_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_log_entity_idx" ON "activity_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activity_log_action_idx" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "activity_log_created_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gra_api_cache_org_id_idx" ON "gra_api_cache" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gra_api_cache_endpoint_idx" ON "gra_api_cache" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "gra_api_cache_cache_key_idx" ON "gra_api_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "gra_api_cache_expires_at_idx" ON "gra_api_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "gra_api_cache_created_at_idx" ON "gra_api_cache" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gra_api_cache_is_error_idx" ON "gra_api_cache" USING btree ("is_error");--> statement-breakpoint
CREATE INDEX "gra_api_cache_client_id_idx" ON "gra_api_cache" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "gra_api_credential_org_idx" ON "gra_api_credential" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gra_api_credential_environment_idx" ON "gra_api_credential" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "gra_api_credential_active_idx" ON "gra_api_credential" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "gra_api_sync_org_idx" ON "gra_api_sync" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gra_api_sync_type_idx" ON "gra_api_sync" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "gra_api_sync_status_idx" ON "gra_api_sync" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gra_connections_org_id_idx" ON "gra_connections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gra_connections_is_active_idx" ON "gra_connections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "gra_connections_environment_idx" ON "gra_connections" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "gra_connections_connection_status_idx" ON "gra_connections" USING btree ("connection_status");--> statement-breakpoint
CREATE INDEX "gra_connections_health_status_idx" ON "gra_connections" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "gra_connections_last_health_check_idx" ON "gra_connections" USING btree ("last_health_check");--> statement-breakpoint
CREATE INDEX "gra_submissions_org_id_idx" ON "gra_submissions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gra_submissions_client_id_idx" ON "gra_submissions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "gra_submissions_filing_type_idx" ON "gra_submissions" USING btree ("filing_type");--> statement-breakpoint
CREATE INDEX "gra_submissions_status_idx" ON "gra_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gra_submissions_tax_year_idx" ON "gra_submissions" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX "gra_submissions_reference_number_idx" ON "gra_submissions" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "gra_submissions_gra_reference_idx" ON "gra_submissions" USING btree ("gra_reference_number");--> statement-breakpoint
CREATE INDEX "gra_submissions_due_date_idx" ON "gra_submissions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "gra_submissions_submitted_at_idx" ON "gra_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "gra_submissions_is_amendment_idx" ON "gra_submissions" USING btree ("is_amendment");--> statement-breakpoint
CREATE INDEX "gra_submissions_payment_required_idx" ON "gra_submissions" USING btree ("payment_required");--> statement-breakpoint
CREATE INDEX "gra_submissions_review_required_idx" ON "gra_submissions" USING btree ("review_required");--> statement-breakpoint
CREATE INDEX "gra_submissions_original_submission_idx" ON "gra_submissions" USING btree ("original_submission_id");--> statement-breakpoint
CREATE INDEX "gra_submissions_created_at_idx" ON "gra_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gra_webhooks_org_id_idx" ON "gra_webhooks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gra_webhooks_event_type_idx" ON "gra_webhooks" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "gra_webhooks_submission_id_idx" ON "gra_webhooks" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "gra_webhooks_processed_idx" ON "gra_webhooks" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "gra_webhooks_received_at_idx" ON "gra_webhooks" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "immigration_cases_org_id_idx" ON "immigration_cases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "immigration_cases_client_id_idx" ON "immigration_cases" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "immigration_cases_case_number_idx" ON "immigration_cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "immigration_cases_case_type_idx" ON "immigration_cases" USING btree ("case_type");--> statement-breakpoint
CREATE INDEX "immigration_cases_status_idx" ON "immigration_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "immigration_cases_priority_idx" ON "immigration_cases" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "immigration_cases_assigned_to_idx" ON "immigration_cases" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "immigration_cases_application_date_idx" ON "immigration_cases" USING btree ("application_date");--> statement-breakpoint
CREATE INDEX "immigration_cases_submission_date_idx" ON "immigration_cases" USING btree ("submission_date");--> statement-breakpoint
CREATE INDEX "immigration_cases_target_decision_date_idx" ON "immigration_cases" USING btree ("target_decision_date");--> statement-breakpoint
CREATE INDEX "immigration_cases_visa_expiry_date_idx" ON "immigration_cases" USING btree ("visa_expiry_date");--> statement-breakpoint
CREATE INDEX "immigration_cases_government_file_idx" ON "immigration_cases" USING btree ("government_file_number");--> statement-breakpoint
CREATE INDEX "immigration_cases_previous_case_idx" ON "immigration_cases" USING btree ("previous_case_id");--> statement-breakpoint
CREATE INDEX "immigration_cases_primary_applicant_idx" ON "immigration_cases" USING btree ("primary_applicant_id");--> statement-breakpoint
CREATE INDEX "immigration_cases_is_active_idx" ON "immigration_cases" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "immigration_cases_is_archived_idx" ON "immigration_cases" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "immigration_cases_created_at_idx" ON "immigration_cases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_case_id_idx" ON "immigration_correspondence" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_org_id_idx" ON "immigration_correspondence" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_type_idx" ON "immigration_correspondence" USING btree ("correspondence_type");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_direction_idx" ON "immigration_correspondence" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_sent_datetime_idx" ON "immigration_correspondence" USING btree ("sent_date_time");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_requires_response_idx" ON "immigration_correspondence" USING btree ("requires_response");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_is_urgent_idx" ON "immigration_correspondence" USING btree ("is_urgent");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_status_idx" ON "immigration_correspondence" USING btree ("status");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_action_required_idx" ON "immigration_correspondence" USING btree ("action_required");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_response_id_idx" ON "immigration_correspondence" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_in_response_to_idx" ON "immigration_correspondence" USING btree ("in_response_to_id");--> statement-breakpoint
CREATE INDEX "immigration_correspondence_created_at_idx" ON "immigration_correspondence" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_case_id_idx" ON "immigration_document_requirements" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_org_id_idx" ON "immigration_document_requirements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_status_idx" ON "immigration_document_requirements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_document_id_idx" ON "immigration_document_requirements" USING btree ("submitted_document_id");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_verified_by_idx" ON "immigration_document_requirements" USING btree ("verified_by");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_due_date_idx" ON "immigration_document_requirements" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_sort_order_idx" ON "immigration_document_requirements" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "immigration_doc_req_is_urgent_idx" ON "immigration_document_requirements" USING btree ("is_urgent");--> statement-breakpoint
CREATE INDEX "immigration_interviews_case_id_idx" ON "immigration_interviews" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "immigration_interviews_org_id_idx" ON "immigration_interviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "immigration_interviews_type_idx" ON "immigration_interviews" USING btree ("interview_type");--> statement-breakpoint
CREATE INDEX "immigration_interviews_scheduled_datetime_idx" ON "immigration_interviews" USING btree ("scheduled_date_time");--> statement-breakpoint
CREATE INDEX "immigration_interviews_status_idx" ON "immigration_interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "immigration_interviews_is_completed_idx" ON "immigration_interviews" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "immigration_interviews_follow_up_required_idx" ON "immigration_interviews" USING btree ("follow_up_required");--> statement-breakpoint
CREATE INDEX "immigration_interviews_rescheduled_from_idx" ON "immigration_interviews" USING btree ("rescheduled_from_id");--> statement-breakpoint
CREATE INDEX "immigration_interviews_created_at_idx" ON "immigration_interviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "immigration_timeline_case_id_idx" ON "immigration_timeline" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "immigration_timeline_org_id_idx" ON "immigration_timeline" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "immigration_timeline_event_type_idx" ON "immigration_timeline" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "immigration_timeline_event_date_idx" ON "immigration_timeline" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "immigration_timeline_scheduled_date_idx" ON "immigration_timeline" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "immigration_timeline_is_milestone_idx" ON "immigration_timeline" USING btree ("is_milestone");--> statement-breakpoint
CREATE INDEX "immigration_timeline_action_required_idx" ON "immigration_timeline" USING btree ("action_required");--> statement-breakpoint
CREATE INDEX "immigration_timeline_responsible_person_idx" ON "immigration_timeline" USING btree ("responsible_person");--> statement-breakpoint
CREATE INDEX "immigration_timeline_client_notified_idx" ON "immigration_timeline" USING btree ("client_notified");--> statement-breakpoint
CREATE INDEX "immigration_timeline_created_at_idx" ON "immigration_timeline" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lc_checklists_org_idx" ON "local_content_checklists" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lc_checklists_registration_idx" ON "local_content_checklists" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "lc_checklists_category_idx" ON "local_content_checklists" USING btree ("category");--> statement-breakpoint
CREATE INDEX "lc_checklists_compliant_idx" ON "local_content_checklists" USING btree ("is_compliant");--> statement-breakpoint
CREATE INDEX "lc_checklists_due_date_idx" ON "local_content_checklists" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "lc_plans_org_idx" ON "local_content_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lc_plans_registration_idx" ON "local_content_plans" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "lc_plans_client_idx" ON "local_content_plans" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "lc_plans_number_idx" ON "local_content_plans" USING btree ("plan_number");--> statement-breakpoint
CREATE INDEX "lc_plans_status_idx" ON "local_content_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lc_plans_period_idx" ON "local_content_plans" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "lc_registrations_org_idx" ON "local_content_registrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lc_registrations_client_idx" ON "local_content_registrations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "lc_registrations_number_idx" ON "local_content_registrations" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "lc_registrations_type_idx" ON "local_content_registrations" USING btree ("registration_type");--> statement-breakpoint
CREATE INDEX "lc_registrations_status_idx" ON "local_content_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lc_registrations_expiry_idx" ON "local_content_registrations" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "lc_reports_org_idx" ON "local_content_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lc_reports_registration_idx" ON "local_content_reports" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "lc_reports_plan_idx" ON "local_content_reports" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "lc_reports_client_idx" ON "local_content_reports" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "lc_reports_number_idx" ON "local_content_reports" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "lc_reports_status_idx" ON "local_content_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lc_reports_period_type_idx" ON "local_content_reports" USING btree ("report_period_type");--> statement-breakpoint
CREATE INDEX "lc_vendors_org_idx" ON "local_content_vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lc_vendors_code_idx" ON "local_content_vendors" USING btree ("vendor_code");--> statement-breakpoint
CREATE INDEX "lc_vendors_name_idx" ON "local_content_vendors" USING btree ("vendor_name");--> statement-breakpoint
CREATE INDEX "lc_vendors_guyanese_idx" ON "local_content_vendors" USING btree ("is_guyanese_owned");--> statement-breakpoint
CREATE INDEX "lc_vendors_verified_idx" ON "local_content_vendors" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "lc_vendors_active_idx" ON "local_content_vendors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_deliveries_delivery_method_idx" ON "notification_deliveries" USING btree ("delivery_method");--> statement-breakpoint
CREATE INDEX "notification_deliveries_scheduled_at_idx" ON "notification_deliveries" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_sent_at_idx" ON "notification_deliveries" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_templates_type_idx" ON "notification_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_templates_delivery_method_idx" ON "notification_templates" USING btree ("delivery_method");--> statement-breakpoint
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_expires_at_idx" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notifications_related_entity_idx" ON "notifications" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "ocr_accuracy_org_id_idx" ON "ocr_accuracy_tracking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ocr_accuracy_processing_id_idx" ON "ocr_accuracy_tracking" USING btree ("processing_id");--> statement-breakpoint
CREATE INDEX "ocr_accuracy_validated_by_idx" ON "ocr_accuracy_tracking" USING btree ("validated_by");--> statement-breakpoint
CREATE INDEX "ocr_accuracy_used_for_training_idx" ON "ocr_accuracy_tracking" USING btree ("used_for_training");--> statement-breakpoint
CREATE INDEX "ocr_accuracy_validation_method_idx" ON "ocr_accuracy_tracking" USING btree ("validation_method");--> statement-breakpoint
CREATE INDEX "ocr_accuracy_created_at_idx" ON "ocr_accuracy_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ocr_engines_org_id_idx" ON "ocr_engine_configurations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ocr_engines_engine_name_idx" ON "ocr_engine_configurations" USING btree ("engine_name");--> statement-breakpoint
CREATE INDEX "ocr_engines_is_active_idx" ON "ocr_engine_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ocr_engines_is_default_idx" ON "ocr_engine_configurations" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "ocr_engines_last_used_idx" ON "ocr_engine_configurations" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "ocr_templates_org_id_idx" ON "ocr_extraction_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ocr_templates_document_type_idx" ON "ocr_extraction_templates" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "ocr_templates_is_active_idx" ON "ocr_extraction_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ocr_templates_last_used_idx" ON "ocr_extraction_templates" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "ocr_queue_org_id_idx" ON "ocr_processing_queue" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ocr_queue_client_id_idx" ON "ocr_processing_queue" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ocr_queue_status_idx" ON "ocr_processing_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ocr_queue_priority_idx" ON "ocr_processing_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "ocr_queue_document_type_idx" ON "ocr_processing_queue" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "ocr_queue_scheduled_for_idx" ON "ocr_processing_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "ocr_queue_requires_review_idx" ON "ocr_processing_queue" USING btree ("requires_review");--> statement-breakpoint
CREATE INDEX "ocr_queue_processing_engine_idx" ON "ocr_processing_queue" USING btree ("processing_engine");--> statement-breakpoint
CREATE INDEX "ocr_queue_confidence_level_idx" ON "ocr_processing_queue" USING btree ("confidence_level");--> statement-breakpoint
CREATE INDEX "ocr_queue_quality_idx" ON "ocr_processing_queue" USING btree ("quality");--> statement-breakpoint
CREATE INDEX "ocr_queue_created_at_idx" ON "ocr_processing_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organization_settings_org_id_idx" ON "organization_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_settings_category_idx" ON "organization_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "organization_settings_key_idx" ON "organization_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "organization_settings_feature_flag_idx" ON "organization_settings" USING btree ("feature_flag");--> statement-breakpoint
CREATE INDEX "organization_users_org_id_idx" ON "organization_users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_users_user_id_idx" ON "organization_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_users_role_idx" ON "organization_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "organization_users_status_idx" ON "organization_users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organization_users_invited_by_idx" ON "organization_users" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "organization_users_invite_token_idx" ON "organization_users" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_gra_tin_idx" ON "organizations" USING btree ("gra_tin_number");--> statement-breakpoint
CREATE INDEX "organizations_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organizations_subscription_tier_idx" ON "organizations" USING btree ("subscription_tier");--> statement-breakpoint
CREATE INDEX "organizations_owner_id_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "organizations_parent_id_idx" ON "organizations" USING btree ("parent_organization_id");--> statement-breakpoint
CREATE INDEX "organizations_business_sector_idx" ON "organizations" USING btree ("business_sector");--> statement-breakpoint
CREATE INDEX "organizations_region_idx" ON "organizations" USING btree ("region");--> statement-breakpoint
CREATE INDEX "organizations_created_at_idx" ON "organizations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organizations_deleted_at_idx" ON "organizations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "partner_agreements_org_idx" ON "partner_agreements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partner_agreements_partner_idx" ON "partner_agreements" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_agreements_number_idx" ON "partner_agreements" USING btree ("agreement_number");--> statement-breakpoint
CREATE INDEX "partner_agreements_type_idx" ON "partner_agreements" USING btree ("agreement_type");--> statement-breakpoint
CREATE INDEX "partner_agreements_status_idx" ON "partner_agreements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partner_agreements_expiry_idx" ON "partner_agreements" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "partner_comms_org_idx" ON "partner_communications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partner_comms_partner_idx" ON "partner_communications" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_comms_referral_idx" ON "partner_communications" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "partner_comms_type_idx" ON "partner_communications" USING btree ("communication_type");--> statement-breakpoint
CREATE INDEX "partner_comms_date_idx" ON "partner_communications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "partner_comms_followup_idx" ON "partner_communications" USING btree ("requires_follow_up");--> statement-breakpoint
CREATE INDEX "partner_referrals_org_idx" ON "partner_referrals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partner_referrals_number_idx" ON "partner_referrals" USING btree ("referral_number");--> statement-breakpoint
CREATE INDEX "partner_referrals_status_idx" ON "partner_referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partner_referrals_referring_idx" ON "partner_referrals" USING btree ("referring_partner_id");--> statement-breakpoint
CREATE INDEX "partner_referrals_receiving_idx" ON "partner_referrals" USING btree ("receiving_partner_id");--> statement-breakpoint
CREATE INDEX "partner_referrals_client_idx" ON "partner_referrals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "partner_referrals_date_idx" ON "partner_referrals" USING btree ("referral_date");--> statement-breakpoint
CREATE INDEX "partner_reviews_org_idx" ON "partner_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partner_reviews_partner_idx" ON "partner_reviews" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_reviews_referral_idx" ON "partner_reviews" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "partner_reviews_rating_idx" ON "partner_reviews" USING btree ("overall_rating");--> statement-breakpoint
CREATE INDEX "partner_reviews_status_idx" ON "partner_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partner_reviews_public_idx" ON "partner_reviews" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "partners_org_idx" ON "partners" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "partners_code_idx" ON "partners" USING btree ("partner_code");--> statement-breakpoint
CREATE INDEX "partners_type_idx" ON "partners" USING btree ("partner_type");--> statement-breakpoint
CREATE INDEX "partners_status_idx" ON "partners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partners_tier_idx" ON "partners" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "partners_name_idx" ON "partners" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "partners_verified_idx" ON "partners" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "partners_featured_idx" ON "partners" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "employees_organization_id_idx" ON "employees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employees_email_idx" ON "employees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employees_department_idx" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "payroll_runs_organization_id_idx" ON "payroll_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payroll_runs_period_idx" ON "payroll_runs" USING btree ("period");--> statement-breakpoint
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leases_org_idx" ON "leases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "leases_property_idx" ON "leases" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "leases_tenant_idx" ON "leases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "leases_status_idx" ON "leases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leases_number_idx" ON "leases" USING btree ("lease_number");--> statement-breakpoint
CREATE INDEX "leases_end_date_idx" ON "leases" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "maintenance_requests_org_idx" ON "maintenance_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "maintenance_requests_property_idx" ON "maintenance_requests" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "maintenance_requests_tenant_idx" ON "maintenance_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_requests_priority_idx" ON "maintenance_requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "maintenance_requests_number_idx" ON "maintenance_requests" USING btree ("request_number");--> statement-breakpoint
CREATE INDEX "properties_org_idx" ON "properties" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "properties_code_idx" ON "properties" USING btree ("property_code");--> statement-breakpoint
CREATE INDEX "properties_city_idx" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "property_inspections_org_idx" ON "property_inspections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "property_inspections_property_idx" ON "property_inspections" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_inspections_lease_idx" ON "property_inspections" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "property_inspections_type_idx" ON "property_inspections" USING btree ("inspection_type");--> statement-breakpoint
CREATE INDEX "property_inspections_date_idx" ON "property_inspections" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "property_units_property_idx" ON "property_units" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_units_status_idx" ON "property_units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rent_payments_org_idx" ON "rent_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rent_payments_lease_idx" ON "rent_payments" USING btree ("lease_id");--> statement-breakpoint
CREATE INDEX "rent_payments_tenant_idx" ON "rent_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "rent_payments_status_idx" ON "rent_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rent_payments_due_date_idx" ON "rent_payments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "tenants_org_idx" ON "tenants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tenants_client_idx" ON "tenants" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "tenants_code_idx" ON "tenants" USING btree ("tenant_code");--> statement-breakpoint
CREATE INDEX "tenants_email_idx" ON "tenants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "tenants_active_idx" ON "tenants" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "job_history_org_id_idx" ON "job_execution_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_history_job_id_idx" ON "job_execution_history" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_history_execution_id_idx" ON "job_execution_history" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "job_history_status_idx" ON "job_execution_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_history_job_type_idx" ON "job_execution_history" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "job_history_started_at_idx" ON "job_execution_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "job_history_worker_id_idx" ON "job_execution_history" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "job_history_analytics_idx" ON "job_execution_history" USING btree ("job_type","status","started_at");--> statement-breakpoint
CREATE INDEX "job_queue_org_id_idx" ON "job_queue" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_queue_status_idx" ON "job_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_queue_priority_idx" ON "job_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "job_queue_queue_type_idx" ON "job_queue" USING btree ("queue_type");--> statement-breakpoint
CREATE INDEX "job_queue_scheduled_for_idx" ON "job_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "job_queue_delayed_until_idx" ON "job_queue" USING btree ("delayed_until");--> statement-breakpoint
CREATE INDEX "job_queue_worker_id_idx" ON "job_queue" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "job_queue_parent_job_idx" ON "job_queue" USING btree ("parent_job_id");--> statement-breakpoint
CREATE INDEX "job_queue_workflow_id_idx" ON "job_queue" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "job_queue_created_at_idx" ON "job_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_queue_processing_idx" ON "job_queue" USING btree ("status","priority","scheduled_for");--> statement-breakpoint
CREATE INDEX "job_queue_retry_idx" ON "job_queue" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "queue_configs_org_id_idx" ON "queue_configurations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "queue_configs_queue_type_idx" ON "queue_configurations" USING btree ("queue_type");--> statement-breakpoint
CREATE INDEX "queue_configs_is_active_idx" ON "queue_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "queue_configs_is_paused_idx" ON "queue_configurations" USING btree ("is_paused");--> statement-breakpoint
CREATE INDEX "queue_metrics_org_id_idx" ON "queue_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "queue_metrics_date_idx" ON "queue_metrics" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "queue_metrics_queue_type_idx" ON "queue_metrics" USING btree ("queue_type");--> statement-breakpoint
CREATE INDEX "queue_metrics_aggregation_period_idx" ON "queue_metrics" USING btree ("aggregation_period");--> statement-breakpoint
CREATE INDEX "queue_workers_org_id_idx" ON "queue_workers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "queue_workers_hostname_idx" ON "queue_workers" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "queue_workers_status_idx" ON "queue_workers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "queue_workers_last_heartbeat_idx" ON "queue_workers" USING btree ("last_heartbeat");--> statement-breakpoint
CREATE INDEX "queue_workers_health_score_idx" ON "queue_workers" USING btree ("health_score");--> statement-breakpoint
CREATE INDEX "permission_group_memberships_permission_id_idx" ON "permission_group_memberships" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "permission_group_memberships_group_id_idx" ON "permission_group_memberships" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "permission_groups_name_idx" ON "permission_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "permission_groups_is_active_idx" ON "permission_groups" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "permission_groups_sort_order_idx" ON "permission_groups" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "permissions_name_idx" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "permissions_resource_idx" ON "permissions" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "permissions_action_idx" ON "permissions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "permissions_scope_idx" ON "permissions" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "permissions_is_active_idx" ON "permissions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "permissions_is_sensitive_idx" ON "permissions" USING btree ("is_sensitive");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "role_permissions_is_granted_idx" ON "role_permissions" USING btree ("is_granted");--> statement-breakpoint
CREATE INDEX "role_permissions_is_inherited_idx" ON "role_permissions" USING btree ("is_inherited");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_parent_role_id_idx" ON "roles" USING btree ("parent_role_id");--> statement-breakpoint
CREATE INDEX "roles_is_active_idx" ON "roles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "roles_is_system_role_idx" ON "roles" USING btree ("is_system_role");--> statement-breakpoint
CREATE INDEX "roles_level_idx" ON "roles" USING btree ("level");--> statement-breakpoint
CREATE INDEX "user_permissions_user_id_idx" ON "user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permissions_permission_id_idx" ON "user_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "user_permissions_is_granted_idx" ON "user_permissions" USING btree ("is_granted");--> statement-breakpoint
CREATE INDEX "user_permissions_is_denied_idx" ON "user_permissions" USING btree ("is_denied");--> statement-breakpoint
CREATE INDEX "user_permissions_valid_from_idx" ON "user_permissions" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "user_permissions_valid_until_idx" ON "user_permissions" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "user_permissions_assigned_by_idx" ON "user_permissions" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_roles_is_active_idx" ON "user_roles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_roles_valid_from_idx" ON "user_roles" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "user_roles_valid_until_idx" ON "user_roles" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "user_roles_assigned_by_idx" ON "user_roles" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "user_roles_user_active_idx" ON "user_roles" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "user_roles_active_valid_idx" ON "user_roles" USING btree ("is_active","valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_searches_is_shared_idx" ON "saved_searches" USING btree ("is_shared");--> statement-breakpoint
CREATE INDEX "saved_searches_last_used_idx" ON "saved_searches" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "search_analytics_date_idx" ON "search_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "search_analytics_period_idx" ON "search_analytics" USING btree ("period");--> statement-breakpoint
CREATE INDEX "search_history_user_id_idx" ON "search_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_history_query_idx" ON "search_history" USING btree ("query");--> statement-breakpoint
CREATE INDEX "search_history_created_at_idx" ON "search_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "search_history_was_successful_idx" ON "search_history" USING btree ("was_successful");--> statement-breakpoint
CREATE INDEX "search_index_entity_idx" ON "search_index" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "search_index_owner_idx" ON "search_index" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "search_index_visibility_idx" ON "search_index" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "search_index_file_type_idx" ON "search_index" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "search_index_tags_idx" ON "search_index" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "search_index_is_indexed_idx" ON "search_index" USING btree ("is_indexed");--> statement-breakpoint
CREATE INDEX "search_index_last_modified_idx" ON "search_index" USING btree ("last_modified_at");--> statement-breakpoint
CREATE INDEX "search_suggestions_term_idx" ON "search_suggestions" USING btree ("term");--> statement-breakpoint
CREATE INDEX "search_suggestions_category_idx" ON "search_suggestions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "search_suggestions_frequency_idx" ON "search_suggestions" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "search_suggestions_is_active_idx" ON "search_suggestions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "search_suggestions_entity_type_idx" ON "search_suggestions" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "client_comm_org_idx" ON "client_communication_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "client_comm_client_idx" ON "client_communication_log" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_comm_project_idx" ON "client_communication_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "client_comm_type_idx" ON "client_communication_log" USING btree ("communication_type");--> statement-breakpoint
CREATE INDEX "client_comm_followup_idx" ON "client_communication_log" USING btree ("requires_follow_up");--> statement-breakpoint
CREATE INDEX "client_projects_org_idx" ON "client_projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "client_projects_client_idx" ON "client_projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_projects_service_idx" ON "client_projects" USING btree ("service_catalog_id");--> statement-breakpoint
CREATE INDEX "client_projects_status_idx" ON "client_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_projects_entity_idx" ON "client_projects" USING btree ("business_entity");--> statement-breakpoint
CREATE INDEX "client_projects_lead_idx" ON "client_projects" USING btree ("lead_consultant_id");--> statement-breakpoint
CREATE INDEX "client_projects_number_idx" ON "client_projects" USING btree ("project_number");--> statement-breakpoint
CREATE INDEX "project_milestones_project_idx" ON "project_milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_milestones_status_idx" ON "project_milestones" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_milestones_assigned_idx" ON "project_milestones" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "service_catalog_org_idx" ON "service_catalog" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "service_catalog_entity_idx" ON "service_catalog" USING btree ("business_entity");--> statement-breakpoint
CREATE INDEX "service_catalog_category_idx" ON "service_catalog" USING btree ("category");--> statement-breakpoint
CREATE INDEX "service_catalog_status_idx" ON "service_catalog" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_catalog_code_idx" ON "service_catalog" USING btree ("code");--> statement-breakpoint
CREATE INDEX "service_catalog_featured_idx" ON "service_catalog" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "svc_doc_templates_org_idx" ON "service_document_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "svc_doc_templates_entity_idx" ON "service_document_templates" USING btree ("business_entity");--> statement-breakpoint
CREATE INDEX "svc_doc_templates_category_idx" ON "service_document_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "svc_doc_templates_status_idx" ON "service_document_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_packages_org_idx" ON "service_packages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "service_packages_entity_idx" ON "service_packages" USING btree ("business_entity");--> statement-breakpoint
CREATE INDEX "service_packages_status_idx" ON "service_packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "time_entries_org_idx" ON "time_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "time_entries_project_idx" ON "time_entries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "time_entries_user_idx" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_entries_date_idx" ON "time_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "time_entries_billable_idx" ON "time_entries" USING btree ("is_billable");--> statement-breakpoint
CREATE INDEX "nis_calculations_org_id_idx" ON "nis_calculations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "nis_calculations_client_id_idx" ON "nis_calculations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "nis_calculations_year_idx" ON "nis_calculations" USING btree ("contribution_year");--> statement-breakpoint
CREATE INDEX "nis_calculations_pay_period_idx" ON "nis_calculations" USING btree ("pay_period");--> statement-breakpoint
CREATE INDEX "nis_calculations_status_idx" ON "nis_calculations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nis_calculations_due_date_idx" ON "nis_calculations" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "nis_calculations_nis_class_idx" ON "nis_calculations" USING btree ("nis_class");--> statement-breakpoint
CREATE INDEX "nis_calculations_org_year_idx" ON "nis_calculations" USING btree ("organization_id","contribution_year");--> statement-breakpoint
CREATE INDEX "nis_calculations_org_status_idx" ON "nis_calculations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "nis_calculations_client_year_idx" ON "nis_calculations" USING btree ("client_id","contribution_year");--> statement-breakpoint
CREATE INDEX "nis_calculations_class_year_idx" ON "nis_calculations" USING btree ("nis_class","contribution_year");--> statement-breakpoint
CREATE INDEX "paye_calculations_org_id_idx" ON "paye_calculations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "paye_calculations_client_id_idx" ON "paye_calculations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "paye_calculations_tax_year_idx" ON "paye_calculations" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX "paye_calculations_pay_period_idx" ON "paye_calculations" USING btree ("pay_period");--> statement-breakpoint
CREATE INDEX "paye_calculations_status_idx" ON "paye_calculations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "paye_calculations_due_date_idx" ON "paye_calculations" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "paye_calculations_org_year_idx" ON "paye_calculations" USING btree ("organization_id","tax_year");--> statement-breakpoint
CREATE INDEX "paye_calculations_org_status_idx" ON "paye_calculations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "paye_calculations_client_year_idx" ON "paye_calculations" USING btree ("client_id","tax_year");--> statement-breakpoint
CREATE INDEX "paye_calculations_status_due_date_idx" ON "paye_calculations" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "tax_rates_tax_type_idx" ON "tax_rates" USING btree ("tax_type");--> statement-breakpoint
CREATE INDEX "tax_rates_effective_from_idx" ON "tax_rates" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "tax_rates_tax_year_idx" ON "tax_rates" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX "tax_rates_is_active_idx" ON "tax_rates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "vat_calculations_org_id_idx" ON "vat_calculations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vat_calculations_client_id_idx" ON "vat_calculations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "vat_calculations_tax_year_idx" ON "vat_calculations" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX "vat_calculations_quarter_idx" ON "vat_calculations" USING btree ("tax_quarter");--> statement-breakpoint
CREATE INDEX "vat_calculations_period_start_idx" ON "vat_calculations" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "vat_calculations_status_idx" ON "vat_calculations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vat_calculations_due_date_idx" ON "vat_calculations" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "vat_calculations_registration_number_idx" ON "vat_calculations" USING btree ("vat_registration_number");--> statement-breakpoint
CREATE INDEX "vat_calculations_org_year_idx" ON "vat_calculations" USING btree ("organization_id","tax_year");--> statement-breakpoint
CREATE INDEX "vat_calculations_org_status_idx" ON "vat_calculations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "vat_calculations_client_year_idx" ON "vat_calculations" USING btree ("client_id","tax_year");--> statement-breakpoint
CREATE INDEX "vat_calculations_year_quarter_idx" ON "vat_calculations" USING btree ("tax_year","tax_quarter");--> statement-breakpoint
CREATE INDEX "vat_calculations_period_range_idx" ON "vat_calculations" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "training_certificates_org_idx" ON "training_certificates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_certificates_registration_idx" ON "training_certificates" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "training_certificates_course_idx" ON "training_certificates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "training_certificates_status_idx" ON "training_certificates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_certificates_number_idx" ON "training_certificates" USING btree ("certificate_number");--> statement-breakpoint
CREATE INDEX "training_certificates_verification_idx" ON "training_certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "training_certificates_expiry_idx" ON "training_certificates" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "training_courses_org_idx" ON "training_courses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_courses_code_idx" ON "training_courses" USING btree ("course_code");--> statement-breakpoint
CREATE INDEX "training_courses_category_idx" ON "training_courses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "training_courses_status_idx" ON "training_courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_courses_mode_idx" ON "training_courses" USING btree ("delivery_mode");--> statement-breakpoint
CREATE INDEX "training_courses_public_idx" ON "training_courses" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "training_instructors_org_idx" ON "training_instructors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_instructors_user_idx" ON "training_instructors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_instructors_email_idx" ON "training_instructors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "training_instructors_active_idx" ON "training_instructors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "training_instructors_available_idx" ON "training_instructors" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "training_registrations_org_idx" ON "training_registrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_registrations_session_idx" ON "training_registrations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "training_registrations_client_idx" ON "training_registrations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "training_registrations_status_idx" ON "training_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_registrations_number_idx" ON "training_registrations" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "training_registrations_email_idx" ON "training_registrations" USING btree ("participant_email");--> statement-breakpoint
CREATE INDEX "training_registrations_payment_idx" ON "training_registrations" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "training_sessions_org_idx" ON "training_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "training_sessions_course_idx" ON "training_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "training_sessions_code_idx" ON "training_sessions" USING btree ("session_code");--> statement-breakpoint
CREATE INDEX "training_sessions_status_idx" ON "training_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_sessions_start_date_idx" ON "training_sessions" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "training_sessions_instructor_idx" ON "training_sessions" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "training_sessions_registration_idx" ON "training_sessions" USING btree ("is_registration_open");--> statement-breakpoint
CREATE INDEX "user_accounts_user_id_idx" ON "user_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_accounts_provider_id_idx" ON "user_accounts" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_token_idx" ON "user_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_created_by_idx" ON "users" USING btree ("created_by");