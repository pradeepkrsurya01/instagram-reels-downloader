const express = require("express");
const cors = require("cors");
const instagramGetUrl = require("instagram-url-direct");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/download", async (req, res) => {
    const { url } = req.body;

    try {
        const data = await instagramGetUrl(url);
        const video = data.url_list[0];

        res.json({
            status: "success",
            video: video
        });
    } catch (error) {
        res.json({
            status: "error",
            message: "Invalid Instagram URL"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
