import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // 1. Initialize state with localStorage to persist chat
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a ref to track the bottom of the message list
  const messagesEndRef = useRef(null);

  // 2. Save to localStorage every time messages change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // 3. Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage]; // Include the new message
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://aichatapp-production-79ee.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANT: We now send the WHOLE history (newMessages)
        body: JSON.stringify({ messages: newMessages }), 
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      
      // Update with AI response
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'ai', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai">
            <div className="bubble">Thinking...</div>
          </div>
        )}
        {/* This div is the anchor for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="input-area">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type a message..." 
          disabled={isLoading} 
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}

export default App;