import { expect, test } from "@playwright/test";
import { testUsers } from "../fixtures/test-data";
import { createTestHelpers } from "../utils/test-helpers";

test.describe("Dashboard Interactions", () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.auth.loginAsAdmin();
    await helpers.nav.goToDashboard();
  });

  test.describe("Dashboard Overview", () => {
    test("should display dashboard correctly", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Verify main dashboard components
      await expect(
        page.locator('[data-testid="dashboard-header"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="stats-overview"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="recent-activities"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="upcoming-deadlines"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="task-summary"]')).toBeVisible();

      // Check accessibility
      await helpers.a11y.injectAxe();
      await helpers.a11y.checkAccessibility();
    });

    test("should show correct user welcome message", async ({ page }) => {
      await expect(
        page.locator('[data-testid="welcome-message"]')
      ).toContainText(`Welcome back, ${testUsers.admin.firstName}`);

      // Should show current date
      const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await expect(page.locator('[data-testid="current-date"]')).toContainText(
        currentDate.split(",")[0] // Just the weekday
      );
    });

    test("should display key performance indicators", async ({ page }) => {
      // Verify KPI cards are present
      await expect(
        page.locator('[data-testid="total-clients-kpi"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="active-projects-kpi"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="pending-invoices-kpi"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="monthly-revenue-kpi"]')
      ).toBeVisible();

      // Verify KPIs have values
      await expect(
        page.locator('[data-testid="total-clients-value"]')
      ).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="active-projects-value"]')
      ).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="pending-invoices-value"]')
      ).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="monthly-revenue-value"]')
      ).not.toBeEmpty();

      // Verify trend indicators
      const trendIndicators = page.locator('[data-testid*="trend-indicator"]');
      expect(await trendIndicators.count()).toBeGreaterThan(0);
    });

    test("should show quick actions", async ({ page }) => {
      // Verify quick action buttons
      await expect(
        page.locator('[data-testid="new-client-action"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="new-project-action"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="new-invoice-action"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="upload-document-action"]')
      ).toBeVisible();

      // Test quick actions functionality
      await page.click('[data-testid="new-client-action"]');
      await expect(page).toHaveURL(/\/clients\/new/);

      // Navigate back to dashboard
      await page.goBack();
      await page.click('[data-testid="new-project-action"]');
      await expect(page).toHaveURL(/\/projects\/new/);
    });
  });

  test.describe("Recent Activities Feed", () => {
    test("should display recent activities", async ({ page }) => {
      // Verify activities section
      await expect(
        page.locator('[data-testid="activities-section"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="activity-item"]')
      ).toHaveCount.toBeGreaterThan(0);

      // Verify activity structure
      const firstActivity = page
        .locator('[data-testid="activity-item"]')
        .first();
      await expect(
        firstActivity.locator('[data-testid="activity-icon"]')
      ).toBeVisible();
      await expect(
        firstActivity.locator('[data-testid="activity-description"]')
      ).toBeVisible();
      await expect(
        firstActivity.locator('[data-testid="activity-timestamp"]')
      ).toBeVisible();
      await expect(
        firstActivity.locator('[data-testid="activity-user"]')
      ).toBeVisible();
    });

    test("should filter activities by type", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Open activity filter
      await page.click('[data-testid="activity-filter-button"]');

      // Verify filter options
      await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="filter-clients"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="filter-projects"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="filter-invoices"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="filter-documents"]')
      ).toBeVisible();

      // Filter by client activities
      await page.click('[data-testid="filter-clients"]');
      await helpers.wait.waitForLoader();

      // Verify filtered results
      const visibleActivities = page.locator(
        '[data-testid="activity-item"]:visible'
      );
      const count = await visibleActivities.count();
      expect(count).toBeGreaterThan(0);

      // All visible activities should be client-related
      for (let i = 0; i < count; i++) {
        const activity = visibleActivities.nth(i);
        const description = await activity
          .locator('[data-testid="activity-description"]')
          .textContent();
        expect(description).toMatch(/(client|Client)/);
      }
    });

    test("should show activity details on click", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Click on first activity
      await page.click('[data-testid="activity-item"]:first-child');

      // Verify activity details modal opens
      await helpers.wait.waitForModal("activity-details-modal");
      await expect(
        page.locator('[data-testid="activity-details-title"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="activity-details-description"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="activity-details-metadata"]')
      ).toBeVisible();

      // Close modal
      await helpers.wait.closeModal("activity-details-modal");
    });

    test("should load more activities on scroll", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Count initial activities
      const initialCount = await page
        .locator('[data-testid="activity-item"]')
        .count();

      // Scroll to bottom of activities section
      await page
        .locator('[data-testid="activities-section"]')
        .scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const activitiesSection = document.querySelector(
          '[data-testid="activities-section"]'
        );
        activitiesSection?.scrollTo(0, activitiesSection.scrollHeight);
      });

      // Wait for loading indicator
      await helpers.wait.waitForLoader();

      // Verify more activities loaded
      const newCount = await page
        .locator('[data-testid="activity-item"]')
        .count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe("Upcoming Deadlines", () => {
    test("should display upcoming deadlines", async ({ page }) => {
      // Verify deadlines section
      await expect(
        page.locator('[data-testid="deadlines-section"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="deadline-item"]')
      ).toHaveCount.toBeGreaterThan(0);

      // Verify deadline structure
      const firstDeadline = page
        .locator('[data-testid="deadline-item"]')
        .first();
      await expect(
        firstDeadline.locator('[data-testid="deadline-title"]')
      ).toBeVisible();
      await expect(
        firstDeadline.locator('[data-testid="deadline-date"]')
      ).toBeVisible();
      await expect(
        firstDeadline.locator('[data-testid="deadline-priority"]')
      ).toBeVisible();
      await expect(
        firstDeadline.locator('[data-testid="deadline-client"]')
      ).toBeVisible();
    });

    test("should prioritize overdue items", async ({ page }) => {
      // Check if overdue items are highlighted
      const overdueItems = page.locator(
        '[data-testid="deadline-item"][data-status="overdue"]'
      );
      const overdueCount = await overdueItems.count();

      if (overdueCount > 0) {
        // Verify overdue styling
        await expect(overdueItems.first()).toHaveClass(/overdue/);
        await expect(
          overdueItems.first().locator('[data-testid="deadline-priority"]')
        ).toContainText("OVERDUE");
      }

      // Verify items are sorted by urgency (overdue first, then by date)
      const allDeadlines = page.locator('[data-testid="deadline-item"]');
      const count = await allDeadlines.count();

      if (count > 1) {
        const firstItemStatus = await allDeadlines
          .first()
          .getAttribute("data-status");
        const _lastItemStatus = await allDeadlines
          .last()
          .getAttribute("data-status");

        // If there are overdue items, they should appear first
        if (overdueCount > 0 && count > overdueCount) {
          expect(firstItemStatus).toBe("overdue");
        }
      }
    });

    test("should navigate to project details on deadline click", async ({
      page,
    }) => {
      // Click on first deadline
      await page.click(
        '[data-testid="deadline-item"]:first-child [data-testid="deadline-title"]'
      );

      // Should navigate to project details
      await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);

      // Verify project details page loaded
      await expect(
        page.locator('[data-testid="project-details-header"]')
      ).toBeVisible();
    });

    test("should allow deadline status updates", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Click on deadline actions menu
      await page.click(
        '[data-testid="deadline-item"]:first-child [data-testid="deadline-actions-menu"]'
      );

      // Verify action options
      await expect(
        page.locator('[data-testid="mark-completed-action"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="extend-deadline-action"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="add-note-action"]')
      ).toBeVisible();

      // Mark as completed
      await page.click('[data-testid="mark-completed-action"]');

      // Verify confirmation dialog
      await helpers.wait.waitForModal("confirmation-modal");
      await page.click('[data-testid="confirm-button"]');

      // Verify success feedback
      await helpers.wait.waitForToast("Deadline marked as completed");

      // Verify item is updated or removed from list
      await expect(
        page.locator('[data-testid="deadline-item"]').first()
      ).not.toHaveAttribute("data-status", "overdue");
    });
  });

  test.describe("Task Summary Widget", () => {
    test("should display task summary correctly", async ({ page }) => {
      // Verify task summary section
      await expect(
        page.locator('[data-testid="task-summary-section"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="tasks-today"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="tasks-this-week"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="overdue-tasks"]')).toBeVisible();

      // Verify task counts
      await expect(
        page.locator('[data-testid="tasks-today-count"]')
      ).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="tasks-week-count"]')
      ).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="overdue-tasks-count"]')
      ).not.toBeEmpty();
    });

    test("should show task progress visualization", async ({ page }) => {
      // Verify progress charts/bars
      await expect(
        page.locator('[data-testid="task-progress-chart"]')
      ).toBeVisible();

      // Verify progress percentages
      const progressElements = page.locator(
        '[data-testid*="progress-percentage"]'
      );
      const count = await progressElements.count();
      expect(count).toBeGreaterThan(0);

      // Verify progress values are valid percentages
      for (let i = 0; i < count; i++) {
        const progressText = await progressElements.nth(i).textContent();
        const percentage = Number.parseInt(
          progressText?.replace("%", "") || "0",
          10
        );
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      }
    });

    test("should navigate to tasks view on click", async ({ page }) => {
      // Click on tasks today section
      await page.click('[data-testid="tasks-today"]');

      // Should navigate to tasks with today filter
      await expect(page).toHaveURL(/\/tasks\?filter=today/);

      // Navigate back and test other links
      await page.goBack();

      await page.click('[data-testid="tasks-this-week"]');
      await expect(page).toHaveURL(/\/tasks\?filter=this-week/);

      await page.goBack();

      await page.click('[data-testid="overdue-tasks"]');
      await expect(page).toHaveURL(/\/tasks\?filter=overdue/);
    });
  });

  test.describe("Revenue and Financial Widgets", () => {
    test("should display revenue chart", async ({ page }) => {
      // Verify revenue chart section
      await expect(
        page.locator('[data-testid="revenue-chart-section"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="chart-legend"]')).toBeVisible();

      // Verify time period selector
      await expect(
        page.locator('[data-testid="chart-period-selector"]')
      ).toBeVisible();

      // Test different time periods
      await page.click('[data-testid="chart-period-selector"]');
      await page.click('[data-testid="period-monthly"]');

      // Chart should update
      await page.waitForTimeout(1000); // Wait for chart animation
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    });

    test("should display invoice status breakdown", async ({ page }) => {
      // Verify invoice status widget
      await expect(
        page.locator('[data-testid="invoice-status-widget"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="paid-invoices-count"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="pending-invoices-count"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="overdue-invoices-count"]')
      ).toBeVisible();

      // Verify status amounts
      await expect(page.locator('[data-testid="paid-amount"]')).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="pending-amount"]')
      ).not.toBeEmpty();
      await expect(
        page.locator('[data-testid="overdue-amount"]')
      ).not.toBeEmpty();
    });

    test("should navigate to detailed financial reports", async ({ page }) => {
      // Click on revenue chart
      await page.click('[data-testid="view-detailed-report"]');

      // Should navigate to reports page
      await expect(page).toHaveURL(/\/reports\/financial/);

      // Verify reports page loaded
      await expect(
        page.locator('[data-testid="financial-reports-header"]')
      ).toBeVisible();
    });
  });

  test.describe("Notifications and Alerts", () => {
    test("should display notification center", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      // Click on notification bell
      await page.click('[data-testid="notification-bell"]');

      // Verify notification dropdown opens
      await expect(
        page.locator('[data-testid="notification-dropdown"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="notification-list"]')
      ).toBeVisible();

      // Verify notification items
      const notifications = page.locator('[data-testid="notification-item"]');
      const count = await notifications.count();
      expect(count).toBeGreaterThan(0);

      // Verify notification structure
      if (count > 0) {
        const firstNotification = notifications.first();
        await expect(
          firstNotification.locator('[data-testid="notification-icon"]')
        ).toBeVisible();
        await expect(
          firstNotification.locator('[data-testid="notification-title"]')
        ).toBeVisible();
        await expect(
          firstNotification.locator('[data-testid="notification-message"]')
        ).toBeVisible();
        await expect(
          firstNotification.locator('[data-testid="notification-time"]')
        ).toBeVisible();
      }
    });

    test("should mark notifications as read", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      // Open notification dropdown
      await page.click('[data-testid="notification-bell"]');

      // Find unread notification
      const unreadNotification = page
        .locator('[data-testid="notification-item"][data-read="false"]')
        .first();

      if ((await unreadNotification.count()) > 0) {
        // Click on unread notification
        await unreadNotification.click();

        // Verify notification is marked as read
        await expect(unreadNotification).toHaveAttribute("data-read", "true");
        await expect(unreadNotification).not.toHaveClass(/unread/);
      }
    });

    test("should clear all notifications", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Open notification dropdown
      await page.click('[data-testid="notification-bell"]');

      // Click clear all button
      await page.click('[data-testid="clear-all-notifications"]');

      // Verify confirmation dialog
      await helpers.wait.waitForModal("confirmation-modal");
      await page.click('[data-testid="confirm-button"]');

      // Verify notifications cleared
      await helpers.wait.waitForToast("All notifications cleared");
      await expect(
        page.locator('[data-testid="notification-item"]')
      ).toHaveCount(0);
      await expect(
        page.locator('[data-testid="no-notifications-message"]')
      ).toBeVisible();
    });

    test("should show notification badge count", async ({ page }) => {
      // Verify notification badge shows unread count
      const badge = page.locator('[data-testid="notification-badge"]');

      if ((await badge.count()) > 0) {
        const badgeText = await badge.textContent();
        const count = Number.parseInt(badgeText || "0", 10);
        expect(count).toBeGreaterThan(0);

        // Badge should disappear after reading all notifications
        await page.click('[data-testid="notification-bell"]');
        await page.click('[data-testid="mark-all-read"]');

        await expect(badge).toBeHidden();
      }
    });
  });

  test.describe("Dashboard Customization", () => {
    test("should allow widget rearrangement", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Enter customization mode
      await page.click('[data-testid="customize-dashboard-button"]');

      // Verify customization mode active
      await expect(
        page.locator('[data-testid="customization-mode"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="widget-drag-handles"]')
      ).toHaveCount.toBeGreaterThan(0);

      // Test drag and drop (simplified - full drag/drop testing requires complex setup)
      const firstWidget = page
        .locator('[data-testid="dashboard-widget"]')
        .first();
      const _initialPosition = await firstWidget.boundingBox();

      // Verify widgets are draggable
      await expect(firstWidget).toHaveClass(/draggable/);

      // Exit customization mode
      await page.click('[data-testid="save-layout-button"]');

      // Verify customization mode exited
      await expect(
        page.locator('[data-testid="customization-mode"]')
      ).toBeHidden();
      await helpers.wait.waitForToast("Dashboard layout saved");
    });

    test("should allow widget visibility toggle", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      // Enter customization mode
      await page.click('[data-testid="customize-dashboard-button"]');

      // Open widget settings
      await page.click('[data-testid="widget-settings-button"]');

      // Verify widget toggle options
      await expect(
        page.locator('[data-testid="widget-toggle-recent-activities"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="widget-toggle-upcoming-deadlines"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="widget-toggle-task-summary"]')
      ).toBeVisible();

      // Toggle off recent activities widget
      await page.uncheck('[data-testid="widget-toggle-recent-activities"]');

      // Save settings
      await page.click('[data-testid="save-settings-button"]');

      // Verify widget is hidden
      await expect(
        page.locator('[data-testid="recent-activities"]')
      ).toBeHidden();

      // Re-enable widget
      await page.click('[data-testid="customize-dashboard-button"]');
      await page.click('[data-testid="widget-settings-button"]');
      await page.check('[data-testid="widget-toggle-recent-activities"]');
      await page.click('[data-testid="save-settings-button"]');

      // Verify widget is visible again
      await expect(
        page.locator('[data-testid="recent-activities"]')
      ).toBeVisible();
    });

    test("should save and persist dashboard preferences", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Customize dashboard
      await page.click('[data-testid="customize-dashboard-button"]');
      await page.click('[data-testid="widget-settings-button"]');
      await page.uncheck('[data-testid="widget-toggle-task-summary"]');
      await page.click('[data-testid="save-settings-button"]');

      // Reload page
      await page.reload();

      // Verify customization persisted
      await expect(page.locator('[data-testid="task-summary"]')).toBeHidden();

      // Reset to defaults
      await page.click('[data-testid="customize-dashboard-button"]');
      await page.click('[data-testid="reset-to-default-button"]');

      // Verify confirmation
      await helpers.wait.waitForModal("confirmation-modal");
      await page.click('[data-testid="confirm-button"]');

      // Verify all widgets restored
      await expect(page.locator('[data-testid="task-summary"]')).toBeVisible();
      await helpers.wait.waitForToast("Dashboard reset to default layout");
    });
  });

  test.describe("Performance and Responsiveness", () => {
    test("should load dashboard within performance targets", async ({
      page,
    }) => {
      const helpers = createTestHelpers(page);

      // Measure dashboard load time
      const metrics = await helpers.perf.measurePageLoad("/dashboard");

      // Verify performance metrics
      expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds
      expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
      expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
    });

    test("should handle real-time updates efficiently", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Mock real-time updates (would be WebSocket in real app)
      await page.route("**/ws/dashboard-updates", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            type: "notification",
            data: {
              id: "new-notification",
              title: "New Task Assigned",
              message: "A new task has been assigned to you",
              timestamp: new Date().toISOString(),
            },
          }),
        });
      });

      // Trigger real-time update
      await page.evaluate(() => {
        // Simulate WebSocket message
        window.dispatchEvent(
          new CustomEvent("dashboard-update", {
            detail: {
              type: "notification",
              data: {
                id: "new-notification",
                title: "New Task Assigned",
                message: "A new task has been assigned to you",
                timestamp: new Date().toISOString(),
              },
            },
          })
        );
      });

      // Verify update reflected in UI
      await helpers.wait.waitForToast("New Task Assigned");

      // Check notification badge updated
      const badge = page.locator('[data-testid="notification-badge"]');
      if ((await badge.count()) > 0) {
        const count = Number.parseInt((await badge.textContent()) || "0", 10);
        expect(count).toBeGreaterThan(0);
      }
    });
  });
});
