import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("myChats");
    return saved ? JSON.parse(saved) : [{ id: Date.now(), title: 'New Chat', messages: [] }];
  });
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("myChats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const newMessages = [...activeChat.messages, userMessage];

    // Update the specific chat
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: newMessages } : c));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://aichatapp-production-79ee.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      setChats(prev => prev.map(c => c.id === activeChatId ? { 
        ...c, 
        messages: [...newMessages, { sender: 'ai', text: data.reply }],
        title: c.messages.length === 0 ? input.substring(0, 20) : c.title // Set title on first message
      } : c));
    } catch (error) {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...newMessages, { sender: 'ai', text: 'Error' }] } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newChat = { id: Date.now(), title: 'New Chat', messages: [] };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{ width: '250px', background: '#222', padding: '20px', color: 'white' }}>
        <button onClick={createNewChat} style={{ width: '100%', marginBottom: '20px' }}>+ New Chat</button>
        {chats.map(chat => (
          <div key={chat.id} onClick={() => setActiveChatId(chat.id)} style={{ cursor: 'pointer', padding: '10px', background: activeChatId === chat.id ? '#444' : 'transparent', marginBottom: '5px', borderRadius: '5px' }}>
            {chat.title}
          </div>
        ))}
      </div>

      {/* Main Chat Area */}
      <div className="chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="chat-window">
          {activeChat.messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="input-area">
          <input value={input} onChange={(e) => setInput(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;