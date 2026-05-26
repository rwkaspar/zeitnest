import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function MessagesPage() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [match, setMatch] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
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

  async function handleSend(e) {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;
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
  }

  function startEdit(msg) {
    setEditingId(msg.id);
    setEditDraft(msg.content);
  }

  async function saveEdit() {
    if (!editDraft.trim()) return;
    try {
      const updated = await api.editMessage(editingId, editDraft);
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content: updated.content, edited_at: updated.edited_at } : m));
      setEditingId(null);
      setEditDraft('');
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteMsg(id) {
    if (!confirm('Nachricht wirklich löschen?')) return;
    try {
      await api.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function canEditOrDelete(msg) {
    if (msg.sender_id !== user?.id) return false;
    return Date.now() - new Date(msg.created_at).getTime() < EDIT_WINDOW_MS;
  }

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
              messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                const editable = canEditOrDelete(msg);
                const editing = editingId === msg.id;
                return (
                  <div key={msg.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                    {editing ? (
                      <div className="message-bubble" style={{ background: '#fff', border: '1px solid var(--primary)' }}>
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          autoFocus
                          rows={Math.min(8, editDraft.split('\n').length + 1)}
                          style={{ width: '100%', minWidth: '280px', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditingId(null); setEditDraft(''); }}>Abbrechen</button>
                          <button className="btn btn-sm btn-primary" onClick={saveEdit}>Speichern</button>
                        </div>
                      </div>
                    ) : (
                      <div className="message-bubble" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                    <div className="message-meta">
                      {msg.first_name} &middot; {new Date(msg.created_at).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      {msg.edited_at && <span style={{ marginLeft: '6px', fontStyle: 'italic' }}>(bearbeitet)</span>}
                      {!editing && editable && (
                        <span style={{ marginLeft: '8px', display: 'inline-flex', gap: '6px' }}>
                          <button onClick={() => startEdit(msg)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                            Bearbeiten
                          </button>
                          <button onClick={() => deleteMsg(msg.id)}
                            style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                            Löschen
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {match?.status === 'accepted' ? (
            <form onSubmit={handleSend} className="message-input" style={{ alignItems: 'flex-end' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nachricht schreiben — Strg/⌘+Enter sendet"
                disabled={sending}
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
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
