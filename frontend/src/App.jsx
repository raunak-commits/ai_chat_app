import { useState, useEffect, useRef } from 'react';
import './App.css';
import Auth from './Auth';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

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

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('myChats');
    setUser(null);
    setToken(null);
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    const isFirstMessage = activeChat.messages.length === 0;
    const newMessages = [...activeChat.messages, userMessage];
    const newTitle = isFirstMessage ? input.substring(0, 25) : activeChat.title;

    setChats(prev => prev.map(c => c.id === activeChatId ? {
      ...c, messages: newMessages, title: newTitle
    } : c));

    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://aichatapp-production-79ee.up.railway.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c, messages: [...newMessages, { sender: 'ai', text: data.reply }]
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

  const deleteChat = (idToDelete, e) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c.id !== idToDelete);
    if (updatedChats.length === 0) {
      const freshChat = { id: Date.now(), title: 'New Chat', messages: [] };
      setChats([freshChat]);
      setActiveChatId(freshChat.id);
    } else {
      setChats(updatedChats);
      if (activeChatId === idToDelete) setActiveChatId(updatedChats[0].id);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">💬 MyChat</span>
        </div>
        <button className="new-chat-btn" onClick={createNewChat}>
          <span>+</span> New Chat
        </button>
        <div className="chat-list-label">Recent</div>
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
            onClick={() => setActiveChatId(chat.id)}
          >
            <div className="chat-item-icon">💭</div>
            <div className="chat-item-info">
              <span className="chat-item-title">{chat.title}</span>
              <span className="chat-item-count">{chat.messages.length} messages</span>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => deleteChat(chat.id, e)}
              title="Delete Chat"
            >×</button>
          </div>
        ))}
      </div>

      <div className="chat-area">
        <div className="chat-header">
          <div className="ai-avatar">🤖</div>
          <div style={{ flex: 1 }}>
            <div className="ai-name">AI Assistant</div>
            <div className="ai-status">● Online</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>👤 {user.name}</span>
            <button onClick={handleLogout} style={{
              background: 'transparent',
              border: '1px solid #2a2a2a',
              color: '#666',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px'
            }}>Logout</button>
          </div>
        </div>

        <div className="chat-window">
          {activeChat.messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <h2>How can I help you today?</h2>
              <p>Ask me anything — I'm here to help!</p>
            </div>
          )}

          {activeChat.messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.sender === 'ai' && <div className="avatar">🤖</div>}
              <div className="bubble">{msg.text}</div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai">
              <div className="avatar">🤖</div>
              <div className="bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>➤</button>
        </form>
      </div>
    </div>
  );
}

export default App;