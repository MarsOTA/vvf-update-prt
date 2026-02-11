
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StaffView } from './components/StaffView';
import { TemplateCreator } from './components/TemplateCreator';
import { OlympicGenerator } from './components/OlympicGenerator';
import { LoginScreen } from './components/LoginScreen';
import { ScreenType, UserRole, OperationalEvent } from './types';
import { MOCK_EVENTS } from './constants';

// Persistenza locale (client-side) per mantenere eventi e selezioni tra refresh.
const STORAGE_KEY = 'vvf-mi-app-state-v1';

type PersistedState = {
  events: OperationalEvent[];
  selectedDate: string;
  currentRole: UserRole;
};

const safeParse = (raw: string | null): PersistedState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { events, selectedDate, currentRole } = parsed as PersistedState;
    if (!Array.isArray(events)) return null;
    if (typeof selectedDate !== 'string') return null;
    if (typeof currentRole !== 'string') return null;
    // Non facciamo validazioni profonde: i dati arrivano da questo stesso client.
    return { events, selectedDate, currentRole };
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('DASHBOARD');
  const [currentRole, setCurrentRole] = useState<UserRole>('COMPILATORE_A');
  const [currentDate, setCurrentDate] = useState('');
  const [events, setEvents] = useState<OperationalEvent[]>(MOCK_EVENTS);
  const [selectedDate, setSelectedDate] = useState('2026-02-17');
  const [editingEvent, setEditingEvent] = useState<OperationalEvent | null>(null);

  // Hydration da LocalStorage (una sola volta)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const restored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (restored) {
      setEvents(restored.events);
      setSelectedDate(restored.selectedDate);
      setCurrentRole(restored.currentRole);
    }
  }, []);

  // Persistenza su ogni modifica rilevante
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: PersistedState = { events, selectedDate, currentRole };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Se lo storage è pieno o bloccato, ignoriamo silenziosamente.
    }
  }, [events, selectedDate, currentRole]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const dayName = now.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
      const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      setCurrentDate(`${dayName} ${formatted} • ${time}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    setActiveScreen('DASHBOARD');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveScreen('DASHBOARD');
    setEditingEvent(null);
  };

  const handleSaveEvent = (newEvent: OperationalEvent) => {
    if (editingEvent) {
      setEvents(prev => prev.map(ev => ev.id === newEvent.id ? newEvent : ev));
    } else {
      setEvents(prev => [newEvent, ...prev]);
    }
    setSelectedDate(newEvent.date);
    setActiveScreen('DASHBOARD');
    setEditingEvent(null);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setActiveScreen('DASHBOARD');
  };

  const handleStartEdit = (event: OperationalEvent) => {
    setEditingEvent(event);
    setActiveScreen('CREAZIONE');
  };

  const handleNavigateToCreate = () => {
    setEditingEvent(null);
    setActiveScreen('CREAZIONE');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-full w-full font-sans antialiased text-slate-700">
      <Layout 
        activeScreen={activeScreen} 
        setScreen={(s) => {
          if (s === 'CREAZIONE') handleNavigateToCreate();
          else setActiveScreen(s);
        }} 
        role={currentRole} 
        setRole={setCurrentRole}
        onLogout={handleLogout}
        date={currentDate}
        events={events}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      >
        {activeScreen === 'DASHBOARD' && (
          <Dashboard 
            events={events} 
            setEvents={setEvents} 
            role={currentRole} 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate}
            onEditEvent={handleStartEdit}
          />
        )}
        {activeScreen === 'STAFF' && <StaffView events={events} />}
        {activeScreen === 'CREAZIONE' && (
          <TemplateCreator 
            onSave={handleSaveEvent} 
            onCancel={handleCancelEdit}
            defaultDate={selectedDate} 
            initialEvent={editingEvent || undefined} 
          />
        )}
        {activeScreen === 'GENERATORE' && <OlympicGenerator />}
      </Layout>
    </div>
  );
};

export default App;
