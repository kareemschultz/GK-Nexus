# GK-Nexus Wizard Inventory

## Overview
This document catalogs all existing and required wizards in the GK-Nexus application, following the wizard architecture patterns defined in the protocol.

---

## Existing Wizards

### 1. Client Onboarding Wizard
**Location**: `apps/web/src/components/client-onboarding-wizard.tsx`
**Status**: Implemented
**Steps**: 5

| Step | Title | Description | Compliance Check |
|------|-------|-------------|------------------|
| 1 | Entity Structure | Basic business information and legal structure | ✅ Has validation |
| 2 | Contact Information | Address and communication details | ✅ Has validation |
| 3 | Document Upload | Required identification and business documents | ⚠️ Basic upload only |
| 4 | Service Selection | Choose required accounting and compliance services | ✅ Has validation |
| 5 | Review & Submit | Confirm all information before creating client | ✅ Has summary |

**Architecture Compliance**:
- ✅ Progress indicator (percentage + steps)
- ✅ Back/Next navigation
- ✅ Step-level validation (Zod schemas)
- ✅ Review step before submission
- ✅ Cancel option
- ⚠️ No draft save/resume functionality
- ⚠️ No GRA pre-population integration
- ⚠️ Missing OCR actual implementation (UI only)

**GRA Integration Fields**:
- TIN Number (9-digit) ✅
- Local Content Qualification ✅
- Region selection (10 Guyana regions) ✅
- Entity types per GRA requirements ✅

---

### 2. Setup Wizard (Organization Setup)
**Location**: `apps/web/src/components/onboarding/setup-wizard.tsx`
**Status**: Implemented
**Steps**: 4

| Step | Title | Description | Compliance Check |
|------|-------|-------------|------------------|
| 1 | Organization Details | Organization name, type, industry | ✅ Basic form |
| 2 | Contact Information | Address, phone, email, website | ✅ Basic form |
| 3 | Tax Configuration | TIN, VAT registration, tax year | ✅ Guyana-specific |
| 4 | Features & Preferences | Feature selection, timezone, currency | ✅ Configuration |

**Architecture Compliance**:
- ✅ Progress indicator
- ✅ Step navigation
- ⚠️ Missing final review step
- ⚠️ No draft save functionality
- ❌ No comprehensive validation display

---

## Missing Wizards (Priority Order)

### P0 - Critical

#### 1. Tax Filing Wizard
**Priority**: P0
**Location**: Should be at `apps/web/src/components/tax/tax-filing-wizard.tsx`
**Required Steps**:
1. Select Filing Type (PAYE/VAT/NIS/Income Tax)
2. Select Tax Period
3. Enter/Import Data
4. Calculate & Validate
5. Review Submission
6. GRA Submission Confirmation

**GRA Integration Requirements**:
- TIN validation
- Period selection (monthly/quarterly/annual)
- Form type selection (C-104, Self-Assessment, etc.)
- Deadline awareness
- E-filing status tracking

---

#### 2. Invoice Creation Wizard
**Priority**: P0
**Location**: Should be at `apps/web/src/components/invoices/invoice-wizard.tsx`
**Required Steps**:
1. Select Client (with search/filter)
2. Add Line Items
3. Apply Tax & Discounts
4. Set Payment Terms
5. Review & Generate

**Requirements**:
- Client pre-population from database
- Service catalog integration
- VAT calculation integration
- Template selection
- PDF generation

---

### P1 - High Priority

#### 3. Payroll Run Wizard
**Priority**: P1
**Location**: Should be at `apps/web/src/components/payroll/payroll-run-wizard.tsx`
**Required Steps**:
1. Select Pay Period
2. Review Employee List
3. Enter/Adjust Hours
4. Review Calculations (PAYE/NIS)
5. Generate Payslips
6. Approve & Process

**GRA Integration Requirements**:
- PAYE deduction calculations
- NIS contribution calculations
- Employee TIN validation
- Statutory deduction compliance

---

#### 4. GRA Filing Wizard
**Priority**: P1
**Location**: Should be at `apps/web/src/components/compliance/gra-filing-wizard.tsx`
**Required Steps**:
1. Select Filing Type
2. Select Client/Entity
3. Enter Financial Data
4. Validate Against GRA Rules
5. Generate Forms
6. Submit to GRA

