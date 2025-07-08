import { useState } from "react";

const initialQuestion = "What role are you interviewing for?";

export default function App() {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [topicsAsked, setTopicsAsked] = useState([]);

  async function submitAnswer() {
    if (!answer.trim()) {
      alert("Please type an answer before submitting.");
      return;
    }

    setLoading(true);

    try {
      // Extract Role
      if (question.includes("What role are you interviewing for")) {
        const roleRes = await fetch("/api/extract-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInput: answer.trim() }),
        });

        const roleData = await roleRes.json();
        setUserRole(roleData.role);

      } else {
        // Extract Topics
        const conversation = history
          .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
          .join("\n");

        const topicsRes = await fetch("/api/extract-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation }),
        });
        
        const topicsData = await topicsRes.json();
        const newTopics = topicsData.topics.filter((t) => !topicsAsked.includes(t));

        setTopicsAsked((prev) => [...prev, ...newTopics]);
      }

      // Get New Question
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          userRole,
          topicsAsked,
        }),
      });
      
      const data = await res.json();

      // Update State
      setHistory([...history, { question, answer, feedback: data.feedback }]);
      setFeedback(data.feedback);
      setAnswer("");
      setQuestion(data.newQuestion);

    } catch (err) {
      alert("Error contacting the server. Try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="content">
        <div className="left-panel">
          <h1>AI Behavioral Interview</h1>
          <section>
            <h2>Question</h2>
            <p>{question}</p>
          </section>

          <div className="textarea-container">
            <textarea
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>

          <div className="submit-button-container">
            <button
              className={`submit-button ${loading ? "loading" : ""}`}
              onClick={submitAnswer}
              disabled={loading}
            >
              {loading ? "Processing…" : "Submit Answer"}
            </button>
            {loading && <div className="loader"></div>}
          </div>
        </div>

        <div className="right-panel">
          {feedback && (
            <div className="card">
              <h3>AI Feedback</h3>
              <p>{feedback}</p>
            </div>
          )}
          {history.length > 0 && (
            <div className="card">
              <h3>History</h3>
              <ul>
                {history.map(({ question, answer, feedback }, i) => (
                  <li key={i}>
                    <p><strong>Q:</strong> {question}</p>
                    <p><strong>A:</strong> {answer}</p>
                    <p><em>Feedback: {feedback}</em></p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
