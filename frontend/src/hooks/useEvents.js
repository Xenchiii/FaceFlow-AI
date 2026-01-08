import { useEffect, useState } from 'react';
import { INITIAL_EVENTS } from '../utils/constants';

export const useEvents = () => {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('faceflow_events');
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        setEvents(parsed);
        if (parsed.length > 0) {
          setCurrentEvent(parsed[0]);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setEvents(INITIAL_EVENTS);
        setCurrentEvent(INITIAL_EVENTS[0]);
      }
    } else {
      setEvents(INITIAL_EVENTS);
      setCurrentEvent(INITIAL_EVENTS[0]);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('faceflow_events', JSON.stringify(events));
    }
  }, [events]);

  const selectEvent = (event) => {
    setCurrentEvent(event);
  };

  const addEvent = (newEvent) => {
    const event = {
      ...newEvent,
      id: Date.now(),
      date: newEvent.date || new Date().toISOString(),
    };
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (id, updatedData) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, ...updatedData } : event
      )
    );
  };

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const getEventById = (id) => {
    return events.find((event) => event.id === id);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getPastEvents = () => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.date) <= now)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return {
    events,
    currentEvent,
    loading,
    error,
    selectEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getUpcomingEvents,
    getPastEvents,
  };
};

export default useEvents;