const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Serve app config (keys stay server-side)
    if (url.pathname === '/config') {
      return new Response(JSON.stringify({
        claude_api_key: env.CLAUDE_API_KEY || '',
        todoist_token: env.TODOIST_TOKEN || '',
        supabase_url: env.SUPABASE_URL || '',
        supabase_anon_key: env.SUPABASE_ANON_KEY || '',
      }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // Proxy Todoist API (avoids CORS block)
    if (url.pathname.startsWith('/todoist/')) {
      const path = url.pathname.replace('/todoist/', '');
      const target = `https://api.todoist.com/api/v1/${path}${url.search}`;

      const resp = await fetch(target, {
        method: request.method,
        headers: {
          'Authorization': `Bearer ${env.TODOIST_TOKEN}`,
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });

      const body = await resp.text();
      return new Response(body, {
        status: resp.status,
        headers: { ...CORS, 'Content-Type': resp.headers.get('Content-Type') || 'application/json' },
      });
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};
