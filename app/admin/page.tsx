'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock, LayoutDashboard, Newspaper, Calendar,
  MessageSquare, Plus, Trash2, Edit2, Eye, EyeOff, CheckCircle,
  X, RefreshCw, Loader2, Sparkles, UserCheck, AlertCircle,
  Search, Filter, ExternalLink, LogOut, Mail, Phone, MapPin, Clock, BookOpen,
  Home, ArrowLeft, Images, Upload
} from 'lucide-react';

import { supabase, supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const InquiriesTab = dynamic(() => import('@/components/admin/InquiriesTab'), { ssr: false });
const PostsTab = dynamic(() => import('@/components/admin/PostsTab'), { ssr: false });
const EventsTab = dynamic(() => import('@/components/admin/EventsTab'), { ssr: false });
const CarouselsTab = dynamic(() => import('@/components/admin/CarouselsTab'), { ssr: false });

// TypeScript Interfaces matching the requested Database Schema
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

export default function AdminPage() {
  // Authentication states
  const [session, setSession] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const localSession = sessionStorage.getItem('matem_admin_session');
      if (localSession) {
        try {
          return JSON.parse(localSession);
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  });
  const [checkingSession, setCheckingSession] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // App state
  const [activeTab, setActiveTab] = useState<'inquiries' | 'posts' | 'events' | 'carousels'>('inquiries');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Carousels State
  const getStateKey = (key: string): string => {
    if (key === 'default' || key === 'carousel') return 'carousel';
    if (key === 'academicAchievement') return 'carouselAcademicAchievement';
    if (key === 'nurseryPrimary') return 'carouselNurseryPrimary';
    if (key === 'secondary') return 'carouselSecondary';
    if (key === 'gallery') return 'carouselGallery';
    if (key === 'event') return 'carouselEvent';
    if (key === 'ictRobotics') return 'carouselIctRobotics';
    if (key === 'classicScience') return 'carouselClassicScience';
    if (key === 'physicalLibrary') return 'carouselPhysicalLibrary';
    if (key === 'crechePlayground') return 'carouselCrechePlayground';
    if (key === 'modernClinic') return 'carouselModernClinic';
    if (key === 'sportsGala') return 'carouselSportsGala';
    if (key === 'graduationGala') return 'carouselGraduationGala';
    return `carousel${key.charAt(0).toUpperCase() + key.slice(1)}`;
  };

  const [carouselsData, setCarouselsData] = useState<any>({
    carousel: { images: [], intervalSeconds: 5 },
    carouselNurseryPrimary: { images: [], intervalSeconds: 5 },
    carouselSecondary: { images: [], intervalSeconds: 5 },
    carouselGallery: { images: [], intervalSeconds: 5 },
    carouselAcademicAchievement: { images: [], intervalSeconds: 5 },
    carouselIctRobotics: { images: [], intervalSeconds: 5 },
    carouselClassicScience: { images: [], intervalSeconds: 5 },
    carouselPhysicalLibrary: { images: [], intervalSeconds: 5 },
    carouselCrechePlayground: { images: [], intervalSeconds: 5 },
    carouselModernClinic: { images: [], intervalSeconds: 5 },
    carouselEvent: { images: [], intervalSeconds: 5 },
    carouselSportsGala: { images: [], intervalSeconds: 5 },
    carouselGraduationGala: { images: [], intervalSeconds: 5 }
  });
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [dragOverSections, setDragOverSections] = useState<Record<string, boolean>>({});
  const [isSavingCarouselConfig, setIsSavingCarouselConfig] = useState(false);
  const [showProceedOptions, setShowProceedOptions] = useState(false);

  // Data states
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'resolved'>('all');
  const [categoryPostFilter, setCategoryPostFilter] = useState<'all' | 'School News' | 'Academic Achievements' | 'Announcements' | 'Notices'>('all');
  const [categoryEventFilter, setCategoryEventFilter] = useState<'all' | 'academic' | 'sports' | 'cultural' | 'other'>('all');

  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create_post' | 'edit_post' | 'create_event' | 'edit_event' | 'view_inquiry'>('create_post');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Post form fields
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<'School News' | 'Academic Achievements' | 'Announcements' | 'Notices'>('School News');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postDate, setPostDate] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postAuthor, setPostAuthor] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Event form fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCategory, setEventCategory] = useState<'academic' | 'sports' | 'cultural' | 'other'>('academic');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Monitor auth status
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
      if (sbSession) {
        setSession(sbSession);
      }
      setCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sbSession) => {
      if (sbSession) {
        setSession(sbSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clear session on unmount / navigating away from the admin portal
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
        sessionStorage.removeItem('matem_admin_session');
        if (isSupabaseConfigured) {
          supabase.auth.signOut();
        }
      }
    };
  }, []);

  // Fetch data when session changes or tab changes or trigger fires
  useEffect(() => {
    if (!session) return;
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setFeedbackMsg(null);
      try {
        if (!isSupabaseConfigured) {
          const res = await fetch(`/api/db?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setInquiries(data.inquiries || []);
              setPosts(data.posts || []);
              setEvents(data.events || []);
              setCarouselsData({
                carousel: data.carousel || { images: [], intervalSeconds: 5 },
                carouselNurseryPrimary: data.carouselNurseryPrimary || { images: [], intervalSeconds: 5 },
                carouselSecondary: data.carouselSecondary || { images: [], intervalSeconds: 5 },
                carouselGallery: data.carouselGallery || { images: [], intervalSeconds: 5 },
                carouselAcademicAchievement: data.carouselAcademicAchievement || { images: [], intervalSeconds: 5 },
                carouselIctRobotics: data.carouselIctRobotics || { images: [], intervalSeconds: 5 },
                carouselClassicScience: data.carouselClassicScience || { images: [], intervalSeconds: 5 },
                carouselPhysicalLibrary: data.carouselPhysicalLibrary || { images: [], intervalSeconds: 5 },
                carouselCrechePlayground: data.carouselCrechePlayground || { images: [], intervalSeconds: 5 },
                carouselModernClinic: data.carouselModernClinic || { images: [], intervalSeconds: 5 },
                carouselEvent: data.carouselEvent || { images: [], intervalSeconds: 5 },
                carouselSportsGala: data.carouselSportsGala || { images: [], intervalSeconds: 5 },
                carouselGraduationGala: data.carouselGraduationGala || { images: [], intervalSeconds: 5 }
              });
            }
          }
          return;
        }

        if (activeTab === 'inquiries') {
          const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (isMounted) setInquiries(data || []);
        } else if (activeTab === 'posts') {
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('date', { ascending: false });
          if (error) throw error;
          if (isMounted) setPosts(data || []);
        } else if (activeTab === 'events') {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });
          if (error) throw error;
          if (isMounted) setEvents(data || []);
        } else if (activeTab === 'carousels') {
          const res = await fetch(`/api/db?t=${Date.now()}`);
          if (res.ok) {
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (isMounted) {
              setCarouselsData({
                carousel: data.carousel || { images: [], intervalSeconds: 5 },
                carouselNurseryPrimary: data.carouselNurseryPrimary || { images: [], intervalSeconds: 5 },
                carouselSecondary: data.carouselSecondary || { images: [], intervalSeconds: 5 },
                carouselGallery: data.carouselGallery || { images: [], intervalSeconds: 5 },
                carouselAcademicAchievement: data.carouselAcademicAchievement || { images: [], intervalSeconds: 5 },
                carouselIctRobotics: data.carouselIctRobotics || { images: [], intervalSeconds: 5 },
                carouselClassicScience: data.carouselClassicScience || { images: [], intervalSeconds: 5 },
                carouselPhysicalLibrary: data.carouselPhysicalLibrary || { images: [], intervalSeconds: 5 },
                carouselCrechePlayground: data.carouselCrechePlayground || { images: [], intervalSeconds: 5 },
                carouselModernClinic: data.carouselModernClinic || { images: [], intervalSeconds: 5 },
                carouselEvent: data.carouselEvent || { images: [], intervalSeconds: 5 },
                carouselSportsGala: data.carouselSportsGala || { images: [], intervalSeconds: 5 },
                carouselGraduationGala: data.carouselGraduationGala || { images: [], intervalSeconds: 5 }
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          setFeedbackMsg({ type: 'error', text: err.message || 'Failed to sync data with DB.' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [session, activeTab, refreshTrigger]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all email and password fields.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      // Check for default admin preview credentials first
      if (email.trim().toLowerCase() === 'admin@matemschools.edu' && password === 'admin123') {
        const demoSession = { user: { email: 'admin@matemschools.edu', role: 'admin' } };
        setSession(demoSession);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('matem_admin_session', JSON.stringify(demoSession));
        }
        setFeedbackMsg({ type: 'success', text: 'Welcome to the Admin Workspace!' });
        return;
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        if (typeof window !== 'undefined' && data.session) {
          sessionStorage.setItem('matem_admin_session', JSON.stringify(data.session));
        }
      } else {
        setAuthError('Invalid credentials. Use admin@matemschools.edu and password: admin123');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      setSession(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('matem_admin_session');
      }
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Carousel helper functions
  const handleSaveCarousel = async (key: string, images: string[], intervalSeconds: number) => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_carousel',
          payload: { key, images, intervalSeconds }
        })
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (response.ok && data.success) {
        setFeedbackMsg({ type: 'success', text: 'Carousel updated successfully!' });
        
        const stateKey = getStateKey(key);
        
        setCarouselsData((prev: any) => ({
          ...prev,
          [stateKey]: { images, intervalSeconds }
        }));
      } else {
        throw new Error(data.error || 'Failed to update carousel');
      }
    } catch (error: any) {
      console.error('Error updating carousel:', error);
      setFeedbackMsg({ type: 'error', text: error.message || 'Error updating carousel' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (key: string, file: File) => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      let imageUrl = '';
      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `carousels/${cleanFileName}`;

          const { data, error } = await supabase.storage
            .from('school-media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('school-media')
            .getPublicUrl(filePath);

          if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to retrieve public URL from Supabase storage.');
          }

          imageUrl = urlData.publicUrl;
        } catch (supabaseErr: any) {
          console.log('Supabase direct upload failed, falling back to api upload:', supabaseErr);
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok || !data.url) {
            throw new Error(data.error || 'Failed to upload image file');
          }
          imageUrl = data.url;
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Failed to upload image file');
        }
        imageUrl = data.url;
      }

      const stateKey = getStateKey(key);
      const currentImages = carouselsData[stateKey]?.images || [];
      const updatedImages = [...currentImages, imageUrl];
      
      await handleSaveCarousel(key, updatedImages, carouselsData[stateKey]?.intervalSeconds || 5);
      setFeedbackMsg({ type: 'success', text: 'Image uploaded and carousel updated successfully!' });
    } catch (err: any) {
      console.error('Upload error:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to upload image.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPostImage = async (file: File) => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      let imageUrl = '';
      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `carousels/${cleanFileName}`;

          const { data, error } = await supabase.storage
            .from('school-media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('school-media')
            .getPublicUrl(filePath);

          if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to retrieve public URL from Supabase storage.');
          }

          imageUrl = urlData.publicUrl;
        } catch (supabaseErr: any) {
          console.log('Supabase direct upload failed for article image, falling back to local api upload:', supabaseErr);
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok || !data.url) {
            throw new Error(data.error || 'Failed to upload image file locally');
          }
          imageUrl = data.url;
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Failed to upload image file locally');
        }
        imageUrl = data.url;
      }

      setPostImage(imageUrl);
      setFeedbackMsg({ type: 'success', text: 'Article cover image uploaded successfully!' });
    } catch (err: any) {
      console.error('Upload error:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to upload image.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCarouselImage = async (key: string, indexToDelete: number) => {
    const stateKey = getStateKey(key);
    const currentImages = carouselsData[stateKey]?.images || [];
    const updatedImages = currentImages.filter((_: any, idx: number) => idx !== indexToDelete);
    await handleSaveCarousel(key, updatedImages, carouselsData[stateKey]?.intervalSeconds || 5);
  };

  const handleAddCarouselImageByLink = async (key: string, url: string) => {
    if (!url) return;
    const stateKey = getStateKey(key);
    const currentImages = carouselsData[stateKey]?.images || [];
    const updatedImages = [...currentImages, url];
    await handleSaveCarousel(key, updatedImages, carouselsData[stateKey]?.intervalSeconds || 5);
  };

  const handleChangeCarouselInterval = async (key: string, interval: number) => {
    const stateKey = getStateKey(key);
    const currentImages = carouselsData[stateKey]?.images || [];
    await handleSaveCarousel(key, currentImages, interval);
  };

  const handleSaveAndProceed = async () => {
    setIsSavingCarouselConfig(true);
    setFeedbackMsg(null);
    try {
      // Small simulated delay to represent a thorough checklist save and verification sequence
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowProceedOptions(true);
      setFeedbackMsg({ type: 'success', text: 'All carousel configurations saved, verified, and active on the storefront!' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'An unexpected error occurred during configuration verification.' });
    } finally {
      setIsSavingCarouselConfig(false);
    }
  };

  // Clear modal fields helper
  const resetFormFields = () => {
    setPostTitle('');
    setPostCategory('School News');
    setPostExcerpt('');
    setPostContent('');
    setPostDate(new Date().toISOString().split('T')[0]);
    setPostImage('');
    setPostAuthor('Admin');
    setSelectedPostId(null);

    setEventTitle('');
    setEventDescription('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventTime('');
    setEventLocation('');
    setEventCategory('academic');
    setSelectedEventId(null);

    setSelectedInquiry(null);
  };

  // Open creation modal
  const openCreateModal = () => {
    resetFormFields();
    if (activeTab === 'posts') {
      setModalType('create_post');
    } else if (activeTab === 'events') {
      setModalType('create_event');
    }
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (item: any) => {
    resetFormFields();
    if (activeTab === 'posts') {
      const p = item as Post;
      setSelectedPostId(p.id);
      setPostTitle(p.title || '');
      setPostCategory(p.category || 'School News');
      setPostExcerpt(p.excerpt || '');
      setPostContent(p.content || '');
      setPostDate(p.date || '');
      setPostImage(p.image || '');
      setPostAuthor(p.author || '');
      setModalType('edit_post');
    } else if (activeTab === 'events') {
      const ev = item as EventItem;
      setSelectedEventId(ev.id);
      setEventTitle(ev.title || '');
      setEventDescription(ev.description || '');
      setEventDate(ev.date || '');
      setEventTime(ev.time || '');
      setEventLocation(ev.location || '');
      setEventCategory(ev.category || 'academic');
      setModalType('edit_event');
    }
    setIsModalOpen(true);
  };

  // Open Inquiry View modal
  const openViewInquiry = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setModalType('view_inquiry');
    setIsModalOpen(true);
  };

  // Submit Post handler
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent) {
      setFeedbackMsg({ type: 'error', text: 'Post Title and Content are required.' });
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        title: postTitle,
        category: postCategory,
        excerpt: postExcerpt,
        content: postContent,
        date: postDate || new Date().toISOString().split('T')[0],
        image: postImage || 'https://picsum.photos/seed/school/800/600',
        author: postAuthor || 'Admin'
      };

      if (!isSupabaseConfigured) {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: modalType === 'create_post' ? 'create_post' : 'update_post',
            payload: { id: selectedPostId, ...payload }
          })
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to save post');
        setFeedbackMsg({ type: 'success', text: `Blog Post ${modalType === 'create_post' ? 'created' : 'updated'} successfully!` });
      } else {
        if (modalType === 'create_post') {
          const { error } = await supabase.from('posts').insert([payload]);
          if (error) throw error;
          setFeedbackMsg({ type: 'success', text: 'Blog Post created successfully!' });
        } else {
          const { error } = await supabase.from('posts').update(payload).eq('id', selectedPostId);
          if (error) throw error;
          setFeedbackMsg({ type: 'success', text: 'Blog Post updated successfully!' });
        }
      }
      setIsModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error('Error saving post:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save Blog Post.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit Event handler
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) {
      setFeedbackMsg({ type: 'error', text: 'Event Title and Date are required.' });
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        category: eventCategory
      };

      if (!isSupabaseConfigured) {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: modalType === 'create_event' ? 'create_event' : 'update_event',
            payload: { id: selectedEventId, ...payload }
          })
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to save event');
        setFeedbackMsg({ type: 'success', text: `Event ${modalType === 'create_event' ? 'created' : 'updated'} successfully!` });
      } else {
        if (modalType === 'create_event') {
          const { error } = await supabase.from('events').insert([payload]);
          if (error) throw error;
          setFeedbackMsg({ type: 'success', text: 'Event created successfully!' });
        } else {
          const { error } = await supabase.from('events').update(payload).eq('id', selectedEventId);
          if (error) throw error;
          setFeedbackMsg({ type: 'success', text: 'Event updated successfully!' });
        }
      }
      setIsModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error('Error saving event:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save Event.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string, table: 'posts' | 'events') => {
    if (!window.confirm(`Are you absolutely sure you want to delete this ${table === 'posts' ? 'Blog Post' : 'Event'}? This action is permanent.`)) {
      return;
    }
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: table === 'posts' ? 'delete_post' : 'delete_event',
            payload: { id }
          })
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to delete record');
      } else {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      }
      setFeedbackMsg({ type: 'success', text: `${table === 'posts' ? 'Blog Post' : 'Event'} deleted successfully.` });
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(`Error deleting from ${table}:`, err);
      setFeedbackMsg({ type: 'error', text: err.message || `Failed to delete record.` });
    } finally {
      setLoading(false);
    }
  };

  // Inquiries status update dropdown handler
  const handleInquiryStatusChange = async (id: string, newStatus: 'pending' | 'contacted' | 'resolved') => {
    try {
      if (!isSupabaseConfigured) {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_inquiry_status',
            payload: { id, status: newStatus }
          })
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to update status');
      } else {
        const { error } = await supabase
          .from('inquiries')
          .update({ status: newStatus })
          .eq('id', id);
        if (error) throw error;
      }
      
      // Update local state smoothly
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
      
      // Also update currently viewed modal inquiry if matches
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      setFeedbackMsg({ type: 'success', text: 'Inquiry status updated successfully.' });
    } catch (err: any) {
      console.error('Error updating inquiry status:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update status.' });
    }
  };

  // Filter lists based on Search & Select Inputs
  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = (inq.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inq.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inq.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPosts = posts.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryPostFilter === 'all' || p.category === categoryPostFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredEvents = events.filter(ev => {
    const matchesSearch = (ev.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryEventFilter === 'all' || ev.category === categoryEventFilter;
    return matchesSearch && matchesCategory;
  });

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center" id="loading-container">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-slate-800 animate-spin" id="loading-spinner" />
          <p className="text-slate-600 font-medium animate-pulse" id="loading-text">Synchronizing administrative workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="admin-workspace">
      {/* 1. AUTH LOGIN VIEW */}
      {!session ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-100" id="login-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            id="login-card"
          >
            {/* Login Header */}
            <div className="bg-slate-900 text-white p-8 text-center relative" id="login-header">
              <div className="absolute top-4 right-4 text-amber-400" id="login-icon-badge">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold font-serif tracking-tight text-white mb-2" id="login-title">
                MATEM SCHOOLS
              </h2>
              <p className="text-xs text-slate-300 font-mono tracking-widest uppercase" id="login-subtitle">
                Administrative Workspace
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="p-8 space-y-6" id="login-form">
              {!isSupabaseConfigured && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs flex flex-col space-y-1.5 rounded-md" id="login-demo-badge">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Demo Preview Mode Active</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    To access the Staff Portal in this preview, authorize with:
                    <br />
                    <span className="font-semibold select-all font-mono">Email: admin@matemschools.edu</span>
                    <br />
                    <span className="font-semibold select-all font-mono">Password: admin123</span>
                  </p>
                </div>
              )}

              {authError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start space-x-2 rounded-md" id="login-error-alert">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-2" id="login-email-group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Admin Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@matemschools.edu"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
                    required
                    id="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2" id="login-password-group">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Security Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
                    required
                    id="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                    id="password-toggle-btn"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-slate-950 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                  id="login-submit-btn"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Authorize & Access</span>
                    </>
                  )}
                </button>

                <Link
                  href="/"
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm border border-slate-200"
                  id="back-to-storefront-login-btn"
                >
                  <Home className="w-4 h-4 text-slate-600" />
                  <span>Back to Homepage</span>
                </Link>
              </div>

              <div className="pt-2 text-center border-t border-slate-100" id="login-footer">
                <p className="text-xs text-slate-400 font-mono">
                  Protected by standard Row Level Security
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      ) : (
        /* 2. DASHBOARD MANAGER VIEW */
        <div className="flex-1 flex flex-col md:flex-row min-h-screen" id="dashboard-layout">
          {/* Sidebar Menu */}
          <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800" id="sidebar">
            <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950" id="sidebar-header">
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-slate-950" id="sidebar-logo">
                M
              </div>
              <div>
                <h1 className="text-md font-bold text-white tracking-wide uppercase font-serif">MATEM</h1>
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">Admin Workspace</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 p-4 flex flex-col justify-between" id="sidebar-nav">
              <div className="space-y-1.5">
                <button
                  onClick={() => { setActiveTab('inquiries'); setSearchQuery(''); setShowProceedOptions(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'inquiries'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  id="sidebar-btn-inquiries"
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Student Inquiries</span>
                  </div>
                  {inquiries.filter(i => i.status === 'pending').length > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      activeTab === 'inquiries' ? 'bg-slate-950 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {inquiries.filter(i => i.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('posts'); setSearchQuery(''); setShowProceedOptions(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'posts'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  id="sidebar-btn-posts"
                >
                  <Newspaper className="w-4 h-4 shrink-0" />
                  <span>Blog Articles</span>
                </button>

                <button
                  onClick={() => { setActiveTab('events'); setSearchQuery(''); setShowProceedOptions(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'events'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  id="sidebar-btn-events"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>School Events</span>
                </button>

                <button
                  onClick={() => { setActiveTab('carousels'); setSearchQuery(''); setShowProceedOptions(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'carousels'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-semibold'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  id="sidebar-btn-carousels"
                >
                  <Images className="w-4 h-4 shrink-0" />
                  <span>Section Carousels</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-auto">
                <Link
                  href="/"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
                  id="sidebar-btn-storefront"
                >
                  <Home className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Exit to Homepage</span>
                </Link>
              </div>
            </nav>

            {/* Sidebar Footer with Session User and Logout */}
            <div className="p-4 border-t border-slate-800 bg-slate-950" id="sidebar-footer">
              <div className="mb-4 px-2" id="user-info">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Authorized Session</p>
                <p className="text-xs font-medium text-white truncate">{session.user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 hover:text-white rounded-xl text-xs transition-all font-medium"
                id="logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Portal</span>
              </button>
            </div>
          </aside>

          {/* Main Dashboard Screen Area */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-50" id="main-content">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex items-center justify-between shadow-sm z-10" id="main-header">
              <div className="flex items-center space-x-2" id="header-left">
                <LayoutDashboard className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-800 capitalize font-serif" id="header-title">
                  {activeTab} Management Panel
                </h2>
              </div>
              <div className="flex items-center space-x-3" id="header-right">
                <button
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  disabled={loading}
                  title="Synchronize Database"
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50"
                  id="sync-btn"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {activeTab !== 'inquiries' && (
                  <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    id="create-new-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New</span>
                  </button>
                )}
              </div>
            </header>

            {/* Core Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" id="dashboard-body">
              {/* Feedback messages / Notifications */}
              <AnimatePresence>
                {feedbackMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-xl flex items-center justify-between ${
                      feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800'
                        : 'bg-rose-50 border-l-4 border-rose-500 text-rose-800'
                    }`}
                    id="feedback-notification"
                  >
                    <div className="flex items-center space-x-3">
                      {feedbackMsg.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 shrink-0" />
                      )}
                      <p className="text-sm font-medium">{feedbackMsg.text}</p>
                    </div>
                    <button
                      onClick={() => setFeedbackMsg(null)}
                      className="p-1 hover:bg-black/5 rounded"
                      id="close-feedback-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filtering & Searching Controls Bar */}
              {activeTab !== 'carousels' && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4" id="filters-bar">
                  <div className="relative flex-1" id="search-input-group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search by keyword in ${activeTab}...`}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white text-sm"
                      id="search-input"
                    />
                  </div>

                  <div className="flex items-center gap-2" id="filters-controls">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    
                    {/* Category Filter for Inquiries */}
                    {activeTab === 'inquiries' && (
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                        id="inquiries-status-filter"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    )}

                    {/* Category Filter for Posts */}
                    {activeTab === 'posts' && (
                      <select
                        value={categoryPostFilter}
                        onChange={(e) => setCategoryPostFilter(e.target.value as any)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                        id="posts-category-filter"
                      >
                        <option value="all">All Categories</option>
                        <option value="School News">School News</option>
                        <option value="Academic Achievements">Academic Achievements</option>
                        <option value="Announcements">Announcements</option>
                        <option value="Notices">Notices</option>
                      </select>
                    )}

                    {/* Category Filter for Events */}
                    {activeTab === 'events' && (
                      <select
                        value={categoryEventFilter}
                        onChange={(e) => setCategoryEventFilter(e.target.value as any)}
                        className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                        id="events-category-filter"
                      >
                        <option value="all">All Event Categories</option>
                        <option value="academic">Academic</option>
                        <option value="sports">Sports</option>
                        <option value="cultural">Cultural</option>
                        <option value="other">Other</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Data Table Views */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="table-card">
                {loading ? (
                  <div className="py-20 flex flex-col justify-center items-center space-y-3" id="loading-table-state">
                    <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
                    <p className="text-slate-500 text-sm">Fetching fresh database updates...</p>
                  </div>
                ) : (
                  <>
                    {/* INQUIRIES LIST VIEW */}
                    {activeTab === 'inquiries' && (
                      <InquiriesTab
                        filteredInquiries={filteredInquiries}
                        handleInquiryStatusChange={handleInquiryStatusChange}
                        openViewInquiry={openViewInquiry}
                      />
                    )}

                    {/* BLOG POSTS LIST VIEW */}
                    {activeTab === 'posts' && (
                      <PostsTab
                        filteredPosts={filteredPosts}
                        openEditModal={openEditModal}
                        handleDelete={handleDelete}
                      />
                    )}

                    {/* SCHOOL EVENTS LIST VIEW */}
                    {activeTab === 'events' && (
                      <EventsTab
                        filteredEvents={filteredEvents}
                        openEditModal={openEditModal}
                        handleDelete={handleDelete}
                      />
                    )}

                    {/* SECTION CAROUSELS MANAGER */}
                    {activeTab === 'carousels' && (
                      <CarouselsTab
                        carouselsData={carouselsData}
                        urlInputs={urlInputs}
                        setUrlInputs={setUrlInputs}
                        dragOverSections={dragOverSections}
                        setDragOverSections={setDragOverSections}
                        isSavingCarouselConfig={isSavingCarouselConfig}
                        showProceedOptions={showProceedOptions}
                        setShowProceedOptions={setShowProceedOptions}
                        handleChangeCarouselInterval={handleChangeCarouselInterval}
                        handleDeleteCarouselImage={handleDeleteCarouselImage}
                        handleUploadImage={handleUploadImage}
                        handleAddCarouselImageByLink={handleAddCarouselImageByLink}
                        handleSaveAndProceed={handleSaveAndProceed}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 3. CRUD CREATE/EDIT & VIEW POPUP MODAL (motion/react backed) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8"
              id="modal-window"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-6 flex items-center justify-between" id="modal-header">
                <div>
                  <h3 className="text-lg font-bold font-serif text-white tracking-wide" id="modal-title">
                    {modalType === 'create_post' && 'Write Blog Article'}
                    {modalType === 'edit_post' && 'Update Blog Article'}
                    {modalType === 'create_event' && 'Schedule Campus Event'}
                    {modalType === 'edit_event' && 'Update Campus Event'}
                    {modalType === 'view_inquiry' && 'Inquiry Complete Record'}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono uppercase mt-0.5">
                    {activeTab} Management
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg transition-all"
                  id="modal-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto" id="modal-body">
                {/* A. BLOG POSTS FORM */}
                {(modalType === 'create_post' || modalType === 'edit_post') && (
                  <form onSubmit={handlePostSubmit} className="space-y-4" id="post-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Article Title *</label>
                        <input
                          type="text"
                          required
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          placeholder="e.g. Science Bowl Champions!"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Category *</label>
                        <select
                          value={postCategory}
                          onChange={(e) => setPostCategory(e.target.value as any)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                        >
                          <option value="School News">School News</option>
                          <option value="Academic Achievements">Academic Achievements</option>
                          <option value="Announcements">Announcements</option>
                          <option value="Notices">Notices</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Publish Date *</label>
                        <input
                          type="date"
                          required
                          value={postDate}
                          onChange={(e) => setPostDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Author</label>
                        <input
                          type="text"
                          value={postAuthor}
                          onChange={(e) => setPostAuthor(e.target.value)}
                          placeholder="e.g. Principal's Office"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <label className="text-xs font-bold text-slate-700 uppercase block">Cover Image</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                        <div className="flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Option A: Upload Image File</span>
                          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all text-center min-h-[100px]">
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-xs text-slate-600 font-medium">Select Image File</span>
                            <span className="text-[9px] text-slate-400">PNG, JPG, WEBP, GIF</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  await handleUploadPostImage(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Option B: Cover Image URL</span>
                          <textarea
                            value={postImage}
                            onChange={(e) => setPostImage(e.target.value)}
                            placeholder="https://picsum.photos/seed/school/800/600"
                            rows={4}
                            className="w-full flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                          />
                        </div>
                      </div>
                      {postImage && (
                        <div className="mt-2 flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200 animate-fadeIn">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={postImage} 
                              alt="Cover Preview" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/matem_school_promo.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-mono truncate text-slate-500 mb-0.5">Active Cover Path:</p>
                            <p className="text-xs font-semibold truncate text-slate-800">{postImage}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPostImage('')}
                            className="text-red-500 hover:text-red-600 text-xs font-semibold px-2 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase block">Brief Excerpt</label>
                      <input
                        type="text"
                        value={postExcerpt}
                        onChange={(e) => setPostExcerpt(e.target.value)}
                        placeholder="Provide a concise one-sentence summary for the preview feed..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase block">Full Article Content *</label>
                      <textarea
                        required
                        rows={6}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Write detailed announcements, news blogs, achievements description here..."
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        {submitLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Post...</span>
                          </>
                        ) : (
                          <span>Publish Article</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* B. EVENTS FORM */}
                {(modalType === 'create_event' || modalType === 'edit_event') && (
                  <form onSubmit={handleEventSubmit} className="space-y-4" id="event-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Event Title *</label>
                        <input
                          type="text"
                          required
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="e.g. Inter-House Sports Meet"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Category *</label>
                        <select
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value as any)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                        >
                          <option value="academic">Academic Assembly</option>
                          <option value="sports">Sports Day / Games</option>
                          <option value="cultural">Cultural Festival</option>
                          <option value="other">Other Event</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Scheduled Date *</label>
                        <input
                          type="date"
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase block">Timing</label>
                        <input
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="e.g. 08:00 AM - 02:00 PM"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase block">Location Venue</label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="e.g. Main Auditorium, Matem College"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase block">Description Details</label>
                      <textarea
                        rows={4}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Provide details about the rules, requirements, dress code, or general briefing for parents..."
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 disabled:opacity-50"
                      >
                        {submitLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Scheduling...</span>
                          </>
                        ) : (
                          <span>Publish Event</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* C. INQUIRY READ-ONLY DETAIL POPUP */}
                {modalType === 'view_inquiry' && selectedInquiry && (
                  <div className="space-y-6" id="inquiry-detail-view">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">Status Level</span>
                        <select
                          value={selectedInquiry.status}
                          onChange={(e) => handleInquiryStatusChange(selectedInquiry.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                            selectedInquiry.status === 'resolved'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : selectedInquiry.status === 'contacted'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          <option value="pending">● Pending</option>
                          <option value="contacted">● Contacted</option>
                          <option value="resolved">● Resolved</option>
                        </select>
                      </div>
                      
                      <h4 className="text-lg font-bold text-slate-900">{selectedInquiry.name}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="break-all">{selectedInquiry.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{selectedInquiry.phone || 'No phone provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-slate-100 py-4">
                      <div>
                        <span className="text-xs font-mono text-slate-400 block uppercase">Target Campus / Arm</span>
                        <span className="font-semibold text-slate-800 capitalize mt-0.5 inline-block">
                          {selectedInquiry.arm === 'private-school' ? 'Matem Private School' : 'Matem College'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-mono text-slate-400 block uppercase">Purpose of Contact</span>
                        <span className="font-semibold text-slate-800 capitalize mt-0.5 inline-block">
                          {selectedInquiry.purpose}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-slate-400 block uppercase">Submitted Message</span>
                      <p className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-150 whitespace-pre-wrap">
                        {selectedInquiry.message}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all"
                      >
                        Done Reviewing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
