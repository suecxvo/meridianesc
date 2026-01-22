export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { t: tokenToken, k: requestKey } = body;

        // 1. Turnstile Validation
        const ip = request.headers.get('CF-Connecting-IP');
        const formData = new FormData();
        formData.append('secret', env.meridianesc_SECRET);
        formData.append('response', tokenToken);
        formData.append('remoteip', ip);

        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: formData,
            method: 'POST',
        });
        const outcome = await turnstileResult.json();
        if (!outcome.success) {
            return new Response(JSON.stringify({ error: 'Turnstile Failed' }), { status: 403 });
        }

        // 2. Fetch Content (Always use 'home_content' for Universal Mode)
        const dbKey = 'home_content';

        // 3. Fetch from D1 (Simple, no chunks)
        const content = await env.DB.prepare('SELECT value FROM site_content WHERE key = ?').bind(dbKey).first();
        
        if (!content) {
            return new Response(JSON.stringify({ error: 'Content Not Found in DB' }), { status: 404 });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            content: content.value 
        }), { 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
