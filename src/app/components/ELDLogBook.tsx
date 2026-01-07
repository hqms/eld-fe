import React from 'react';
import { ELDLog, ELDEntry } from '../contexts/TripContext';

interface ELDLogBookProps {
  log: ELDLog;
  driverName: string;
  licenseNumber: string;
}

export function ELDLogBook({ log, driverName, licenseNumber }: ELDLogBookProps) {
  // Convert time string (HH:MM) to decimal hours
  const timeToDecimal = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  // Create graph data points for the 24-hour grid
  const createGraphPoints = () => {
    const points: Array<{ x: number; y: number; status: ELDEntry['status'] }> = [];
    
    log.logs.forEach((entry) => {
      const startHour = timeToDecimal(entry.startTime);
      const endHour = timeToDecimal(entry.endTime);
      
      // Map status to y-position (1-4)
      let yPos = 1;
      switch (entry.status) {
        case 'off-duty':
          yPos = 1;
          break;
        case 'sleeper-berth':
          yPos = 2;
          break;
        case 'driving':
          yPos = 3;
          break;
        case 'on-duty-not-driving':
          yPos = 4;
          break;
      }
      
      points.push({ x: startHour, y: yPos, status: entry.status });
      points.push({ x: endHour, y: yPos, status: entry.status });
    });
    
    return points;
  };

  const graphPoints = createGraphPoints();

  // Calculate totals
  const totals = {
    offDuty: log.logs
      .filter((l) => l.status === 'off-duty')
      .reduce((sum, l) => sum + l.duration, 0),
    sleeperBerth: log.logs
      .filter((l) => l.status === 'sleeper-berth')
      .reduce((sum, l) => sum + l.duration, 0),
    driving: log.logs
      .filter((l) => l.status === 'driving')
      .reduce((sum, l) => sum + l.duration, 0),
    onDuty: log.logs
      .filter((l) => l.status === 'on-duty-not-driving')
      .reduce((sum, l) => sum + l.duration, 0),
  };

  // Calculate total miles
  const totalMiles = log.logs.length > 0 
    ? log.logs[log.logs.length - 1].odometer - log.logs[0].odometer 
    : 0;

  const getStatusColor = (status: ELDEntry['status']) => {
    switch (status) {
      case 'off-duty':
        return '#6B7280'; // gray
      case 'sleeper-berth':
        return '#9333EA'; // purple
      case 'driving':
        return '#10B981'; // green
      case 'on-duty-not-driving':
        return '#F59E0B'; // yellow
      default:
        return '#6B7280';
    }
  };

  // Create SVG path for the graph
  const createPath = () => {
    if (graphPoints.length === 0) return '';
    
    let path = '';
    for (let i = 0; i < graphPoints.length - 1; i += 2) {
      const start = graphPoints[i];
      const end = graphPoints[i + 1];
      
      if (i === 0) {
        path += `M ${start.x * 40} ${(5 - start.y) * 50}`;
      } else {
        // Connect to previous point with vertical line
        const prevEnd = graphPoints[i - 1];
        if (prevEnd.y !== start.y) {
          path += ` V ${(5 - start.y) * 50}`;
        }
      }
      
      path += ` H ${end.x * 40}`;
    }
    
    return path;
  };

  return (
    <div className="bg-white border-2 border-black p-6 print:p-4">
      {/* Header Section */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 border-b-2 border-black p-2 text-center">
          <h1 className="text-lg uppercase tracking-wide">
            Driver's Daily Log - Electronic Logging Device (ELD)
          </h1>
          <p className="text-xs mt-1">As Required by 49 CFR Part 395</p>
        </div>
        
        {/* Driver Information */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black p-2">
            <div className="mb-2">
              <span className="text-xs uppercase">Date:</span>
              <span className="ml-2 font-semibold">
                {new Date(log.date).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-xs uppercase">Driver Name:</span>
              <span className="ml-2 font-semibold">{driverName}</span>
            </div>
            <div>
              <span className="text-xs uppercase">Driver License:</span>
              <span className="ml-2 font-semibold">{licenseNumber}</span>
            </div>
          </div>
          <div className="p-2">
            <div className="mb-2">
              <span className="text-xs uppercase">Co-Driver:</span>
              <span className="ml-2">—</span>
            </div>
            <div className="mb-2">
              <span className="text-xs uppercase">Carrier Name:</span>
              <span className="ml-2 font-semibold">TruckLog Pro Transport</span>
            </div>
            <div>
              <span className="text-xs uppercase">Main Office Address:</span>
              <span className="ml-2 text-xs">123 Logistics Way, CA 90001</span>
            </div>
          </div>
        </div>

        {/* Vehicle & Route Info */}
        <div className="grid grid-cols-4 border-b border-black">
          <div className="border-r border-black p-2">
            <span className="text-xs uppercase block">Truck/Tractor #:</span>
            <span className="font-semibold">TRK-{log.driverId}01</span>
          </div>
          <div className="border-r border-black p-2">
            <span className="text-xs uppercase block">Trailer #:</span>
            <span className="font-semibold">TRL-{log.driverId}02</span>
          </div>
          <div className="border-r border-black p-2">
            <span className="text-xs uppercase block">Total Miles:</span>
            <span className="font-semibold">{totalMiles.toLocaleString()}</span>
          </div>
          <div className="p-2">
            <span className="text-xs uppercase block">ELD Device:</span>
            <span className="font-semibold">ELD-{log.id}</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Grid Graph */}
      <div className="border-2 border-black mb-4 bg-white">
        <div className="bg-gray-100 border-b-2 border-black p-2">
          <h2 className="text-sm uppercase text-center">24-Hour Period Record of Duty Status</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          {/* Graph Area */}
          <div className="relative" style={{ minWidth: '960px', height: '280px' }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 w-32 h-full border-r-2 border-black bg-gray-50">
              <div className="h-1/4 border-b border-black flex items-center justify-end pr-2">
                <span className="text-xs uppercase">On Duty Not Driving</span>
              </div>
              <div className="h-1/4 border-b border-black flex items-center justify-end pr-2">
                <span className="text-xs uppercase">Driving</span>
              </div>
              <div className="h-1/4 border-b border-black flex items-center justify-end pr-2">
                <span className="text-xs uppercase">Sleeper Berth</span>
              </div>
              <div className="h-1/4 flex items-center justify-end pr-2">
                <span className="text-xs uppercase">Off Duty</span>
              </div>
            </div>

            {/* Grid and Graph */}
            <div className="absolute left-32 top-0 right-0 h-full">
              <svg width="960" height="280" className="absolute inset-0">
                {/* Horizontal grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 70}
                    x2="960"
                    y2={i * 70}
                    stroke="black"
                    strokeWidth={i === 0 || i === 4 ? "2" : "1"}
                  />
                ))}
                
                {/* Vertical grid lines (hourly) */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 40}
                    y1="0"
                    x2={i * 40}
                    y2="280"
                    stroke="black"
                    strokeWidth={i === 0 || i === 24 ? "2" : "0.5"}
                    strokeDasharray={i % 2 === 0 ? "none" : "2,2"}
                  />
                ))}

                {/* Status change lines */}
                {log.logs.map((entry, idx) => {
                  const startHour = timeToDecimal(entry.startTime);
                  const endHour = timeToDecimal(entry.endTime);
                  let yPos = 1;
                  
                  switch (entry.status) {
                    case 'off-duty':
                      yPos = 4;
                      break;
                    case 'sleeper-berth':
                      yPos = 3;
                      break;
                    case 'driving':
                      yPos = 2;
                      break;
                    case 'on-duty-not-driving':
                      yPos = 1;
                      break;
                  }
                  
                  const y = (yPos - 0.5) * 70;
                  
                  return (
                    <g key={`entry-${idx}`}>
                      {/* Horizontal line for status duration */}
                      <line
                        x1={startHour * 40}
                        y1={y}
                        x2={endHour * 40}
                        y2={y}
                        stroke={getStatusColor(entry.status)}
                        strokeWidth="4"
                      />
                      
                      {/* Vertical connecting lines */}
                      {idx > 0 && (() => {
                        const prevEntry = log.logs[idx - 1];
                        const prevEndHour = timeToDecimal(prevEntry.endTime);
                        let prevYPos = 1;
                        
                        switch (prevEntry.status) {
                          case 'off-duty':
                            prevYPos = 4;
                            break;
                          case 'sleeper-berth':
                            prevYPos = 3;
                            break;
                          case 'driving':
                            prevYPos = 2;
                            break;
                          case 'on-duty-not-driving':
                            prevYPos = 1;
                            break;
                        }
                        
                        const prevY = (prevYPos - 0.5) * 70;
                        
                        return (
                          <line
                            x1={prevEndHour * 40}
                            y1={prevY}
                            x2={startHour * 40}
                            y2={y}
                            stroke="#000"
                            strokeWidth="2"
                            strokeDasharray="2,2"
                          />
                        );
                      })()}
                      
                      {/* Time markers */}
                      <circle
                        cx={startHour * 40}
                        cy={y}
                        r="4"
                        fill={getStatusColor(entry.status)}
                        stroke="black"
                        strokeWidth="1"
                      />
                      <circle
                        cx={endHour * 40}
                        cy={y}
                        r="4"
                        fill={getStatusColor(entry.status)}
                        stroke="black"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* X-axis hour labels */}
              <div className="absolute bottom-0 left-0 right-0 flex border-t-2 border-black bg-gray-50">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs py-1 border-r border-gray-300"
                    style={{ minWidth: '40px' }}
                  >
                    {i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-4 border-2 border-black mb-4">
        <div className="border-r border-black p-3 text-center">
          <div className="text-xs uppercase mb-1">Off Duty</div>
          <div className="text-xl">{totals.offDuty.toFixed(1)}</div>
          <div className="text-xs text-gray-600">hours</div>
        </div>
        <div className="border-r border-black p-3 text-center">
          <div className="text-xs uppercase mb-1">Sleeper Berth</div>
          <div className="text-xl">{totals.sleeperBerth.toFixed(1)}</div>
          <div className="text-xs text-gray-600">hours</div>
        </div>
        <div className="border-r border-black p-3 text-center">
          <div className="text-xs uppercase mb-1">Driving</div>
          <div className="text-xl">{totals.driving.toFixed(1)}</div>
          <div className="text-xs text-gray-600">hours</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-xs uppercase mb-1">On Duty Not Driving</div>
          <div className="text-xl">{totals.onDuty.toFixed(1)}</div>
          <div className="text-xs text-gray-600">hours</div>
        </div>
      </div>

      {/* Detailed Log Entries */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 border-b-2 border-black">
          <div className="grid grid-cols-12 text-xs uppercase">
            <div className="col-span-1 border-r border-black p-2 text-center">Time</div>
            <div className="col-span-2 border-r border-black p-2 text-center">Status</div>
            <div className="col-span-3 border-r border-black p-2 text-center">Location</div>
            <div className="col-span-2 border-r border-black p-2 text-center">Odometer</div>
            <div className="col-span-2 border-r border-black p-2 text-center">Eng. Hrs</div>
            <div className="col-span-2 p-2 text-center">Remarks</div>
          </div>
        </div>
        <div className="divide-y divide-gray-300 max-h-96 overflow-y-auto">
          {log.logs.map((entry, idx) => (
            <div key={entry.id} className="grid grid-cols-12 text-xs">
              <div className="col-span-1 border-r border-gray-300 p-2 text-center">
                {entry.startTime}
              </div>
              <div className="col-span-2 border-r border-gray-300 p-2">
                <div
                  className="inline-block px-2 py-1 rounded text-white text-xs"
                  style={{ backgroundColor: getStatusColor(entry.status) }}
                >
                  {entry.status === 'off-duty' && 'OFF'}
                  {entry.status === 'sleeper-berth' && 'SB'}
                  {entry.status === 'driving' && 'D'}
                  {entry.status === 'on-duty-not-driving' && 'ON'}
                </div>
              </div>
              <div className="col-span-3 border-r border-gray-300 p-2 truncate">
                {entry.location}
              </div>
              <div className="col-span-2 border-r border-gray-300 p-2 text-center">
                {entry.odometer.toLocaleString()}
              </div>
              <div className="col-span-2 border-r border-gray-300 p-2 text-center">
                {entry.engineHours.toLocaleString()}
              </div>
              <div className="col-span-2 p-2 truncate text-gray-600">
                {entry.notes || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certification */}
      <div className="border-2 border-black p-4">
        <div className="mb-4">
          <h3 className="text-sm uppercase mb-2">Driver Certification</h3>
          <p className="text-xs mb-4">
            I hereby certify that my data entries and my record of duty status for this 24-hour
            period are true and correct.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="border-b-2 border-black h-12 mb-1"></div>
              <span className="text-xs">Driver Signature</span>
            </div>
            <div>
              <div className="border-b-2 border-black h-12 mb-1 flex items-end pb-2">
                <span>{new Date(log.date).toLocaleDateString()}</span>
              </div>
              <span className="text-xs">Date</span>
            </div>
          </div>
        </div>

        {/* Compliance Information */}
        <div className="bg-gray-50 border border-gray-300 p-3 mt-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="uppercase text-gray-600">HOS Compliance:</span>
              <span className="ml-2 font-semibold">
                {totals.driving <= 11 ? '✓ Compliant' : '⚠ Violation - Driving exceeds 11 hours'}
              </span>
            </div>
            <div>
              <span className="uppercase text-gray-600">ELD Provider:</span>
              <span className="ml-2 font-semibold">TruckLog Pro ELD System</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Generated per FMCSA 49 CFR Part 395 - Hours of Service of Drivers
          </div>
        </div>
      </div>
    </div>
  );
}
