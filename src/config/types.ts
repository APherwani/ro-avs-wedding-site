export interface CoupleConfig {
  bride: string;
  groom: string;
  fullNames: string;
  hashtag: string;
}

export interface WeddingDateConfig {
  date: string;
  displayDate: string;
}

export interface OurStoryConfig {
  title: string;
  paragraphs: string[];
}

export interface EventConfig {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  description: string;
  dresscode: string;
  image?: string;
}

export interface VenueConfig {
  name: string;
  address: string;
  mapUrl: string;
  description: string;
}

export interface SiteConfig {
  couple: CoupleConfig;
  weddingDate: WeddingDateConfig;
  ourStory: OurStoryConfig;
  events: EventConfig[];
  venue: VenueConfig;
  gallery: string[];
}
