import { useState } from 'react';
import './MilestoneInput.css';

function MilestoneInput({ quest, value, onChange, onComplete }) {
  const [evidenceText, setEvidenceText] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleSubmit = () => {
    // If this quest has dropdown options, use selected option
    if (quest.dropdown_options) {
      if (!selectedOption) {
        alert('Please select an option.');
        return;
      }
      const milestoneData = {
        milestone_type: quest.milestone_type,
        selected_option: selectedOption,
        selected_label: quest.dropdown_options.find(o => o.value === selectedOption)?.label
      };
      onComplete(quest, milestoneData);
    } else {
      // Text input mode
      if (!evidenceText.trim()) {
        alert('Please describe what you accomplished for this milestone.');
        return;
      }
      const milestoneData = {
        milestone_type: quest.milestone_type,
        evidence_text: evidenceText
      };
      onComplete(quest, milestoneData);
    }
  };

  // Determine if this is a "launch" type milestone
  const isLaunchMilestone = quest.milestone_type?.includes('launched') || quest.type === 'Launch';

  // Get appropriate icon
  const getMilestoneIcon = () => {
    if (isLaunchMilestone) return '🎉';
    if (quest.milestone_type?.includes('product')) return '📦';
    if (quest.milestone_type?.includes('offer')) return '💎';
    if (quest.milestone_type?.includes('model')) return '📊';
    if (quest.milestone_type?.includes('tested')) return '🧪';
    return '✨';
  };

  // Get appropriate title
  const getTitle = () => {
    if (isLaunchMilestone) return 'Offer Launch Complete';
    return 'Mark Milestone Complete';
  };

  // Get appropriate label
  const getLabel = () => {
    if (quest.dropdown_options) {
      return 'Which offer did you launch?';
    }
    return 'What did you accomplish?';
  };

  return (
    <div className="milestone-input">
      <div className="milestone-header">
        <span className="milestone-icon">{getMilestoneIcon()}</span>
        <h4>{getTitle()}</h4>
      </div>

      <div className="input-group">
        <label>{getLabel()}</label>

        {quest.dropdown_options ? (
          <select
            className="milestone-select"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <option value="">Select your attraction offer...</option>
            {quest.dropdown_options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder={quest.placeholder || "Describe what you created, share a link, or explain your progress..."}
            rows="4"
          />
        )}
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
