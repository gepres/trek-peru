'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

// Dispara el evento custom feature_view una vez al montar la página de feature.
// El pageview ya lo emite GoogleAnalytics globalmente; este evento añade
// dimensión por slug para construir funnels por feature en GA4.
export function FeatureAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    analytics.featureView(slug);
  }, [slug]);

  return null;
}
