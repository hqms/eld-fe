import React from 'react';
import { Clock, User, History, LogOut, Plus, FileText, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';

interface MainScreenProps {
  onNavigate: (screen: 'main' | 'new-trip' | 'recap' | 'activity') => void;
}

export function MainScreen({ onNavigate }: MainScreenProps) {
  const { user, logout } = useAuth();
  const { trips } = useTrips();

  if (!user) return null;

  const cyclePercentage = (user.cycleHoursUsed / user.cycleHoursLimit) * 100;
  const hoursRemaining = user.cycleHoursLimit - user.cycleHoursUsed;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'planned':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Clock className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">TruckLog Pro</h1>
                <p className="text-sm text-gray-500">Driver Dashboard</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            size="lg"
            className="h-24 text-lg"
            onClick={() => onNavigate('activity')}
          >
            <Activity className="mr-2 size-6" />
            Track Activity
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-24 text-lg"
            onClick={() => onNavigate('new-trip')}
          >
            <Plus className="mr-2 size-6" />
            Start New Trip
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-24 text-lg"
            onClick={() => onNavigate('recap')}
          >
            <FileText className="mr-2 size-6" />
            View ELD Logs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cycle Hours Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cycle Hours Summary</CardTitle>
              <CardDescription>70-hour/8-day cycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Hours Used</span>
                  <span className="text-sm">
                    {user.cycleHoursUsed} / {user.cycleHoursLimit} hours
                  </span>
                </div>
                <Progress value={cyclePercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Hours Remaining</p>
                  <p className="text-2xl mt-1">{hoursRemaining.toFixed(1)} hrs</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl mt-1">
                    {cyclePercentage < 80 ? 'Available' : 'Near Limit'}
                  </p>
                </div>
              </div>

              {cyclePercentage >= 80 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ You are approaching your cycle hour limit. Plan rest accordingly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Driver Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="mt-1">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="mt-1">{user.licenseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver ID</p>
                <p className="mt-1">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your recent trips and deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trips.slice(0, 5).map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={`${getStatusColor(trip.status)} text-white`}
                        >
                          {trip.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{trip.date}</span>
                      </div>
                      <p className="text-sm mb-1">
                        <span className="text-gray-500">From:</span> {trip.pickupLocation}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="text-gray-500">To:</span> {trip.dropoffLocation}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Distance: {trip.distance} mi</span>
                        <span>Duration: {trip.duration} hrs</span>
                        <span>Cycle Hours: {trip.cycleHoursUsed} hrs</span>
                      </div>
                    </div>
                  </div>
                ))}

                {trips.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <History className="size-12 mx-auto mb-2 opacity-20" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}