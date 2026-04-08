const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static("public"));

// Favicon route
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Helper function to extract Instagram video URL with proper headers
async function extractInstagramVideo(url) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        };

        console.log("Fetching Instagram page:", url);

        const response = await axios.get(url, {
            headers,
            timeout: 15000,
            maxRedirects: 5
        });

        const html = response.data;

        // Try to find video URL in various formats
        let videoUrl = null;

        // Pattern 1: Video URL in window._sharedData
        const sharedMatch = html.match(/"video_url":"(https?:\/\/[^"]+\.mp4[^"]*)"/);
        if (sharedMatch) {
            videoUrl = sharedMatch[1].replace(/\\\//g, '/');
            console.log("Found video via shared data");
        }

        // Pattern 2: Video in media URLs
        if (!videoUrl) {
            const mediaMatch = html.match(/"src":"(https?:\/\/[^"]*instagram[^"]*\.mp4[^"]*)"/);
            if (mediaMatch) {
                videoUrl = mediaMatch[1].replace(/\\\//g, '/');
                console.log("Found video via media URL");
            }
        }

        // Pattern 3: Look for video element src
        if (!videoUrl) {
            const videoElementMatch = html.match(/<video[^>]*>[\s\S]*?<source[^>]*src="([^"]+\.mp4)"/);
            if (videoElementMatch) {
                videoUrl = videoElementMatch[1];
                console.log("Found video via video element");
            }
        }

        // Pattern 4: Search for full video URLs in the page
        if (!videoUrl) {
            const urlMatch = html.match(/(https?:\/\/[^"\s]*\.mp4[^"\s]*)/);
            if (urlMatch) {
                videoUrl = urlMatch[1];
                console.log("Found video via URL pattern");
            }
        }

        if (!videoUrl) {
            throw new Error("Could not extract video URL - Instagram page did not contain a downloadable video");
        }

        // Verify the URL is valid
        if (!videoUrl.includes('.mp4')) {
            throw new Error("Invalid video URL format");
        }

        return videoUrl;

    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error("Video not found - post may have been deleted");
        }
        if (error.response?.status === 403) {
            throw new Error("Access forbidden - the content may be private");
        }
        if (error.code === 'ENOTFOUND') {
            throw new Error("Network error - unable to reach Instagram");
        }
        throw error;
    }
}

// Download endpoint
app.post("/download", async (req, res) => {
    try {
        const { url } = req.body;

        // Validate URL exists
        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                status: "error",
                message: "URL is required"
            });
        }

        // Trim and validate URL
        const cleanUrl = url.trim();
        if (!cleanUrl.includes('instagram.com')) {
            return res.status(400).json({
                status: "error",
                message: "Invalid Instagram URL. Please use a direct Instagram link."
            });
        }

        // Validate it's a valid Instagram post/reel/story link
        if (!/instagram\.com\/(p|reel|tv|stories)\//.test(cleanUrl) && !cleanUrl.includes('/p/')) {
            return res.status(400).json({
                status: "error",
                message: "Please use a direct link to a post, reel, or story."
            });
        }

        console.log("=== Download Request ===");
        console.log("URL:", cleanUrl);

        // Extract video URL
        const videoUrl = await extractInstagramVideo(cleanUrl);

        if (!videoUrl) {
            return res.status(400).json({
                status: "error",
                message: "Could not extract video. The link may be invalid or the content is no longer available."
            });
        }

        console.log("✅ Successfully extracted video URL");

        return res.status(200).json({
            status: "success",
            video: videoUrl,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("❌ Download error:", error.message);

        // Specific error handling
        if (error.message.includes('not found') || error.message.includes('deleted')) {
            return res.status(404).json({
                status: "error",
                message: "Video not found. The post may have been deleted or archived."
            });
        }

        if (error.message.includes('forbidden') || error.message.includes('private')) {
            return res.status(403).json({
                status: "error",
                message: "This content is private or restricted. You may need to follow the account to download it."
            });
        }

        if (error.message.includes('Network') || error.message.includes('ENOTFOUND')) {
            return res.status(500).json({
                status: "error",
                message: "Network error. Please check your internet connection."
            });
        }

        if (error.message.includes('extract')) {
            return res.status(400).json({
                status: "error",
                message: "Could not process this link. It might not be a valid Instagram post."
            });
        }

        // Generic error response
        res.status(400).json({
            status: "error",
            message: "Could not download the video. Please try again with a different link."
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found"
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        status: "error",
        message: "Internal server error"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📥 Download endpoint: POST http://localhost:${PORT}/download`);
    console.log(`🏥 Health check: GET http://localhost:${PORT}/health`);
});
