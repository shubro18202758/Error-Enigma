import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import './ChatOverlay.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  typing?: boolean;
}

interface ChatOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ isVisible, onToggle }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (currentUser && isVisible) {
      // Connect to backend WebSocket
      socketRef.current = io('http://localhost:3001', {
        auth: {
          userId: currentUser.uid
        }
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        console.log('🔌 Chat connected to server');
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        console.log('🔌 Chat disconnected from server');
      });

      // Listen for AI responses
      socketRef.current.on('ai-response', (data: any) => {
        setIsTyping(false);
        addMessage(data.message, 'ai');
      });

      socketRef.current.on('ai-error', (error: any) => {
        setIsTyping(false);
        addMessage('Sorry, I encountered an error. Please try again.', 'ai');
      });

      // Join user-specific room
      socketRef.current.emit('join-user-room', currentUser.uid);

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [currentUser, isVisible]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !socketRef.current || !currentUser) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, 'user');
    setIsTyping(true);

    // Send to AI via WebSocket
    socketRef.current.emit('ai-chat', {
      message: userMessage,
      userId: currentUser.uid,
      context: {
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAIGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}! I'm your AI learning assistant. How can I help you today?`;
  };

  // Initialize with greeting if no messages
  useEffect(() => {
    if (messages.length === 0 && isVisible && currentUser) {
      addMessage(getAIGreeting(), 'ai');
    }
  }, [isVisible, currentUser]);

  if (!isVisible) return null;

  return (
    <div className={`chat-overlay ${isMinimized ? 'minimized' : ''}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <div className="ai-avatar">🤖</div>
          <div className="chat-info">
            <div className="chat-name">AI Learning Assistant</div>
            <div className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Online' : 'Connecting...'}
            </div>
          </div>
        </div>
        <div className="chat-controls">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? '📈' : '➖'}
          </button>
          <button className="close-btn" onClick={onToggle}>
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message ai">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your learning..."
                className="chat-input"
                rows={1}
                disabled={!isConnected}
              />
              <button 
                onClick={sendMessage}
                className="send-btn"
                disabled={!inputText.trim() || !isConnected}
              >
                🚀
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <button 
                className="quick-action"
                onClick={() => setInputText("What should I study next?")}
              >
                📚 Study Plan
              </button>
              <button 
                className="quick-action"
                onClick={() => setInputText("Show my progress")}
              >
                📊 Progress
              </button>
              <button 
                className="quick-action"
                onClick={() => setInputText("Start a quiz")}
              >
                🎯 Quiz
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatOverlay;
