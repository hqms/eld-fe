import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchWithAuth, getLocalUser } from '../utils/api';

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
  notes?: string;
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
  startActivity: (status: ActiveActivity['status'], notes?: string) => void;
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [eldLogs, setEldLogs] = useState<ELDLog[]>(mockELDLogs);
  const [activeActivity, setActiveActivity] = useState<ActiveActivity | null>(null);
  const [todayActivities, setTodayActivities] = useState<CompletedActivity[]>([]);

  const addTrip = (trip: Omit<Trip, 'id' | 'status'>) => {
    // Try create on backend
    (async () => {
      try {
        const res = await fetchWithAuth('/api/trip/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_location: trip.currentLocation,
            pickup_location: trip.pickupLocation,
            dropoff_location: trip.dropoffLocation,
            estimated_cycle_used: trip.cycleHoursUsed,
            driver: getLocalUser()?.user_id ,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newTrip: Trip = {
            id: String(data.id),
            date: data.created_at || new Date().toISOString(),
            currentLocation: data.current_location || trip.currentLocation,
            pickupLocation: data.pickup_location || trip.pickupLocation,
            dropoffLocation: data.dropoff_location || trip.dropoffLocation,
            cycleHoursUsed: data.estimated_cycle_used || trip.cycleHoursUsed,
            status: 'in-progress',
            distance: trip.distance || 0,
            duration: trip.duration || 0,
          };
          setTrips(prev => [newTrip, ...prev]);
          return;
        }
      } catch (e) {
        // fall back to local mock
      }

      const newTripLocal: Trip = {
        ...trip,
        id: String(trips.length + 1),
        status: 'in-progress',
      };
      setTrips([newTripLocal, ...trips]);
    })();
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchWithAuth('/api/trip/');
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          const mapped: Trip[] = (data || []).map((t: any) => ({
            id: String(t.id),
            date: t.created_at || new Date().toISOString(),
            currentLocation: t.current_location || '',
            pickupLocation: t.pickup_location || '',
            dropoffLocation: t.dropoff_location || '',
            cycleHoursUsed: t.estimated_cycle_used || 0,
            status: 'planned',
            distance: 0,
            duration: 0,
          }));
          setTrips(mapped);
        }
      } catch (e) {
        // ignore and keep mock data
      }
    })();
    return () => { mounted = false };
  }, []);

  // Fetch activities and populate today's completed activities and any open active activity
  useEffect(() => {
    let mounted = true;

    const mapActivityTypeToStatus = (t: string | undefined) => {
      switch (t) {
        case 'ONDUTY':
          return 'on-duty-not-driving';
        case 'OFFDUTY':
          return 'off-duty';
        case 'DRIVING':
          return 'driving';
        case 'SLEEPER':
          return 'sleeper-berth';
        default:
          return 'off-duty';
      }
    };

    (async () => {
      try {
        const res = await fetchWithAuth('/api/activity/');
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const todayStr = new Date().toISOString().slice(0, 10);
        const completed: CompletedActivity[] = [];

        for (const a of data) {
          const start: string | null = a.start_time || null;
          const end: string | null = a.end_time || null;
          const startDate = start ? start.slice(0, 10) : null;
          const endDate = end ? end.slice(0, 10) : null;

          if (!end && startDate === todayStr) {
            // open activity -> set as active
            const active: ActiveActivity = {
              id: String(a.id),
              status: mapActivityTypeToStatus(a.activity_type) as ActiveActivity['status'],
              startTime: start || new Date().toISOString(),
              location: a.location || 'Current Location',
              notes: a.notes,
            };
            setActiveActivity(active);
            continue;
          }

          // Completed (or at least has end_time) and occurred today
          if ((startDate === todayStr) || (endDate === todayStr)) {
            const s = start ? new Date(start) : null;
            const e = end ? new Date(end) : null;
            const duration = s && e ? (e.getTime() - s.getTime()) / (1000 * 60 * 60) : 0;

            const completedActivity: CompletedActivity = {
              id: String(a.id),
              status: mapActivityTypeToStatus(a.activity_type) as CompletedActivity['status'],
              startTime: s ? s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
              endTime: e ? e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
              location: a.location || '',
              duration,
              odometer: 145350 + Math.floor(Math.random() * 100),
              engineHours: 8522.5 + duration,
              notes: a.notes,
            };

            completed.push(completedActivity);
          }
        }

        if (completed.length > 0) {
          setTodayActivities(completed);
        }
      } catch (e) {
        // ignore and keep mock data
      }
    })();

    return () => { mounted = false };
  }, []);

  const getELDLogByDate = (date: string): ELDLog | undefined => {
    return eldLogs.find(log => log.date === date);
  };

  const startActivity = (status: ActiveActivity['status'], notes?: string) => {
    const now = new Date();

    const mapStatusToActivityType = (s: ActiveActivity['status']) => {
      switch (s) {
        case 'on-duty-not-driving':
          return 'ONDUTY';
        case 'off-duty':
          return 'OFFDUTY';
        case 'driving':
          return 'DRIVING';
        case 'sleeper-berth':
          return 'SLEEPER';
        default:
          return 'OFFDUTY';
      }
    };

    const newActivityLocal: ActiveActivity = {
      id: `activity-${Date.now()}`,
      status,
      startTime: now.toISOString(),
      location: 'Current Location', // Could be enhanced with geolocation
      notes,
    };

    // Attempt to create activity on backend; fall back to local mock on failure
    (async () => {
      try {
        const body: any = {
          driver: getLocalUser()?.user_id,
          activity_type: mapStatusToActivityType(status),
          start_time: now.toISOString(),
          end_time: now.toISOString(),
          location: newActivityLocal.location,
        };

        const res = await fetchWithAuth('/api/activity/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          const created: ActiveActivity = {
            id: String(data.id),
            status,
            startTime: data.start_time || newActivityLocal.startTime,
            location: data.location || newActivityLocal.location,
            notes,
          };
          setActiveActivity(created);
          return;
        }
      } catch (e) {
        // fall through to local fallback
      }

      setActiveActivity(newActivityLocal);
    })();
  };

  const stopActivity = (): CompletedActivity | null => {
    if (!activeActivity) return null;

    const now = new Date();
    const start = new Date(activeActivity.startTime);
    const durationHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);

    const completedActivityLocal: CompletedActivity = {
      id: activeActivity.id,
      status: activeActivity.status,
      startTime: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      location: activeActivity.location,
      duration: durationHours,
      odometer: 145350 + Math.floor(Math.random() * 100), // Mock odometer
      engineHours: 8522.5 + durationHours, // Mock engine hours
      notes: activeActivity.notes,
    };

    const tryUpdateBackend = async () => {
      // If id looks like a backend id (numeric), try PATCHing the activity
      const backendId = activeActivity.id && !activeActivity.id.startsWith('activity-') ? activeActivity.id : null;
      if (!backendId) return false;

      try {
        const res = await fetchWithAuth(`/api/activity/${backendId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ end_time: now.toISOString() }),
        });

        if (res.ok) {
          return true;
        }
      } catch (e) {
        // ignore
      }
      return false;
    };

    (async () => {
      const updated = await tryUpdateBackend();
      // in either case, push to local today's activities and clear active
      setTodayActivities([completedActivityLocal, ...todayActivities]);
      setActiveActivity(null);
    })();

    return completedActivityLocal;
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