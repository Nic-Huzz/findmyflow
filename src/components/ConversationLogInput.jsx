import { useState } from 'react';
import './ConversationLogInput.css';

function ConversationLogInput({ quest, value, onChange, onComplete }) {
  const [personType, setPersonType] = useState('potential_customer');
  const [conversationSummary, setConversationSummary] = useState('');
  const [keyInsights, setKeyInsights] = useState('');
  const [field2Response, setField2Response] = useState('');

  // Check if quest has custom conversation fields
  const hasCustomFields = quest.conversation_fields && quest.conversation_fields.length > 0;
  const field1Label = hasCustomFields ? quest.conversation_fields[0] : 'Conversation Summary';
  const field2Label = hasCustomFields && quest.conversation_fields.length > 1 ? quest.conversation_fields[1] : 'Key Insights (optional)';

  const handleSubmit = () => {
    if (!conversationSummary.trim()) {
      alert(hasCustomFields ? `Please answer: ${field1Label}` : 'Please describe who you talked to and what you discussed.');
      return;
    }

    // Combine the data into a structured format
    const logData = {
      person_type: hasCustomFields ? 'validation' : personType,
      conversation_summary: conversationSummary,
      key_insights: hasCustomFields ? field2Response : keyInsights
    };

    // Pass this back to the parent for completion
    onComplete(quest, logData);
  };

  return (
    <div className="conversation-log-input">
      {/* Only show person type selector for default conversation logs */}
      {!hasCustomFields && (
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
      )}

      <div className="input-group">
        <label>{field1Label}</label>
        <textarea
          value={conversationSummary}
          onChange={(e) => setConversationSummary(e.target.value)}
          placeholder={hasCustomFields ? '' : 'Who did you talk to? What did you discuss?'}
          rows="3"
        />
      </div>

      <div className="input-group">
        <label>{field2Label}</label>
        <textarea
          value={hasCustomFields ? field2Response : keyInsights}
          onChange={(e) => hasCustomFields ? setField2Response(e.target.value) : setKeyInsights(e.target.value)}
          placeholder={quest.placeholder || (hasCustomFields ? '' : 'What was the most valuable insight from this conversation?')}
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
