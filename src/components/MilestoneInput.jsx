import { useState } from 'react';
import './MilestoneInput.css';

function MilestoneInput({ quest, value, onChange, onComplete }) {
  const [evidenceText, setEvidenceText] = useState('');

  const handleSubmit = () => {
    if (!evidenceText.trim()) {
      alert('Please describe what you accomplished for this milestone.');
      return;
    }

    // Combine the data into a structured format
    const milestoneData = {
      milestone_type: quest.milestone_type,
      evidence_text: evidenceText
    };

    // Pass this back to the parent for completion
    onComplete(quest, milestoneData);
  };

  const getMilestoneIcon = (milestoneType) => {
    if (milestoneType?.includes('product')) return '📦';
    if (milestoneType?.includes('offer')) return '💎';
    if (milestoneType?.includes('model')) return '📊';
    if (milestoneType?.includes('tested')) return '🧪';
    if (milestoneType?.includes('launched')) return '🚀';
    return '✨';
  };

  return (
    <div className="milestone-input">
      <div className="milestone-header">
        <span className="milestone-icon">{getMilestoneIcon(quest.milestone_type)}</span>
        <h4>Mark Milestone Complete</h4>
      </div>

      <div className="input-group">
        <label>What did you accomplish?</label>
        <textarea
          value={evidenceText}
          onChange={(e) => setEvidenceText(e.target.value)}
          placeholder={quest.placeholder || "Describe what you created, share a link, or explain your progress..."}
          rows="4"
        />
      </div>

      <button className="complete-button milestone" onClick={handleSubmit}>
        Complete Milestone (+{quest.points} points)
      </button>

      {quest.learnMore && (
        <p className="milestone-note">{quest.learnMore}</p>
      )}
    </div>
  );
}

export default MilestoneInput;
