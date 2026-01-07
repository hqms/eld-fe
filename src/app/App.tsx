import React, { useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TripProvider } from './contexts/TripContext';
import { LoginScreen } from './components/LoginScreen';
import { MainScreen } from './components/MainScreen';
import { NewTripScreen } from './components/NewTripScreen';
import { RecapScreen } from './components/RecapScreen';
import { ActivityScreen } from './components/ActivityScreen';

type Screen = 'main' | 'new-trip' | 'recap' | 'activity';

function AppContent() {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  if (!user) {
    return <LoginScreen />;
  }

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  return (
    <>
      {currentScreen === 'main' && <MainScreen onNavigate={handleNavigate} />}
      {currentScreen === 'new-trip' && <NewTripScreen onNavigate={handleNavigate} />}
      {currentScreen === 'recap' && <RecapScreen onNavigate={handleNavigate} />}
      {currentScreen === 'activity' && <ActivityScreen onNavigate={handleNavigate} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <AppContent />
        <Toaster />
      </TripProvider>
    </AuthProvider>
  );
}