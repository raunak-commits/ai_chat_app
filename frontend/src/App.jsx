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
    const isFirstMessage = activeChat.messages.length === 0;
    const newMessages = [...activeChat.messages, userMessage];

    const newTitle = isFirstMessage ? input.substring(0, 20) : activeChat.title;

    setChats(prev => prev.map(c => c.id === activeChatId ? { 
      ...c, 
      messages: newMessages,
      title: newTitle 
    } : c));
    
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
        messages: [...newMessages, { sender: 'ai', text: data.reply }]
      } : c));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newChat = { id: Date.now(), title: 'New Chat', messages: [] };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  // NEW: Function to delete a chat
  const deleteChat = (idToDelete, e) => {
    e.stopPropagation(); // Prevents the click from selecting the chat
    const updatedChats = chats.filter(c => c.id !== idToDelete);
    
    // If we delete the last chat, create a fresh one automatically
    if (updatedChats.length === 0) {
      const freshChat = { id: Date.now(), title: 'New Chat', messages: [] };
      setChats([freshChat]);
      setActiveChatId(freshChat.id);
    } else {
      setChats(updatedChats);
      // If we deleted the chat we were currently looking at, switch to the top one
      if (activeChatId === idToDelete) {
        setActiveChatId(updatedChats[0].id);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <button className="new-chat-btn" onClick={createNewChat}>+ New Chat</button>
        {chats.map(chat => (
          <div 
            key={chat.id} 
            className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
            onClick={() => setActiveChatId(chat.id)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
            {/* NEW: Delete Button */}
            <button 
              onClick={(e) => deleteChat(chat.id, e)}
              style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '0 5px', fontSize: '16px', fontWeight: 'bold' }}
              title="Delete Chat"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="chat-area">
        <div className="chat-window">
          {activeChat.messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="input-area">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;