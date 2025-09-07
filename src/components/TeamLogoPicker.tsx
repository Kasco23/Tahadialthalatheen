import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface LogoFile {
  name: string;
  url: string;
  league: string;
}

interface TeamLogoPickerProps {
  selectedUrl?: string;
  onSelect: (url: string) => void;
}

// Simple in-memory cache
let logoCache: LogoFile[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const TeamLogoPicker: React.FC<TeamLogoPickerProps> = ({ 
  selectedUrl, 
  onSelect 
}) => {
  const [logos, setLogos] = useState<LogoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string>('');

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        // Check cache first
        const now = Date.now();
        if (logoCache && (now - cacheTimestamp) < CACHE_DURATION) {
          setLogos(logoCache);
          setActiveLeague(logoCache.length > 0 ? logoCache[0].league : '');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Fetch from Supabase Storage - first get directories
        const { data: rootData, error: rootError } = await supabase.storage
          .from('logos')
          .list('', { limit: 100 });

        if (rootError) {
          throw new Error(`Failed to fetch root directory: ${rootError.message}`);
        }

        // Build logo array with public URLs
        const logoFiles: LogoFile[] = [];
        
        if (rootData) {
          // For each directory, list its contents
          for (const item of rootData) {
            if (item.name && !item.name.includes('.')) {
              // This is likely a directory (league folder)
              const { data: leagueData, error: leagueError } = await supabase.storage
                .from('logos')
                .list(item.name, { limit: 100 });

              if (!leagueError && leagueData) {
                for (const logoFile of leagueData) {
                  if (logoFile.name && logoFile.name.endsWith('.svg')) {
                    const encodedPath = `${encodeURIComponent(item.name)}/${encodeURIComponent(logoFile.name)}`;
                    
                    // Get public URL
                    const { data: urlData } = supabase.storage
                      .from('logos')
                      .getPublicUrl(encodedPath);

                    if (urlData?.publicUrl) {
                      logoFiles.push({
                        name: logoFile.name.replace('.svg', ''),
                        url: urlData.publicUrl,
                        league: item.name
                      });
                    }
                  }
                }
              }
            } else if (item.name && item.name.endsWith('.svg')) {
              // Direct SVG file in root
              const { data: urlData } = supabase.storage
                .from('logos')
                .getPublicUrl(item.name);

              if (urlData?.publicUrl) {
                logoFiles.push({
                  name: item.name.replace('.svg', ''),
                  url: urlData.publicUrl,
                  league: 'General'
                });
              }
            }
          }
        }

        // Update cache
        logoCache = logoFiles;
        cacheTimestamp = now;

        setLogos(logoFiles);
        setActiveLeague(logoFiles.length > 0 ? logoFiles[0].league : '');
      } catch (err) {
        console.error('Error fetching logos:', err);
        setError(err instanceof Error ? err.message : 'Failed to load logos');
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading team logos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Failed to load logos: {error}</p>
      </div>
    );
  }

  if (logos.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>No team logos available</p>
      </div>
    );
  }

  // Group logos by league
  const logosByLeague = logos.reduce((acc, logo) => {
    if (!acc[logo.league]) {
      acc[logo.league] = [];
    }
    acc[logo.league].push(logo);
    return acc;
  }, {} as Record<string, LogoFile[]>);

  const leagues = Object.keys(logosByLeague).sort();

  return (
    <div className="w-full">
      {/* League tabs */}
      {leagues.length > 1 && (
        <div className="flex border-b border-gray-200 mb-4">
          {leagues.map((league) => (
            <button
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`px-4 py-2 text-sm font-medium ${
                activeLeague === league
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      )}

      {/* Logo grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {logosByLeague[activeLeague || leagues[0]]?.map((logo) => (
          <button
            key={logo.url}
            onClick={() => onSelect(logo.url)}
            className={`relative p-2 rounded-lg border-2 transition-all hover:shadow-md ${
              selectedUrl === logo.url
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            title={logo.name}
          >
            <img
              src={logo.url}
              alt={logo.name}
              className="w-full h-12 object-contain"
              loading="lazy"
            />
            {selectedUrl === logo.url && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        )) || []}
      </div>
    </div>
  );
};
