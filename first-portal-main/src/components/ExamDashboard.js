// src/components/ExamDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Alert } from 'react-bootstrap';
import apiService from '../services/api';

const ExamDashboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const student = apiService.getUser();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DB-question mode state
  const [currentQ, setCurrentQ] = useState(0);

  // Unified answer state
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [examTerminated, setExamTerminated] = useState(false);
  const MAX_TAB_SWITCHES = 3;

  // ✅ FIXED: Fetch exam data correctly
  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
  try {
    setLoading(true);
    setError('');

    console.log('📝 Fetching exam data for ID:', examId);
    
    // Get exam details
    const examData = await apiService.getExamQuestions(examId);
    
    if (!examData || !examData.exam) {
      setError('Exam not found');
      setLoading(false);
      return;
    }

    console.log('✅ Got exam:', examData.exam);
    
    // Check if student has already joined
    if (examData.submission) {
      console.log('✅ Already joined:', examData.submission);
    } else {
      // Try to auto-join using exam code
      const examCode = examData.exam.exam_code;
      console.log('📝 Auto-joining exam with code:', examCode);
      
      try {
        await apiService.joinExam(examCode);
        console.log('✅ Auto-joined successfully');
      } catch (joinError) {
        console.error('⚠️ Join failed:', joinError.message);
        if (joinError.message?.includes('must join')) {
          setError('Please use the exam code to join first');
          setLoading(false);
          return;
        }
      }
    }
    
    setExam(examData.exam);
    setQuestions(examData.questions || []);
    setTimeLeft(examData.exam.duration * 60);

    console.log('✅ Exam ready');

  } catch (err) {
    console.error('❌ Error:', err);
    setError(err.message || 'Failed to load exam');
  } finally {
    setLoading(false);
  }
};

  const isPdfMode = exam && exam.pdf_url;
  const totalQ = isPdfMode ? exam.total_questions : questions.length;

  const getKey = (indexOrId) => String(indexOrId);

  const saveAnswerToBackend = async (key, answer) => {
    try {
      if (isPdfMode) {
        await apiService.saveAnswer(parseInt(examId), {
          exam_id: parseInt(examId),
          question_number: parseInt(key),
          answer,
        });
      } else {
        await apiService.saveAnswer(parseInt(examId), {
          exam_id: parseInt(examId),
          question_id: parseInt(key),
          answer,
        });
      }
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const toggleOption = async (key, optionValue) => {
    if (answers[key] === optionValue) {
      const updated = { ...answers };
      delete updated[key];
      setAnswers(updated);
    } else {
      setAnswers({ ...answers, [key]: optionValue });
      await saveAnswerToBackend(key, optionValue);
    }
  };

  const buildFormattedAnswers = () => {
    if (isPdfMode) {
      return Object.keys(answers).map(qNum => ({
        question_number: parseInt(qNum),
        answer: answers[qNum],
      }));
    } else {
      return Object.keys(answers).map(qId => ({
        question_id: parseInt(qId),
        answer: answers[qId],
      }));
    }
  };

  const handleForceSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setExamTerminated(true);
    setSubmitting(true);
    try {
      const result = await apiService.submitExam(examId, buildFormattedAnswers());
      navigate(`/result/${result.attempt_id}`, {
        state: { terminated: true, terminationReason: `Tab switch limit exceeded (${MAX_TAB_SWITCHES}/${MAX_TAB_SWITCHES})` },
      });
    } catch (err) {
      setError(err.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  }, [examId, answers, submitted, submitting, navigate, isPdfMode]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      const result = await apiService.submitExam(examId, buildFormattedAnswers());
      navigate(`/result/${result.attempt_id}`, {
        state: { autoSubmitted: true, reason: 'Time expired' },
      });
    } catch (err) {
      setError(err.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  }, [examId, answers, submitted, submitting, navigate, isPdfMode]);

  useEffect(() => {
    if (submitted || examTerminated) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            setWarningMessage(`You have switched tabs ${MAX_TAB_SWITCHES} times. Your exam is now being auto-submitted.`);
            setShowWarningModal(true);
            setTimeout(() => { setShowWarningModal(false); handleForceSubmit(); }, 3000);
          } else {
            const remaining = MAX_TAB_SWITCHES - newCount;
            setWarningMessage(`WARNING: You switched away from the exam tab!\n\nTab switch ${newCount} of ${MAX_TAB_SWITCHES}.\n\n${remaining} warning${remaining === 1 ? '' : 's'} remaining before auto-submission.`);
            setShowWarningModal(true);
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [submitted, examTerminated, handleForceSubmit]);

  useEffect(() => {
    if (submitted || examTerminated || !exam || loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          clearInterval(timer); 
          handleAutoSubmit(); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, examTerminated, exam, loading, handleAutoSubmit]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:16 }}>
        <div className="spinner-border text-primary" role="status" style={{ width:60, height:60 }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div style={{ fontSize:18, color:'#667eea', fontWeight:600 }}>Loading exam...</div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>⚠️</div>
        <h3>Failed to Load Exam</h3>
        <p style={{ color:'#666', marginBottom:24 }}>{error}</p>
        <Button variant="primary" onClick={() => navigate('/exams')}>Back to Exams</Button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div style={{ textAlign:'center', padding:80 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>📝</div>
        <h3>Exam Not Found</h3>
        <Button variant="primary" onClick={() => navigate('/exams')}>Back to Exams</Button>
      </div>
    );
  }

  const confirmSubmit = async () => {
    setShowModal(false);
    setSubmitting(true);
    try {
      const result = await apiService.submitExam(examId, buildFormattedAnswers());
      setSubmitted(true);
      navigate(`/result/${result.attempt_id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const attemptedCount = Object.keys(answers).length;
  const unanswered = totalQ - attemptedCount;

  const getWarningColor = () => {
    if (tabSwitchCount >= MAX_TAB_SWITCHES) return '#e53935';
    if (tabSwitchCount === 2) return '#ff9800';
    if (tabSwitchCount === 1) return '#ffc107';
    return 'transparent';
  };

  const OmrPanel = () => {
    const OPTIONS = ['A', 'B', 'C', 'D'];

    return (
      <div className="omr-panel">
        <div className="timer-box">
          <div className="timer-label">TIME REMAINING</div>
          <div className={`timer-value ${timeLeft < 300 ? 'timer-warning' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {tabSwitchCount > 0 && (
          <div className={`tab-warning-bar ${tabSwitchCount >= 2 ? 'critical' : ''}`}>
            <div className="tab-warning-icon">⚠️</div>
            <div className="tab-warning-text">
              <strong>Tab Switches: {tabSwitchCount}/{MAX_TAB_SWITCHES}</strong><br />
              <span>{MAX_TAB_SWITCHES - tabSwitchCount} remaining before auto-submit</span>
            </div>
          </div>
        )}

        <div className="omr-header">
          <h6>OMR Answer Sheet</h6>
          <span className="omr-count">{attemptedCount}/{totalQ} Answered</span>
        </div>
        <div className="omr-info-text">Click to select. Tap SAME option to deselect.</div>

        <div className="omr-sheet-container" style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px repeat(4, 1fr)',
            gap: 4,
            padding: '8px 12px 4px',
            borderBottom: '1px solid #e0e0e0',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textAlign: 'center' }}>Q.NO</div>
            {OPTIONS.map(opt => (
              <div key={opt} style={{ fontSize: 11, fontWeight: 700, color: '#888', textAlign: 'center' }}>{opt}</div>
            ))}
          </div>

          {Array.from({ length: totalQ }, (_, i) => {
            const qNum = i + 1;
            const key = isPdfMode ? getKey(qNum) : getKey(questions[i]?.id);
            const selected = answers[key];
            const isCurrentRow = !isPdfMode && i === currentQ;

            return (
              <div
                key={qNum}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px repeat(4, 1fr)',
                  gap: 4,
                  padding: '5px 12px',
                  background: isCurrentRow ? '#f0f0ff' : (qNum % 2 === 0 ? '#fafafa' : '#fff'),
                  borderLeft: isCurrentRow ? '3px solid #667eea' : '3px solid transparent',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2D0040', textAlign: 'center' }}>{qNum}</div>
                {OPTIONS.map(opt => {
                  const isSel = selected === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => {
                        if (!isPdfMode) setCurrentQ(i);
                        toggleOption(key, opt);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: `2px solid ${isSel ? '#667eea' : '#ccc'}`,
                        background: isSel ? '#667eea' : '#fff',
                        color: isSel ? '#fff' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        margin: '0 auto',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="submit-section">
          <Button className="btn-submit-exam" onClick={() => setShowModal(true)} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </div>
      </div>
    );
  };

  if (isPdfMode) {
    const pdfSrc = exam.pdf_url.startsWith('http') 
      ? exam.pdf_url 
      : `${window.location.origin}${exam.pdf_url}`;

    return (
      <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="exam-header-bar">
          <h4>{exam.exam_code} &mdash; {student?.name || 'Student'}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              {attemptedCount} of {totalQ} Answered
            </span>
            {tabSwitchCount > 0 && (
              <div className="tab-switch-indicator" style={{ background: getWarningColor() }}>
                Tab Switches: {tabSwitchCount}/{MAX_TAB_SWITCHES}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '6px 16px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', fontSize: 13, color: '#555' }}>
          Question Paper &mdash; {exam.title}
          <span style={{ float: 'right', color: '#667eea', fontWeight: 600 }}>{attemptedCount} of {totalQ} Answered</span>
        </div>

        {error && (
          <Alert variant="danger" style={{ margin: 8, borderRadius: 10 }}>{error}</Alert>
        )}

        <div className="exam-body" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="question-panel" style={{ padding: 0 }}>
            <iframe
              src={pdfSrc}
              title="Exam PDF"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <OmrPanel />
        </div>

        <SubmitModal
          showModal={showModal}
          setShowModal={setShowModal}
          confirmSubmit={confirmSubmit}
          submitting={submitting}
          totalQ={totalQ}
          attemptedCount={attemptedCount}
          unanswered={unanswered}
        />

        <TabWarningModal
          showWarningModal={showWarningModal}
          setShowWarningModal={setShowWarningModal}
          tabSwitchCount={tabSwitchCount}
          warningMessage={warningMessage}
          MAX_TAB_SWITCHES={MAX_TAB_SWITCHES}
        />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
        <h3>No Questions Available</h3>
        <p style={{ color: '#666', marginBottom: 24 }}>This exam doesn't have any questions yet.</p>
        <Button variant="primary" onClick={() => navigate('/exams')}>Back to Exams</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="exam-header-bar">
        <h4>{exam.title}</h4>
        {tabSwitchCount > 0 && (
          <div className="tab-switch-indicator" style={{ background: getWarningColor() }}>
            Tab Switches: {tabSwitchCount}/{MAX_TAB_SWITCHES}
          </div>
        )}
      </div>

      {error && <Alert variant="danger" style={{ margin: 16, borderRadius: 10 }}>{error}</Alert>}

      <div className="exam-body">
        <div className="question-panel">
          <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:16, borderBottom:'2px solid #e0e0e0' }}>
                <h5 style={{ margin:0, color:'#667eea', fontWeight:700 }}>Question {currentQ + 1} of {totalQ}</h5>
                <span style={{
                  padding:'6px 16px',
                  background: answers[getKey(currentQuestion.id)] ? '#e8f5e9' : '#fff3e0',
                  color: answers[getKey(currentQuestion.id)] ? '#2e7d32' : '#f57f17',
                  borderRadius:20, fontSize:12, fontWeight:600
                }}>
                  {answers[getKey(currentQuestion.id)] ? 'Answered' : 'Not Answered'}
                </span>
              </div>

              <p style={{ fontSize:18, lineHeight:1.8, color:'#333', marginBottom:32, whiteSpace:'pre-wrap' }}>
                {currentQuestion.question_text}
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {['option_a','option_b','option_c','option_d','option_e'].map((optionKey, index) => {
                  if (!currentQuestion[optionKey]) return null;
                  const optionValue = String.fromCharCode(65 + index);
                  const isSelected = answers[getKey(currentQuestion.id)] === optionValue;
                  return (
                    <label
                      key={optionKey}
                      style={{
                        display:'flex', alignItems:'center', padding:16,
                        border:`2px solid ${isSelected ? '#667eea' : '#e0e0e0'}`,
                        borderRadius:12, cursor:'pointer',
                        background: isSelected ? '#f8f9ff' : '#fff', transition:'all 0.3s',
                      }}
                      onClick={() => toggleOption(getKey(currentQuestion.id), optionValue)}
                    >
                      <div style={{
                        width:24, height:24, borderRadius:'50%',
                        border:`2px solid ${isSelected ? '#667eea' : '#ccc'}`,
                        background: isSelected ? '#667eea' : '#fff',
                        marginRight:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                      }}>
                        {isSelected && <div style={{ width:12, height:12, borderRadius:'50%', background:'#fff' }} />}
                      </div>
                      <div style={{ flex:1 }}>
                        <span style={{ fontWeight:600, marginRight:8, color: isSelected ? '#667eea' : '#333' }}>{optionValue}.</span>
                        <span style={{ color:'#333' }}>{currentQuestion[optionKey]}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:32, paddingTop:24, borderTop:'2px solid #e0e0e0' }}>
              <Button variant="outline-secondary" onClick={() => setCurrentQ(currentQ - 1)} disabled={currentQ === 0} style={{ borderRadius:10, padding:'10px 24px', fontWeight:600 }}>← Previous</Button>
              {currentQ < totalQ - 1 ? (
                <Button variant="primary" onClick={() => setCurrentQ(currentQ + 1)} style={{ borderRadius:10, padding:'10px 24px', fontWeight:600, background:'#667eea', border:'none' }}>Next →</Button>
              ) : (
                <Button variant="success" onClick={() => setShowModal(true)} disabled={submitting} style={{ borderRadius:10, padding:'10px 24px', fontWeight:600 }}>
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <OmrPanel />
      </div>

      <SubmitModal showModal={showModal} setShowModal={setShowModal} confirmSubmit={confirmSubmit} submitting={submitting} totalQ={totalQ} attemptedCount={attemptedCount} unanswered={unanswered} />
      <TabWarningModal showWarningModal={showWarningModal} setShowWarningModal={setShowWarningModal} tabSwitchCount={tabSwitchCount} warningMessage={warningMessage} MAX_TAB_SWITCHES={MAX_TAB_SWITCHES} />
    </div>
  );
};

const SubmitModal = ({ showModal, setShowModal, confirmSubmit, submitting, totalQ, attemptedCount, unanswered }) => (
  <Modal show={showModal} onHide={() => setShowModal(false)} centered className="modal-confirm">
    <Modal.Header closeButton>
      <Modal.Title style={{ fontWeight:700, fontSize:18 }}>Confirm Submission</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p style={{ color:'#555', marginBottom:16 }}>Are you sure you want to submit? You cannot change answers after submission.</p>
      <div className="summary-grid">
        <div className="summary-item"><div className="s-value">{totalQ}</div><div className="s-label">Total</div></div>
        <div className="summary-item"><div className="s-value" style={{ color:'#4caf50' }}>{attemptedCount}</div><div className="s-label">Attempted</div></div>
        <div className="summary-item"><div className="s-value" style={{ color:'#e53935' }}>{unanswered}</div><div className="s-label">Unanswered</div></div>
        <div className="summary-item">
          <div className="s-value" style={{ color:'#7B1FA2' }}>{Math.round((attemptedCount / Math.max(totalQ,1)) * 100)}%</div>
          <div className="s-label">Progress</div>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-secondary" onClick={() => setShowModal(false)} style={{ borderRadius:10, fontWeight:600, padding:'8px 24px' }} disabled={submitting}>Go Back</Button>
      <Button variant="danger" onClick={confirmSubmit} disabled={submitting} style={{ borderRadius:10, fontWeight:600, padding:'8px 24px' }}>
        {submitting ? 'Submitting...' : 'Yes, Submit'}
      </Button>
    </Modal.Footer>
  </Modal>
);

const TabWarningModal = ({ showWarningModal, setShowWarningModal, tabSwitchCount, warningMessage, MAX_TAB_SWITCHES }) => (
  <Modal show={showWarningModal} onHide={() => { if (tabSwitchCount < MAX_TAB_SWITCHES) setShowWarningModal(false); }} centered backdrop="static" keyboard={false} className="modal-warning">
    <Modal.Body style={{ padding:0 }}>
      <div className={`warning-modal-content ${tabSwitchCount >= MAX_TAB_SWITCHES ? 'terminated' : ''}`}>
        <div className="warning-icon-container">
          {tabSwitchCount >= MAX_TAB_SWITCHES ? <div style={{ fontSize:72, color:'#e53935' }}>🚫</div> : <div style={{ fontSize:72, color:'#ff9800' }}>⚠️</div>}
        </div>
        <h4 className="warning-title">{tabSwitchCount >= MAX_TAB_SWITCHES ? 'Exam Terminated!' : 'Warning: Tab Switch Detected!'}</h4>
        <p className="warning-message" style={{ whiteSpace:'pre-wrap' }}>{warningMessage}</p>
        <div className="warning-dots">
          {Array.from({ length: MAX_TAB_SWITCHES }, (_, i) => (
            <div key={i} className={`warning-dot ${i < tabSwitchCount ? 'active' : ''} ${i < tabSwitchCount && tabSwitchCount >= MAX_TAB_SWITCHES ? 'terminated' : ''}`}>{i + 1}</div>
          ))}
        </div>
        <div className="warning-level">
          {tabSwitchCount >= MAX_TAB_SWITCHES ? <span className="level-critical">EXAM AUTO-SUBMITTING...</span>
            : tabSwitchCount === 2 ? <span className="level-high">FINAL WARNING - Last chance!</span>
            : <span className="level-low">Please stay on the exam tab</span>}
        </div>
        {tabSwitchCount < MAX_TAB_SWITCHES && (
          <Button onClick={() => setShowWarningModal(false)} style={{ borderRadius:10, fontWeight:700, padding:'12px 40px', marginTop:16, fontSize:16, background:'#5B0A7B', border:'none', color:'#fff' }}>
            I Understand — Continue Exam
          </Button>
        )}
      </div>
    </Modal.Body>
  </Modal>
);

export default ExamDashboard;
