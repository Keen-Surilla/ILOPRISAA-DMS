import React, { useState, useEffect } from 'react';
import { Calendar, Users, LayoutDashboard, Settings, Plus, FileText, Clock, Bell, X, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { calendarApi } from '../../3-data-tier/api/calendarApi';
import type { CalendarEvent } from '../../3-data-tier/api/calendarApi';
import { PortalShell } from '../components/layout/PortalShell';
import { EventCalendar } from '../components/calendar/EventCalendar';

export default function CoachDashboard() {
  const authStore = useAuthStore();
  const user = authStore?.user;
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('schedule');
  
  // MODAL STATES (Now includes status)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', type: 'event', status: 'Pending' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const profileName = user?.full_name || user?.email || 'Coach Profile';
  const profileSport = (user as Record<string, any>)?.sport || 'Unassigned';

  useEffect(() => {
    let isMounted = true;
    calendarApi.getEvents().then(data => {
      if (isMounted) {
        setEvents(Array.isArray(data) ? data : []);
        setIsLoading(false);
      }
    }).catch(err => {
      console.error("Failed to load events:", err);
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

// Include both events and meetings in this panel!
  const upcomingEvents = Array.isArray(events) ? events.filter(e => e?.type === 'event' || e?.type === 'meeting').slice(0, 3) : [];
  const upcomingDeadlines = Array.isArray(events) ? events.filter(e => e?.type === 'deadline').slice(0, 4) : [];

  const handleOpenNew = () => {
    setEditingId(null);
    setNewEvent({ title: '', date: '', time: '', type: 'event', status: 'Pending' });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (eventToEdit: CalendarEvent) => {
    setEditingId(eventToEdit.id);
    setNewEvent({ 
      title: eventToEdit.title, 
      date: eventToEdit.event_date, 
      time: eventToEdit.event_time, 
      type: eventToEdit.type,
      status: eventToEdit.status || 'Pending' // Load real status
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (editingId) {
        const updatedEvent = await calendarApi.updateEvent(editingId, {
          title: newEvent.title,
          event_date: newEvent.date,
          event_time: newEvent.time,
          type: newEvent.type as 'event' | 'deadline',
          status: newEvent.status as 'Pending' | 'Completed'
        });
        if (updatedEvent) {
          setEvents(prev => prev.map(ev => ev.id === editingId ? updatedEvent : ev));
        }
      } else {
        const currentUserId = user?.id || '00000000-0000-0000-0000-000000000000';
        const createdEvent = await calendarApi.addEvent({
          title: newEvent.title,
          event_date: newEvent.date,
          event_time: newEvent.time,
          type: newEvent.type as 'event' | 'deadline',
          status: newEvent.status as 'Pending' | 'Completed',
          user_id: currentUserId
        });
        if (createdEvent) setEvents(prev => [...prev, createdEvent]);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMessage(error?.message || "An unexpected error occurred while saving.");
    }
  };

  // Calendar specific delete handler
  const handleDeleteFromCalendar = async (eventId: string): Promise<boolean> => {
    try {
      await calendarApi.deleteEvent(eventId);
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
      return true;
    } catch (error) {
      console.error("Failed to delete from calendar", error);
      return false;
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingId) return;
    setErrorMessage(null);
    try {
      await calendarApi.deleteEvent(editingId);
      setEvents(prev => prev.filter(ev => ev.id !== editingId));
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to delete the event.");
    }
  };

  return (
    <PortalShell
      portalTitle="Coach Portal"
      navItems={[
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: activeTab === 'dashboard', onClick: () => setActiveTab('dashboard') },
        { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" />, active: activeTab === 'schedule', onClick: () => setActiveTab('schedule') },
        { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, active: activeTab === 'team', onClick: () => setActiveTab('team') },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, active: activeTab === 'settings', onClick: () => setActiveTab('settings') },
      ]}
    >
      <div className="p-8 max-w-7xl mx-auto font-sans text-slate-900 relative">
        
        {/* Header Section */}
        <div className="flex justify-end items-center gap-6 mb-8">
          <button className="text-slate-800 hover:text-blue-600 transition-colors">
            <Bell className="w-5 h-5 fill-current" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
              <span className="text-slate-600 font-bold text-sm uppercase">{profileName ? profileName.charAt(0) : 'C'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 leading-tight">{profileName}</span>
              <span className="text-[10px] font-medium text-slate-500 capitalize">{profileSport}</span>
            </div>
          </div>
        </div>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Start your Journey</h2>
            <p className="text-slate-500 text-sm mt-1">View important deadlines, events, and reminders related to your documents.</p>
          </div>
          <button 
            onClick={handleOpenNew}
            className="bg-[#0f172a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
          >Add event
          </button>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <EventCalendar 
              events={events as any} 
              isLoading={isLoading} 
              onMonthChange={(_y, _m) => {}} 
              // WIRED UP CALENDAR ACTIONS
              canManage={true}
              onDelete={handleDeleteFromCalendar}
              onEdit={(ev: any) => handleOpenEdit(ev)} 
            />
          </div>

          {/* Right Column: Widgets */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-5">Upcoming Events</h3>
              <ul className="space-y-4">
                {upcomingEvents.length === 0 && <p className="text-xs text-slate-400">No upcoming events.</p>}
                {upcomingEvents.map(evt => (
                  <li 
                    key={evt?.id || Math.random()} 
                    onClick={() => handleOpenEdit(evt)}
                    className="flex gap-4 items-start cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -ml-2"
                  >
                    <div className="bg-[#0f172a] text-white rounded-md w-10 h-10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold">{evt?.event_date ? new Date(evt.event_date).getDate() : ''}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{evt?.title}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" /> {evt?.event_time}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-5">Upcoming Deadline</h3>
              <ul className="space-y-4">
                {upcomingDeadlines.length === 0 && <p className="text-xs text-slate-400">No deadlines.</p>}
                {upcomingDeadlines.map(deadline => (
                  <li 
                    key={deadline?.id || Math.random()} 
                    onClick={() => handleOpenEdit(deadline)}
                    className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -ml-2"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{deadline?.title}</span>
                    </div>
                    {/* DYNAMIC STATUS BADGE */}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      deadline?.status === 'Completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {deadline?.status || 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* --- ADD/EDIT EVENT MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Schedule' : 'Add New Schedule'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>
              
              <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                    {errorMessage}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                    <input type="time" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                    <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600 bg-white">
                      <option value="event">General Event </option>
                      <option value="meeting">Meeting </option>
                      <option value="deadline">Document Deadline </option>
                    </select>
                  </div>
                  {/* NEW STATUS DROPDOWN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600 bg-white">
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 justify-between items-center border-t border-slate-100 mt-4">
                  {editingId ? (
                    <button type="button" onClick={handleDeleteEvent} className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  ) : <div></div>}
                  
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/20">
                      {editingId ? 'Save Changes' : 'Save Schedule'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PortalShell>
  );
}