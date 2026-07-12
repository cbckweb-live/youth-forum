// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: ['/admin/', '/developers/'],
      }
    ],
    sitemap: 'https://cbckyouthforum.live/sitemap.xml',
  };
}