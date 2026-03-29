import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function MessagesPage() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [match, setMatch] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [msgs, matches] = await Promise.all([
          api.getMessages(matchId),
          api.getMatches()
        ]);
        setMessages(msgs);
        setMatch(matches.find(m => m.id === matchId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Poll for new messages
    const interval = setInterval(async () => {
      try {
        const msgs = await api.getMessages(matchId);
        setMessages(msgs);
      } catch (err) { /* silent */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(matchId, newMessage);
      setMessages(prev => [...prev, { ...msg, first_name: user.first_name, last_name: user.last_name }]);
      setNewMessage('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const isParent = user?.role === 'parent';
  const otherName = match
    ? (isParent ? `${match.grandparent_first_name} ${match.grandparent_last_name}` : `${match.parent_first_name} ${match.parent_last_name}`)
    : 'Unbekannt';

  return (
    <div className="messages-page">
      <div className="container">
        <div className="messages-header">
          <Link to="/anfragen" className="btn btn-outline btn-sm">&larr; Zur&uuml;ck</Link>
          <h1>Chat mit {otherName}</h1>
        </div>

        <div className="card">
          <div className="message-list">
            {messages.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p>Noch keine Nachrichten. Sagen Sie Hallo! &#x1F44B;</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender_id === user?.id ? 'own' : 'other'}`}>
                  <div className="message-bubble">{msg.content}</div>
                  <div className="message-meta">
                    {msg.first_name} &middot; {new Date(msg.created_at).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {match?.status === 'accepted' ? (
            <form onSubmit={handleSend} className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nachricht schreiben..."
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
                {sending ? '...' : 'Senden'}
              </button>
            </form>
          ) : (
            <p style={{ textAlign: 'center', padding: '16px', color: '#6b7c93', fontSize: '0.9rem' }}>
              Nachrichten k&ouml;nnen erst nach Annahme der Anfrage gesendet werden.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
