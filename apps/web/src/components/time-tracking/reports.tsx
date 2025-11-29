import { BarChart3, Download, Filter, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TimeReports() {
  const reports = [
    {
      period: "This Week",
      totalHours: "32.5",
      billableHours: "28.0",
      clients: 5,
      projects: 8,
      utilization: 86,
    },
    {
      period: "Last Week",
      totalHours: "38.0",
      billableHours: "34.5",
      clients: 6,
      projects: 10,
      utilization: 91,
    },
    {
      period: "This Month",
      totalHours: "142.5",
      billableHours: "128.0",
      clients: 12,
      projects: 25,
      utilization: 90,
    },
  ];

  const projectBreakdown = [
    { name: "Client A - Tax Prep", hours: 45.5, percentage: 32 },
    { name: "Client B - Audit", hours: 38.0, percentage: 27 },
    { name: "Client C - Consulting", hours: 28.5, percentage: 20 },
    { name: "Administrative", hours: 15.0, percentage: 11 },
    { name: "Business Development", hours: 14.5, percentage: 10 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Time Reports</h1>
          <p className="text-muted-foreground">
            Analyze your time tracking data and generate reports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.period}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{report.period}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Total Hours
                </span>
                <span className="font-mono font-semibold">
                  {report.totalHours}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Billable</span>
                <span className="font-mono font-semibold text-green-600">
                  {report.billableHours}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Utilization
                </span>
                <div className="flex items-center gap-2">
                  <Progress className="h-2 w-12" value={report.utilization} />
                  <span className="font-medium text-sm">
                    {report.utilization}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="text-center">
                  <div className="font-bold text-xl">{report.clients}</div>
                  <div className="text-muted-foreground text-xs">Clients</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{report.projects}</div>
                  <div className="text-muted-foreground text-xs">Projects</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Project Breakdown</CardTitle>
            <CardDescription>
              Time distribution across projects this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectBreakdown.map((project, index) => (
                <div className="space-y-2" key={index}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{project.name}</span>
                    <span className="font-mono text-sm">{project.hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      className="h-2 flex-1"
                      value={project.percentage}
                    />
                    <span className="w-8 text-muted-foreground text-xs">
                      {project.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Productivity Trends</CardTitle>
            <CardDescription>
              Weekly productivity and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Daily Hours</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">7.2h</span>
                  <Badge className="text-green-600" variant="outline">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +5%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Billable Rate</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">89%</span>
                  <Badge className="text-green-600" variant="outline">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +2%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Focus Time</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">6.1h</span>
                  <Badge className="text-green-600" variant="outline">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +8%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Task Completion</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">92%</span>
                  <Badge className="text-green-600" variant="outline">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +3%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Generate detailed reports for specific time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col gap-2" variant="outline">
              <BarChart3 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">Daily Report</div>
                <div className="text-muted-foreground text-xs">
                  Detailed breakdown
                </div>
              </div>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <BarChart3 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">Weekly Summary</div>
                <div className="text-muted-foreground text-xs">
                  Productivity metrics
                </div>
              </div>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <BarChart3 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">Client Report</div>
                <div className="text-muted-foreground text-xs">
                  Per-client analysis
                </div>
              </div>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <BarChart3 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">Custom Report</div>
                <div className="text-muted-foreground text-xs">
                  Build your own
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
