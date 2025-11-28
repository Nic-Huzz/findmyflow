import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import './ChallengePool.css';

const CATEGORIES = ['Recognise', 'Release', 'Rewire', 'Reconnect'];

function ChallengePool({ onChallengeSelect }) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [completedFlows, setCompletedFlows] = useState([]);

  useEffect(() => {
    loadChallenges();
    loadCompletedFlows();
  }, []);

  useEffect(() => {
    filterChallenges();
  }, [selectedCategory, selectedType, challenges, completedFlows]);

  const loadChallenges = async () => {
    try {
      const response = await fetch('/challengeQuests.json');
      const data = await response.json();
      setChallenges(data.quests || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedFlows = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('nikigai_responses')
        .select('flow_type')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading completed flows:', error);
        return;
      }

      const flowTypes = new Set(data?.map(f => f.flow_type) || []);
      setCompletedFlows(Array.from(flowTypes));
    } catch (err) {
      console.error('Error loading completed flows:', err);
    }
  };

  const filterChallenges = () => {
    let filtered = challenges;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(c => c.type === selectedType);
    }

    // Filter out coming_soon
    filtered = filtered.filter(c => c.status !== 'coming_soon');

    // Filter out completed flows
    filtered = filtered.filter(c => {
      if (c.inputType === 'flow' && c.flow_id) {
        return !completedFlows.includes(c.flow_id);
      }
      return true;
    });

    setFilteredChallenges(filtered);
  };

  const handleChallengeClick = (challenge) => {
    if (onChallengeSelect) {
      onChallengeSelect(challenge);
    }
  };

  if (loading) {
    return (
      <div className="challenge-pool loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="challenge-pool">
      <div className="pool-header">
        <h2>Challenge Pool</h2>
        <p>Select challenges to add to your daily practice</p>
      </div>

      <div className="pool-filters">
        <div className="filter-group">
          <label>Category:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${selectedType === 'daily' ? 'active' : ''}`}
              onClick={() => setSelectedType('daily')}
            >
              Daily
            </button>
            <button
              className={`filter-btn ${selectedType === 'weekly' ? 'active' : ''}`}
              onClick={() => setSelectedType('weekly')}
            >
              Weekly
            </button>
            <button
              className={`filter-btn ${selectedType === 'anytime' ? 'active' : ''}`}
              onClick={() => setSelectedType('anytime')}
            >
              Anytime
            </button>
          </div>
        </div>
      </div>

      <div className="challenges-grid">
        {filteredChallenges.length === 0 ? (
          <div className="empty-state">
            <p>No challenges match your filters</p>
          </div>
        ) : (
          filteredChallenges.map(challenge => (
            <div
              key={challenge.id}
              className={`challenge-card ${challenge.category.toLowerCase()}`}
              onClick={() => handleChallengeClick(challenge)}
            >
              <div className="challenge-header">
                <span className="challenge-category">{challenge.category}</span>
                <span className="challenge-type">{challenge.type}</span>
              </div>
              <h3 className="challenge-name">{challenge.name}</h3>
              <p className="challenge-description">{challenge.description}</p>
              <div className="challenge-footer">
                <span className="challenge-points">{challenge.points} points</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChallengePool;
