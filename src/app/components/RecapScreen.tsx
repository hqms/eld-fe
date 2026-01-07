import React, { useState } from 'react';
import { ArrowLeft, Calendar, FileText, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useTrips, ELDEntry } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import { ELDLogBook } from './ELDLogBook';

interface RecapScreenProps {
  onNavigate: (screen: 'main' | 'new-trip' | 'recap' | 'activity') => void;
}

export function RecapScreen({ onNavigate }: RecapScreenProps) {
  const { eldLogs } = useTrips();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(eldLogs[0]?.date || '');

  const selectedLog = eldLogs.find((log) => log.date === selectedDate);

  const getStatusLabel = (status: ELDEntry['status']) => {
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

  const getStatusColor = (status: ELDEntry['status']) => {
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

  // Calculate daily totals
  const dailyTotals = selectedLog
    ? {
        driving: selectedLog.logs
          .filter((log) => log.status === 'driving')
          .reduce((sum, log) => sum + log.duration, 0),
        onDuty: selectedLog.logs
          .filter((log) => log.status === 'on-duty-not-driving')
          .reduce((sum, log) => sum + log.duration, 0),
        offDuty: selectedLog.logs
          .filter((log) => log.status === 'off-duty')
          .reduce((sum, log) => sum + log.duration, 0),
        sleeperBerth: selectedLog.logs
          .filter((log) => log.status === 'sleeper-berth')
          .reduce((sum, log) => sum + log.duration, 0),
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => onNavigate('main')}>
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl">ELD Logs</h1>
                <p className="text-sm text-gray-500">Daily Log Recap</p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              Select Date
            </CardTitle>
            <CardDescription>Choose a date to view ELD logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select a date" />
              </SelectTrigger>
              <SelectContent>
                {eldLogs.map((log) => (
                  <SelectItem key={log.id} value={log.date}>
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedLog ? (
          <>
            {/* Daily Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Daily Summary</CardTitle>
                <CardDescription>
                  {new Date(selectedLog.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Driving</p>
                    <p className="text-2xl mt-1">
                      {dailyTotals?.driving.toFixed(1)} hrs
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-600">On Duty</p>
                    <p className="text-2xl mt-1">
                      {dailyTotals?.onDuty.toFixed(1)} hrs
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Off Duty</p>
                    <p className="text-2xl mt-1">
                      {dailyTotals?.offDuty.toFixed(1)} hrs
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600">Sleeper Berth</p>
                    <p className="text-2xl mt-1">
                      {dailyTotals?.sleeperBerth.toFixed(1)} hrs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed View - FMCSA Log Book and Details */}
            <Tabs defaultValue="logbook" className="w-full">
              <TabsList className="grid w-full md:w-96 grid-cols-2">
                <TabsTrigger value="logbook">FMCSA Log Book</TabsTrigger>
                <TabsTrigger value="details">Detailed Table</TabsTrigger>
              </TabsList>
              
              <TabsContent value="logbook" className="mt-6">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <ELDLogBook 
                        log={selectedLog} 
                        driverName={user?.name || ''} 
                        licenseNumber={user?.licenseNumber || ''} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="size-5" />
                      Electronic Logging Device (ELD) Log Sheet
                    </CardTitle>
                    <CardDescription>
                      Driver: {user?.name} | License: {user?.licenseNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-24">Start Time</TableHead>
                            <TableHead className="w-24">End Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="w-24 text-right">Duration</TableHead>
                            <TableHead className="w-28 text-right">Odometer</TableHead>
                            <TableHead className="w-32 text-right">Engine Hours</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLog.logs.map((entry) => (
                            <TableRow key={entry.id} className="hover:bg-gray-50">
                              <TableCell>{entry.startTime}</TableCell>
                              <TableCell>{entry.endTime}</TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getStatusColor(entry.status)} text-white`}
                                >
                                  {getStatusLabel(entry.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {entry.location}
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.duration.toFixed(1)} hrs
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.odometer.toLocaleString()} mi
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.engineHours.toLocaleString()} hrs
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {entry.notes || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Log Footer */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Entries</p>
                          <p className="mt-1">{selectedLog.logs.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Driving Time</p>
                          <p className="mt-1">
                            {dailyTotals?.driving.toFixed(1)} hours
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Compliance Status</p>
                          <p className="mt-1 text-green-600">
                            {dailyTotals && dailyTotals.driving <= 11
                              ? '✓ Compliant'
                              : '⚠ Review Required'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          This log is generated in accordance with FMCSA ELD regulations (49 CFR Part 395).
                          Driver signature and certification required for official submission.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="size-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No logs available for selected date</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}