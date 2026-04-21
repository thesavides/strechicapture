const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy all /todoist/* calls to api.todoist.com
    if (url.pathname.startsWith('/todoist/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }

      const path = url.pathname.replace('/todoist/', '');
      const target = `https://api.todoist.com/rest/v2/${path}${url.search}`;

      const resp = await fetch(target, {
        method: request.method,
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });

      const body = await resp.text();
      return new Response(body, {
        status: resp.status,
        headers: {
          ...CORS,
          'Content-Type': resp.headers.get('Content-Type') || 'application/json',
        },
      });
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};
