import { useState } from 'react';
import './ConversationLogInput.css';

function ConversationLogInput({ quest, value, onChange, onComplete }) {
  const [personType, setPersonType] = useState('potential_customer');
  const [conversationSummary, setConversationSummary] = useState('');
  const [keyInsights, setKeyInsights] = useState('');

  const handleSubmit = () => {
    if (!conversationSummary.trim()) {
      alert('Please describe who you talked to and what you discussed.');
      return;
    }

    // Combine the data into a structured format
    const logData = {
      person_type: personType,
      conversation_summary: conversationSummary,
      key_insights: keyInsights
    };

    // Pass this back to the parent for completion
    onComplete(quest, logData);
  };

  return (
    <div className="conversation-log-input">
      <div className="input-group">
        <label>Who did you talk to?</label>
        <select value={personType} onChange={(e) => setPersonType(e.target.value)}>
          <option value="potential_customer">Potential Customer</option>
          <option value="current_customer">Current Customer</option>
          <option value="mentor">Mentor</option>
          <option value="peer">Peer</option>
          <option value="expert">Industry Expert</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="input-group">
        <label>Conversation Summary</label>
        <textarea
          value={conversationSummary}
          onChange={(e) => setConversationSummary(e.target.value)}
          placeholder="Who did you talk to? What did you discuss?"
          rows="3"
        />
      </div>

      <div className="input-group">
        <label>Key Insights (optional)</label>
        <textarea
          value={keyInsights}
          onChange={(e) => setKeyInsights(e.target.value)}
          placeholder="What was the most valuable insight from this conversation?"
          rows="2"
        />
      </div>

      <button className="complete-button" onClick={handleSubmit}>
        Log Conversation (+{quest.points} points)
      </button>

      {quest.counts_toward_graduation && (
        <p className="graduation-note">✨ Counts toward stage graduation</p>
      )}
    </div>
  );
}

export default ConversationLogInput;
