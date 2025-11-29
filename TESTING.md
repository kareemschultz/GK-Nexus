# GK-Nexus Testing Suite Documentation

This document provides comprehensive information about the testing suite for the GK-Nexus project, covering all implemented testing strategies and best practices.

## 📋 Overview

The GK-Nexus testing suite follows a comprehensive testing pyramid approach with:

- **Unit Tests**: Fast, isolated tests for individual functions and components
- **Integration Tests**: Tests for module interactions and database operations
- **End-to-End Tests**: Complete user workflow testing with Playwright
- **Performance Tests**: Load and performance benchmarking
- **Security Tests**: Security vulnerability scanning and testing
- **Accessibility Tests**: WCAG compliance and accessibility validation

## 🚀 Quick Start

### Run All Tests
```bash
bun run test:ci
```

### Run Specific Test Types
```bash
# Unit tests only
bun run test:unit

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e

# Accessibility tests
bun run test:accessibility

# Performance tests
bun run test:performance

# Security tests
bun run test:security
```

### Development Testing
```bash
# Watch mode for unit tests
bun run test:watch

# E2E tests with UI
bun run test:e2e:ui

# Debug E2E tests
bun run test:e2e:debug
```

## 🏗️ Test Architecture

### Unit Tests

**Location**:
- Web components: `apps/web/src/test/`
- API logic: `packages/api/src/test/`

**Framework**: Vitest + Testing Library

**Coverage**:
- Tax calculation business logic
- RBAC and permission system
- React component rendering and interactions
- API endpoint validation
- Utility functions and helpers

**Key Features**:
- Custom matchers for Guyana-specific validations
- Comprehensive mocking strategies
- Performance-oriented test design
- TypeScript-first approach

### Integration Tests

**Location**: `packages/api/src/test/integration/`

**Framework**: Vitest + Testcontainers

**Coverage**:
- Database operations with multi-tenant isolation
- API endpoint integration with database
- Authentication and authorization flows
- Document upload and processing workflows
- Complex business logic workflows

**Key Features**:
- PostgreSQL test containers for isolation
- Real database operations testing
- Multi-tenancy validation
- Referential integrity testing

### End-to-End Tests

**Location**: `tests/`

**Framework**: Playwright

**Coverage**:
- Complete tax calculation workflows
- Multi-role user scenarios
- Document management flows
- Cross-browser compatibility
- Mobile responsive design
- Error handling and recovery

**Key Features**:
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Visual regression testing
- Performance monitoring
- Accessibility scanning

## 📊 Test Configuration

### Unit Test Configuration

**Web Package** (`apps/web/vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

**API Package** (`packages/api/vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    name: "api-unit",
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
  },
});
```

### Playwright Configuration

**Main Config** (`playwright.config.ts`):
- Multi-browser testing
- Mobile device emulation
- Accessibility testing integration
- Performance monitoring
- Visual regression testing

**Projects**:
- Desktop browsers (Chrome, Firefox, Safari)
- Mobile devices (iPhone, Android)
- Accessibility-focused runs
- Performance testing

## 🧪 Testing Patterns and Best Practices

### Unit Testing Patterns

**Tax Calculation Testing**:
```typescript
describe("PAYE Calculation", () => {
  it("should calculate correctly for Guyana 2025 rates", () => {
    const employee = createTestEmployee({
      basicSalary: 200000,
      overtime: 25000,
      dependents: 2,
    });

    const result = calculatePAYE(employee);

    expect(result.grossEarnings).toBe(225000);
    expect(result.totalPAYETax).toBeValidGuyanaAmount();
    expect(result.netPay).toBeLessThan(result.grossEarnings);
  });
});
```

**Component Testing**:
```typescript
describe("PayeCalculator Component", () => {
  it("should validate and calculate PAYE", async () => {
    render(<PayeCalculator />);

    await user.type(screen.getByLabelText("Basic Salary"), "200000");
    await user.click(screen.getByText("Calculate"));

    await waitFor(() => {
      expect(screen.getByText("Calculation Results")).toBeInTheDocument();
    });
  });
});
```

### Integration Testing Patterns

**Database Multi-tenancy**:
```typescript
describe("Multi-Tenant Isolation", () => {
  it("should isolate data between organizations", async () => {
    const org1 = await createTestOrganization("Org 1");
    const org2 = await createTestOrganization("Org 2");

    // Create data for each org
    // Verify isolation
  });
});
```

### E2E Testing Patterns

**Complete Workflow Testing**:
```typescript
test("should complete tax calculation workflow", async ({ page }) => {
  await page.goto("/login");
  // Login flow

  await page.goto("/tax/paye");
  // Fill form and calculate

  await expect(page.locator("text=Results")).toBeVisible();
  // Verify results
});
```

## 🎯 Test Data Management

### Test Fixtures

**Employee Data**:
```typescript
export function createTestEmployee(overrides = {}) {
  return {
    id: `emp-${Date.now()}`,
    firstName: "John",
    lastName: "Doe",
    nisNumber: "123456789",
    basicSalary: 150000,
    ...overrides,
  };
}
```

**Tax Scenarios**:
```typescript
export const TAX_TEST_SCENARIOS = {
  LOW_INCOME: {
    employee: createTestEmployee({ basicSalary: 100000 }),
    expectedResults: { totalPAYETax: 0 },
  },
  // Additional scenarios...
};
```

### Database Seeding

**E2E Test Data**:
- Test organizations with different feature sets
- Users with various roles and permissions
- Sample clients, documents, and appointments
- Pre-calculated tax scenarios

## 📈 Coverage and Quality Metrics

### Coverage Targets

- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: All major user workflows

### Quality Gates

- All tests must pass for CI/CD pipeline
- Coverage thresholds enforced
- Performance budgets maintained
- Accessibility standards met
- Security scans pass

## 🔧 Local Development

### Setting Up Tests

```bash
# Install dependencies
bun install

