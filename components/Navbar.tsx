'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GraduationCap, ChevronDown, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; category?: string }[]>([
    {
      id: '4',
      title: 'Important Notice: 2026/2027 Entrance Examination & Admission Screening Ongoing',
      category: 'Notices'
    },
    {
      id: '2',
      title: 'Matem College Academic Calendar & Term 3 Resumption Info',
      category: 'Announcements'
    },
    {
      id: '1',
      title: 'Matem Private School Tops Regional Science Fair',
      category: 'Academic Achievements'
    },
    {
      id: '3',
      title: 'Introducing the Matem Modern ICT & Robotics Lab',
      category: 'School News'
    }
  ]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const data = await response.json();
          if (data.posts && data.posts.length > 0) {
            const items = data.posts.map((p: any) => ({
              id: p.id,
              title: p.title,
              category: p.category
            }));
            if (items.length > 0) {
              setAnnouncements(items);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Academics', href: '/academics' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Gallery & Events', href: '/gallery' },
    { name: 'News & Blog', href: '/news' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col">
      <nav
        id="main-navbar"
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-navy-800/95 text-white shadow-premium backdrop-blur-md py-3'
            : 'bg-navy-800 text-white py-4 border-b border-navy-700/50'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & School Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gold-500 shadow-md group-hover:scale-105 transition-transform duration-300">
              {/* Crest Placeholder Icon */}
              <GraduationCap className="h-7 w-7 text-navy-800" />
            </div>
            <div>
              <span className="block font-serif text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-gold-300 transition-colors">
                MATEM SCHOOLS
              </span>
              <span className="block text-[10px] text-gold-400 font-medium tracking-widest uppercase">
                Private School & College
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-gold-400 ${
                  isActive(link.href) ? 'text-gold-500 font-semibold' : 'text-gray-100'
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-gold-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Call to Action Button */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              href="/admin"
              className="text-xs text-gray-300 hover:text-gold-400 font-medium transition-colors mr-1"
            >
              Staff Portal
            </Link>
            <Link
              href="/admissions"
              className="bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold px-5 py-2.5 rounded-full text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform duration-200"
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Link
              href="/admissions"
              className="bg-gold-500 text-navy-950 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:bg-gold-400 transition-colors"
            >
              Apply
            </Link>
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-200 hover:text-white p-2 rounded-md focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-navigation-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden bg-navy-900 border-t border-navy-700 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-navy-800 text-gold-400 border-l-4 border-gold-500 font-semibold'
                      : 'text-gray-200 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-navy-800 flex flex-col space-y-3 px-4">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-sm text-gray-400 hover:text-gold-400 py-2 transition-colors"
                >
                  Staff Portal
                </Link>
                <Link
                  href="/admissions"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-3 rounded-full text-sm shadow-md transition-all"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

    {/* Announcement Bar Positioned Below the Header Navigation where "MATEM SCHOOLS" is */}
    <AnimatePresence>
      {isVisible && announcements.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-navy-950 font-sans text-xs font-semibold shadow-sm relative overflow-hidden flex items-center z-30 border-b border-gold-600/30"
        >
          {/* Left Static Badge */}
          <div className="shrink-0 bg-gold-500 px-3 sm:px-4 py-2 z-10 flex items-center gap-2 shadow-md border-r border-navy-950/15 font-mono text-[10px] sm:text-xs uppercase font-bold tracking-wider text-navy-950">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy-900 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-navy-950"></span>
            </span>
            <span className="hidden sm:inline">Notices & Announcements</span>
            <span className="sm:hidden">Notices</span>
          </div>

          {/* Marquee Ticker moving inside the announcement bar */}
          <div className="overflow-hidden flex-1 relative flex items-center py-2 select-none">
            <div className="animate-marquee flex items-center whitespace-nowrap text-navy-950">
              {/* Set 1 */}
              <div className="flex items-center gap-10 shrink-0 pr-10">
                {announcements.map((item) => (
                  <Link
                    key={`s1-${item.id}`}
                    href={`/news?id=${item.id}`}
                    className="inline-flex items-center gap-2 hover:underline transition-colors text-navy-950 hover:text-black group shrink-0"
                  >
                    {item.category && (
                      <span className="bg-navy-950/10 text-navy-950 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        {item.category}
                      </span>
                    )}
                    <span className="font-semibold text-xs sm:text-sm">{item.title}</span>
                    <span className="text-[10px] font-bold bg-navy-950/15 group-hover:bg-navy-950 group-hover:text-gold-400 text-navy-950 px-2 py-0.5 rounded transition-colors">
                      Read More →
                    </span>
                    <span className="text-navy-950/40 text-xs ml-4">✦</span>
                  </Link>
                ))}
              </div>
              {/* Set 2 (Identical duplicate for seamless 0% -> -50% GPU loop) */}
              <div className="flex items-center gap-10 shrink-0 pr-10">
                {announcements.map((item) => (
                  <Link
                    key={`s2-${item.id}`}
                    href={`/news?id=${item.id}`}
                    className="inline-flex items-center gap-2 hover:underline transition-colors text-navy-950 hover:text-black group shrink-0"
                  >
                    {item.category && (
                      <span className="bg-navy-950/10 text-navy-950 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        {item.category}
                      </span>
                    )}
                    <span className="font-semibold text-xs sm:text-sm">{item.title}</span>
                    <span className="text-[10px] font-bold bg-navy-950/15 group-hover:bg-navy-950 group-hover:text-gold-400 text-navy-950 px-2 py-0.5 rounded transition-colors">
                      Read More →
                    </span>
                    <span className="text-navy-950/40 text-xs ml-4">✦</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Close Button */}
          <div className="shrink-0 bg-gold-500 pl-2 pr-3 py-2 z-10 flex items-center border-l border-navy-950/10">
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-full hover:bg-navy-950/15 text-navy-950/80 hover:text-navy-950 transition-colors cursor-pointer"
              aria-label="Dismiss Announcement"
              title="Dismiss Announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </header>
  );
}
