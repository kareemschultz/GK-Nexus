import { Calendar, Clock, Play, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimeEntry {
  id: string;
  project: string;
  task: string;
  client: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  billable: boolean;
  description: string;
}

interface ProjectStats {
  id: string;
  name: string;
  client: string;
  totalHours: number;
  billableHours: number;
  budgetHours: number;
  progress: number;
  status: "active" | "completed" | "on-hold";
}

const mockTimeEntries: TimeEntry[] = [
  {
    id: "1",
    project: "Tax Return - ABC Corp",
    task: "Document Review",
    client: "ABC Corporation",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 30 * 60 * 1000),
    duration: 90,
    billable: true,
    description: "Reviewed corporate tax documents and compliance filings",
  },
  {
    id: "2",
    project: "Payroll Processing - DEF Inc",
    task: "Payroll Calculation",
    client: "DEF Industries",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    duration: 60,
    billable: true,
    description: "Monthly payroll calculation and processing",
  },
  {
    id: "3",
    project: "Internal Operations",
    task: "Team Meeting",
    client: "Internal",
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
    duration: 30,
    billable: false,
    description: "Weekly team sync and planning meeting",
  },
];

const mockProjectStats: ProjectStats[] = [
  {
    id: "1",
    name: "Tax Return - ABC Corp",
    client: "ABC Corporation",
    totalHours: 45.5,
    billableHours: 43.0,
    budgetHours: 50,
    progress: 86,
    status: "active",
  },
  {
    id: "2",
    name: "Audit Preparation - GHI LLC",
    client: "GHI LLC",
    totalHours: 32.0,
    billableHours: 32.0,
    budgetHours: 40,
    progress: 80,
    status: "active",
  },
  {
    id: "3",
    name: "Quarterly Books - JKL Corp",
    client: "JKL Corporation",
    totalHours: 28.5,
    billableHours: 25.0,
    budgetHours: 30,
    progress: 95,
    status: "completed",
  },
];

export function TimeTrackingDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Calculate today's statistics
  const todayEntries = mockTimeEntries.filter((entry) => {
    const entryDate = entry.startTime.toDateString();
    const today = new Date().toDateString();
    return entryDate === today;
  });

  const todayHours =
    todayEntries.reduce((total, entry) => total + entry.duration, 0) / 60;
  const billableHours =
    todayEntries
      .filter((entry) => entry.billable)
      .reduce((total, entry) => total + entry.duration, 0) / 60;

  const totalProjects = mockProjectStats.length;
  const activeProjects = mockProjectStats.filter(
    (p) => p.status === "active"
  ).length;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setCurrentTask("New Task");
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setCurrentTask(null);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground">Time Tracking</h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {isTimerRunning ? (
            <Button
              className="flex items-center gap-2"
              onClick={stopTimer}
              variant="destructive"
            >
              <Square className="h-4 w-4" />
              Stop Timer
            </Button>
          ) : (
            <Button className="flex items-center gap-2" onClick={startTimer}>
              <Play className="h-4 w-4" />
              Start Timer
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Today's Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{todayHours.toFixed(1)}h</div>
            <p className="text-muted-foreground text-xs">
              {billableHours.toFixed(1)}h billable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Active Projects
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activeProjects}</div>
            <p className="text-muted-foreground text-xs">
              of {totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">38.5h</div>
            <p className="text-muted-foreground text-xs">
              +2.5h from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Efficiency</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">87%</div>
            <p className="text-muted-foreground text-xs">
              billable vs total time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Timer Status */}
      {isTimerRunning && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                <div>
                  <p className="font-medium">
                    Currently tracking: {currentTask}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Started at {formatTime(new Date())}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl">00:05</p>
                <p className="text-muted-foreground text-xs">Running time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs className="space-y-4" defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Entries</TabsTrigger>
          <TabsTrigger value="projects">Project Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeEntries.map((entry) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={entry.id}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{entry.task}</h4>
                        <Badge
                          variant={entry.billable ? "default" : "secondary"}
                        >
                          {entry.billable ? "Billable" : "Non-billable"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {entry.project}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {entry.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDuration(entry.duration)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {formatTime(entry.startTime)} -{" "}
                        {entry.endTime ? formatTime(entry.endTime) : "Ongoing"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockProjectStats.map((project) => (
                  <div className="space-y-2" key={project.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {project.client}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            project.status === "completed"
                              ? "default"
                              : project.status === "active"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>
                          {project.totalHours}h / {project.budgetHours}h
                        </span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress className="h-2" value={project.progress} />
                      <p className="text-muted-foreground text-xs">
                        {project.billableHours}h billable of{" "}
                        {project.totalHours}h total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => {
                    const hours = [8.5, 7.2, 9.1, 6.8, 8.0][index];
                    return (
                      <div
                        className="flex items-center justify-between"
                        key={day}
                      >
                        <span className="font-medium text-sm">{day}</span>
                        <div className="mx-4 flex flex-1 items-center gap-2">
                          <Progress
                            className="h-2 flex-1"
                            value={(hours / 10) * 100}
                          />
                          <span className="text-muted-foreground text-sm">
                            {hours}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Client Work</span>
                    <span className="font-medium text-sm">75%</span>
                  </div>
                  <Progress className="h-2" value={75} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Administrative</span>
                    <span className="font-medium text-sm">15%</span>
                  </div>
                  <Progress className="h-2" value={15} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Meetings</span>
                    <span className="font-medium text-sm">10%</span>
                  </div>
                  <Progress className="h-2" value={10} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
