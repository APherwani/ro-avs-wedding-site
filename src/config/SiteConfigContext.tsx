"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { SiteConfig } from "./types";
import { defaultConfig } from "./content";

const SiteConfigContext = createContext<SiteConfig>(defaultConfig);

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          // Deep merge: use fetched values but fall back to defaults for missing fields
          setConfig({
            couple: { ...defaultConfig.couple, ...data.config.couple },
            weddingDate: {
              ...defaultConfig.weddingDate,
              ...data.config.weddingDate,
            },
            ourStory: { ...defaultConfig.ourStory, ...data.config.ourStory },
            events:
              Array.isArray(data.config.events) && data.config.events.length > 0
                ? data.config.events
                : defaultConfig.events,
            venue: { ...defaultConfig.venue, ...data.config.venue },
            gallery: Array.isArray(data.config.gallery)
              ? data.config.gallery
              : defaultConfig.gallery,
          });
        }
      })
      .catch(() => {
        // Silently fall back to defaults
      });
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}
