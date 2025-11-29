/**
 * Performance Testing Suite
 * Tests application performance under various load conditions and scenarios
 */

import { expect, type Page, test } from "@playwright/test";

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 3000, // Max 3 seconds for page load
  API_RESPONSE: 1000, // Max 1 second for API responses
  CALCULATION: 500, // Max 500ms for tax calculations
  SEARCH: 800, // Max 800ms for search operations
  FILE_UPLOAD: 5000, // Max 5 seconds for file uploads
  REPORT_GENERATION: 10_000, // Max 10 seconds for report generation
};

// Test data sets for performance testing
const LARGE_DATASET = {
  CLIENT_COUNT: 100,
  CALCULATION_COUNT: 500,
  DOCUMENT_COUNT: 50,
};

// Helper function to measure performance
async function measurePerformance<T>(
  operation: () => Promise<T>,
  description: string,
  threshold: number
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`${description}: ${duration.toFixed(2)}ms`);
  expect(
    duration,
    `${description} should complete within ${threshold}ms`
  ).toBeLessThan(threshold);

  return { result, duration };
}

// Helper function to authenticate for performance tests
async function performanceAuth(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill("[data-testid=email-input]", "performance@test.com");
  await page.fill("[data-testid=password-input]", "TestPassword123!");
  await page.click("[data-testid=login-button]");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

// Helper function to create test data for performance tests
async function createPerformanceTestData(page: Page): Promise<void> {
  console.log("Creating performance test data...");

  // Navigate to test data creation endpoint (would be admin-only in real app)
  await page.goto("/admin/test-data");

  // Generate large dataset
  await page.click("[data-testid=generate-performance-data-button]");
  await page.fill(
    "[data-testid=client-count]",
    LARGE_DATASET.CLIENT_COUNT.toString()
  );
  await page.fill(
    "[data-testid=calculation-count]",
    LARGE_DATASET.CALCULATION_COUNT.toString()
  );
  await page.fill(
    "[data-testid=document-count]",
    LARGE_DATASET.DOCUMENT_COUNT.toString()
  );

  await page.click("[data-testid=create-data-button]");

  // Wait for data generation to complete
  await expect(
    page.locator("[data-testid=data-creation-complete]")
  ).toBeVisible({ timeout: 60_000 });
  console.log("Performance test data created successfully");
}

test.describe("Performance Testing Suite", () => {
  test.beforeEach(async ({ page }) => {
    await performanceAuth(page);
  });

  test.describe("Page Load Performance", () => {
    test("should load dashboard within performance threshold", async ({
      page,
    }) => {
      const { duration } = await measurePerformance(
        async () => {
          await page.goto("/dashboard");
          await expect(
            page.locator("[data-testid=dashboard-loaded]")
          ).toBeVisible();
          return true;
        },
        "Dashboard page load",
        PERFORMANCE_THRESHOLDS.PAGE_LOAD
      );

      // Additional performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint:
            performance.getEntriesByName("first-paint")[0]?.startTime || 0,
          firstContentfulPaint:
            performance.getEntriesByName("first-contentful-paint")[0]
              ?.startTime || 0,
        };
      });

      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500);

      console.log("Performance metrics:", performanceMetrics);
    });

    test("should load clients list with large dataset efficiently", async ({
      page,
    }) => {
      await createPerformanceTestData(page);

      const { duration } = await measurePerformance(
        async () => {
          await page.goto("/clients");
          await expect(
            page.locator("[data-testid=clients-table]")
          ).toBeVisible();
          await expect(
            page.locator("[data-testid=client-row]").first()
          ).toBeVisible();
          return true;
        },
        "Clients list with large dataset",
        PERFORMANCE_THRESHOLDS.PAGE_LOAD
      );

      // Verify pagination is working to limit initial load
      const visibleRows = await page
        .locator("[data-testid=client-row]")
        .count();
      expect(visibleRows).toBeLessThanOrEqual(25); // Should use pagination

      // Test search performance
      await measurePerformance(
        async () => {
          await page.fill("[data-testid=search-input]", "Test Client");
          await expect(
            page.locator("[data-testid=search-results]")
          ).toBeVisible();
          return true;
        },
        "Client search",
        PERFORMANCE_THRESHOLDS.SEARCH
      );
    });

    test("should handle concurrent page loads efficiently", async ({
      browser,
    }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      try {
        const { duration } = await measurePerformance(
          async () => {
            const pages = await Promise.all(
              contexts.map((ctx) => ctx.newPage())
            );

            // Authenticate all pages
            await Promise.all(pages.map((page) => performanceAuth(page)));

            // Load different pages simultaneously
            const loadPromises = [
              pages[0].goto("/dashboard"),
              pages[1].goto("/clients"),
              pages[2].goto("/tax"),
              pages[3].goto("/documents"),
              pages[4].goto("/reports"),
            ];

            await Promise.all(loadPromises);

            // Verify all pages loaded
            await Promise.all([
              expect(
                pages[0].locator("[data-testid=dashboard-loaded]")
              ).toBeVisible(),
              expect(
                pages[1].locator("[data-testid=clients-table]")
              ).toBeVisible(),
              expect(
                pages[2].locator("[data-testid=tax-calculator]")
              ).toBeVisible(),
              expect(
                pages[3].locator("[data-testid=documents-list]")
              ).toBeVisible(),
              expect(
                pages[4].locator("[data-testid=reports-dashboard]")
              ).toBeVisible(),
            ]);

            return true;
          },
          "Concurrent page loads",
          PERFORMANCE_THRESHOLDS.PAGE_LOAD * 2 // Allow more time for concurrent loads
        );
      } finally {
        await Promise.all(contexts.map((ctx) => ctx.close()));
      }
    });
  });

  test.describe("API Performance", () => {
    test("should perform tax calculations within performance threshold", async ({
      page,
    }) => {
      await page.goto("/tax");

      // Test single calculation performance
      await measurePerformance(
        async () => {
          await page.fill("[data-testid=basic-salary]", "200000");
          await page.fill("[data-testid=overtime]", "25000");
          await page.fill("[data-testid=dependents]", "2");

          await page.click("[data-testid=calculate-button]");
          await expect(
            page.locator("[data-testid=calculation-results]")
          ).toBeVisible();
          return true;
        },
        "PAYE tax calculation",
        PERFORMANCE_THRESHOLDS.CALCULATION
      );

      // Test VAT calculation performance
      await measurePerformance(
        async () => {
          await page.click("[data-testid=vat-calculator-tab]");
          await page.fill("[data-testid=standard-rate-sales]", "1000000");
          await page.fill("[data-testid=standard-rate-purchases]", "600000");

          await page.click("[data-testid=calculate-vat-button]");
          await expect(page.locator("[data-testid=vat-results]")).toBeVisible();
          return true;
        },
        "VAT calculation",
        PERFORMANCE_THRESHOLDS.CALCULATION
      );
    });

    test("should handle batch calculations efficiently", async ({ page }) => {
      await page.goto("/tax/batch");

      const batchData = Array.from({ length: 20 }, (_, i) => ({
        employeeId: `EMP${String(i + 1).padStart(3, "0")}`,
        basicSalary: 150_000 + i * 5000,
        overtime: 10_000 + i * 1000,
        dependents: Math.floor(i / 5),
      }));

      await measurePerformance(
        async () => {
          // Upload batch calculation data
          await page.click("[data-testid=upload-batch-data]");
          await page.setInputFiles("[data-testid=batch-file-input]", {
            name: "batch-calculations.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(
              [
                "employeeId,basicSalary,overtime,dependents",
                ...batchData.map((row) => Object.values(row).join(",")),
              ].join("\n")
            ),
          });

          await page.click("[data-testid=process-batch-button]");
          await expect(
            page.locator("[data-testid=batch-processing-complete]")
          ).toBeVisible();
          return true;
        },
        "Batch tax calculations (20 employees)",
        PERFORMANCE_THRESHOLDS.CALCULATION * 5 // Allow more time for batch processing
      );

      // Verify all calculations completed
      const completedCount = await page
        .locator("[data-testid=completed-calculation]")
        .count();
      expect(completedCount).toBe(batchData.length);
    });

    test("should load client data with proper pagination performance", async ({
      page,
      request,
    }) => {
      // Test API performance directly
      const { duration } = await measurePerformance(
        async () => {
          const response = await request.get("/api/clients?limit=25&offset=0");
          expect(response.status()).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data.clients)).toBe(true);
          return data;
        },
        "API: Get clients (paginated)",
        PERFORMANCE_THRESHOLDS.API_RESPONSE
      );

      // Test search API performance
      await measurePerformance(
        async () => {
          const response = await request.get(
            "/api/clients/search?q=John&limit=10"
          );
          expect(response.status()).toBe(200);
          const data = await response.json();
          return data;
        },
        "API: Search clients",
        PERFORMANCE_THRESHOLDS.SEARCH
      );
    });
  });

  test.describe("Database Performance", () => {
    test("should handle complex queries with proper indexing", async ({
      page,
      request,
    }) => {
      // Test complex tax calculation history query
      await measurePerformance(
        async () => {
          const response = await request.get(
            "/api/tax/calculations?year=2024&limit=100"
          );
          expect(response.status()).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data.calculations)).toBe(true);
          return data;
        },
        "Database: Complex tax calculation query",
        PERFORMANCE_THRESHOLDS.API_RESPONSE
      );

      // Test aggregated report query
      await measurePerformance(
        async () => {
          const response = await request.get(
            "/api/reports/tax-summary?period=quarterly&year=2024"
          );
          expect(response.status()).toBe(200);
          const data = await response.json();
          return data;
        },
        "Database: Aggregated report query",
        PERFORMANCE_THRESHOLDS.API_RESPONSE * 2
      );

      // Test multi-tenant isolation query performance
      await measurePerformance(
        async () => {
          const response = await request.get("/api/audit/logs?limit=50");
          expect(response.status()).toBe(200);
          const data = await response.json();
          return data;
        },
        "Database: Multi-tenant audit log query",
        PERFORMANCE_THRESHOLDS.API_RESPONSE
      );
    });

    test("should perform efficiently under concurrent database operations", async ({
      browser,
    }) => {
      const contexts = await Promise.all(
        Array.from({ length: 10 }, () => browser.newContext())
      );

      try {
        const { duration } = await measurePerformance(
          async () => {
            const pages = await Promise.all(
              contexts.map((ctx) => ctx.newPage())
            );
            await Promise.all(pages.map((page) => performanceAuth(page)));

            // Perform concurrent operations
            const operations = pages.map(async (page, index) => {
              // Each user performs different operations
              const operations = [
                () => page.goto("/clients"),
                () => page.goto("/tax"),
                () => page.goto("/documents"),
                () => page.goto("/reports"),
              ];

              const operation = operations[index % operations.length];
              await operation();

              // Wait for page to load
              await page.waitForTimeout(100);
            });

            await Promise.all(operations);
            return true;
          },
          "Concurrent database operations",
          PERFORMANCE_THRESHOLDS.PAGE_LOAD * 3
        );
      } finally {
        await Promise.all(contexts.map((ctx) => ctx.close()));
      }
    });
  });

  test.describe("File Upload Performance", () => {
    test("should upload documents within performance threshold", async ({
      page,
    }) => {
      await page.goto("/documents");

      // Test small file upload
      const smallFileContent = Buffer.alloc(100 * 1024); // 100KB
      await measurePerformance(
        async () => {
          await page.click("[data-testid=upload-document-button]");

          await page.fill(
            "[data-testid=document-name]",
            "Small Performance Test Document"
          );
          await page.selectOption("[data-testid=document-type]", "TAX_RETURN");

          await page.setInputFiles("[data-testid=file-input]", {
            name: "small-test.pdf",
            mimeType: "application/pdf",
            buffer: smallFileContent,
          });

          await page.click("[data-testid=upload-button]");
          await expect(
            page.locator("[data-testid=upload-success]")
          ).toBeVisible();
          return true;
        },
        "Small file upload (100KB)",
        PERFORMANCE_THRESHOLDS.FILE_UPLOAD
      );

      // Test large file upload
      const largeFileContent = Buffer.alloc(5 * 1024 * 1024); // 5MB
      await measurePerformance(
        async () => {
          await page.click("[data-testid=upload-document-button]");

          await page.fill(
            "[data-testid=document-name]",
            "Large Performance Test Document"
          );
          await page.selectOption(
            "[data-testid=document-type]",
            "FINANCIAL_STATEMENT"
          );

          await page.setInputFiles("[data-testid=file-input]", {
            name: "large-test.pdf",
            mimeType: "application/pdf",
            buffer: largeFileContent,
          });

          await page.click("[data-testid=upload-button]");
          await expect(
            page.locator("[data-testid=upload-success]")
          ).toBeVisible();
          return true;
        },
        "Large file upload (5MB)",
        PERFORMANCE_THRESHOLDS.FILE_UPLOAD * 2
      );
    });

    test("should handle multiple concurrent uploads", async ({ browser }) => {
      const uploadContexts = await Promise.all(
        Array.from({ length: 5 }, () => browser.newContext())
      );

      try {
        const { duration } = await measurePerformance(
          async () => {
            const pages = await Promise.all(
              uploadContexts.map((ctx) => ctx.newPage())
            );
            await Promise.all(pages.map((page) => performanceAuth(page)));

            const uploadPromises = pages.map(async (page, index) => {
              await page.goto("/documents");
              await page.click("[data-testid=upload-document-button]");

              await page.fill(
                "[data-testid=document-name]",
                `Concurrent Upload ${index + 1}`
              );
              await page.selectOption(
                "[data-testid=document-type]",
                "TAX_RETURN"
              );

              const fileContent = Buffer.alloc(500 * 1024); // 500KB each
              await page.setInputFiles("[data-testid=file-input]", {
                name: `concurrent-test-${index + 1}.pdf`,
                mimeType: "application/pdf",
                buffer: fileContent,
              });

              await page.click("[data-testid=upload-button]");
              await expect(
                page.locator("[data-testid=upload-success]")
              ).toBeVisible();
            });

            await Promise.all(uploadPromises);
            return true;
          },
          "Concurrent file uploads (5 x 500KB)",
          PERFORMANCE_THRESHOLDS.FILE_UPLOAD * 3
        );
      } finally {
        await Promise.all(uploadContexts.map((ctx) => ctx.close()));
      }
    });
  });

  test.describe("Report Generation Performance", () => {
    test("should generate standard reports within threshold", async ({
      page,
    }) => {
      await page.goto("/reports");

      // Test tax summary report
      await measurePerformance(
        async () => {
          await page.click("[data-testid=generate-tax-summary-button]");
          await page.selectOption("[data-testid=report-period]", "MONTHLY");
          await page.fill("[data-testid=report-year]", "2024");

          await page.click("[data-testid=generate-button]");
          await expect(
            page.locator("[data-testid=report-complete]")
          ).toBeVisible();
          return true;
        },
        "Tax summary report generation",
        PERFORMANCE_THRESHOLDS.REPORT_GENERATION
      );

      // Test client portfolio report
      await measurePerformance(
        async () => {
          await page.click("[data-testid=generate-client-portfolio-button]");
          await page.selectOption("[data-testid=portfolio-type]", "DETAILED");

          await page.click("[data-testid=generate-portfolio-button]");
          await expect(
            page.locator("[data-testid=portfolio-complete]")
          ).toBeVisible();
          return true;
        },
        "Client portfolio report generation",
        PERFORMANCE_THRESHOLDS.REPORT_GENERATION
      );

      // Test performance of large dataset report
      await measurePerformance(
        async () => {
          await page.click(
            "[data-testid=generate-comprehensive-report-button]"
          );
          await page.selectOption("[data-testid=report-scope]", "ALL_CLIENTS");
          await page.selectOption("[data-testid=report-detail]", "FULL");

          await page.click("[data-testid=generate-comprehensive-button]");
          await expect(
            page.locator("[data-testid=comprehensive-complete]")
          ).toBeVisible();
          return true;
        },
        "Comprehensive report generation (large dataset)",
        PERFORMANCE_THRESHOLDS.REPORT_GENERATION * 3
      );
    });
  });

  test.describe("Memory and Resource Usage", () => {
    test("should maintain acceptable memory usage during extended operations", async ({
      page,
    }) => {
      await page.goto("/dashboard");

      // Monitor memory usage during intensive operations
      const initialMemory = await page.evaluate(() =>
        (performance as any).memory
          ? {
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null
      );

      if (initialMemory) {
        console.log("Initial memory usage:", initialMemory);
      }

      // Perform intensive operations
      await page.goto("/clients");
      await createPerformanceTestData(page);

      // Navigate through multiple pages
      const pages = [
        "/tax",
        "/documents",
        "/reports",
        "/settings",
        "/dashboard",
      ];
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForTimeout(1000);
      }

      const finalMemory = await page.evaluate(() =>
        (performance as any).memory
          ? {
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null
      );

      if (initialMemory && finalMemory) {
        console.log("Final memory usage:", finalMemory);

        const memoryIncrease = finalMemory.used - initialMemory.used;
        const memoryIncreasePercent =
          (memoryIncrease / initialMemory.used) * 100;

        console.log(
          `Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`
        );

        // Memory usage should not increase by more than 50% during normal operations
        expect(memoryIncreasePercent).toBeLessThan(50);

        // Used memory should not exceed 80% of available memory
        const memoryUtilization = (finalMemory.used / finalMemory.total) * 100;
        expect(memoryUtilization).toBeLessThan(80);
      }
    });

    test("should handle cleanup after intensive operations", async ({
      page,
    }) => {
      await page.goto("/clients");

      // Perform operations that should be cleaned up
      for (let i = 0; i < 10; i++) {
        await page.fill("[data-testid=search-input]", `search-term-${i}`);
        await page.waitForTimeout(100);

        // Perform search
        await page.press("[data-testid=search-input]", "Enter");
        await page.waitForTimeout(200);

        // Clear search
        await page.fill("[data-testid=search-input]", "");
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      // Check for memory leaks
      const domNodeCount = await page.evaluate(
        () => document.querySelectorAll("*").length
      );
      console.log(`DOM nodes after cleanup: ${domNodeCount}`);

      // DOM should not have excessive number of nodes
      expect(domNodeCount).toBeLessThan(5000);
    });
  });

  test.describe("Network Performance", () => {
    test("should optimize network requests and minimize payload size", async ({
      page,
    }) => {
      // Monitor network requests
      const networkRequests: Array<{
        url: string;
        size: number;
        duration: number;
      }> = [];

      page.on("response", async (response) => {
        try {
          const request = response.request();
          const timing = response.timing();

          // Only monitor API requests
          if (request.url().includes("/api/")) {
            networkRequests.push({
              url: request.url(),
              size: Number.parseInt(
                response.headers()["content-length"] || "0"
              ),
              duration: timing.responseEnd - timing.responseStart,
            });
          }
        } catch (error) {
          // Ignore errors from cancelled requests
        }
      });

      await page.goto("/dashboard");
      await page.waitForTimeout(2000);

      // Navigate through pages to trigger various API calls
      await page.goto("/clients");
      await page.waitForTimeout(1000);

      await page.goto("/tax");
      await page.waitForTimeout(1000);

      // Analyze network performance
      if (networkRequests.length > 0) {
        console.log(`Total API requests: ${networkRequests.length}`);

        const avgDuration =
          networkRequests.reduce((sum, req) => sum + req.duration, 0) /
          networkRequests.length;
        const avgSize =
          networkRequests.reduce((sum, req) => sum + req.size, 0) /
          networkRequests.length;

        console.log(`Average request duration: ${avgDuration.toFixed(2)}ms`);
        console.log(`Average response size: ${avgSize.toFixed(2)} bytes`);

        // Performance expectations
        expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
        expect(avgSize).toBeLessThan(100 * 1024); // 100KB average response size

        // No single request should be excessively slow
        const slowRequests = networkRequests.filter(
          (req) => req.duration > PERFORMANCE_THRESHOLDS.API_RESPONSE * 2
        );
        expect(slowRequests.length).toBe(0);

        // No single response should be excessively large
        const largeResponses = networkRequests.filter(
          (req) => req.size > 500 * 1024
        ); // 500KB
        expect(largeResponses.length).toBe(0);
      }
    });
  });

  test.describe("Performance Monitoring Integration", () => {
    test("should track Core Web Vitals", async ({ page }) => {
      await page.goto("/dashboard");

      // Wait for page to fully load
      await expect(
        page.locator("[data-testid=dashboard-loaded]")
      ).toBeVisible();
      await page.waitForTimeout(3000);

      const coreWebVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {
            FCP: 0, // First Contentful Paint
            LCP: 0, // Largest Contentful Paint
            FID: 0, // First Input Delay
            CLS: 0, // Cumulative Layout Shift
          };

          // Get First Contentful Paint
          const fcpEntry = performance.getEntriesByName(
            "first-contentful-paint"
          )[0];
          if (fcpEntry) {
            vitals.FCP = fcpEntry.startTime;
          }

          // Get Largest Contentful Paint
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              vitals.LCP = lastEntry.startTime;
            }
          });

          try {
            observer.observe({
              type: "largest-contentful-paint",
              buffered: true,
            });

            // Get layout shift score
            const clsObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  vitals.CLS += (entry as any).value;
                }
              }
            });

            clsObserver.observe({ type: "layout-shift", buffered: true });

            setTimeout(() => {
              observer.disconnect();
              clsObserver.disconnect();
              resolve(vitals);
            }, 1000);
          } catch (error) {
            resolve(vitals);
          }
        });
      });

      console.log("Core Web Vitals:", coreWebVitals);

      // Performance expectations based on Google's thresholds
      expect(
        coreWebVitals.FCP,
        "First Contentful Paint should be under 1.8s"
      ).toBeLessThan(1800);
      expect(
        coreWebVitals.LCP,
        "Largest Contentful Paint should be under 2.5s"
      ).toBeLessThan(2500);
      expect(
        coreWebVitals.CLS,
        "Cumulative Layout Shift should be under 0.1"
      ).toBeLessThan(0.1);
    });

    test("should generate performance reports for monitoring", async ({
      page,
    }) => {
      const performanceData = {
        timestamp: new Date().toISOString(),
        testResults: [] as Array<{
          test: string;
          duration: number;
          threshold: number;
          passed: boolean;
        }>,
      };

      // Collect performance data from various operations
      const tests = [
        {
          name: "Dashboard Load",
          operation: () => page.goto("/dashboard"),
          threshold: PERFORMANCE_THRESHOLDS.PAGE_LOAD,
        },
        {
          name: "Client Search",
          operation: () => page.fill("[data-testid=search-input]", "test"),
          threshold: PERFORMANCE_THRESHOLDS.SEARCH,
        },
        {
          name: "Tax Calculation",
          operation: () => page.click("[data-testid=quick-calculate]"),
          threshold: PERFORMANCE_THRESHOLDS.CALCULATION,
        },
      ];

      for (const testCase of tests) {
        const startTime = performance.now();
        try {
          await testCase.operation();
          await page.waitForTimeout(100);
        } catch (error) {
          console.warn(`Test ${testCase.name} failed:`, error);
        }
        const endTime = performance.now();
        const duration = endTime - startTime;

        performanceData.testResults.push({
          test: testCase.name,
          duration,
          threshold: testCase.threshold,
          passed: duration < testCase.threshold,
        });
      }

      // Log performance data (in real app, this would be sent to monitoring service)
      console.log(
        "Performance Test Report:",
        JSON.stringify(performanceData, null, 2)
      );

      // Verify most tests passed performance thresholds
      const passedTests = performanceData.testResults.filter(
        (result) => result.passed
      );
      const passRate =
        (passedTests.length / performanceData.testResults.length) * 100;

      expect(
        passRate,
        "At least 80% of performance tests should pass"
      ).toBeGreaterThanOrEqual(80);
    });
  });
});
