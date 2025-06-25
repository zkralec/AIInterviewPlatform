import { useState } from "react"

const initialQuestion = "Tell me about a time you worked on a team project."

export default function App() {
  const [question, setQuestion] = useState(initialQuestion)
  const [answer, setAnswer] = useState("")
  // Array of {question, answer, feedback}
  const [history, setHistory] = useState([])
  const [feedback, setFeedback] = useState("")

  async function submitAnswer() {
    if (!answer.trim()) return alert("Please type an answer before submitting.")
  
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      })
  
      const data = await res.json()
  
      setHistory([...history, { question, answer, feedback: data.feedback }])
      setFeedback(data.feedback)
      setAnswer("")
      setQuestion(data.newQuestion)
    } catch (err) {
      alert("Error contacting the server. Try again later.")
      console.error(err)
    }
  }  

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Simulated Behavioral Interview</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Question:</h2>
        <p className="text-lg">{question}</p>
      </section>

      <textarea
        rows={5}
        className="w-full border rounded p-2"
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <button
        onClick={submitAnswer}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Answer
      </button>

      {feedback && (
        <section className="bg-gray-100 p-3 rounded border">
          <h3 className="font-semibold">AI Feedback:</h3>
          <p>{feedback}</p>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-2">History</h3>
          <ul className="space-y-4 max-h-48 overflow-auto border rounded p-2 bg-white">
            {history.map(({ question, answer, feedback }, i) => (
              <li key={i} className="border-b pb-2">
                <p className="font-semibold">Q: {question}</p>
                <p>A: {answer}</p>
                <p className="italic text-sm text-gray-600">Feedback: {feedback}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
