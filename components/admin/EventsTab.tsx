'use client';

import React from 'react';
import { Clock, MapPin, Edit2, Trash2 } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  category: 'academic' | 'sports' | 'cultural' | 'other';
  created_at?: string;
}

interface EventsTabProps {
  filteredEvents: EventItem[];
  openEditModal: (event: EventItem) => void;
  handleDelete: (id: string, type: 'posts' | 'events') => void;
}

export default function EventsTab({
  filteredEvents,
  openEditModal,
  handleDelete
}: EventsTabProps) {
  return (
    <div className="overflow-x-auto" id="events-table-container">
      <table className="w-full text-left border-collapse" id="events-table">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Event Showcase</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Category</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Date & Time</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Location</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right font-mono">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <tr id="empty-events">
              <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                No events scheduled. Click &quot;Create New&quot; to organize an event.
              </td>
            </tr>
          ) : (
            filteredEvents.map((evt) => (
              <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors" id={`event-row-${evt.id}`}>
                <td className="p-4 max-w-sm">
                  <div className="font-semibold text-slate-900 text-sm">{evt.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{evt.description || 'No description'}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase ${
                    evt.category === 'academic' ? 'bg-blue-50 text-blue-700' :
                    evt.category === 'sports' ? 'bg-amber-50 text-amber-700' :
                    evt.category === 'cultural' ? 'bg-purple-50 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {evt.category}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm text-slate-700 font-medium flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    {evt.time || 'All Day'}
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{evt.location || 'Main Campus'}</span>
                  </div>
                </td>
                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => openEditModal(evt)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all inline-block"
                    title="Edit Event"
                    id={`edit-event-btn-${evt.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id, 'events')}
                    className="p-1.5 text-red-600 hover:text-red-950 hover:bg-red-50 rounded-lg transition-all inline-block"
                    title="Delete Event"
                    id={`delete-event-btn-${evt.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
