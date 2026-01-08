import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Square, Clock, MapPin, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { useTrips, ELDEntry } from '../contexts/TripContext';
import { toast } from 'sonner';

interface ActivityScreenProps {
  onNavigate: (screen: 'main' | 'new-trip' | 'recap' | 'activity') => void;
}

type ActivityStatus = 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';

export function ActivityScreen({ onNavigate }: ActivityScreenProps) {
  const { user } = useAuth();
  const { activeActivity, todayActivities, startActivity, stopActivity } = useTrips();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityStatus | null>(null);
  const [noteText, setNoteText] = useState('');

  // Update elapsed time every second
  useEffect(() => {
    if (!activeActivity) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeActivity.startTime);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000); // seconds
      setElapsedTime(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeActivity]);

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusLabel = (status: ActivityStatus) => {
    switch (status) {
      case 'off-duty':
        return 'Off Duty';
      case 'sleeper-berth':
        return 'Sleeper Berth';
      case 'driving':
        return 'Driving';
      case 'on-duty-not-driving':
        return 'On Duty (Not Driving)';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'off-duty':
        return 'bg-gray-500';
      case 'sleeper-berth':
        return 'bg-purple-500';
      case 'driving':
        return 'bg-green-500';
      case 'on-duty-not-driving':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'off-duty':
        return '🏠';
      case 'sleeper-berth':
        return '🛏️';
      case 'driving':
        return '🚚';
      case 'on-duty-not-driving':
        return '📋';
      default:
        return '📍';
    }
  };

  const handleStartActivity = (status: ActivityStatus) => {
    if (activeActivity) {
      toast.error('Please stop current activity first');
      return;
    }

    setSelectedActivity(status);
    setNoteText('');
    setShowNoteDialog(true);
  };

  const handleConfirmStart = () => {
    if (!selectedActivity) return;

    startActivity(selectedActivity, noteText.trim() || undefined);
    toast.success(`Started ${getStatusLabel(selectedActivity)}`);
    setShowNoteDialog(false);
    setSelectedActivity(null);
    setNoteText('');
  };

  const handleCancelStart = () => {
    setShowNoteDialog(false);
    setSelectedActivity(null);
    setNoteText('');
  };

  const handleStopActivity = () => {
    if (!activeActivity) {
      toast.error('No active activity to stop');
      return;
    }

    const stoppedActivity = stopActivity();
    if (stoppedActivity) {
      toast.success(`Stopped ${getStatusLabel(stoppedActivity.status)} - Duration: ${stoppedActivity.duration.toFixed(2)} hrs`);
    }
  };

  const calculateTodayTotals = () => {
    const totals = {
      offDuty: 0,
      sleeperBerth: 0,
      driving: 0,
      onDuty: 0,
    };

    todayActivities.forEach((activity) => {
      const duration = activity.duration || 0;
      switch (activity.status) {
        case 'off-duty':
          totals.offDuty += duration;
          break;
        case 'sleeper-berth':
          totals.sleeperBerth += duration;
          break;
        case 'driving':
          totals.driving += duration;
          break;
        case 'on-duty-not-driving':
          totals.onDuty += duration;
          break;
      }
    });

    // Add current active activity
    if (activeActivity) {
      const currentDuration = elapsedTime / 3600; // Convert seconds to hours
      switch (activeActivity.status) {
        case 'off-duty':
          totals.offDuty += currentDuration;
          break;
        case 'sleeper-berth':
          totals.sleeperBerth += currentDuration;
          break;
        case 'driving':
          totals.driving += currentDuration;
          break;
        case 'on-duty-not-driving':
          totals.onDuty += currentDuration;
          break;
      }
    }

    return totals;
  };

  const todayTotals = calculateTodayTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('main')}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl">Activity Tracker</h1>
              <p className="text-sm text-gray-500">Log your duty status</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Activity / Activity Controls */}
          <div className="space-y-6">
            {/* Active Activity Display */}
            {activeActivity ? (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5 text-blue-500" />
                    Active Activity
                  </CardTitle>
                  <CardDescription>Currently in progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${getStatusColor(activeActivity.status)} p-3 rounded-full`}>
                        <span className="text-2xl">{getStatusIcon(activeActivity.status)}</span>
                      </div>
                      <div>
                        <h3 className="text-xl">{getStatusLabel(activeActivity.status)}</h3>
                        <p className="text-sm text-gray-500">
                          Started at {new Date(activeActivity.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Elapsed Time */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Elapsed Time</p>
                    <p className="text-4xl font-mono tabular-nums">{formatElapsedTime(elapsedTime)}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {(elapsedTime / 3600).toFixed(2)} hours
                    </p>
                  </div>

                  <Button 
                    variant="destructive" 
                    className="w-full h-14 text-lg"
                    onClick={handleStopActivity}
                  >
                    <Square className="mr-2 size-5" />
                    Stop Activity
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Activity</CardTitle>
                  <CardDescription>Select an activity below to start tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Clock className="size-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Not currently tracking any activity</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Control Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Start Activity</CardTitle>
                <CardDescription>Select duty status to begin tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className={`h-24 flex-col gap-2 ${activeActivity ? 'opacity-50' : ''}`}
                    onClick={() => handleStartActivity('on-duty-not-driving')}
                    disabled={!!activeActivity}
                  >
                    <span className="text-3xl">📋</span>
                    <span>On Duty</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className={`h-24 flex-col gap-2 ${activeActivity ? 'opacity-50' : ''}`}
                    onClick={() => handleStartActivity('driving')}
                    disabled={!!activeActivity}
                  >
                    <span className="text-3xl">🚚</span>
                    <span>Driving</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className={`h-24 flex-col gap-2 ${activeActivity ? 'opacity-50' : ''}`}
                    onClick={() => handleStartActivity('sleeper-berth')}
                    disabled={!!activeActivity}
                  >
                    <span className="text-3xl">🛏️</span>
                    <span>Sleeper Berth</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className={`h-24 flex-col gap-2 ${activeActivity ? 'opacity-50' : ''}`}
                    onClick={() => handleStartActivity('off-duty')}
                    disabled={!!activeActivity}
                  >
                    <span className="text-3xl">🏠</span>
                    <span>Off Duty</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Summary & Activities */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  Today's Summary
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Driving</p>
                    <p className="text-xl">{todayTotals.driving.toFixed(2)} hrs</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-gray-600 mb-1">On Duty</p>
                    <p className="text-xl">{todayTotals.onDuty.toFixed(2)} hrs</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Off Duty</p>
                    <p className="text-xl">{todayTotals.offDuty.toFixed(2)} hrs</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-600 mb-1">Sleeper Berth</p>
                    <p className="text-xl">{todayTotals.sleeperBerth.toFixed(2)} hrs</p>
                  </div>
                </div>

                {/* HOS Compliance Warning */}
                {todayTotals.driving >= 10 && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      ⚠️ Approaching 11-hour driving limit ({todayTotals.driving.toFixed(2)}/11 hrs)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Activities List */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Activities</CardTitle>
                <CardDescription>
                  {todayActivities.length + (activeActivity ? 1 : 0)} activities logged
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Active Activity (if any) */}
                  {activeActivity && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${getStatusColor(activeActivity.status)} text-white`}>
                          {getStatusLabel(activeActivity.status)}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500 text-white border-blue-600">
                          In Progress
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <Clock className="size-4" />
                        <span>Started: {new Date(activeActivity.startTime).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="size-4" />
                        <span>{activeActivity.location}</span>
                      </div>
                      {activeActivity.notes && (
                        <div className="mt-2 p-2 bg-white rounded border border-blue-200 text-sm text-gray-600 italic">
                          {activeActivity.notes}
                        </div>
                      )}
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">Duration: </span>
                        <span className="font-mono">{formatElapsedTime(elapsedTime)}</span>
                      </div>
                    </div>
                  )}

                  {/* Completed Activities */}
                  {todayActivities.map((activity) => (
                    <div key={activity.id} className="p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${getStatusColor(activity.status)} text-white`}>
                          {getStatusLabel(activity.status)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {activity.duration?.toFixed(2)} hrs
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="size-4" />
                        <span>
                          {new Date(activity.startTime).toLocaleTimeString()} - {activity.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="size-4" />
                        <span>{activity.location}</span>
                      </div>
                      {activity.notes && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          {activity.notes}
                        </div>
                      )}
                    </div>
                  ))}

                  {todayActivities.length === 0 && !activeActivity && (
                    <div className="text-center py-8 text-gray-400">
                      <Calendar className="size-12 mx-auto mb-2 opacity-20" />
                      <p>No activities logged today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note for the activity you are starting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter a note..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelStart}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStart}
            >
              Start Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}