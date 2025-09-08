// supabase/functions/list-logos/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { data: folders, error: foldersError } = await supabase.storage.from("logos").list("", {
      limit: 1000,
      sortBy: {
        column: "name",
        order: "asc"
      }
    });
    if (foldersError) throw foldersError;
    const categories: Record<string, { 
      displayName: string;
      leagueLogo?: string;
      teams: { name: string; url: string }[] 
    }> = {};

    for (const folder of folders || []) {
      const folderName = folder.name;
      if (!folderName || folderName.includes(".")) continue;
      
      // Clean the folder name for display (replace dashes with spaces)
      const displayName = folderName.replace(/-/g, " ");
      const { data: files, error: filesError } = await supabase.storage.from("logos").list(folderName, {
        limit: 1000,
        sortBy: {
          column: "name",
          order: "asc"
        }
      });
      if (filesError) {
        console.error(`Error listing files in '${folderName}':`, filesError);
        continue;
      }

      // Find league logo (matches folder name)
      const leagueLogo = (files || []).find(
        (file) => file.name.toLowerCase() === `${folderName.toLowerCase()}.svg`
      );
      
      let leagueLogoUrl: string | undefined;
      if (leagueLogo) {
        const { data: logoUrlData } = supabase.storage.from("logos").getPublicUrl(`${folderName}/${leagueLogo.name}`);
        leagueLogoUrl = decodeURIComponent(logoUrlData.publicUrl);
      }

      // Get team logos (excluding league logo and hidden files)
      const teamLogos = (files || [])
        .filter((file) => !file.name.startsWith(".") && file !== leagueLogo)
        .map((file) => {
          const path = `${folderName}/${file.name}`;
          const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
          const correctedUrl = decodeURIComponent(urlData.publicUrl);
          
          // Clean up team name: remove .svg extension, replace dashes with spaces, capitalize words
          const cleanName = file.name
            .replace('.svg', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          
          return {
            name: cleanName,
            url: correctedUrl
          };
        });

      categories[folderName] = {
        displayName,
        leagueLogo: leagueLogoUrl,
        teams: teamLogos
      };
    }
    return new Response(JSON.stringify({
      categories
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  } catch (err) {
    console.error("Error in list-logos function:", err);
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }
});
