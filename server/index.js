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

// Main Interview Route
app.post("/api/interview", async (req, res) => {
  const { question, answer, userRole, topicsAsked } = req.body;

  console.log("\n---------------------------------");
  console.log("User Role:", userRole);
  console.log("Topics Asked:", topicsAsked);
  console.log("---------------------------------\n");

  if (!question) {
    return res.json({
      feedback: "",
      newQuestion: "What role are you interviewing for?",
    });
  }

  const topicsList = Array.isArray(topicsAsked) && topicsAsked.length > 0
    ? topicsAsked.join(", ")
    : "None";

  const prompt = `
    You are a behavioral interviewer for a ${userRole}.
    The user just gave an answer to the question:
    "${question}"

    Their answer was:
    "${answer}"

    Topics already covered:
    ${topicsList}

    Your job:
    1. Give constructive, interviewer-style feedback.
    2. Ask a NEW behavioral interview question that is relevant to the role of ${userRole}.
    3. Do NOT repeat topics listed in the "Topics already covered".
    4. Choose questions that naturally flow from a behavioral interviewer, focusing on areas ${userRole}s are evaluated on.
    5. Respond strictly in this JSON format:

    {
      "feedback": "Your constructive feedback goes here.",
      "newQuestion": "Your next interviewer-style question goes here."
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    const content = completion.choices[0]?.message?.content || ""; 
    const cleanContent = content.trim()
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, ""); 

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

// Extract Role
app.post("/api/extract-role", async (req, res) => {
  const { userInput } = req.body;

  const prompt = `
    The user gave the following answer about the role they're interviewing for:
    "${userInput}"

    Extract and return only the job role in plain text (without company names or extra words).
    If it's unclear, respond with "unknown".
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    const role = completion.choices[0]?.message?.content.trim();
    res.json({ role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error extracting role" });
  }
});

// Extract Topics
app.post("/api/extract-topics", async (req, res) => {
  const { conversation } = req.body;

  const prompt = `
    You are an expert interviewer assistant.
    The conversation is:

    ${conversation}

    List any NEW behavioral topics that appeared in the LAST answer only.
    Do NOT list any topics that were discussed earlier.
    Output STRICTLY in this JSON format:
    {
      "topics": ["newTopic1", "newTopic2"]
    }
    If no new topics appeared, return an empty array for "topics".
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    const content = completion.choices[0]?.message?.content.trim();
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error extracting topics" });
  }
});

// Lets user know if working
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server listening on http://127.0.0.1:${PORT}`);
});
