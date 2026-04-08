const express = require("express");
const cors = require("cors");
const instagramGetUrl = require("instagram-url-direct");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

app.post("/download", async (req, res) => {
    const { url } = req.body;

    try {
        const data = await instagramGetUrl(url);
        const video = data.url_list[0];

        res.status(200).json({
            status: "success",
            video: video
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: "Invalid Instagram URL"
        });
    }
});

app.listen(5500, () => {
    console.log("Server running on http://localhost:5500");
});
