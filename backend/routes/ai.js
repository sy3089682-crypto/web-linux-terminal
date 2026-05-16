const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Uses env var or dummy for safety if not set
});

router.post('/ask', auth, async (req, res) => {
    try {
        const { message, fileContext } = req.body;
        
        if (!process.env.OPENAI_API_KEY) {
            // Fallback mock if no API key is provided, but structured like a real LLM response
            return res.json({ 
                reply: `[MOCK MODE - No OPENAI_API_KEY set] I see you are asking about: "${message}". Context provided: ${fileContext ? 'Yes' : 'No'}.` 
            });
        }

        const systemPrompt = `You are a Google-tier expert Cloud IDE AI assistant. You help the user write, debug, and optimize code.
        Context: The user is currently looking at the following file content:
        \`\`\`
        ${fileContext || '(No file context provided)'}
        \`\`\`
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // or gpt-3.5-turbo
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
        });

        res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
        console.error('AI Error:', err);
        res.status(500).json({ msg: 'AI Service Error' });
    }
});

// Agentic AI — can execute commands, write files, etc.
router.post('/agent', auth, async (req, res) => {
    try {
        const { task, context } = req.body;
        const { processTask } = require('../services/ai-agent');
        const result = await processTask(task, context || {});
        res.json(result);
    } catch (err) {
        console.error('AI Agent Error:', err);
        res.status(500).json({ msg: 'AI Agent Error' });
    }
});

module.exports = router;
