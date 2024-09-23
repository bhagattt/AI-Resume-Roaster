const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs').promises; 
require('dotenv').config();

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/analyze-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const resumeContent = await extractTextFromFile(req.file.path);
        console.log('Resume Content:', resumeContent); 


        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Analyze the following resume and provide a humorous "roast":\n\n${resumeContent}`;
        console.log('Prompt sent to AI:', prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;

       
        if (!response || !response.text) {
            throw new Error('Invalid response from AI');
        }

        const roast = response.text();
        res.json({ roast });

    } catch (error) {
        console.error('Error:', error); 
        res.status(500).send('An error occurred while analyzing the resume: ' + error.message);
    }
});
async function extractTextFromFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        throw new Error('Failed to read the uploaded file.');
    }
}

app.listen(port, () => {
    console.log(`AI Resume Roaster app listening at http://localhost:${port}`);
   
});
