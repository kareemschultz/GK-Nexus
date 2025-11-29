import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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

export function TimeTrackingProjects() {
  const projects = [
    {
      id: "1",
      name: "Client A - Tax Preparation",
      client: "ABC Corporation",
      status: "active",
      budget: 120,
      spent: 87.5,
      billableRate: 150,
      totalHours: 87.5,
      billableHours: 82.0,
      deadline: "2025-04-15",
      team: ["John Doe", "Jane Smith"],
    },
    {
      id: "2",
      name: "Client B - Business Audit",
      client: "XYZ Holdings",
      status: "active",
      budget: 200,
      spent: 145.0,
      billableRate: 175,
      totalHours: 145.0,
      billableHours: 138.5,
      deadline: "2025-03-30",
      team: ["Alice Johnson", "Bob Wilson"],
    },
    {
      id: "3",
      name: "Client C - Strategic Consulting",
      client: "DEF Enterprises",
      status: "completed",
      budget: 80,
      spent: 78.0,
      billableRate: 200,
      totalHours: 78.0,
      billableHours: 75.5,
      deadline: "2024-12-31",
      team: ["John Doe", "Sarah Connor"],
    },
    {
      id: "4",
      name: "Internal - Process Optimization",
      client: "Internal",
      status: "on-hold",
      budget: 40,
      spent: 12.0,
      billableRate: 0,
      totalHours: 12.0,
      billableHours: 0,
      deadline: "2025-06-30",
      team: ["Development Team"],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "outline";
      case "on-hold":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getBudgetUtilization = (spent: number, budget: number) =>
    Math.round((spent / budget) * 100);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track time allocation.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <div className="font-bold text-2xl">
                {projects.filter((p) => p.status === "active").length}
              </div>
              <div className="text-muted-foreground text-sm">
                Active Projects
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <div className="font-bold text-2xl">
                {projects.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}h
              </div>
              <div className="text-muted-foreground text-sm">Total Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <div className="font-bold text-2xl text-green-600">
                {formatCurrency(
                  projects.reduce(
                    (sum, p) => sum + p.billableHours * p.billableRate,
                    0
                  )
                )}
              </div>
              <div className="text-muted-foreground text-sm">Revenue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <div className="font-bold text-2xl">
                {Math.round(
                  (projects.reduce((sum, p) => sum + p.billableHours, 0) /
                    projects.reduce((sum, p) => sum + p.totalHours, 0)) *
                    100
                )}
                %
              </div>
              <div className="text-muted-foreground text-sm">Billable Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => {
          const budgetUtilization = getBudgetUtilization(
            project.spent,
            project.budget
          );

          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project.client} • Due {formatDate(project.deadline)}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Budget Progress
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">
                            {project.spent}h / {project.budget}h
                          </span>
                          <span className="text-sm">{budgetUtilization}%</span>
                        </div>
                        <Progress className="h-2" value={budgetUtilization} />
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Billable Hours
                      </p>
                      <p className="font-mono font-semibold text-lg">
                        {project.billableHours}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Hourly Rate
                      </p>
                      <p className="font-mono font-semibold text-lg">
                        {project.billableRate > 0
                          ? formatCurrency(project.billableRate)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Revenue</p>
                      <p className="font-mono font-semibold text-green-600 text-lg">
                        {formatCurrency(
                          project.billableHours * project.billableRate
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Team and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Team</p>
                      <div className="mt-1 flex items-center gap-2">
                        {project.team.map((member, index) => (
                          <Badge
                            className="text-xs"
                            key={index}
                            variant="outline"
                          >
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {project.status !== "completed" && (
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
