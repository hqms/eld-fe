import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Package, Clock, Map } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
// select component not used anymore; locations use Geoapify autocomplete
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';
import { toast } from 'sonner';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MaplibreMap } from 'maplibre-gl';

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

interface Suggestion {
  label: string;
  lat: number;
  lon: number;
}

async function fetchGeoSuggestions(query: string, apiKey: string): Promise<Suggestion[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = encodeURIComponent(query);
  if (!apiKey) {
    // fallback to local list (no coords)
    const filtered = LOCATIONS.filter(l => l.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
    return filtered.map((label) => ({ label, lat: 0, lon: 0 }));
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${q}&limit=6&apiKey=${apiKey}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    const items = (json.features || []).map((f: any) => ({
      label: f.properties?.formatted,
      lat: f.properties?.lat,
      lon: f.properties?.lon,
    })).filter((i: any) => i.label);
    // uniq by label preserve order
    const uniq: Suggestion[] = [];
    for (const it of items) if (!uniq.find(u => u.label === it.label)) uniq.push(it);
    return uniq.slice(0, 6);
  } catch (e) {
    return [];
  }
}

export function NewTripScreen({ onNavigate }: NewTripScreenProps) {
  const { user, updateCycleHours } = useAuth();
  const { addTrip } = useTrips();

  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<Suggestion[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; geometry?: [number, number][] , pickupLocation: string, dropoffLocation: string , coords: any} | null>(null);
  const suggRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const geoApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || '';
  const [cycleHoursUsed, setCycleHoursUsed] = useState('');

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inside = (formRef.current && formRef.current.contains(target));
      if (!inside) {
        setShowCurrentSuggestions(false);
        setShowPickupSuggestions(false);
        setShowDropoffSuggestions(false);
      }
    };

    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Create / update MapLibre map when route geometry changes
  useEffect(() => {
    if (!routeInfo || !routeInfo.geometry || routeInfo.geometry.length === 0) {
      // destroy map if exists
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const coordsLatLon = routeInfo.geometry as [number, number][]; // currently [lat, lon]
    const coordsLonLat = coordsLatLon.map(([lat, lon]) => [lon, lat] as [number, number]);

    const center = coordsLonLat[Math.floor(coordsLonLat.length / 2)][0] as unknown as [number, number];
    // create map if not existing
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,        
        style: 'https://api.maptiler.com/maps/streets-v4/style.json?key='+(import.meta.env.VITE_MAPTILER_API_KEY || ''),
        center: center,        
        zoom: 9,
      });
      mapRef.current.addControl(new maplibregl.NavigationControl());
      mapRef.current.on('load', () => {
        if (!mapRef.current) return;
        // add route source/layer
        if (!mapRef.current.getSource('route')) {
          mapRef.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: routeInfo.coords[0] },
            },
          } as any);
          mapRef.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#3b82f6', 'line-width': 5 },
          });
        }
        // add markers
        const start = {lng: routeInfo.pickupLocation.lon, lat: routeInfo.pickupLocation.lat}  as unknown as [number, number];
        const end =  {lng: routeInfo.dropoffLocation.lon, lat: routeInfo.dropoffLocation.lat}  as unknown as [number, number];
        new maplibregl.Marker({ color: 'green' }).setLngLat(start).addTo(mapRef.current!);
        new maplibregl.Marker({ color: 'red' }).setLngLat(end).addTo(mapRef.current!);
        setCycleHoursUsed((routeInfo.duration).toString());
      });
    } else if (mapRef.current) {
      // update source data and fly to center
      const src = mapRef.current.getSource('route') as any | undefined;
      const data = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coordsLonLat },
      } as GeoJSON.Feature<GeoJSON.LineString>;
      if (src && (src as any).setData) {
        try { (src as any).setData(data); } catch {}
      }
      mapRef.current.flyTo({ center: coordsLonLat[Math.floor(coordsLonLat.length / 2)] as [number, number], zoom: 10 });
      // remove existing markers then add new ones
      const existing = Array.from(mapRef.current.getContainer().querySelectorAll('.maplibregl-marker'));
      existing.forEach((n) => n.remove());
      new maplibregl.Marker({ color: 'green' }).setLngLat(coordsLonLat[0] as [number, number]).addTo(mapRef.current);
      new maplibregl.Marker({ color: 'red' }).setLngLat(coordsLonLat[coordsLonLat.length - 1] as [number, number]).addTo(mapRef.current);

    }

    return () => {
      // do not remove map here to allow persistence; it will be removed when routeInfo cleared
    };
  }, [routeInfo]);

  // When pickup/dropoff selected with coords, call routing API
  useEffect(() => {
    const pickup = pickupSuggestions.find(s => s.label === pickupLocation);
    const dropoff = dropoffSuggestions.find(s => s.label === dropoffLocation);
    if (!pickup || !dropoff || !geoApiKey) {
      // clear route if missing
      setRouteInfo(null);
      return;
    }

    (async () => {
      try {
        const waypoints = `${pickup.lat},${pickup.lon}|${dropoff.lat},${dropoff.lon}`;
        const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypoints)}&mode=truck&details=route_details&apiKey=${geoApiKey}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        // Expect geometry in features[0].geometry.coordinates as [[lon,lat],...]
        const feat = json?.features && json.features[0];
        const props = feat?.properties || {};
        const dist = props?.distance || props?.distance_in_meters || 0;
        const duration = props?.time || props?.travel_time || props?.duration || 0;
        const coords = feat?.geometry?.coordinates || [];
        // coords are [lon, lat] - convert to [lat, lon] for display if needed
        const geom: [number, number][] = coords.map((c: any) => [c[1], c[0]]);
        setRouteInfo({ distance: Math.round(dist), duration: Math.round(duration / 3600 * 10) / 10, 
                    geometry: geom, pickupLocation: pickup, dropoffLocation: dropoff, coords: coords });
      } catch (e) {
        // ignore
      }
    })();
  }, [pickupLocation, dropoffLocation, pickupSuggestions, dropoffSuggestions, geoApiKey]);

  // Calculate estimated distance and duration (simplified)
  // routeInfo state is managed by routing API calls when both pickup and dropoff have coordinates

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
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 relative" ref={suggRef}>
                  <Label htmlFor="current-location" className="flex items-center gap-2">
                    <Navigation className="size-4" />
                    Current Location
                  </Label>
                  <Input
                    id="current-location"
                    value={currentLocation}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCurrentLocation(v);
                      fetchGeoSuggestions(v, geoApiKey).then((res) => { setCurrentSuggestions(res); setShowCurrentSuggestions(true); });
                    }}
                    placeholder="Start typing an address"
                    onFocus={() => { if (currentSuggestions.length) setShowCurrentSuggestions(true); }}
                  />
                  {showCurrentSuggestions && currentSuggestions.length > 0 && (
                    <div className="absolute z-40 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                      {currentSuggestions.map((s) => (
                        <div
                          key={s.label}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => { setCurrentLocation(s.label); setShowCurrentSuggestions(false); }}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="pickup-location" className="flex items-center gap-2">
                    <Package className="size-4" />
                    Pickup Location
                  </Label>
                  <Input
                    id="pickup-location"
                    value={pickupLocation}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPickupLocation(v);
                      fetchGeoSuggestions(v, geoApiKey).then((res) => { setPickupSuggestions(res); setShowPickupSuggestions(true); });
                    }}
                    placeholder="Start typing pickup address"
                    onFocus={() => { if (pickupSuggestions.length) setShowPickupSuggestions(true); }}
                  />
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute z-40 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                      {pickupSuggestions.map((s) => (
                        <div
                          key={s.label}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => { setPickupLocation(s.label); setShowPickupSuggestions(false); }}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="dropoff-location" className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    Dropoff Location
                  </Label>
                  <Input
                    id="dropoff-location"
                    value={dropoffLocation}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDropoffLocation(v);
                      fetchGeoSuggestions(v, geoApiKey).then((res) => { setDropoffSuggestions(res); setShowDropoffSuggestions(true); });
                    }}
                    placeholder="Start typing dropoff address"
                    onFocus={() => { if (dropoffSuggestions.length) setShowDropoffSuggestions(true); }}
                  />
                  {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                    <div className="absolute z-40 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                      {dropoffSuggestions.map((s) => (
                        <div
                          key={s.label}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => { setDropoffLocation(s.label); setShowDropoffSuggestions(false); }}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycle-hours" className="flex items-center gap-2">
                    <Clock className="size-4" />
                    Estimated Cycle Hours
                  </Label>
                  <Input
                    id="cycle-hours"
                    type="number"
                    step="0.1"
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
                  {routeInfo && routeInfo.geometry ? (
                    <div className="w-full h-full relative">
                      <div ref={mapContainerRef} className="w-full h-full rounded" />
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