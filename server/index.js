const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/interview", async (req, res) => {
    const { question, answer } = req.body;

    if (!question) {
        return res.json({
            feedback: "",
            newQuestion: "What role are you interviewing for?",
        });
    }

    const prompt = `
        You are a behavioral interviewer.

        The user just gave an answer to the question:
        "${question}"

        Their answer was:
        "${answer}"

        Your job:
        1. Give constructive, interviewer-style feedback.
        2. Ask a NEW behavioral interview question (one the interviewer would naturally ask in an interview).
        3. Adapt to questions, keep knowledge of them and answers, also remember what type of role the interview is for in order to give relevant questions.
        4. Respond strictly in this JSON format:

        {
        "feedback": "Your constructive feedback goes here.",
        "newQuestion": "Your next interviewer-style question goes here."
        }

        Example:
        {
        "feedback": "That was a solid example highlighting teamwork. You can make it stronger by focusing more on the result you achieved.",
        "newQuestion": "Can you tell me about a time when you had to resolve a conflict within a team?"
        }
        `;

  try {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content || "";

    const cleanContent = content.trim()
        .replace(/^```json\s*/, "") // Removes starting ```json
        .replace(/\s*```$/, "");    // Removes trailing ```

    let parsed;
    try {
        parsed = JSON.parse(cleanContent);
    } catch {
        const feedback = cleanContent.split("New question:")[0]?.trim();
        const newQuestion = cleanContent.split("New question:")[1]?.trim() || "Tell me about a challenge you faced.";
        parsed = { feedback, newQuestion };
    }

    res.json(parsed);
  } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Server listening on http://127.0.0.1:${PORT}`);
});
