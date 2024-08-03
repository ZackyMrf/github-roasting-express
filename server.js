const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');
const cors = require('cors');

require('dotenv').config();

const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
const PORT = process.env.PORT || 3001;

// LiveReload server
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
        liveReloadServer.refresh('/');
    }, 100);
});

app.use(cors());
app.use(bodyParser.json());
app.use(connectLivereload());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
});

app.post('/roast', async (req, res) => {
    const { username } = req.query;
    const { jsonData, README } = req.body;

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ];

    try {
        // Prepare the input for the AI
        const input = `Username: ${username}\nProfile Data: ${JSON.stringify(jsonData, null, 2)}\nREADME: ${README}\n
        Coba roasting data diri saya dari data yang saya lampirkan di atas,\n
        langsung return 1 data saja ya dengan key roasting, Gunakan Bahasa Indonesia, Respon Tidak sopan tidak apa apa, Terima kasih.`;

        // Start the chat session with the generative AI model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        };

        const chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: [],
        });

        console.log('Sending message to AI...');

        // Send the message to the AI and get the response
        const result = await chatSession.sendMessage(input);
        const roasting = result.response.text();

        let parsedRoasting = JSON.parse(roasting);

        res.json(parsedRoasting);

    } catch (error) {
        console.error("Error in AI roasting:", error);
        res.status(500).json({ error: 'Internal Server Error', type: 'Server' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