# Set up test database
bun run db:push

# Run tests in watch mode
bun run test:watch
```

### Debugging Tests

**Unit Tests**:
```bash
# Debug specific test file
bunx vitest src/test/tax-calculations.test.ts --reporter=verbose

# Debug with UI
bunx vitest --ui
```

**E2E Tests**:
```bash
# Debug mode
bun run test:e2e:debug

# headed mode
bunx playwright test --headed

# Specific test
bunx playwright test tax-calculation-workflow.spec.ts
```

### Test Database Management

```bash
# Start test database
bun run db:start

# Reset test data
bun run db:reset

# View test database
bun run db:studio
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

The testing pipeline includes:

1. **Code Quality**: Linting and type checking
2. **Unit Tests**: Parallel execution across packages
3. **Integration Tests**: With PostgreSQL service
4. **E2E Tests**: Multi-browser matrix testing
5. **Accessibility Tests**: axe-core integration
6. **Performance Tests**: Lighthouse auditing
7. **Security Tests**: Vulnerability scanning

### Test Sharding

E2E tests are sharded across multiple runners for performance:
- 3 shards per browser
- Parallel execution
- Artifact collection for debugging

## 📱 Mobile and Accessibility Testing

### Mobile Testing

```typescript
test.describe("Mobile Workflow", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("should work on mobile", async ({ page }) => {
    // Mobile-specific testing
  });
});
```

### Accessibility Testing

```typescript
test("should be accessible", async ({ page }) => {
  await page.goto("/tax/paye");

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## 🔒 Security Testing

### Authentication Testing

```typescript
test("should require authentication", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login");
});
```

### Authorization Testing

```typescript
test("should respect role permissions", async ({ page }) => {
  // Login as CLIENT role
  await expect(page.locator("text=Admin Panel")).not.toBeVisible();
});
```

## 📊 Performance Testing

### Load Testing

```typescript
test("should handle concurrent users", async ({ page }) => {
  // Simulate multiple concurrent operations
  const promises = Array.from({ length: 10 }, () =>
    calculateTax(testData)
  );

  await Promise.all(promises);
  // Verify performance metrics
});
```

### Memory and Resource Testing

```typescript
test("should not leak memory", async ({ page }) => {
  // Monitor memory usage during operations
});
```

## 🛠️ Troubleshooting

### Common Issues

**Test Database Connection**:
```bash
# Check PostgreSQL container status
docker ps | grep postgres

# Restart test database
bun run db:stop && bun run db:start
```

**E2E Test Failures**:
```bash
# View test traces
bunx playwright show-trace test-results/trace.zip

# Take screenshots on failure
bunx playwright test --screenshot=only-on-failure
```

**Memory Issues**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" bun run test
```

## 🎯 Best Practices

### General Guidelines

1. **Test Naming**: Descriptive test names explaining the scenario
2. **Test Structure**: Arrange-Act-Assert pattern
3. **Test Independence**: Each test should be isolated
4. **Data Cleanup**: Proper cleanup after each test
5. **Error Handling**: Test both success and failure scenarios

### Performance Considerations

1. **Parallel Execution**: Maximize parallel test execution
2. **Test Containers**: Use lightweight containers for integration tests
3. **Selective Testing**: Run relevant tests based on changes
4. **Caching**: Cache dependencies and build artifacts

### Maintenance

1. **Regular Updates**: Keep testing frameworks updated
2. **Test Reviews**: Include tests in code review process
3. **Documentation**: Keep test documentation current
4. **Metrics Monitoring**: Track test performance and flakiness

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Testcontainers Documentation](https://www.testcontainers.org/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

---

For questions or support with testing, please refer to the team documentation or create an issue in the repository.