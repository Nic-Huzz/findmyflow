// Phase 3: Persona Stage System
// Defines stages, graduation requirements, and progression logic for each persona

export const PERSONA_STAGES = {
  vibe_seeker: {
    stages: ['validation', 'creation', 'testing'],
    graduation_requirements: {
      validation: {
        flows_required: ['nikigai'],
        conversations_required: 3,
        description: 'Complete Nikigai + talk to 3 people about your idea'
      },
      creation: {
        milestones: ['product_created'],
        description: 'Create your first product/offering'
      },
      testing: {
        milestones: ['tested_with_3'],
        description: 'Test your product with 3 people'
      }
    }
  },
  vibe_riser: {
    stages: ['validation', 'creation', 'testing', 'scale'],
    graduation_requirements: {
      validation: {
        flows_required: ['100m_offer'],
        conversations_required: 3,
        description: 'Complete $100M Offer flow + talk to 3 people'
      },
      creation: {
        milestones: ['offer_created'],
        description: 'Create your offer'
      },
      testing: {
        milestones: ['offer_tested_with_3'],
        description: 'Test offer with 3 people'
      },
      scale: {
        flows_required: ['100m_leads'],
        challenge_streak: 7,
        description: 'Complete $100M Leads + 7-day challenge streak'
      }
    }
  },
  movement_maker: {
    stages: ['validation', 'creation', 'testing', 'scale'],
    graduation_requirements: {
      validation: {
        flows_required: ['100m_money_model'],
        conversations_required: 3,
        description: 'Complete $100M Money Model + talk to 3 people'
      },
      creation: {
        milestones: ['model_built'],
        description: 'Build your money model'
      },
      testing: {
        milestones: ['model_tested_with_3'],
        description: 'Test model with 3 people'
      },
      scale: {
        flows_required: ['100m_leads'],
        milestones: ['acquisition_offer_launched'],
        description: 'Complete $100M Leads + launch acquisition offer'
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
    validation: 'Validation',
    creation: 'Creation',
    testing: 'Testing',
    scale: 'Scale'
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

// Helper function to get celebration message for stage graduation
export const getStageCelebration = (stage, persona) => {
  const celebrations = {
    validation: {
      title: '🎉 Validation Complete!',
      message: "You've validated your idea with real conversations. Time to create!",
      next_step: 'Now let\'s build something amazing.'
    },
    creation: {
      title: '🚀 Creation Milestone Unlocked!',
      message: "You've built your product/offer. Now it's time to test it!",
      next_step: 'Get feedback from real users.'
    },
    testing: {
      title: '✨ Testing Stage Complete!',
      message: "You've tested with real people and gathered insights!",
      next_step: persona === 'vibe_seeker' ? 'Keep iterating!' : 'Time to scale up!'
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
