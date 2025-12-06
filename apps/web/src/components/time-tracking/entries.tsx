import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function TimeEntriesManager() {
  const entries = [
    {
      id: "1",
      date: "2025-01-01",
      project: "Client A - Tax Preparation",
      task: "Review 2024 documents",
      startTime: "09:00",
      endTime: "11:30",
      duration: "2h 30m",
      billable: true,
      description:
        "Reviewed all tax documents and prepared initial calculations",
    },
    {
      id: "2",
      date: "2025-01-01",
      project: "Client B - Business Audit",
      task: "Financial statement review",
      startTime: "13:00",
      endTime: "16:45",
      duration: "3h 45m",
      billable: true,
      description:
        "Analyzed quarterly financial statements and identified key areas",
    },
    {
      id: "3",
      date: "2025-01-01",
      project: "Administrative",
      task: "Team meeting",
      startTime: "17:00",
      endTime: "17:30",
      duration: "30m",
      billable: false,
      description: "Weekly team sync and planning session",
    },
    {
      id: "4",
      date: "2024-12-31",
      project: "Client C - Consulting",
      task: "Strategic planning",
      startTime: "10:00",
      endTime: "12:00",
      duration: "2h 00m",
      billable: true,
      description: "Developed business strategy recommendations",
    },
  ];

  type TimeEntry = (typeof entries)[number];
  type GroupedEntries = Record<string, TimeEntry[]>;

  const groupedEntries = entries.reduce<GroupedEntries>((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDayTotal = (entries: TimeEntry[]): number =>
    entries.reduce((total, entry) => {
      const [hours, minutes] = entry.duration.replace(/[hm]/g, "").split(" ");
      return (
        total + Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10)
      );
    }, 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Time Entries</h1>
          <p className="text-muted-foreground">
            View and manage all your time tracking entries.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search entries..." />
        </div>
        <Button variant="outline">Filter by Project</Button>
        <Button variant="outline">Filter by Date</Button>
      </div>

      {/* Entries by Date */}
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([date, dayEntries]) => {
          const dayTotal = getDayTotal(dayEntries);
          const billableEntries = dayEntries.filter((entry) => entry.billable);
          const billableTotal = getDayTotal(billableEntries);

          return (
            <Card key={date}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {formatDate(date)}
                    </CardTitle>
                    <CardDescription>
                      {dayEntries.length} entries • Total:{" "}
                      {formatDuration(dayTotal)} • Billable:{" "}
                      {formatDuration(billableTotal)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-lg">
                      {formatDuration(dayTotal)}
                    </div>
                    <div className="font-mono text-green-600 text-sm">
                      {formatDuration(billableTotal)} billable
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayEntries.map((entry) => (
                    <div
                      className="flex items-start justify-between rounded-lg border p-4"
                      key={entry.id}
                    >
                      <div className="flex-1 space-y-2">
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
                        {entry.description && (
                          <p className="text-muted-foreground text-sm">
                            {entry.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-muted-foreground text-sm">
                          <span>
                            {entry.startTime} - {entry.endTime}
                          </span>
                          <span className="font-mono">{entry.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Summary</CardTitle>
          <CardDescription>
            Overview of your recent time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Total Entries</p>
              <p className="font-bold font-mono text-2xl">{entries.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Total Hours</p>
              <p className="font-bold font-mono text-2xl">
                {formatDuration(getDayTotal(entries))}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Billable Hours</p>
              <p className="font-bold font-mono text-2xl text-green-600">
                {formatDuration(getDayTotal(entries.filter((e) => e.billable)))}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Billable Rate</p>
              <p className="font-bold font-mono text-2xl">
                {Math.round(
                  (getDayTotal(entries.filter((e) => e.billable)) /
                    getDayTotal(entries)) *
                    100
                )}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
