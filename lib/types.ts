export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  arm: 'private-school' | 'college';
  purpose: 'admission' | 'general' | 'complaint' | 'other';
  message: string;
  status: 'pending' | 'contacted' | 'resolved';
  date: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: 'School News' | 'Academic Achievements' | 'Announcements' | 'Notices';
  excerpt: string;
  content: string;
  date: string;
  image: string;
  author: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  category: 'academic' | 'sports' | 'cultural' | 'other';
}

export interface CarouselSettings {
  images: string[];
  intervalSeconds: number;
}

export interface SchoolDatabase {
  inquiries: Inquiry[];
  posts: BlogPost[];
  events: EventItem[];
  carousel?: CarouselSettings; // homepage
  carouselNurseryPrimary?: CarouselSettings;
  carouselSecondary?: CarouselSettings;
  carouselAcademicAchievement?: CarouselSettings;
  carouselGallery?: CarouselSettings;
  carouselEvent?: CarouselSettings;
  carouselIctRobotics?: CarouselSettings;
  carouselClassicScience?: CarouselSettings;
  carouselPhysicalLibrary?: CarouselSettings;
  carouselCrechePlayground?: CarouselSettings;
  carouselModernClinic?: CarouselSettings;
  carouselSportsGala?: CarouselSettings;
  carouselGraduationGala?: CarouselSettings;
}
