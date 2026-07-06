// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/developers/'], // Hides your admin routes from search engines
    },
    sitemap: 'https://cbckyouthforum.live/sitemap.xml',
  };
}