export async function onRequestPost(context) {
  try {
    const { model, messages } = await context.request.json();
    
    const accountId = "64523cd0c5915c95d192adaa4b4c230f";
    const apiToken = "3EKiBdfDpcD5R7qwT2cg9-2-cklfCVM_J82tRm8m";
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages,
          max_tokens: 2048  // ← ADD THIS LINE
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.errors?.[0]?.message || 'AI API error');
    }
    
    return new Response(JSON.stringify({ response: data.result.response }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}