/**
 * Vercel Serverless Function to securely fetch a random word.
 * This code runs on a secure server, not in the browser.
 * Your API key is safe here, especially when stored as an Environment Variable.
 */
export default async function handler(request, response) {
    // --- BEST PRACTICE ---
    // Store your API key in Vercel's "Environment Variables" settings.
    // Name it: WORDS_API_KEY
    // Vercel will automatically make it available here.
    const wordsApiKey = process.env.WORDS_API_KEY;


    if (!wordsApiKey) {
        return response.status(500).json({ error: "Server configuration error: Missing WORDS_API_KEY." });
    }

    // Get the category query from the client's request
    const { categoryQuery } = request.query;
    const decodedCategoryQuery = decodeURIComponent(categoryQuery || '');

    const baseApiUrl = "https://wordsapiv1.p.rapidapi.com/words?random=true&partOfSpeech=noun&letterPattern=^[a-zA-Z]{4,9}$";
    const finalUrl = baseApiUrl + decodedCategoryQuery;

    try {
        const apiRes = await fetch(finalUrl, {
            headers: {
                'X-RapidAPI-Key': wordsApiKey,
                'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
                'Accept': 'application/json'
            }
        });

        if (!apiRes.ok) {
            console.error(`WordsAPI Error: ${apiRes.status} ${apiRes.statusText}`);
            return response.status(apiRes.status).json({ error: "Failed to fetch word from WordsAPI." });
        }

        const data = await apiRes.json();

        // Ensure the data is valid before sending
        if (!data.word || !data.results || !data.results[0] || !data.results[0].definition) {
            console.warn("WordsAPI returned word with no definition. Retrying...");
            // You could retry, but for simplicity, we'll ask the client to retry.
            return response.status(502).json({ error: "Received incomplete data from WordsAPI." });
        }

        // Send only the necessary data back to the client
        response.status(200).json({
            word: data.word,
            definition: data.results[0].definition
        });

    } catch (error) {
        console.error("Error in /api/get-word:", error.message);
        response.status(500).json({ error: "An internal server error occurred." });
    }
}
