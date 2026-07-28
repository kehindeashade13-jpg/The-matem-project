'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

interface CampusCarouselProps {
  images?: string[];
  intervalSeconds?: number;
  aspectRatio?: string;
  altText?: string;
  isHeroBackground?: boolean;
}

export default function CampusCarousel({
  images = [],
  intervalSeconds = 5,
  aspectRatio = "aspect-video",
  altText = "Campus Slide",
  isHeroBackground = false
}: CampusCarouselProps) {
  const [index, setIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  const activeIndex = images && images.length > 0 ? index % images.length : 0;

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [images, intervalSeconds]);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-full min-h-[250px] bg-navy-900 flex items-center justify-center text-gray-400 text-xs font-sans ${isHeroBackground ? '' : 'rounded-xl border border-navy-800'}`}>
        No images available
      </div>
    );
  }

  const currentSrc = imageErrorMap[activeIndex] ? '/images/matem_school_promo.jpg' : images[activeIndex];

  return (
    <div className={`relative w-full h-full overflow-hidden ${isHeroBackground ? '' : 'rounded-2xl shadow-premium'} ${aspectRatio} bg-navy-950`}>
      {/* Invisible image preload for smooth instant slide transitions */}
      <div className="hidden" aria-hidden="true">
        {images.map((img, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={i} src={img} alt="" />
        ))}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={currentSrc}
            alt={`${altText} - Slide ${activeIndex + 1}`}
            fill
            unoptimized
            priority={activeIndex === 0 || isHeroBackground}
            sizes={isHeroBackground ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Progress Dots */}
      {images.length > 1 && !isHeroBackground && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === index ? 'bg-gold-500 w-5 shadow-sm' : 'bg-white/50 hover:bg-white w-1.5'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
