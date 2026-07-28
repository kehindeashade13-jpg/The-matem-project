'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Images, Trash2, Upload, Plus, Loader2, CheckCircle, Home } from 'lucide-react';

interface CarouselsTabProps {
  carouselsData: any;
  urlInputs: Record<string, string>;
  setUrlInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  dragOverSections: Record<string, boolean>;
  setDragOverSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isSavingCarouselConfig: boolean;
  showProceedOptions: boolean;
  setShowProceedOptions: (show: boolean) => void;
  handleChangeCarouselInterval: (sectionKey: string, interval: number) => void;
  handleDeleteCarouselImage: (sectionKey: string, idx: number) => void;
  handleUploadImage: (sectionKey: string, file: File) => Promise<void>;
  handleAddCarouselImageByLink: (sectionKey: string, url: string) => void;
  handleSaveAndProceed: () => void;
}

export default function CarouselsTab({
  carouselsData,
  urlInputs,
  setUrlInputs,
  dragOverSections,
  setDragOverSections,
  isSavingCarouselConfig,
  showProceedOptions,
  setShowProceedOptions,
  handleChangeCarouselInterval,
  handleDeleteCarouselImage,
  handleUploadImage,
  handleAddCarouselImageByLink,
  handleSaveAndProceed
}: CarouselsTabProps) {
  return (
    <div className="p-6 space-y-8" id="carousels-management-panel">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold font-serif text-slate-800">Section Carousels Manager</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload, delete, and manage rotating images for all main school slides and gallery highlights.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" id="carousels-grid">
        {[
          { key: 'gallery', stateKey: 'carouselGallery', label: 'Campus Gallery Overview', description: 'Rotating images for the main Campus Gallery header overview' },
          { key: 'event', stateKey: 'carouselEvent', label: 'Featured Event Highlights', description: 'Rotating images for Featured Event Highlights on the gallery page' },
          { key: 'academicAchievement', stateKey: 'carouselAcademicAchievement', label: 'Academic Achievement', description: 'Rotating images for Academic Achievement slide on home and news pages' },
          { key: 'ictRobotics', stateKey: 'carouselIctRobotics', label: 'ICT & Robotics Lab', description: 'Rotating images for ICT and Robotics Lab slide on the home page' },
          { key: 'classicScience', stateKey: 'carouselClassicScience', label: 'Classic Science Laboratory', description: 'Rotating images for Classic Science Laboratory slide on the home page' },
          { key: 'physicalLibrary', stateKey: 'carouselPhysicalLibrary', label: 'Physical & Digital Library', description: 'Rotating images for Physical and Digital Library slide on the home page' },
          { key: 'crechePlayground', stateKey: 'carouselCrechePlayground', label: 'Creche & Nursery Playground', description: 'Rotating images for Creche and Nursery Playground slide on the home page' },
          { key: 'modernClinic', stateKey: 'carouselModernClinic', label: 'Modern Clinic Office', description: 'Rotating images for Modern Clinic Office slide on the home page' },
          { key: 'sportsGala', stateKey: 'carouselSportsGala', label: 'Matem Interhouse Sport Gala', description: 'Rotating images for Matem Interhouse Sport Gala in the past highlights' },
          { key: 'graduationGala', stateKey: 'carouselGraduationGala', label: 'Matem Graduation Gala', description: 'Rotating images for Matem Graduation Gala in the past highlights' }
        ].map((section) => {
          const currentData = carouselsData[section.stateKey] || { images: [], intervalSeconds: 5 };
          const currentImages = currentData.images || [];
          const currentInterval = currentData.intervalSeconds || 5;
          const inputVal = urlInputs[section.key] || '';

          return (
            <div key={section.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between" id={`carousel-card-${section.key}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-800">{section.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{section.description}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-semibold">
                    <span className="text-slate-500 font-normal">Interval:</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={currentInterval}
                      onChange={(e) => handleChangeCarouselInterval(section.key, parseInt(e.target.value) || 5)}
                      className="w-10 text-center font-mono focus:outline-none text-slate-800 focus:ring-1 focus:ring-slate-900 rounded bg-transparent font-medium"
                      title="Rotation Interval (seconds)"
                    />
                    <span className="text-slate-400 font-mono text-[10px]">sec</span>
                  </div>
                </div>

                {/* Thumbnail Preview Area */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Current Images ({currentImages.length})</h4>
                  {currentImages.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-sans">
                      No images configured. Upload a file or add a URL below.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                      {currentImages.map((imgUrl: string, idx: number) => (
                        <div key={idx} className="relative aspect-video group rounded-lg overflow-hidden border border-slate-150 bg-slate-50 shadow-sm transition-all hover:ring-2 hover:ring-amber-400">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/matem_school_promo.jpg';
                            }}
                          />
                          {/* Always visible, highly tapable delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteCarouselImage(section.key, idx);
                            }}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:scale-105 transition-all z-10"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 py-0.5 text-center pointer-events-none">
                            <span className="text-[9px] text-white font-mono font-semibold">Slide {idx + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                {/* Option 1: Drag & Drop / File Upload */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Option 1: Drag & Drop or Click to Upload</span>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSections(prev => ({ ...prev, [section.key]: true }));
                    }}
                    onDragLeave={() => {
                      setDragOverSections(prev => ({ ...prev, [section.key]: false }));
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverSections(prev => ({ ...prev, [section.key]: false }));
                      if (e.dataTransfer.files?.[0]) {
                        await handleUploadImage(section.key, e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                      dragOverSections[section.key]
                        ? 'border-amber-400 bg-amber-50/50 scale-[1.01] shadow-inner'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <label className="absolute inset-0 cursor-pointer w-full h-full">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadImage(section.key, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                      <div className={`p-2 rounded-full ${dragOverSections[section.key] ? 'bg-amber-100 text-amber-600 animate-bounce' : 'bg-slate-100 text-slate-500'}`}>
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {dragOverSections[section.key] ? 'Drop image here!' : 'Drag & Drop file here'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          or <span className="text-amber-600 font-semibold">browse files</span> from your device
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 2: Add by URL */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Option 2: Add by External Link</span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Paste image URL here..."
                      value={inputVal}
                      onChange={(e) => setUrlInputs(prev => ({ ...prev, [section.key]: e.target.value }))}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    />
                    <button
                      onClick={() => {
                        if (inputVal.trim()) {
                          handleAddCarouselImageByLink(section.key, inputVal.trim());
                          setUrlInputs(prev => ({ ...prev, [section.key]: '' }));
                        }
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center transition-all shrink-0"
                      title="Add Image URL"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save & Proceed Action Section */}
      <div className="pt-8 border-t border-slate-200 mt-8" id="carousel-save-and-proceed-section">
        {!showProceedOptions ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-6" id="save-prompt-card">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Done managing school carousels?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Save all changes and verify the active slide rotation configurations across public pages.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAndProceed}
              disabled={isSavingCarouselConfig}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              id="btn-save-and-proceed-trigger"
            >
              {isSavingCarouselConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving configurations...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save & Proceed</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800"
            id="proceed-options-card"
          >
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-sm font-bold flex items-center justify-center md:justify-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                Carousel configurations successfully saved!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your rotating slide selections have been updated and synchronized with the cloud database.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.02]"
                id="btn-proceed-home"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Proceed to Homepage</span>
              </Link>
              
              <Link
                href="/gallery"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center flex items-center justify-center gap-2 border border-slate-700 transition-all hover:scale-[1.02]"
                id="btn-proceed-gallery"
              >
                <Images className="w-3.5 h-3.5 text-slate-300" />
                <span>View Event Gallery</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowProceedOptions(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                id="btn-dismiss-proceed"
              >
                <span>Modify Again</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
