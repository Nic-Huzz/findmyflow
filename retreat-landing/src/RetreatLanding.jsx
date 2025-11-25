import React, { useState } from 'react';
import './RetreatLanding.css';

function RetreatLanding() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [playingVideos, setPlayingVideos] = useState({});

  const offerings = [
    {
      r: "Recognise",
      title: "Healing Compass",
      description: "Do your participants feel like they were made for more? Like their essence is pulling them up? But something is pulling them back?",
      fullDescription: "In the Healing Compass they will learn exactly what emotional splinters (traumas) are keeping them stuck so they can finally free themselves from the thing that has quietly been sabotaging their progress.",
      image: "/images/retreats/healing-compass.jpg",
      video: "/videos/retreats/healing-compass.mp4" // Optional: add video file here
    },
    {
      r: "Release",
      title: "Conscious Connected Breathwork & Somatic Movement",
      description: "Bali's best emotional release breathwork experience combining deep cathartic releases with somatic movement.",
      fullDescription: "After completing a 400hr breathwork teacher training and hosting sessions for years I noticed a consistent source of resistant in myself and others who love breathwork but struggle with a consistent practice.\n\nThe idea of lying down for 40+ minutes breathing is intimidating, especially when our busy minds sometimes have other ideas and resist 'dropping in'.\n\nInspired by polyvagel theory and my desire to find a solution to this problem I created a new conscious connected breathing experience.\n\nIt combines the best of laying down breathwork where we feel deep cathartic emotional releases with the somatic understanding that how we 'release' trauma isn't limited to emotions but movements like shaking.\n\nThis shaking breathwork experience has since been described by experienced breathwork participants as Bali's best emotional release breathwork.",
      image: "/images/retreats/breathwork.jpg",
      video: "/videos/retreats/breathwork.mp4" // Optional: add video file here
    },
    {
      r: "Rewire",
      title: "Rewire Subconscious Limiting Beliefs",
      description: "We don't rise to the level of our ambitions, we fall to the level of what feels safe.",
      fullDescription: "Why…? Because our subconscious mind's number priority is to keep us safe. Unfortunately this causes us to subconsciously self-sabotage if our ambitions don't feel safe. This workshop is designed to identifying the emotional splinters (trauma's) that have caused participants ambitions to be safe and guide them through an NLP (neuro-lingustic programming) process to begin the rewiring process.",
      image: "/images/retreats/rewire.jpg",
      video: "/videos/retreats/rewire.mp4" // Optional: add video file here
    },
    {
      r: "Reconnect",
      title: "Vibe Rise Dance Journey",
      subtitle: "Bali's Best Dance Experience",
      description: "You know that euphoric moment at the 'peak' of an ecstatic dance journey? Vibe Rise is designed to give you that feeling — but for the whole set.",
      fullDescription: "We use meditation, breathwork, and music to get participants feeling on high as life as possible. It's a journey that's been described as an explosion of joy. But videos speak a thousand words so check this out:",
      hasVideo: true,
      image: "/images/retreats/vibe-rise.jpg",
      video: "/videos/retreats/vibe-rise.mp4" // Optional: add video file here
    }
  ];

  const handleVideoClick = (index) => {
    const videoElement = document.getElementById(`offering-video-${index}`);
    if (videoElement) {
      if (playingVideos[index]) {
        videoElement.pause();
        setPlayingVideos({ ...playingVideos, [index]: false });
      } else {
        videoElement.play();
        setPlayingVideos({ ...playingVideos, [index]: true });
      }
    }
  };

  const testimonials = [
    {
      name: "Alyce",
      handle: "@TheMindsetAdventure",
      text: "Huzz's energy is unmatched!!! The absolute vibe king with a heart of gold!! Having Nic on our Retreat was next level! He not only brings the vibes but he has a genuine and special way of making everyone feel safe, loved and supported! His silent discos are just like no other!! He has a unique way of holding a safe and FUN space both in Breathwork and his Silent discos with his super inspiring presence and his compassionate heart! There is no one like you Huzz!! Thank you 🙏",
      image: "/images/retreats/testimonial-alyce.jpg"
    },
    {
      name: "Amy",
      handle: "@FIFreedomRetreats",
      text: "I had the pleasure of working with Huzz at my recent retreat, and he made the experience unforgettable. Many of the attendees had never participated in a silent disco, with some feeling uneasy about dancing. Huzz immediately established a warm rapport with the group, creating a safe and inviting space for everyone to feel comfortable. His guided meditation and breath work journey was the perfect way to ease everyone into the experience, helping participants connect with their bodies and tap into a sense of fun and childlike innocence. The transformation was palpable-by the time the silent disco began, everyone was fully engaged and ready to let loose. The feedback from the group was overwhelmingly positive. Many participants described the silent disco as one of the most freeing and fun experiences they've had in a long time, and several expressed a desire to do it again the next day!",
      image: "/images/retreats/testimonial-amy.jpg"
    },
    {
      name: "Kylie",
      handle: "@kylieex.stevenson",
      text: "We had such a blast with our silent disco at our team retreat! Huzz was an amazing host and truly allowed for a space of fun and expansion!\n\nOf course we then had to have him facilitate our breathwork also. WOW. What a magnificent experience this was!\n\nCannot recommend this team more highly!\n\nThanks so much Huzz!",
      image: "/images/retreats/testimonial-kylie.jpg"
    }
  ];

  const credentials = [
    "Taught at all of Uluwatu's best yoga studios: The Istana, Alchemy, The Space, Mantra",
    "Runs monthly 'Healing But Fun' Festival with 100+ participants",
    "400hr conscious connected breathwork teacher training",
    "Completed 50+ NLP training program",
    "Delivers Vibe Rise Dance Teacher Trainings"
  ];

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/61423220241', '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/_Huzz', '_blank');
  };

  return (
    <div className="retreat-landing">
      {/* Hero Section */}
      <section className="retreat-hero">
        <div className="retreat-hero-overlay"></div>
        <div className="retreat-hero-content">
          <div className="retreat-hero-tag">For Retreat Hosts</div>
          <h1 className="retreat-hero-title">Healing But Fun Experiences</h1>
          <p className="retreat-hero-subtitle">Bali Healing Experiences Led by Nic Huzz</p>
          <button className="retreat-cta-primary" onClick={() => document.getElementById('offerings').scrollIntoView({ behavior: 'smooth' })}>
            Explore Offerings
          </button>
        </div>
      </section>

      {/* 4 R's Philosophy Section */}
      <section className="retreat-philosophy">
        <div className="retreat-container">
          <h2 className="retreat-section-title">My Healing Philosophy: The 4 R's</h2>
          <p className="retreat-philosophy-intro">
            I believe the Healing Journey follows the 4R's:
          </p>

          <div className="retreat-rs-grid">
            <div className="retreat-r-card">
              <div className="retreat-r-number">1</div>
              <h3 className="retreat-r-title">Recognise</h3>
              <p className="retreat-r-description">Your emotional splinters (trauma's) and your protective patterns</p>
            </div>

            <div className="retreat-r-card">
              <div className="retreat-r-number">2</div>
              <h3 className="retreat-r-title">Release</h3>
              <p className="retreat-r-description">The emotional splinters</p>
            </div>

            <div className="retreat-r-card">
              <div className="retreat-r-number">3</div>
              <h3 className="retreat-r-title">Rewire</h3>
              <p className="retreat-r-description">The beliefs and behaviours your emotional splinters created</p>
            </div>

            <div className="retreat-r-card">
              <div className="retreat-r-number">4</div>
              <h3 className="retreat-r-title">Reconnect</h3>
              <p className="retreat-r-description">To the loving, playful, care-free version of you</p>
            </div>
          </div>

          <p className="retreat-philosophy-tagline">
            We specialise in offering the most effective healing experiences for each R.
          </p>
        </div>
      </section>

      {/* Offerings Section */}
      <section className="retreat-offerings" id="offerings">
        <div className="retreat-container">
          <h2 className="retreat-section-title">Retreat Experiences</h2>

          <div className="retreat-offerings-grid">
            {offerings.map((offering, index) => (
              <div key={index} className="retreat-offering-card">
                <div className="retreat-offering-media">
                  {offering.video ? (
                    <div className="retreat-offering-video-container" onClick={() => handleVideoClick(index)}>
                      <video
                        id={`offering-video-${index}`}
                        className="retreat-offering-video"
                        poster={offering.image}
                        loop
                        playsInline
                      >
                        <source src={offering.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      {!playingVideos[index] && (
                        <div className="retreat-video-play-overlay">
                          <div className="retreat-video-play-button">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="retreat-offering-r-badge">{offering.r}</div>
                    </div>
                  ) : (
                    <div className="retreat-offering-image" style={{ backgroundImage: `url(${offering.image})` }}>
                      <div className="retreat-offering-r-badge">{offering.r}</div>
                    </div>
                  )}
                </div>
                <div className="retreat-offering-content">
                  <h3 className="retreat-offering-title">{offering.title}</h3>
                  {offering.subtitle && (
                    <p className="retreat-offering-subtitle">{offering.subtitle}</p>
                  )}
                  <p className="retreat-offering-description">{offering.description}</p>
                  <p className="retreat-offering-full">{offering.fullDescription}</p>
                  {offering.hasVideo && (
                    <button className="retreat-video-btn" onClick={() => setVideoModalOpen(true)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Watch Full Video
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="retreat-pricing-note">
            <p>Contact for custom pricing based on your retreat needs</p>
            <button className="retreat-pricing-cta" onClick={handleWhatsAppClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Message on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="retreat-about">
        <div className="retreat-container">
          <div className="retreat-about-grid">
            <div className="retreat-about-image">
              <img src="/images/retreats/huzz-profile.jpg" alt="Huzz" />
            </div>
            <div className="retreat-about-content">
              <h2 className="retreat-section-title">Meet Huzz</h2>
              <div className="retreat-story">
                <p>In 2020, I experienced an "awakening" after finding my "dream job" unfulfilling. By early 2023, my internal world had change, but felt stuck in my external world. Determined to break free of this reality I committed to a fear challenge where I would do one thing a week that absolutely terrified me.</p>

                <p>Within six weeks, this challenge saw me move to Bali; within three months, I quit my job. Within five months, I was funding my life by hosting sunset silent discos on the beach.</p>

                <p>My journey taught me that when we feel 'stuck', it's often from our essence yearning for more, but "emotional splinters" (trauma) has made taking action feel terrifying.</p>

                <p>My passion for healing stems from my own journey where I'd never felt more vulnerable, isolated and confused.</p>

                <div className="retreat-story-highlight">
                  <p>I believe healing is the most beautiful thing.</p>

                  <p>But it can seen as a heavy burden due to a stigma that the more pain you experience, the more healing you're doing. But I'm here to say that's bullsh*t.</p>

                  <p>I believe we can not only enjoy the process, I believe by merging these ancient modalities with modern technology, we can make it fun.</p>
                </div>
              </div>

              <h3 className="retreat-credentials-title">What Differentiates Me</h3>
              <div className="retreat-differentiators">
                <div className="retreat-differentiator">
                  <div className="retreat-differentiator-icon">✨</div>
                  <p>My experiences are designed to do the deep healing work but in a fun, approachable way</p>
                </div>
                <div className="retreat-differentiator">
                  <div className="retreat-differentiator-icon">🔄</div>
                  <p>My experiences are built to guide participants through the 4R's of healing</p>
                </div>
                <div className="retreat-differentiator">
                  <div className="retreat-differentiator-icon">🎧</div>
                  <p>As the owner of Bali's largest silent disco rental business and someone who teaches AI programs I bring modern day technology and expertise to enhance the transformation experience</p>
                </div>
              </div>

              <h3 className="retreat-credentials-title">Credentials & Experience</h3>
              <ul className="retreat-credentials-list">
                {credentials.map((credential, index) => (
                  <li key={index}>{credential}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="retreat-testimonials">
        <div className="retreat-container">
          <h2 className="retreat-section-title">What Retreat Hosts Say</h2>

          <div className="retreat-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`retreat-testimonial-card ${testimonial.placeholder ? 'placeholder' : ''}`}>
                <div className="retreat-testimonial-header">
                  <div className="retreat-testimonial-avatar" style={{ backgroundImage: `url(${testimonial.image})` }}></div>
                  <div className="retreat-testimonial-info">
                    <h4 className="retreat-testimonial-name">{testimonial.name}</h4>
                    <p className="retreat-testimonial-handle">{testimonial.handle}</p>
                  </div>
                </div>
                <p className="retreat-testimonial-text">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="retreat-cta-section">
        <div className="retreat-container">
          <div className="retreat-cta-box">
            <h2 className="retreat-cta-title">Ready to Elevate Your Retreat?</h2>
            <p className="retreat-cta-description">
              Let's create an unforgettable healing experience for your participants
            </p>
            <div className="retreat-cta-buttons">
              <button className="retreat-cta-primary" onClick={handleWhatsAppClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Message on WhatsApp
              </button>
              <button className="retreat-cta-secondary" onClick={handleInstagramClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Follow on Instagram
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How Else Can I Help Section */}
      <section className="retreat-help-section">
        <div className="retreat-container">
          <h2 className="retreat-section-title">How Else Can I Help?</h2>

          <div className="retreat-help-grid">
            {/* Silent Disco Rental */}
            <div className="retreat-help-card">
              <div className="retreat-help-icon">🎧</div>
              <h3 className="retreat-help-title">Need Silent Disco Headsets?</h3>
              <div className="retreat-help-description">
                <p>Don't need a facilitator but keen to rent headsets?</p>
                <p>We've got you sorted.</p>
                <p>I'm also the owner of Bali's largest silent disco rental company with over 300 Noise-Cancelling, Hi-Fi Sound Quality Headsets.</p>
              </div>
              <button className="retreat-help-button" onClick={() => window.open('https://wa.me/6282266355322', '_blank')}>
                Click here to learn more
              </button>
            </div>

            {/* Network Connections */}
            <div className="retreat-help-card">
              <div className="retreat-help-icon">🌟</div>
              <h3 className="retreat-help-title">Other Epic Experiences</h3>
              <div className="retreat-help-description">
                <p>Keen for other epic experiences?</p>
                <p>After 3 years in Bali I'm fortunate to have amazing network of awesome humans guiding epic experiences.</p>
                <p>If you're keen for a Guided Meditation Adventure, a Bounce Shoes experience or Sound Healing, I'm more than happy to make a connection.</p>
              </div>
              <button className="retreat-help-button" onClick={handleWhatsAppClick}>
                Click here to be connected
              </button>
            </div>

            {/* Find My Flow App */}
            <div className="retreat-help-card">
              <div className="retreat-help-icon">🚀</div>
              <h3 className="retreat-help-title">Scale Your Retreat Business</h3>
              <div className="retreat-help-description">
                <p>Keen to scale your retreats business?</p>
                <p>I've created an AI coach that gamifies your ambitions.</p>
                <p>Using the knowledge of the best business people in the world, be guided and held accountable via the Find My Flow app so you can Live Your Ambitions Faster.</p>
              </div>
              <button className="retreat-help-button" onClick={() => window.open('https://findmyflow.nichuzz.com', '_blank')}>
                Click here to learn more
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="retreat-footer">
        <div className="retreat-container">
          <div className="retreat-footer-content">
            <div className="retreat-footer-brand">
              <h3>Healing But Fun</h3>
              <p>Bali's Healing Experiences</p>
            </div>
            <div className="retreat-footer-links">
              <a href="https://wa.me/61423220241" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a href="https://instagram.com/_Huzz" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
          <div className="retreat-footer-bottom">
            <p>&copy; 2024 Healing But Fun. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="retreat-video-modal" onClick={() => setVideoModalOpen(false)}>
          <div className="retreat-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="retreat-video-close" onClick={() => setVideoModalOpen(false)}>×</button>
            <div className="retreat-video-placeholder">
              <p>Video placeholder - Add your Vibe Rise video URL here</p>
              <p className="retreat-video-note">Replace this with an iframe or video element</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetreatLanding;
