/**
 * Vercel Serverless Function to securely fetch a random image.
 * This code runs on a secure server, not in the browser.
 */
export default async function handler(request, response) {
    // --- BEST PRACTICE ---
    // Store your API key in Vercel's "Environment Variables" settings.
    // Name it: UNSPLASH_API_KEY
    const unsplashApiKey = process.env.UNSPLASH_API_KEY;

    // --- (Insecure Fallback - Use only for quick local testing) ---
    // const unsplashApiKey = "N3iMDjWYpWJRhzGmbPakKjPtssaVSxSAMPDdd_rILnM"; // <-- Your key

    if (!unsplashApiKey) {
        return response.status(500).json({ error: "Server configuration error: Missing UNSPLASH_API_KEY." });
    }

    const unsplashApiUrl = "https://api.unsplash.com/photos/random";

    try {
        const apiRes = await fetch(unsplashApiUrl, {
            headers: {
                'Authorization': `Client-ID ${unsplashApiKey}`,
                'Accept-Version': 'v1'
            }
        });

        if (!apiRes.ok) {
            console.error(`Unsplash API Error: ${apiRes.status} ${apiRes.statusText}`);
            return response.status(apiRes.status).json({ error: "Failed to fetch image from Unsplash." });
        }

        const data = await apiRes.json();

        if (!data.urls || !data.urls.regular || !data.user || !data.user.name) {
            console.warn("Unsplash data incomplete. Retrying...");
            // You could retry, but for simplicity, we'll ask the client to retry.
            return response.status(502).json({ error: "Received incomplete data from Unsplash." });
        }

        // Send only the necessary data back to the client
        response.status(200).json({
            imageUrl: data.urls.regular,
            photographer: data.user.name,
            attributionUrl: data.links.html
        });

    } catch (error) {
        console.error("Error in /api/get-image:", error.message);
        response.status(500).json({ error: "An internal server error occurred." });
    }
}
