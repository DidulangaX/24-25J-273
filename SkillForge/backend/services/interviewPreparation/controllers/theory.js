require('dotenv').config();
const OpenAI = require('openai');


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const theory = async (req, res) => {

    const { question, answer } = req.body;

    const prompt = `You are an interviewer.\nQuestion: "${question}"\nCandidate Answer: "${answer}"\n\nRespond as JSON: {"answer_type": "correct"|"incorrect", "explanation": "..."}.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
    });
    const content = response.choices[0].message.content.trim();
    try {
        gptFeedback = JSON.parse(content);
    } catch (parseErr) {
        console.error('GPT parse error:', parseErr, content);
        return res.status(500).json({ message: 'Invalid GPT output', raw: content });
    }
}


module.exports =  {
    theory,
};