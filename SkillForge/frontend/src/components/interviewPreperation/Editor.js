import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useToast } from "@chakra-ui/react";
import { submitQuestionAnswer } from "../authentication/useUserAuthInfo";

export default function Editor({ question , type }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [skillBotAnswer, setSkillBotAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const recognitionRef = useRef(null);
  const toast = useToast();

  // Simulate word count
  useEffect(() => {
    setWordCount(answer.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [answer]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';
      recog.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswer(transcript);
      };
      recog.onerror = () => {
        setError('Speech recognition error');
        setIsListening(false);
      };
      recognitionRef.current = recog;
    }
  }, []);

  // Reset on new question
  useEffect(() => {
    setAnswer("");
    setFeedback([]);
    setError("");
    setLoading(false);
    setSkillBotAnswer("");
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  }, [question]);

  // Toggle listening
  const handleListen = () => {
    if (!recognitionRef.current) {
      setError('Your browser does not support speech recognition.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async () => {
    const authToken = Cookies.get("authToken");
    if (!authToken) {
      setError("Please log in to submit answers.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = { question, answer, questionType: type };
      const { data } = await axios.post(
        "http://localhost:5001/api/interview/submit-answer",
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (type === "coding") {
        setFeedback(data.modelFeedback || []);
      } else {
        const result = await submitQuestionAnswer(question, answer);
        setFeedback([result]);

      }

      toast({
        title: "Feedback received",
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Simulate SkillBot answer
  useEffect(() => {
    const fetchSkillBot = async () => {
      if (!showDrawer) return;
      
      setSkillBotAnswer("");
      const authToken = Cookies.get("authToken");
      
      if (!authToken) {
        setError("Please log in to use SkillBot.");
        return;
      }

      try {
        const { data } = await axios.post(
          "http://localhost:5001/api/interview/gemini-answer",
          { question },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setSkillBotAnswer(data.answer);
      } catch (err) {
        setSkillBotAnswer("Failed to get SkillBot answer. Please try again.");
        console.error("SkillBot error:", err);
      }
    };

    fetchSkillBot();
  }, [showDrawer, question]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    wrapper: {
      maxWidth: '800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '1rem'
    },
    badge: {
      display: 'inline-block',
      padding: '0.5rem 1rem',
      background: type === 'coding' ? 'linear-gradient(45deg, #10b981, #059669)' : 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
      borderRadius: '2rem',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      textTransform: 'capitalize',
      marginBottom: '1rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #4facfe, #00f2fe)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '0.5rem'
    },
    card: {
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    questionText: {
      fontSize: '1.125rem',
      lineHeight: '1.6',
      color: '#f1f5f9'
    },
    inputSection: {
      position: 'relative'
    },
    inputHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    inputLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#cbd5e1'
    },
    wordCount: {
      fontSize: '0.75rem',
      color: '#94a3b8'
    },
    micButton: {
      padding: '0.5rem',
      background: isListening ? '#ef4444' : 'rgba(59, 130, 246, 0.2)',
      border: isListening ? '2px solid #ef4444' : '2px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '50%',
      color: isListening ? 'white' : '#60a5fa',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginLeft: '0.5rem'
    },
    listeningIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
      color: '#fca5a5'
    },
    progressBar: {
      width: '100%',
      height: '4px',
      background: 'rgba(239, 68, 68, 0.2)',
      borderRadius: '2px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      background: '#ef4444',
      animation: 'pulse 1s infinite'
    },
    textarea: {
      width: '100%',
      minHeight: '200px',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.75rem',
      color: 'white',
      fontSize: '1rem',
      fontFamily: type === 'coding' ? 'Monaco, Consolas, monospace' : 'inherit',
      resize: 'vertical',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    submitButton: {
      width: '100%',
      padding: '1rem 2rem',
      background: answer.trim() ? 'linear-gradient(to right, #4facfe, #00f2fe)' : 'rgba(79, 172, 254, 0.3)',
      border: 'none',
      borderRadius: '0.75rem',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: answer.trim() ? 'pointer' : 'not-allowed',
      transition: 'all 0.3s ease',
      opacity: answer.trim() ? 1 : 0.5
    },
    error: {
      padding: '1rem',
      background: 'rgba(254, 178, 178, 0.1)',
      border: '1px solid rgba(254, 178, 178, 0.3)',
      borderRadius: '0.75rem',
      color: '#fca5a5'
    },
    loadingContainer: {
      textAlign: 'center'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(79, 172, 254, 0.3)',
      borderTop: '4px solid #4facfe',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    },
    skillBotButton: {
      padding: '1rem 2rem',
      background: 'linear-gradient(to right, #14b8a6, #06b6d4)',
      border: 'none',
      borderRadius: '0.75rem',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    drawer: {
      position: 'fixed',
      bottom: showDrawer ? '0' : '-100%',
      left: '0',
      right: '0',
      maxHeight: '70vh',
      background: '#111827',
      borderTopLeftRadius: '1.5rem',
      borderTopRightRadius: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'bottom 0.3s ease',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    },
    drawerOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 999,
      display: showDrawer ? 'block' : 'none'
    },
    drawerHeader: {
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
      borderTopLeftRadius: '1.5rem',
      borderTopRightRadius: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    drawerTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: 'white'
    },
    closeButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '1.25rem'
    },
    drawerBody: {
      padding: '2rem',
      overflowY: 'auto',
      flex: 1
    },
    drawerContent: {
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      whiteSpace: 'pre-line',
      lineHeight: '1.6'
    },
    drawerFooter: {
      padding: '1.5rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          textarea:focus {
            border-color: #4facfe !important;
            box-shadow: 0 0 20px rgba(79, 172, 254, 0.3) !important;
          }
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
        `}
      </style>
      
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>
            {type === 'coding' ? '⚡' : '💡'} {type} Question
          </div>
          <h1 style={styles.title}>Interview Challenge</h1>
        </div>

        {/* Question Card */}
        <div style={styles.card}>
          <p style={styles.questionText}>{question}</p>
        </div>

        {/* Answer Input */}
        <div style={styles.card}>
          <div style={styles.inputSection}>
            <div style={styles.inputHeader}>
              <div style={styles.inputLabel}>
                ⌨️ Your Answer
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={styles.wordCount}>{wordCount} words</span>
                <button
                  style={styles.micButton}
                  onClick={handleListen}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? '🎤' : '🎙️'}
                </button>
              </div>
            </div>

            {isListening && (
              <div>
                <div style={styles.listeningIndicator}>
                  🎵 Listening...
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill}></div>
                </div>
              </div>
            )}

            <textarea
              style={styles.textarea}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                type === "coding" 
                  ? "Write your code here... Use proper syntax and explain your approach." 
                  : "Share your thoughts and explain the concept in detail..."
              }
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          style={styles.submitButton}
          onClick={handleSubmit}
          disabled={!answer.trim() || loading}
        >
          {loading ? '⏳ Analyzing your answer...' : '🚀 Submit Answer'}
        </button>

        {/* Loading */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ color: '#cbd5e1' }}>Our AI is reviewing your response...</p>
          </div>
        )}

        {/* Feedback Display */}
        {feedback.length > 0 && (
          <div style={{
            ...styles.card,
            background: type === 'coding' 
              ? 'rgba(59, 130, 246, 0.1)' 
              : feedback[0].answer_type === "correct" 
                ? 'rgba(72, 187, 120, 0.1)' 
                : 'rgba(245, 101, 101, 0.1)',
            border: type === 'coding'
              ? '1px solid rgba(59, 130, 246, 0.3)'
              : feedback[0].answer_type === "correct" 
                ? '1px solid rgba(72, 187, 120, 0.3)' 
                : '1px solid rgba(245, 101, 101, 0.3)'
          }}>
            {type === 'coding' ? (
              <div>
                <h3 style={{
                  color: '#93c5fd',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🔍 Code Analysis</span>
                </h3>
                {feedback.map((item, index) => (
                  <div key={index} style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: item.error_type === 'No Errors Detected' 
                          ? '#10b981' 
                          : '#ef4444',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {item.error_type}
                      </span>
                    </div>
                    <p style={{ color: '#e2e8f0', margin: 0 }}>
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: feedback[0].answer_type === "correct" ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}>
                  {feedback[0].answer_type === "correct" ? '✓' : '✗'}
                </div>
                <div>
                  <h3 style={{
                    color: feedback[0].answer_type === "correct" ? '#6ee7b7' : '#fca5a5',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    {feedback[0].answer_type === "correct"
                      ? "Excellent! Your answer is correct"
                      : "Not quite right, but good effort!"}
                  </h3>
                  {feedback[0].message && (
                    <p style={{ color: '#e2e8f0', margin: '0.5rem 0 0' }}>
                      {feedback[0].message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SkillBot Button */}
        {feedback.length > 0 && feedback.some((f) => f.answer_type === "incorrect") && (
          <button
            style={styles.skillBotButton}
            onClick={() => setShowDrawer(true)}
          >
            🤖 Get Hint from SkillBot
          </button>
        )}
      </div>

      {/* Drawer Overlay */}
      <div 
        style={styles.drawerOverlay} 
        onClick={() => setShowDrawer(false)}
      />

      {/* SkillBot Drawer */}
      <div style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <div style={styles.drawerTitle}>🤖 SkillBot AI Assistant</div>
          <button
            style={styles.closeButton}
            onClick={() => setShowDrawer(false)}
          >
            ×
          </button>
        </div>
        <div style={styles.drawerBody}>
          {skillBotAnswer ? (
            <div style={styles.drawerContent}>
              {skillBotAnswer}
            </div>
          ) : (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={{ color: '#cbd5e1' }}>SkillBot is preparing your personalized hint...</p>
            </div>
          )}
        </div>
        <div style={styles.drawerFooter}>
          <button 
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(to right, #14b8a6, #06b6d4)',
              border: 'none',
              borderRadius: '0.75rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => setShowDrawer(false)}
          >
            Got it, thanks! 👍
          </button>
        </div>
      </div>
    </div>
  );
}