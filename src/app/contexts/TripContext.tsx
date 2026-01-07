import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Trip {
  id: string;
  date: string;
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  cycleHoursUsed: number;
  status: 'completed' | 'in-progress' | 'planned';
  distance: number; // in miles
  duration: number; // in hours
}

export interface ELDLog {
  id: string;
  date: string;
  driverId: string;
  logs: ELDEntry[];
}

export interface ELDEntry {
  id: string;
  startTime: string;
  endTime: string;
  status: 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';
  location: string;
  duration: number; // in hours
  odometer: number;
  engineHours: number;
  notes?: string;
}

export interface ActiveActivity {
  id: string;
  status: 'off-duty' | 'sleeper-berth' | 'driving' | 'on-duty-not-driving';
  startTime: string; // ISO timestamp
  location: string;
}

export interface CompletedActivity extends ELDEntry {
  // Uses ELDEntry structure
}

interface TripContextType {
  trips: Trip[];
  eldLogs: ELDLog[];
  activeActivity: ActiveActivity | null;
  todayActivities: CompletedActivity[];
  addTrip: (trip: Omit<Trip, 'id' | 'status'>) => void;
  getELDLogByDate: (date: string) => ELDLog | undefined;
  startActivity: (status: ActiveActivity['status']) => void;
  stopActivity: () => CompletedActivity | null;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// Mock data
const mockTrips: Trip[] = [
  {
    id: '1',
    date: '2026-01-06',
    currentLocation: 'Los Angeles, CA',
    pickupLocation: 'Long Beach, CA',
    dropoffLocation: 'San Diego, CA',
    cycleHoursUsed: 3.5,
    status: 'completed',
    distance: 120,
    duration: 2.5,
  },
  {
    id: '2',
    date: '2026-01-05',
    currentLocation: 'San Francisco, CA',
    pickupLocation: 'Oakland, CA',
    dropoffLocation: 'Los Angeles, CA',
    cycleHoursUsed: 6.5,
    status: 'completed',
    distance: 382,
    duration: 6.0,
  },
  {
    id: '3',
    date: '2026-01-04',
    currentLocation: 'Sacramento, CA',
    pickupLocation: 'Stockton, CA',
    dropoffLocation: 'San Francisco, CA',
    cycleHoursUsed: 2.5,
    status: 'completed',
    distance: 95,
    duration: 2.0,
  },
];

const mockELDLogs: ELDLog[] = [
  {
    id: 'log-1',
    date: '2026-01-06',
    driverId: '1',
    logs: [
      {
        id: 'entry-1',
        startTime: '06:00',
        endTime: '07:00',
        status: 'on-duty-not-driving',
        location: 'Los Angeles, CA',
        duration: 1.0,
        odometer: 145230,
        engineHours: 8520,
        notes: 'Pre-trip inspection',
      },
      {
        id: 'entry-2',
        startTime: '07:00',
        endTime: '09:30',
        status: 'driving',
        location: 'Long Beach, CA → San Diego, CA',
        duration: 2.5,
        odometer: 145350,
        engineHours: 8522.5,
      },
      {
        id: 'entry-3',
        startTime: '09:30',
        endTime: '10:30',
        status: 'on-duty-not-driving',
        location: 'San Diego, CA',
        duration: 1.0,
        odometer: 145350,
        engineHours: 8522.5,
        notes: 'Unloading cargo',
      },
      {
        id: 'entry-4',
        startTime: '10:30',
        endTime: '22:00',
        status: 'off-duty',
        location: 'San Diego, CA',
        duration: 11.5,
        odometer: 145350,
        engineHours: 8522.5,
      },
    ],
  },
  {
    id: 'log-2',
    date: '2026-01-05',
    driverId: '1',
    logs: [
      {
        id: 'entry-5',
        startTime: '05:00',
        endTime: '06:00',
        status: 'on-duty-not-driving',
        location: 'San Francisco, CA',
        duration: 1.0,
        odometer: 144848,
        engineHours: 8514,
        notes: 'Pre-trip inspection',
      },
      {
        id: 'entry-6',
        startTime: '06:00',
        endTime: '12:00',
        status: 'driving',
        location: 'Oakland, CA → Los Angeles, CA',
        duration: 6.0,
        odometer: 145230,
        engineHours: 8520,
      },
      {
        id: 'entry-7',
        startTime: '12:00',
        endTime: '13:00',
        status: 'on-duty-not-driving',
        location: 'Los Angeles, CA',
        duration: 1.0,
        odometer: 145230,
        engineHours: 8520,
        notes: 'Unloading and paperwork',
      },
      {
        id: 'entry-8',
        startTime: '13:00',
        endTime: '23:00',
        status: 'sleeper-berth',
        location: 'Los Angeles, CA',
        duration: 10.0,
        odometer: 145230,
        engineHours: 8520,
      },
    ],
  },
];

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [eldLogs, setEldLogs] = useState<ELDLog[]>(mockELDLogs);
  const [activeActivity, setActiveActivity] = useState<ActiveActivity | null>(null);
  const [todayActivities, setTodayActivities] = useState<CompletedActivity[]>([]);

  const addTrip = (trip: Omit<Trip, 'id' | 'status'>) => {
    const newTrip: Trip = {
      ...trip,
      id: String(trips.length + 1),
      status: 'in-progress',
    };
    setTrips([newTrip, ...trips]);
  };

  const getELDLogByDate = (date: string): ELDLog | undefined => {
    return eldLogs.find(log => log.date === date);
  };

  const startActivity = (status: ActiveActivity['status']) => {
    const now = new Date();
    const newActivity: ActiveActivity = {
      id: `activity-${Date.now()}`,
      status,
      startTime: now.toISOString(),
      location: 'Current Location', // Could be enhanced with geolocation
    };
    setActiveActivity(newActivity);
  };

  const stopActivity = (): CompletedActivity | null => {
    if (!activeActivity) return null;

    const now = new Date();
    const start = new Date(activeActivity.startTime);
    const durationHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);

    const completedActivity: CompletedActivity = {
      id: activeActivity.id,
      status: activeActivity.status,
      startTime: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      location: activeActivity.location,
      duration: durationHours,
      odometer: 145350 + Math.floor(Math.random() * 100), // Mock odometer
      engineHours: 8522.5 + durationHours, // Mock engine hours
    };

    setTodayActivities([completedActivity, ...todayActivities]);
    setActiveActivity(null);

    return completedActivity;
  };

  return (
    <TripContext.Provider value={{ 
      trips, 
      eldLogs, 
      activeActivity, 
      todayActivities, 
      addTrip, 
      getELDLogByDate,
      startActivity,
      stopActivity
    }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
}