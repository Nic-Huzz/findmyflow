// Persona Stage Profiles
// These represent where you are in your journey

const personaProfiles = {
  // New snake_case keys (for new system)
  "vibe_seeker": {
    name: "Vibe Seeker",
    tagline: "Finding Your Direction",
    summary: "You're beginning to sense there's more to life than what you've been living.",
    color: "#9333EA",
    flow: {
      name: "Nikigai Discovery",
      path: "/nikigai/skills",
      description: "Discover your unique gifts and calling"
    },
    stages: {
      validation: "Complete Nikigai to discover your calling",
      creation: "Build your first offer around your discovery",
      testing: "Test your offer with real people"
    },
    detailed: {
      description:
        "You feel a pull toward something deeper, but you're not quite sure what it is yet. You're curious, open, and ready to explore.",
      nextSteps: "Start your Nikigai Discovery flow to uncover your unique gifts and calling.",
      image: "/images/personas/vibe-seeker.png"
    }
  },
  "vibe_riser": {
    name: "Vibe Riser",
    tagline: "Bringing It To Life",
    summary: "You know your direction but need help bringing it to life.",
    color: "#F59E0B",
    flow: {
      name: "$100M Offer Creation",
      path: "/offer-creation",
      description: "Create an irresistible offer"
    },
    stages: {
      validation: "Create your $100M Offer",
      creation: "Build and launch your offer",
      testing: "Get your first paying clients"
    },
    detailed: {
      description:
        "You've started to recognize your patterns and are ready to make changes. You're committed to growth and transformation.",
      nextSteps: "Start your $100M Offer Creation flow to build an irresistible offer.",
      image: "/images/personas/vibe-riser.png"
    }
  },
  "movement_maker": {
    name: "Movement Maker",
    tagline: "Scaling Your Impact",
    summary: "You're making money and ready to scale your impact.",
    color: "#10B981",
    flow: {
      name: "$100M Money Model",
      path: "/money-model",
      description: "Build a scalable business model"
    },
    stages: {
      validation: "Design your Money Model",
      creation: "Implement your offer ladder",
      testing: "Optimize for growth"
    },
    detailed: {
      description:
        "You've integrated your archetypes and are using your gifts to serve others. You're a catalyst for change.",
      nextSteps: "Start your $100M Money Model flow to build a scalable business.",
      image: "/images/personas/movement-maker.png"
    }
  },

  // Legacy PascalCase keys (for backwards compatibility)
  "Vibe Seeker": {
    summary: "You're beginning to sense there's more to life than what you've been living.",
    detailed: {
      description:
        "You feel a pull toward something deeper, but you're not quite sure what it is yet. You're curious, open, and ready to explore.",
      nextSteps: "Continue exploring your archetypes and start noticing patterns in your life.",
      image: "/images/personas/vibe-seeker.png"
    }
  },
  "Vibe Riser": {
    summary: "You're connected but wanting to live more in alignment with your essence.",
    detailed: {
      description:
        "You've started to recognize your patterns and are ready to make changes. You're committed to growth and transformation.",
      nextSteps: "Dive deeper with the Healing Compass flow and begin your 7-day challenge.",
      image: "/images/personas/vibe-riser.png"
    }
  },
  "Movement Maker": {
    summary: "You're living in alignment and ready to create movement in the world.",
    detailed: {
      description:
        "You've integrated your archetypes and are using your gifts to serve others. You're a catalyst for change.",
      nextSteps: "Share your journey and help others discover their archetypes.",
      image: "/images/personas/movement-maker.png"
    }
  }
};

// Helper to convert legacy persona names to snake_case
const normalizePersona = (persona) => {
  if (!persona) return null;
  const mapping = {
    'Vibe Seeker': 'vibe_seeker',
    'Vibe Riser': 'vibe_riser',
    'Movement Maker': 'movement_maker'
  };
  return mapping[persona] || persona;
};

// Get persona profile with flow info
const getPersonaWithFlow = (persona) => {
  const normalized = normalizePersona(persona);
  return personaProfiles[normalized] || null;
};

export { personaProfiles, normalizePersona, getPersonaWithFlow };
export default personaProfiles;


