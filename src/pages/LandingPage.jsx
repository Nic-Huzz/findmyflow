import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <span className="landing-badge">
            The anti-university for your career reinvention
          </span>

          <h1 className="landing-headline">
            Turn What You Know Into{' '}
            <span className="gold-text">Work That Lights You Up</span>
          </h1>

          <p className="landing-tagline">
            A process to monetise your mission to obtain financial + location independence
          </p>

          <p className="landing-subheadline">
            For burnt-out professionals ready to commercialise their expertise
            and do more meaningful work. Whether you want to build your own thing
            or find a more impactful career — we'll help you get there.
          </p>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="landing-paths">
        <div className="landing-container">
          <h2 className="paths-heading">Where are you on your journey?</h2>

          <div className="paths-grid">
            {/* Path 1: Self-Employment */}
            <div className="path-card path-card-build">
              <div className="path-icon">🚀</div>
              <h3 className="path-title">I want to work for myself</h3>
              <p className="path-description">
                Turn your skills and expertise into a business that serves you.
                Discover your ideal offer, your dream customers, and build
                something meaningful on your own terms.
              </p>
              <ul className="path-features">
                <li>Identify your unique value</li>
                <li>Find problems you love solving</li>
                <li>Build offers people want to buy</li>
                <li>Launch with confidence</li>
              </ul>
              <button
                className="path-cta path-cta-primary"
                onClick={() => navigate('/get-started')}
              >
                Start Building →
              </button>
            </div>

            {/* Path 2: Career Clarity */}
            <div className="path-card path-card-clarity">
              <div className="path-icon">🤔</div>
              <h3 className="path-title">I'm not sure what I want</h3>
              <p className="path-description">
                Not ready to go solo? Take our 4-minute quiz to discover whether
                you need a different job or your own thing — and exactly what's
                missing in your current work.
              </p>
              <ul className="path-features">
                <li>Identify your core needs</li>
                <li>Discover your working style</li>
                <li>Get a personalised action plan</li>
                <li>Find clarity in 4 minutes</li>
              </ul>
              <button
                className="path-cta path-cta-secondary"
                onClick={() => navigate('/career-clarity')}
              >
                Take the Quiz →
              </button>
            </div>
          </div>

          <p className="paths-note">
            Join thousands of professionals who've used Find My Flow to escape
            the 9-5 grind and do work that actually matters.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Find My Flow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
