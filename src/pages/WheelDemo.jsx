import React, { useState } from 'react';
import { GradientWheel } from '../components/CompetenceWheels';
import {
  SKILLS_SEGMENTS,
  PROBLEM_SEGMENTS,
  PERSONA_SEGMENTS,
  ROLES,
  PROBLEM_TYPES,
  JOURNEY_STAGES,
} from '../lib/wheelTaxonomy';
import './WheelDemo.css';

/**
 * WheelDemo - Test page for the GradientWheel component
 * Route: /wheel-demo
 */
function WheelDemo() {
  // Track lit cells for each wheel
  const [skillsLit, setSkillsLit] = useState(new Set(['0-0', '2-1', '2-3', '4-0', '4-2', '8-4', '10-1']));
  const [problemsLit, setProblemsLit] = useState(new Set(['1-2', '3-0', '3-3', '7-1', '7-4']));
  const [personaLit, setPersonaLit] = useState(new Set(['2-1', '5-0', '5-2', '9-1']));

  // Toggle cell handlers
  const toggleSkillCell = (segment, ring, cellId) => {
    setSkillsLit(prev => {
      const next = new Set(prev);
      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }
      return next;
    });
  };

  const toggleProblemCell = (segment, ring, cellId) => {
    setProblemsLit(prev => {
      const next = new Set(prev);
      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }
      return next;
    });
  };

  const togglePersonaCell = (segment, ring, cellId) => {
    setPersonaLit(prev => {
      const next = new Set(prev);
      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }
      return next;
    });
  };

  // Add hue values to segments for color generation
  const skillsWithHue = SKILLS_SEGMENTS.map((s, i) => ({
    ...s,
    hue: i * 30, // 12 segments = 30° each
  }));

  const problemsWithHue = PROBLEM_SEGMENTS.map((s, i) => ({
    ...s,
    hue: i * 30,
  }));

  const personaWithHue = PERSONA_SEGMENTS.map((s, i) => ({
    ...s,
    hue: i * 30,
  }));

  return (
    <div className="wheel-demo">
      <header className="demo-header">
        <h1>Competence Wheels</h1>
        <p>Click any cell to toggle it on/off</p>
      </header>

      <div className="wheels-container">
        {/* Skills Wheel */}
        <div className="wheel-section">
          <h2>Skills Wheel</h2>
          <p className="wheel-dims">12 skills × 5 roles = 60 cells</p>

          <GradientWheel
            segments={skillsWithHue}
            rings={ROLES}
            litCells={skillsLit}
            onCellClick={toggleSkillCell}
            size={320}
            centerLabel="SKILLS"
          />

          <div className="ring-labels">
            {ROLES.map((r, i) => (
              <span key={r.id} className="ring-label">
                {i === 0 ? 'Inner: ' : ''}{r.label}{i === ROLES.length - 1 ? ' :Outer' : ''}
              </span>
            ))}
          </div>

          <div className="cell-count">
            {skillsLit.size} cells lit
          </div>
        </div>

        {/* Problems Wheel */}
        <div className="wheel-section">
          <h2>Problems Wheel</h2>
          <p className="wheel-dims">12 domains × 6 problem types = 72 cells</p>

          <GradientWheel
            segments={problemsWithHue}
            rings={PROBLEM_TYPES}
            litCells={problemsLit}
            onCellClick={toggleProblemCell}
            size={320}
            centerLabel="PROBLEMS"
          />

          <div className="ring-labels">
            {PROBLEM_TYPES.map((r, i) => (
              <span key={r.id} className="ring-label">
                {i === 0 ? 'Inner: ' : ''}{r.label}{i === PROBLEM_TYPES.length - 1 ? ' :Outer' : ''}
              </span>
            ))}
          </div>

          <div className="cell-count">
            {problemsLit.size} cells lit
          </div>
        </div>

        {/* Persona Wheel */}
        <div className="wheel-section">
          <h2>Persona Wheel</h2>
          <p className="wheel-dims">12 psychographics × 3 journey stages = 36 cells</p>

          <GradientWheel
            segments={personaWithHue}
            rings={JOURNEY_STAGES}
            litCells={personaLit}
            onCellClick={togglePersonaCell}
            size={320}
            centerLabel="PERSONA"
          />

          <div className="ring-labels">
            {JOURNEY_STAGES.map((r, i) => (
              <span key={r.id} className="ring-label">
                {i === 0 ? 'Inner: ' : ''}{r.label}{i === JOURNEY_STAGES.length - 1 ? ' :Outer' : ''}
              </span>
            ))}
          </div>

          <div className="cell-count">
            {personaLit.size} cells lit
          </div>
        </div>
      </div>

      {/* Mini wheels demo */}
      <section className="mini-demo">
        <h3>Mini Wheels (for inline display)</h3>
        <div className="mini-wheels">
          <div className="mini-wheel-item">
            <GradientWheel
              segments={skillsWithHue}
              rings={ROLES}
              litCells={skillsLit}
              size={100}
              centerLabel=""
              interactive={false}
              className="mini"
            />
            <span>Skills</span>
          </div>
          <div className="mini-wheel-item">
            <GradientWheel
              segments={problemsWithHue}
              rings={PROBLEM_TYPES}
              litCells={problemsLit}
              size={100}
              centerLabel=""
              interactive={false}
              className="mini"
            />
            <span>Problems</span>
          </div>
          <div className="mini-wheel-item">
            <GradientWheel
              segments={personaWithHue}
              rings={JOURNEY_STAGES}
              litCells={personaLit}
              size={100}
              centerLabel=""
              interactive={false}
              className="mini"
            />
            <span>Persona</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WheelDemo;
