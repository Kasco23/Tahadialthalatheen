# Lighthouse Performance Reports

This directory contains automated Lighthouse performance reports generated during Netlify builds.

## Reports Generated

### Desktop Performance
- `lighthouse-landing-desktop.html` - Landing page desktop performance
- `lighthouse-join-desktop.html` - Join page desktop performance  
- `lighthouse-create-session-desktop.html` - Create session page desktop performance
- `lighthouse-api-status.html` - API status page performance

### Mobile Performance
- `lighthouse-landing-mobile.html` - Landing page mobile performance
- `lighthouse-join-mobile.html` - Join page mobile performance
- `lighthouse-create-session-mobile.html` - Create session page mobile performance

### Performance-focused Audits
- `lighthouse-landing-performance.html` - Landing page performance-only audit
- `lighthouse-join-performance.html` - Join page performance-only audit

## Performance Thresholds

The build is configured with the following minimum thresholds:
- **Performance**: 75/100
- **Accessibility**: 85/100  
- **Best Practices**: 80/100
- **SEO**: 85/100
- **PWA**: 70/100

Reports are automatically generated and saved to deploy artifacts for each build.
