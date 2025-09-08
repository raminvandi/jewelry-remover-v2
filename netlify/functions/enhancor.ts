// in netlify/functions/enhancor.ts

export default async (req: Request) => {
  // Use the API key from a secure environment variable
  const ENHANCOR_API_KEY = process.env.ENHANCOR_API_KEY;

  if (!ENHANCOR_API_KEY) {
    return new Response(JSON.stringify({ error: "API key is not configured." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine which Enhancor endpoint to call based on the request URL
  const url = new URL(req.url);
  const isStatusCheck = url.pathname.includes('/status');
  const targetUrl = isStatusCheck 
    ? 'https://api.enhancor.ai/api/upscaler/v1/status' 
    : 'https://api.enhancor.ai/api/upscaler/v1/queue';

  try {
    // Pass through the request body from the frontend to the Enhancor API
    const body = await req.json();

    const apiResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENHANCOR_API_KEY,
      },
      body: JSON.stringify(body),
    });

    // Return Enhancor's response directly to the frontend
    return new Response(apiResponse.body, {
      status: apiResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// This tells Netlify to handle all paths under /api-enhancor with this function
export const config = {
  path: "/api-enhancor/*",
};