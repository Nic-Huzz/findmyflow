// Phase 3: Persona Stage System
// Defines stages, graduation requirements, and progression logic for each persona

export const PERSONA_STAGES = {
  vibe_seeker: {
    stages: ['clarity'],
    initial_stage: 'clarity',
    graduation_requirements: {
      clarity: {
        flows_required: ['nikigai_skills', 'nikigai_problems', 'nikigai_persona', 'nikigai_integration'],
        milestones: ['groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete all 4 Flow Finder flows, complete a groan challenge, and complete a 7-day challenge',
        milestones_display: ['Flow Finder: Skills', 'Flow Finder: Problems', 'Flow Finder: Personas', 'Putting It All Together', 'Complete a Groan Challenge']
      }
    }
  },
  vibe_riser: {
    stages: ['validation', 'creation', 'testing', 'launch'],
    initial_stage: 'validation',
    graduation_requirements: {
      validation: {
        milestones: ['validation_form_sent', 'validation_responses_3', 'groan_challenge_completed'],
        milestones_display: ['Send validation form', 'Get 3+ responses', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Send validation form, get 3 responses, complete a groan challenge, and complete a 7-day challenge'
      },
      creation: {
        flows_required: ['100m_offer', 'lead_magnet_offer'],
        milestones: ['product_created', 'lead_magnet_created', 'groan_challenge_completed'],
        milestones_display: ['$100M Offer Flow', 'Lead Magnet Offer Flow', 'Create your product', 'Create your lead magnet', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Complete offer flows, create product and lead magnet, complete a groan challenge, and complete a 7-day challenge'
      },
      testing: {
        milestones: ['testing_complete', 'feedback_responses_3', 'improvements_identified', 'groan_challenge_completed'],
        milestones_display: ['Complete testing', 'Get 3+ feedback responses', 'Identify improvements', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Complete testing, get 3 feedback responses, identify improvements, complete a groan challenge, and complete a 7-day challenge'
      },
      launch: {
        flows_required: ['100m_leads'],
        milestones: ['strategy_identified', 'funnel_stages_defined', 'groan_challenge_completed'],
        milestones_display: ['$100M Leads Flow', 'Identify your strategy', 'Define funnel stages', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Complete leads flow, define strategy and funnel, complete a groan challenge, and complete a 7-day challenge'
      }
    }
  },
  movement_maker: {
    stages: ['ideation', 'creation', 'launch'],
    initial_stage: 'ideation',
    graduation_requirements: {
      ideation: {
        milestones: ['read_putting_it_together', 'decide_acquisition', 'decide_upsell', 'decide_downsell', 'decide_continuity', 'groan_challenge_completed'],
        flows_required: ['attraction_offer', 'upsell_flow', 'downsell_flow', 'continuity_flow'],
        milestones_display: ['Read "Putting It All Together"', 'Attraction Offer Flow', 'Upsell Flow', 'Downsell Flow', 'Continuity Flow', 'Decide on Acquisition offer', 'Decide on Upsell offer', 'Decide on Downsell offer', 'Decide on Continuity offer', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Read overview, complete all 4 money model flows, decide on each offer type, complete a groan challenge, and complete a 7-day challenge'
      },
      creation: {
        milestones: ['create_acquisition_offer', 'create_upsell_offer', 'create_downsell_offer', 'create_continuity_offer', 'groan_challenge_completed'],
        milestones_display: ['Create Acquisition offer', 'Create Upsell offer', 'Create Downsell offer', 'Create Continuity offer', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Create all 4 offer types, complete a groan challenge, and complete a 7-day challenge: Acquisition, Upsell, Downsell, Continuity'
      },
      launch: {
        flows_required: ['100m_leads'],
        milestones: ['strategy_identified', 'funnel_stages_defined', 'groan_challenge_completed'],
        milestones_display: ['$100M Leads Flow', 'Identify your strategy', 'Define funnel stages', 'Complete a Groan Challenge'],
        challenge_streak: 7,
        description: 'Complete leads flow, define strategy and funnel, complete a groan challenge, and complete a 7-day challenge'
      }
    }
  }
};

// Helper function to get the next stage
export const getNextStage = (persona, currentStage) => {
  const personaData = PERSONA_STAGES[persona];
  if (!personaData) return null;

  const currentIndex = personaData.stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === personaData.stages.length - 1) {
    return null; // Already at the last stage or invalid stage
  }

  return personaData.stages[currentIndex + 1];
};

// Helper function to get stage display name
export const getStageDisplayName = (stage) => {
  const displayNames = {
    clarity: 'Clarity',
    validation: 'Validation',
    creation: 'Creation',
    testing: 'Testing',
    launch: 'Launch',
    ideation: 'Ideation',
    scale: 'Scale' // Legacy, kept for backwards compatibility
  };
  return displayNames[stage] || stage;
};

// Helper function to get persona display name
export const getPersonaDisplayName = (persona) => {
  const displayNames = {
    vibe_seeker: 'Vibe Seeker',
    vibe_riser: 'Vibe Riser',
    movement_maker: 'Movement Maker'
  };
  return displayNames[persona] || persona;
};

// Helper function to get the initial stage for a persona
export const getInitialStage = (persona) => {
  const personaData = PERSONA_STAGES[persona];
  if (!personaData) return 'validation'; // Fallback
  return personaData.initial_stage || personaData.stages[0];
};

// Helper function to get all milestones for a stage (combines milestones and milestones_additional)
export const getAllMilestones = (persona, stage) => {
  const requirements = PERSONA_STAGES[persona]?.graduation_requirements?.[stage];
  if (!requirements) return [];

  const milestones = requirements.milestones || [];
  const additionalMilestones = requirements.milestones_additional || [];
  return [...milestones, ...additionalMilestones];
};

// Helper function to get celebration message for stage graduation
export const getStageCelebration = (stage, persona) => {
  const celebrations = {
    clarity: {
      title: '🔮 Clarity Achieved!',
      message: "You've gained clarity on your unique skills, problems you solve, and ideal persona!",
      next_step: persona === 'vibe_seeker' ? 'You\'ve completed your Vibe Seeker journey!' : 'Time to take the next step!'
    },
    validation: {
      title: '🎉 Validation Complete!',
      message: "You've validated your idea with real responses. Time to create!",
      next_step: 'Now let\'s build something amazing.'
    },
    creation: {
      title: '🚀 Creation Milestone Unlocked!',
      message: "You've built your offers and products. Now it's time to test!",
      next_step: 'Get feedback from real users.'
    },
    testing: {
      title: '✨ Testing Stage Complete!',
      message: "You've tested with real people and gathered insights!",
      next_step: 'Time to launch!'
    },
    ideation: {
      title: '💡 Ideation Complete!',
      message: "You've designed your complete money model with all offer types!",
      next_step: 'Now let\'s bring these offers to life.'
    },
    launch: {
      title: '🚀 Launch Stage Achieved!',
      message: "You're ready to launch and reach your audience!",
      next_step: 'Keep pushing boundaries!'
    },
    scale: {
      title: '🌟 Scale Stage Achieved!',
      message: "You're ready to scale your impact and reach more people!",
      next_step: 'Keep pushing boundaries!'
    }
  };

  return celebrations[stage] || {
    title: '🎊 Congratulations!',
    message: 'You completed a stage!',
    next_step: 'Keep going!'
  };
};
