import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENAI_API_KEY;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '100kb' }));
app.use(express.static(currentDir));

app.post('/api/ai', async (request, response) => {
    if (!apiKey) {
        return response.status(500).json({ error: 'Server chưa cấu hình OPENAI_API_KEY.' });
    }

    const { instructions, input } = request.body || {};
    if (typeof instructions !== 'string' || typeof input !== 'string' || !instructions.trim() || !input.trim()) {
        return response.status(400).json({ error: 'Thiếu instructions hoặc input hợp lệ.' });
    }

    try {
        const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                instructions,
                input
            })
        });
        const data = await openAiResponse.json();
        if (!openAiResponse.ok) {
            return response.status(openAiResponse.status).json({ error: data.error?.message || 'OpenAI API request thất bại.' });
        }
        return response.json({ output_text: data.output_text });
    } catch (error) {
        return response.status(502).json({ error: `Không thể kết nối OpenAI: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`StudyMate đang chạy tại http://localhost:${port}`);
});