**Requirements**:
- All GRA form types support
- Validation against GRA business rules
- E-filing integration ready
- Filing receipt/confirmation

---

#### 5. Automation Rule Wizard
**Priority**: P1
**Location**: Should be at `apps/web/src/components/automation/rule-wizard.tsx`
**Required Steps**:
1. Select Trigger Type
2. Define Conditions
3. Configure Actions
4. Set Schedule (if applicable)
5. Test & Preview
6. Activate Rule

---

### P2 - Medium Priority

#### 6. User Invite Wizard
**Priority**: P2
**Location**: Should be at `apps/web/src/components/users/user-invite-wizard.tsx`
**Required Steps**:
1. Enter User Details
2. Assign Role & Permissions
3. Set Department/Team
4. Review & Send Invitation

---

#### 7. Employee Onboarding Wizard
**Priority**: P2
**Location**: Should be at `apps/web/src/components/payroll/employee-onboarding-wizard.tsx`
**Required Steps**:
1. Personal Information
2. Employment Details
3. Tax Information (TIN, NIS)
4. Bank Account Details
5. Document Upload
6. Review & Submit

---

#### 8. Immigration Application Wizard
**Priority**: P2
**Location**: Should be at `apps/web/src/components/immigration/immigration-wizard.tsx`
**Required Steps**:
1. Select Application Type
2. Applicant Information
3. Employment/Sponsor Details
4. Document Checklist
5. Upload Documents
6. Review & Submit

---

### P3 - Lower Priority

#### 9. Property Onboarding Wizard
**Priority**: P3
**Location**: Should be at `apps/web/src/components/property/property-wizard.tsx`
**Required Steps**:
1. Property Details
2. Owner Information
3. Tenant Details (if applicable)
4. Financial Setup
5. Document Upload
6. Review & Create

---

#### 10. Expediting Request Wizard
**Priority**: P3
**Location**: Should be at `apps/web/src/components/expediting/expediting-wizard.tsx`
**Required Steps**:
1. Select Service Type
2. Client Selection
3. Document Requirements
4. Timeline & Priority
5. Review & Submit

---

#### 11. Local Content Submission Wizard
**Priority**: P3
**Location**: Should be at `apps/web/src/components/local-content/submission-wizard.tsx`
**Required Steps**:
1. Entity Information
2. Ownership Details
3. Local Content Metrics
4. Supporting Documents
5. Declaration
6. Review & Submit

---

#### 12. Portal Appointment Wizard
**Priority**: P3
**Location**: Should be at `apps/web/src/routes/portal/appointment-wizard.tsx`
**Required Steps**:
1. Select Service Type
2. Choose Date/Time
3. Provide Details
4. Confirm Booking

---

## Wizard Architecture Standards

### Required Components for All Wizards

```typescript
interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  component: React.ComponentType<StepProps>;
  validationSchema?: z.ZodSchema;
  isOptional?: boolean;
}

interface WizardProps {
  onComplete: (data: FormData) => void;
  onCancel: () => void;
  onSaveDraft?: (data: Partial<FormData>) => void;
  initialData?: Partial<FormData>;
}
```

### Required Features Checklist
- [ ] Progress indicator (step count + percentage)
- [ ] Step title and description
- [ ] Back/Next/Cancel buttons
- [ ] Step-level validation
- [ ] Final review step
- [ ] Loading states during submission
- [ ] Error handling with clear messages
- [ ] Draft save capability (for long wizards)
- [ ] Mobile-responsive layout
- [ ] Keyboard navigation support
- [ ] ARIA labels for accessibility

### GRA Integration Checklist
- [ ] TIN field with 9-digit validation
- [ ] NIS number validation
- [ ] Region dropdown (10 Guyana regions)
- [ ] Entity type selection per GRA categories
- [ ] Tax period awareness
- [ ] Deadline indicators
- [ ] Form type selection where applicable

---

## Summary

| Category | Count |
|----------|-------|
| Existing Wizards | 2 |
| P0 Missing Wizards | 2 |
| P1 Missing Wizards | 3 |
| P2 Missing Wizards | 3 |
| P3 Missing Wizards | 4 |
| **Total Wizards Needed** | **14** |

---

*Generated: 2025-12-01*
*Protocol Version: V2.2*
