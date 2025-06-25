const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/interview", async (req, res) => {
  const { question, answer } = req.body;

  if (!question) {
    return res.json({
      feedback: "",
      newQuestion: "Tell me about a time you worked on a team project.",
    });
  }

  const prompt = `
You are a friendly behavioral interviewer.

User's question: "${question}"
User's answer: "${answer}"

Give constructive feedback on the answer. Then ask a new behavioral interview question.

Format the response as JSON with "feedback" and "newQuestion" fields.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const feedback = content.split("New question:")[0].trim();
      const newQuestion =
        content.split("New question:")[1]?.trim() ||
        "Tell me about a challenge you faced.";
      parsed = { feedback, newQuestion };
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
