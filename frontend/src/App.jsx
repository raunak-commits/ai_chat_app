import { useState, useEffect, useRef } from 'react';
import './App.css';
import Auth from './Auth';

const API = 'https://aichatapp-production-79ee.up.railway.app';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && token) loadChats();
  }, [user, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadChats = async () => {
    try {
      const res = await fetch(`${API}/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const res = await fetch(`${API}/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    loadMessages(chatId);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const createNewChat = async () => {
    try {
      const res = await fetch(`${API}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'New Chat' })
      });
      const data = await res.json();
      setChats(prev => [data.chat, ...prev]);
      setActiveChatId(data.chat.id);
      setMessages([]);
      if (window.innerWidth <= 768) setSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API}/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = chats.filter(c => c.id !== chatId);
      setChats(updated);
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let currentChatId = activeChatId;

    if (!currentChatId) {
      try {
        const res = await fetch(`${API}/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: input.substring(0, 25) })
        });
        const data = await res.json();
        setChats(prev => [data.chat, ...prev]);
        currentChatId = data.chat.id;
        setActiveChatId(currentChatId);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (messages.length === 0) {
      await fetch(`${API}/chats/${currentChatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: input.substring(0, 25) })
      });
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: input.substring(0, 25) } : c));
    }

    await fetch(`${API}/chats/${currentChatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sender: 'user', text: input })
    });

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();
      const aiMessage = { sender: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMessage]);

      await fetch(`${API}/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sender: 'ai', text: data.reply })
      });

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">💬 MyChat</span>
          <button className="toggle-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <button className="new-chat-btn" onClick={createNewChat}>
          <span>+</span> New Chat
        </button>
        <div className="chat-list-label">Recent</div>
        {chats.length === 0 && (
          <div style={{ color: '#555', fontSize: '13px', padding: '8px 4px' }}>No chats yet</div>
        )}
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
            onClick={() => selectChat(chat.id)}
          >
            <div className="chat-item-icon">💭</div>
            <div className="chat-item-info">
              <span className="chat-item-title">{chat.title}</span>
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
          {!sidebarOpen && (
            <button className="toggle-btn open-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          )}
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
          {!activeChatId && (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <h2>Hi, {user.name}!</h2>
              <p>What would you like to talk about today?</p>
              <button className="new-chat-btn" style={{ marginTop: '16px' }} onClick={createNewChat}>
                + Start a New Chat
              </button>
            </div>
          )}

          {activeChatId && messages.map((msg, i) => (
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
            placeholder={activeChatId ? "Type a message..." : `Ask me anything, ${user.name}...`}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>➤</button>
        </form>
      </div>
    </div>
  );
}

export default App;