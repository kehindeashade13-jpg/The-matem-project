'use client';

import React from 'react';
import { Mail, Phone, Eye } from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  arm: 'private-school' | 'college';
  purpose: 'admission' | 'general' | 'complaint' | 'other';
  message: string;
  status: 'pending' | 'contacted' | 'resolved';
  created_at?: string;
}

interface InquiriesTabProps {
  filteredInquiries: Inquiry[];
  handleInquiryStatusChange: (id: string, status: 'pending' | 'contacted' | 'resolved') => void;
  openViewInquiry: (inq: Inquiry) => void;
}

export default function InquiriesTab({
  filteredInquiries,
  handleInquiryStatusChange,
  openViewInquiry
}: InquiriesTabProps) {
  return (
    <div className="overflow-x-auto" id="inquiries-table-container">
      <table className="w-full text-left border-collapse" id="inquiries-table">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Student Details</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Purpose & Arm</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Message Summary</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Follow-Up Status</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right font-mono">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredInquiries.length === 0 ? (
            <tr id="empty-inquiries">
              <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                No inquiries found matching the search parameters.
              </td>
            </tr>
          ) : (
            filteredInquiries.map((inq) => (
              <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors" id={`inquiry-row-${inq.id}`}>
                <td className="p-4">
                  <div className="font-semibold text-slate-900 text-sm">{inq.name}</div>
                  <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[150px]">{inq.email}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{inq.phone || 'No phone'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-slate-100 text-slate-700">
                    {inq.purpose}
                  </span>
                  <div className="text-xs font-medium text-slate-500 capitalize mt-1">
                    {inq.arm === 'private-school' ? 'Matem Private School' : 'Matem College'}
                  </div>
                </td>
                <td className="p-4 max-w-xs">
                  <p className="text-sm text-slate-600 line-clamp-2">{inq.message}</p>
                </td>
                <td className="p-4">
                  <select
                    value={inq.status}
                    onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      inq.status === 'resolved'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : inq.status === 'contacted'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                    id={`inquiry-status-select-${inq.id}`}
                  >
                    <option value="pending">● Pending</option>
                    <option value="contacted">● Contacted</option>
                    <option value="resolved">● Resolved</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => openViewInquiry(inq)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                    title="Review Complete Details"
                    id={`view-inquiry-btn-${inq.id}`}
                  >
                    <Eye className="w-4 h-4" />
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
