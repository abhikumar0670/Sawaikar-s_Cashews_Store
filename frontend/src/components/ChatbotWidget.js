import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '@clerk/clerk-react';
import { API_ENDPOINTS } from '../config/api';
import { FiMessageCircle, FiX, FiSend, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';

const ChatbotWidget = () => {
  const { userId, isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Generate or retrieve session ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem('chatbot_session_id');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatbot_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);

    // Load conversation history
    loadHistory(storedSessionId);

    // Load suggestions
    loadSuggestions();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async (sid) => {
    try {
      const response = await fetch(API_ENDPOINTS.CHATBOT_HISTORY(sid));
      const data = await response.json();
      if (data.success && data.data.messages) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CHATBOT_SUGGESTIONS);
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CHATBOT_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          userId: isSignedIn ? userId : null,
          message: messageText.trim(),
          metadata: {
            platform: 'web',
            url: window.location.href
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (data.data.escalated) {
          // Show escalation notice
          setSuggestions(['Contact Support', 'View FAQs']);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact support.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatbot_session_id', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <ChatButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </ChatButton>

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow>
          <ChatHeader>
            <HeaderInfo>
              <BotAvatar>AI</BotAvatar>
              <div>
                <HeaderTitle>Sawaikar Support</HeaderTitle>
                <HeaderStatus>Online - Powered by AI</HeaderStatus>
              </div>
            </HeaderInfo>
            <HeaderActions>
              <ActionButton onClick={clearChat} title="New Chat">
                New
              </ActionButton>
            </HeaderActions>
          </ChatHeader>

          <MessagesContainer>
            {messages.length === 0 && (
              <WelcomeMessage>
                <BotAvatar $large>AI</BotAvatar>
                <h3>Welcome to Sawaikar's!</h3>
                <p>I'm your AI assistant. Ask me about products, orders, shipping, or anything else!</p>
              </WelcomeMessage>
            )}

            {messages.map((msg, index) => (
              <Message key={index} $isUser={msg.role === 'user'}>
                <MessageBubble $isUser={msg.role === 'user'}>
                  {msg.content}
                </MessageBubble>
                {msg.role === 'assistant' && (
                  <FeedbackButtons>
                    <FeedbackBtn title="Helpful"><FiThumbsUp size={12} /></FeedbackBtn>
                    <FeedbackBtn title="Not Helpful"><FiThumbsDown size={12} /></FeedbackBtn>
                  </FeedbackButtons>
                )}
              </Message>
            ))}

            {isLoading && (
              <Message $isUser={false}>
                <MessageBubble $isUser={false}>
                  <TypingIndicator>
                    <span></span>
                    <span></span>
                    <span></span>
                  </TypingIndicator>
                </MessageBubble>
              </Message>
            )}

            <div ref={messagesEndRef} />
          </MessagesContainer>

          {/* Quick Suggestions */}
          {messages.length < 2 && suggestions.length > 0 && (
            <SuggestionsContainer>
              {suggestions.map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </SuggestionChip>
              ))}
            </SuggestionsContainer>
          )}

          <InputContainer>
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <SendButton onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
              <FiSend size={18} />
            </SendButton>
          </InputContainer>
        </ChatWindow>
      )}
    </>
  );
};

// Styled Components
const ChatButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(139, 69, 19, 0.4);
  transition: all 0.3s ease;
  z-index: 9999;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(139, 69, 19, 0.5);
  }

  ${props => props.$isOpen && `
    background: #666;
  `}
`;

const ChatWindow = styled.div`
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 380px;
  height: 520px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;

  @media (max-width: 480px) {
    width: calc(100vw - 32px);
    right: 16px;
    bottom: 90px;
    height: 70vh;
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BotAvatar = styled.div`
  width: ${props => props.$large ? '48px' : '36px'};
  height: ${props => props.$large ? '48px' : '36px'};
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: ${props => props.$large ? '18px' : '14px'};
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const HeaderStatus = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
`;

const WelcomeMessage = styled.div`
  text-align: center;
  padding: 24px;
  color: #666;

  h3 {
    margin: 16px 0 8px;
    color: #333;
  }

  p {
    font-size: 14px;
    line-height: 1.5;
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 12px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;

  ${props => props.$isUser ? `
    background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    background: white;
    color: #333;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  `}
`;

const FeedbackButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${Message}:hover & {
    opacity: 1;
  }
`;

const FeedbackBtn = styled.button`
  background: #f0f0f0;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;

  &:hover {
    background: #e0e0e0;
    color: #333;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;

  span {
    width: 8px;
    height: 8px;
    background: #8B4513;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`;

const SuggestionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #eee;
`;

const SuggestionChip = styled.button`
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #8B4513;
    color: white;
    border-color: #8B4513;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #eee;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #8B4513;
  }

  &:disabled {
    background: #f5f5f5;
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default ChatbotWidget;
