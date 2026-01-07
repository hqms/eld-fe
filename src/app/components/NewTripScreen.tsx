import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, Navigation, Package, Clock, Map } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';
import { toast } from 'sonner';

interface NewTripScreenProps {
  onNavigate: (screen: 'main' | 'new-trip' | 'recap' | 'activity') => void;
}

// Predefined locations for autocomplete
const LOCATIONS = [
  'Los Angeles, CA',
  'San Francisco, CA',
  'San Diego, CA',
  'Sacramento, CA',
  'Oakland, CA',
  'Long Beach, CA',
  'Fresno, CA',
  'Phoenix, AZ',
  'Las Vegas, NV',
  'Seattle, WA',
  'Portland, OR',
  'Denver, CO',
  'Salt Lake City, UT',
  'Albuquerque, NM',
  'Dallas, TX',
  'Houston, TX',
  'Chicago, IL',
  'New York, NY',
  'Miami, FL',
  'Atlanta, GA',
];

export function NewTripScreen({ onNavigate }: NewTripScreenProps) {
  const { user, updateCycleHours } = useAuth();
  const { addTrip } = useTrips();

  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleHoursUsed, setCycleHoursUsed] = useState('');

  // Calculate estimated distance and duration (simplified)
  const routeInfo = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) {
      return null;
    }

    // Simulate route calculation
    const distance = Math.floor(Math.random() * 400) + 50;
    const duration = (distance / 60).toFixed(1);

    return {
      distance,
      duration: parseFloat(duration),
      route: [pickupLocation, dropoffLocation],
    };
  }, [pickupLocation, dropoffLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentLocation || !pickupLocation || !dropoffLocation || !cycleHoursUsed) {
      toast.error('Please fill in all fields');
      return;
    }

    const hours = parseFloat(cycleHoursUsed);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Please enter valid cycle hours');
      return;
    }

    // Add trip
    addTrip({
      date: new Date().toISOString().split('T')[0],
      currentLocation,
      pickupLocation,
      dropoffLocation,
      cycleHoursUsed: hours,
      distance: routeInfo?.distance || 0,
      duration: routeInfo?.duration || 0,
    });

    // Update cycle hours
    updateCycleHours(hours);

    toast.success('Trip created successfully!');
    
    // Reset form
    setCurrentLocation('');
    setPickupLocation('');
    setDropoffLocation('');
    setCycleHoursUsed('');

    // Navigate back to main screen
    setTimeout(() => {
      onNavigate('main');
    }, 1000);
  };

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
              <h1 className="text-xl">New Trip</h1>
              <p className="text-sm text-gray-500">Plan your route and log hours</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trip Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
              <CardDescription>Enter your trip information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-location" className="flex items-center gap-2">
                    <Navigation className="size-4" />
                    Current Location
                  </Label>
                  <Select value={currentLocation} onValueChange={setCurrentLocation}>
                    <SelectTrigger id="current-location">
                      <SelectValue placeholder="Select current location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-location" className="flex items-center gap-2">
                    <Package className="size-4" />
                    Pickup Location
                  </Label>
                  <Select value={pickupLocation} onValueChange={setPickupLocation}>
                    <SelectTrigger id="pickup-location">
                      <SelectValue placeholder="Select pickup location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropoff-location" className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    Dropoff Location
                  </Label>
                  <Select value={dropoffLocation} onValueChange={setDropoffLocation}>
                    <SelectTrigger id="dropoff-location">
                      <SelectValue placeholder="Select dropoff location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycle-hours" className="flex items-center gap-2">
                    <Clock className="size-4" />
                    Estimated Cycle Hours
                  </Label>
                  <Input
                    id="cycle-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g., 6.5"
                    value={cycleHoursUsed}
                    onChange={(e) => setCycleHoursUsed(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Hours remaining: {user ? (user.cycleHoursLimit - user.cycleHoursUsed).toFixed(1) : 0} hrs
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Create Trip
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Map Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="size-5" />
                  Route Preview
                </CardTitle>
                <CardDescription>
                  {routeInfo
                    ? 'Estimated fastest route'
                    : 'Enter pickup and dropoff locations to see route'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Simplified map visualization */}
                <div className="bg-gray-100 rounded-lg p-6 h-80 flex items-center justify-center relative overflow-hidden">
                  {routeInfo ? (
                    <div className="w-full h-full relative">
                      {/* Mock map background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50" />
                      
                      {/* Route visualization */}
                      <div className="relative h-full flex flex-col justify-between py-8">
                        {/* Pickup pin */}
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 p-3 rounded-full shadow-lg z-10">
                            <Package className="size-6 text-white" />
                          </div>
                          <div className="bg-white px-4 py-2 rounded-lg shadow">
                            <p className="text-sm">{pickupLocation}</p>
                          </div>
                        </div>

                        {/* Route line */}
                        <div className="flex-1 flex items-center pl-6">
                          <div className="w-1 h-full bg-blue-500 rounded-full relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-2 rounded shadow-lg whitespace-nowrap">
                              <p className="text-xs text-gray-600">
                                {routeInfo.distance} mi • {routeInfo.duration} hrs
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dropoff pin */}
                        <div className="flex items-center gap-3">
                          <div className="bg-red-500 p-3 rounded-full shadow-lg z-10">
                            <MapPin className="size-6 text-white" />
                          </div>
                          <div className="bg-white px-4 py-2 rounded-lg shadow">
                            <p className="text-sm">{dropoffLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <Map className="size-16 mx-auto mb-4 opacity-20" />
                      <p>No route selected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            {routeInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Distance</p>
                      <p className="text-2xl mt-1">{routeInfo.distance} mi</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Est. Duration</p>
                      <p className="text-2xl mt-1">{routeInfo.duration} hrs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}