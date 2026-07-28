'use client';

import React from 'react';
import Image from 'next/image';
import { Edit2, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  category: 'School News' | 'Academic Achievements' | 'Announcements' | 'Notices';
  excerpt: string;
  content: string;
  date: string;
  image: string;
  author: string;
  created_at?: string;
}

interface PostsTabProps {
  filteredPosts: Post[];
  openEditModal: (post: Post) => void;
  handleDelete: (id: string, type: 'posts' | 'events') => void;
}

export default function PostsTab({
  filteredPosts,
  openEditModal,
  handleDelete
}: PostsTabProps) {
  return (
    <div className="overflow-x-auto" id="posts-table-container">
      <table className="w-full text-left border-collapse" id="posts-table">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Cover & Article</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Category</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Publish Date</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Author</th>
            <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right font-mono">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredPosts.length === 0 ? (
            <tr id="empty-posts">
              <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                No blog articles found. Click &quot;Create New&quot; to write one.
              </td>
            </tr>
          ) : (
            filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-slate-50/50 transition-colors" id={`post-row-${post.id}`}>
                <td className="p-4 flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                    <Image
                      src={post.image || 'https://picsum.photos/seed/school/800/600'}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate max-w-sm">{post.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">{post.excerpt || 'No excerpt'}</div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {post.category}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-600 font-mono">
                  {post.date}
                </td>
                <td className="p-4 text-sm text-slate-600 font-medium">
                  {post.author || 'Admin'}
                </td>
                <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => openEditModal(post)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all inline-block"
                    title="Edit Article"
                    id={`edit-post-btn-${post.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id, 'posts')}
                    className="p-1.5 text-red-600 hover:text-red-950 hover:bg-red-50 rounded-lg transition-all inline-block"
                    title="Delete Article"
                    id={`delete-post-btn-${post.id}`}
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
