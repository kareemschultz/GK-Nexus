import { Clock, Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TimeTrackingTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && seconds !== 0 && interval) clearInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    if (!startTime) {
      setStartTime(new Date());
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
    setStartTime(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">Time Tracker</h1>
        <p className="text-muted-foreground">
          Track your time and manage your work sessions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>
              Track time for your current work session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="font-bold font-mono text-4xl">
                  {formatTime(seconds)}
                </div>
                {startTime && (
                  <p className="mt-2 text-muted-foreground text-sm">
                    Started at {startTime.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                {isRunning ? (
                  <Button onClick={handlePause} size="lg" variant="outline">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={handleStart} size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </Button>
                )}

                <Button onClick={handleStop} size="lg" variant="destructive">
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>
              Overview of your time tracking for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Total Time
                </span>
                <span className="font-medium font-mono">02:45:30</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Sessions</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Break Time
                </span>
                <span className="font-medium font-mono">00:45:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Productivity
                </span>
                <span className="font-medium text-green-600">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Your most recent time tracking sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { task: "Client Report", duration: "01:30:00", time: "10:00 AM" },
              { task: "Tax Research", duration: "00:45:30", time: "02:15 PM" },
              { task: "Email Review", duration: "00:30:00", time: "04:00 PM" },
            ].map((session, index) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={index}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{session.task}</p>
                    <p className="text-muted-foreground text-sm">
                      {session.time}
                    </p>
                  </div>
                </div>
                <div className="font-mono text-sm">{session.duration}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
