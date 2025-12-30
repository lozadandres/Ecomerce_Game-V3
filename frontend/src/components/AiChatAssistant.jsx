import React, { useState, useEffect, useRef } from 'react';
import { processChat, getCarrito } from '../services/api';
import BehaviorMonitor from './BehaviorMonitor';
import { useAuth } from '../context/AuthContext';

/**
 * AiChatAssistant - Floating AI Chatbot with Predictive Capabilities.
 */
const AiChatAssistant = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        try {
          const data = await getCarrito(user.id);
          setCartItems(data?.Productos || []);
        } catch (error) {
          console.error("Error fetching cart for AI:", error);
        }
      }
    };
    fetchCart();
  }, [user]);
  const [messages, setMessages] = useState([
    { role: 'ai', text: '¡Hola! Soy Joystick AI. ¿Tienes alguna duda sobre los juegos o tu pedido?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(null);
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await processChat({
        message: userMsg,
        cartItems: cartItems,
        behaviorContext: lastTrigger || { type: 'chat' }
      });
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Lo siento, tuve un pequeño problema técnico. ¿Podrías repetir eso?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onBehaviorTrigger = (context) => {
    if (isOpen) return; // Don't nudge if already chatting
    setLastTrigger(context);
    setShowNudge(true);
    
    // Auto-message based on context
    const greeting = context.reason === 'exit_intent' 
      ? "¡Hey! No te vayas todavía. ¿Te puedo ayudar con algo en tu carrito?"
      : "¿Sigues ahí? Si tienes dudas sobre el envío o algún producto, estoy aquí para ayudar.";
    
    setMessages(prev => [
      ...prev, 
      { role: 'ai', text: greeting }
    ]);
  };

  return (
    <>
      <BehaviorMonitor onTrigger={onBehaviorTrigger} />

      <div className={`ai-assistant-wrapper ${isOpen ? 'open' : ''}`}>
        {/* Nudge Notification bubble */}
        {showNudge && !isOpen && (
          <div className="ai-nudge-bubble" onClick={() => { setIsOpen(true); setShowNudge(false); }}>
            <div className="nudge-dot"></div>
            <span>¿Tienes alguna duda?</span>
          </div>
        )}

        {/* Main TOGGLE Button */}
        <button 
          className="ai-chat-toggle" 
          onClick={() => { setIsOpen(!isOpen); setShowNudge(false); }}
        >
          {isOpen ? '✕' : '🤖'}
        </button>

        {/* Chat Window */}
        {isOpen && (
          <div className="ai-chat-window">
            <div className="chat-header">
              <div className="ai-status">
                <span className="dot pulse"></span>
                <strong>Joystick AI</strong>
              </div>
              <p>Asistente de ventas experto</p>
            </div>

            <div className="chat-body">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  <div className="msg-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-msg ai">
                  <div className="msg-bubble loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-footer" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Escribe tu duda aquí..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !inputValue.trim()}>
                →
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default AiChatAssistant;
