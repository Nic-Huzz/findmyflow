import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import './FlowMap.css';

function FlowMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Flow Finder data
  const [problemsClusters, setProblemsClusters] = useState([]);
  const [peopleClusters, setPeopleClusters] = useState([]);
  const [skillsClusters, setSkillsClusters] = useState([]);
  const [currentIndices, setCurrentIndices] = useState({
    problems: 0,
    people: 0,
    skills: 0
  });

  // Nervous System data
  const [moneyLimit, setMoneyLimit] = useState('');
  const [visibilityLimit, setVisibilityLimit] = useState('');
  const [safetyContracts, setSafetyContracts] = useState([]);
  const [nervousSystemArchetype, setNervousSystemArchetype] = useState('');
  const [coreWound, setCoreWound] = useState('');

  // Flow Compass data
  const [projects, setProjects] = useState([]);
  const [projectDirections, setProjectDirections] = useState({});

  // Nikigai flow completion tracking
  const [completedFlows, setCompletedFlows] = useState({
    skills: false,
    problems: false,
    persona: false,
    integration: false
  });
  const [nextNikigaiFlow, setNextNikigaiFlow] = useState('/nikigai/skills');

  // Touch tracking
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFlowFinderData(),
        fetchNervousSystemData(),
        fetchFlowCompassData(),
        fetchNikigaiCompletionStatus()
      ]);
    } catch (error) {
      console.error('Error fetching Flow Map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNikigaiCompletionStatus = async () => {
    if (!user) return;

    try {
      const { data: sessions, error } = await supabase
        .from('flow_sessions')
        .select('flow_version, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('flow_version', ['skills-claude', 'problems-claude', 'persona-claude', 'integration-claude']);

      if (error) {
        console.error('Error fetching nikigai completion status:', error);
        return;
      }

      const completed = {
        skills: sessions?.some(s => s.flow_version === 'skills-claude') || false,
        problems: sessions?.some(s => s.flow_version === 'problems-claude') || false,
        persona: sessions?.some(s => s.flow_version === 'persona-claude') || false,
        integration: sessions?.some(s => s.flow_version === 'integration-claude') || false
      };

      setCompletedFlows(completed);

      // Determine next flow to complete
      if (!completed.skills) {
        setNextNikigaiFlow('/nikigai/skills');
      } else if (!completed.problems) {
        setNextNikigaiFlow('/nikigai/problems');
      } else if (!completed.persona) {
        setNextNikigaiFlow('/nikigai/persona');
      } else if (!completed.integration) {
        setNextNikigaiFlow('/nikigai/integration');
      } else {
        // All completed, default to skills
        setNextNikigaiFlow('/nikigai/skills');
      }
    } catch (error) {
      console.error('Error checking nikigai completion:', error);
    }
  };

  const fetchFlowFinderData = async () => {
    const { data: clusters, error } = await supabase
      .from('nikigai_clusters')
      .select('cluster_type, cluster_label, items')
      .eq('user_id', user.id)
      .eq('cluster_stage', 'final')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nikigai clusters:', error);
      return;
    }

    if (clusters) {
      setProblemsClusters(clusters.filter(c => c.cluster_type === 'problems'));
      setPeopleClusters(clusters.filter(c => c.cluster_type === 'people'));
      setSkillsClusters(clusters.filter(c => c.cluster_type === 'skills'));
    }
  };

  const fetchNervousSystemData = async () => {
    const { data: nsData, error: nsError } = await supabase
      .from('nervous_system_responses')
      .select('income_goal, impact_goal, safety_contracts, archetype')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nsError) {
      console.error('Error fetching nervous system data:', nsError);
    } else if (nsData) {
      setMoneyLimit(nsData.income_goal || 'Not set');
      setVisibilityLimit(nsData.impact_goal || 'Not set');
      setSafetyContracts(nsData.safety_contracts || []);
      setNervousSystemArchetype(nsData.archetype || 'Not set');
    }

    const { data: hcData, error: hcError } = await supabase
      .from('healing_compass_responses')
      .select('past_event_emotions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (hcError) {
      console.error('Error fetching healing compass data:', hcError);
    } else if (hcData) {
      setCoreWound(hcData.past_event_emotions || 'Not identified');
    }
  };

  const fetchFlowCompassData = async () => {
    const { data: projectsData, error: projectsError } = await supabase
      .from('user_projects')
      .select('id, name, description, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return;
    }

    if (projectsData && projectsData.length > 0) {
      setProjects(projectsData);

      const directionsMap = {};
      for (const project of projectsData) {
        const { data: entries, error: entriesError } = await supabase
          .from('flow_entries')
          .select('direction, activity_date, logged_at, internal_state, external_state')
          .eq('user_id', user.id)
          .eq('project_id', project.id)
          .order('logged_at', { ascending: false })
          .limit(5);

        if (!entriesError && entries && entries.length > 0) {
          directionsMap[project.id] = entries;
        }
      }
      setProjectDirections(directionsMap);
    }
  };

  const toggleSection = (section, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isMobile) {
      // Prevent scroll jump by maintaining scroll position
      const scrollY = window.scrollY;
      setExpandedSection(expandedSection === section ? null : section);
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    } else {
      setExpandedSection(expandedSection === section ? null : section);
    }
  };

  const toggleProject = (projectId) => {
    setSelectedProject(selectedProject === projectId ? null : projectId);
  };

  const nextCluster = (category) => {
    const clusters = category === 'problems' ? problemsClusters :
                     category === 'people' ? peopleClusters : skillsClusters;

    if (clusters.length === 0) return;

    setCurrentIndices(prev => ({
      ...prev,
      [category]: (prev[category] + 1) % clusters.length
    }));
  };

  const previousCluster = (category) => {
    const clusters = category === 'problems' ? problemsClusters :
                     category === 'people' ? peopleClusters : skillsClusters;

    if (clusters.length === 0) return;

    setCurrentIndices(prev => ({
      ...prev,
      [category]: prev[category] > 0 ? prev[category] - 1 : clusters.length - 1
    }));
  };

  const handleTouchStart = (e, category) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (category) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextCluster(category);
    } else if (distance < -minSwipeDistance) {
      previousCluster(category);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const getDirectionIcon = (direction) => {
    const icons = { north: '↑', east: '→', south: '↓', west: '←' };
    return icons[direction] || '•';
  };

  const renderClusterSlider = (category, title, clusters) => {
    if (clusters.length === 0) {
      return (
        <div className="finder-category">
          <div className="category-title">{title}</div>
          <div className="cluster-card">
            <button 
              className="start-flow-button"
              onClick={() => navigate(nextNikigaiFlow)}
            >
              Complete Nikigai Flow to Discover
            </button>
          </div>
        </div>
      );
    }

    const currentCluster = clusters[currentIndices[category]];

    return (
      <div className="finder-category">
        <div className="category-title">{title}</div>
        <div className="slider-container">
          <div
            className="slider-content"
            onTouchStart={(e) => handleTouchStart(e, category)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(category)}
          >
            <div className="cluster-card">
              <div className="cluster-label">{currentCluster.cluster_label}</div>
            </div>
          </div>
        </div>
        <div className="slider-controls">
          <button className="slider-arrow" onClick={() => previousCluster(category)}>‹</button>
          <div className="slider-indicator">
            {currentIndices[category] + 1} / {clusters.length}
          </div>
          <button className="slider-arrow" onClick={() => nextCluster(category)}>›</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flow-map loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="flow-map">
      <h2 className="section-heading">Flow Map</h2>
      {/* Section 1: Flow Finder */}
      <div className="flow-section">
        <div
          className={`section-header ${expandedSection === 'flow-finder' ? 'expanded' : ''}`}
          onClick={(e) => toggleSection('flow-finder', e)}
        >
          <div className="section-title">
            <span className="section-icon">🧭</span>
            Flow Finder
          </div>
          <div className="expand-icon">↓</div>
        </div>

        {expandedSection === 'flow-finder' && (
          <div className="section-content">
            {renderClusterSlider('problems', 'Problems You\'re Passionate About', problemsClusters)}
            {renderClusterSlider('people', 'People You\'re Passionate About', peopleClusters)}
            {renderClusterSlider('skills', 'Skills You\'re Passionate About', skillsClusters)}
          </div>
        )}
      </div>

      {/* Section 2: Nervous System Limitations */}
      <div className="flow-section">
        <div
          className={`section-header ${expandedSection === 'nervous-system' ? 'expanded' : ''}`}
          onClick={(e) => toggleSection('nervous-system', e)}
        >
          <div className="section-title">
            <span className="section-icon">⚡</span>
            Nervous System Limitations
          </div>
          <div className="expand-icon">↓</div>
        </div>

        {expandedSection === 'nervous-system' && (
          <div className="section-content">
            {(!moneyLimit || moneyLimit === 'Not set') &&
             (!visibilityLimit || visibilityLimit === 'Not set') &&
             safetyContracts.length === 0 &&
             (!nervousSystemArchetype || nervousSystemArchetype === 'Not set') &&
             (!coreWound || coreWound === 'Not identified') ? (
              <>
                <div className="empty-nervous-system">
                  <button
                    className="start-flow-button"
                    onClick={() => navigate('/nervous-system')}
                  >
                    Start Mapping Boundaries
                  </button>
                </div>
                <div className="limitation-item">
                  <div className="limitation-label">Current Money Limit</div>
                  <div className="limitation-value">Not Identified Yet</div>
                </div>
                <div className="limitation-item">
                  <div className="limitation-label">Current Visibility Limit</div>
                  <div className="limitation-value">Not Identified Yet</div>
                </div>
                <div className="limitation-item">
                  <div className="limitation-label">Current Safety Contracts</div>
                  <div className="limitation-value">Not Identified Yet</div>
                </div>
                <div className="limitation-item">
                  <div className="limitation-label">Nervous System Archetype</div>
                  <div className="limitation-value">Not Identified Yet</div>
                </div>
                <div className="limitation-item core-wound">
                  <div className="limitation-label">Core Wound</div>
                  <div className="limitation-value core-wound-empty">Not Identified Yet</div>
                </div>
              </>
            ) : (
              <>
            <div className="limitation-item">
              <div className="limitation-label">Current Money Limit</div>
              <div className="limitation-value">{moneyLimit === 'Not set' ? 'Not Identified Yet' : moneyLimit}</div>
            </div>

            <div className="limitation-item">
              <div className="limitation-label">Current Visibility Limit</div>
              <div className="limitation-value">{visibilityLimit === 'Not set' ? 'Not Identified Yet' : visibilityLimit}</div>
            </div>

                <div className="limitation-item">
                  <div className="limitation-label">Current Safety Contracts</div>
                  {safetyContracts.length > 0 ? (
                    <div className="safety-contracts-list">
                      {safetyContracts.map((contract, idx) => (
                        <div key={idx} className="contract-item">{contract}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="limitation-value">Not Identified Yet</div>
                  )}
                </div>

                <div className="limitation-item">
                  <div className="limitation-label">Nervous System Archetype</div>
                  <div className="limitation-value">{nervousSystemArchetype === 'Not set' ? 'Not Identified Yet' : nervousSystemArchetype}</div>
                </div>

                <div className="limitation-item core-wound">
                  <div className="limitation-label">Core Wound</div>
                  <div className={`limitation-value ${coreWound === 'Not identified' ? 'core-wound-empty' : ''}`}>
                    {coreWound === 'Not identified' ? 'Not Identified Yet' : coreWound}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Flow Compass */}
      <div className="flow-section">
        <div
          className={`section-header ${expandedSection === 'flow-compass' ? 'expanded' : ''}`}
          onClick={(e) => toggleSection('flow-compass', e)}
        >
          <div className="section-title">
            <span className="section-icon">📊</span>
            Flow Compass
          </div>
          <div className="expand-icon">↓</div>
        </div>

        {expandedSection === 'flow-compass' && (
          <div className="section-content">
            {projects.length > 0 ? (
              <>
                {projects.map((project) => {
                const directions = projectDirections[project.id] || [];
                const latestDirection = directions[0];

                return (
                  <div key={project.id} className="project-item">
                    <div
                      className={`project-header ${selectedProject === project.id ? 'expanded' : ''}`}
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className="project-info">
                        <div className="project-name">{project.name}</div>
                        {latestDirection && (
                          <div className="latest-direction">
                            <span className={`direction-indicator direction-${latestDirection.direction}`}>
                              {getDirectionIcon(latestDirection.direction)}
                            </span>
                            <span>{latestDirection.direction.charAt(0).toUpperCase() + latestDirection.direction.slice(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="project-expand-icon">→</div>
                    </div>

                    {selectedProject === project.id && (
                      <div className="project-history">
                        <div className="history-title">Last 5 Directional Inputs</div>
                        {directions.length > 0 ? (
                          <div className="history-list">
                            {directions.map((entry, idx) => (
                              <div key={idx} className="history-entry">
                                <span className={`direction-indicator direction-${entry.direction}`}>
                                  {getDirectionIcon(entry.direction)}
                                </span>
                                <span className="entry-direction">
                                  {entry.direction.charAt(0).toUpperCase() + entry.direction.slice(1)}
                                </span>
                                <span className="entry-date">
                                  {new Date(entry.logged_at).toLocaleDateString()}
                                </span>
                                <span className="entry-states">
                                  {entry.internal_state} • {entry.external_state}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">No entries yet</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </>
            ) : (
              <div className="empty-nervous-system">
                <button 
                  className="start-flow-button"
                  onClick={() => navigate('/flow-compass')}
                >
                  Start Tracking Your Flow
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FlowMap;
