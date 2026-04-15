// Protective Archetype Profiles
// 4 archetypes on a 2x2 grid (Toward/Away x Sympathetic/Dorsal) + People Pleaser

const protectiveProfiles = {
  Controller: {
    summary: "This archetype developed to protect you from chaos, unpredictability, and being seen as not enough.",
    image: "the-controller.webp",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Chaos, unpredictability, conditional approval, or being seen as not enough.",
      learned: "If I don't manage everything and control how people see me, I will get hurt."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Sympathetic fight",
      description: "Energised but unsafe. Control as safety. Performing, managing, always on."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Clenched jaw, stiff posture, fast talking, chest forward, rigid shoulders, eye intensity."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Micro-managing, overplanning, overworking, impressing, image-managing, inability to rest."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "Leaving it to chance isn't an option."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid letting others lead, avoid trusting, avoid rest, avoid vulnerability without performance."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Exposure to chaos, household instability, achievement-based love, conditional approval, comparison."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Vocal release (growl, sound), stomping, powerful shaking, strong exhale."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "I am safe when I loosen my grip.",
        "My worth exists without performance.",
        "Life supports me when I soften."
      ]
    },
    detailed: {
      howItShowsUp: "It insists: 'If I can just control everything and keep performing, then I'll be safe.' But control and performance become exhaustion in disguise.",
      breakingFree: "Release the need to control. Trust the process. You are enough even when still."
    }
  },

  Ghost: {
    summary: "This archetype developed to protect you from being hurt, judged, or overwhelmed.",
    image: "the-ghost.webp",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Overwhelm, emotional intensity, unsafe closeness, being seen.",
      learned: "Disappearing keeps me safe."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Sympathetic flight",
      description: "Energised but directed away. Withdrawal is active. The Ghost has energy, it's just pointed at escape."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Restless energy, eyes scanning for exits, shallow breath, pulling inward."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Withdraw, avoid visibility, leave before things get intense, stay in the shadows."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "I don't feel comfortable sharing."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid connection, avoid sharing, avoid vulnerability, avoid standing out."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Emotional overload, betrayal, intense conflict, abandonment, intense judgement causing shame."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Gentle grounding, slow rocking, co-regulation, micro-activation to re-engage."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "Connection feels grounding.",
        "I can stay and still feel safe."
      ]
    },
    detailed: {
      howItShowsUp: "It whispers: 'If I just stay invisible, I can't be hurt.' But hiding keeps you from the very connection and opportunities you crave.",
      breakingFree: "Showing up is brave. Your presence matters, even when it feels risky."
    }
  },

  Perfectionist: {
    summary: "This archetype developed to protect you from criticism and failure.",
    image: "perfectionist.webp",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Shame around 'not good enough.'",
      learned: "Mistakes = humiliation."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Dorsal freeze (toward)",
      description: "Gas and brake pressed simultaneously. Oriented toward the thing but can't move. High-focus freeze."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Stillness, tension in forehead, precise movements, shallow breath."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Overdetail, overcontrol, procrastination disguised as preparation."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "I'm not ready yet."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid starting, avoid failing, avoid being seen in progress."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Criticism, performance pressure, humiliation memory."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Micro-shaking, sighing, gentle movement, long exhale."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "Progress is safe.",
        "Being seen imperfectly builds trust."
      ]
    },
    detailed: {
      howItShowsUp: "It whispers: 'If I can just get it perfect, then I'll be safe from judgment.' But perfectionism often becomes procrastination in disguise, keeping you stuck in endless prep mode.",
      breakingFree: "Done is better than perfect. Progress over perfection. Your essence is waiting to emerge."
    }
  },

  "Auto-Pilot": {
    summary: "This archetype developed to protect you from sustained overwhelm by checking out.",
    image: "auto-pilot.webp",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Sustained overwhelm, emotional exhaustion, meaninglessness.",
      learned: "If I stop feeling, I stop hurting."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Dorsal collapse (away)",
      description: "'Safe' because checked out. Going through the motions. The body has given up trying."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Low energy, slumped posture, flat voice, glazed eyes, heavy limbs."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Numbing, scrolling, going through the motions, routine without presence."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "I'm fine, just tired."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid desire, avoid feeling, avoid the question 'What do I actually want?'"
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Prolonged stress without resolution, burnout, hollow achievement, meaningless routine."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Gentle activation: cold water, movement, breath that re-engages the body."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "I am allowed to want things.",
        "Feeling is not dangerous."
      ]
    },
    detailed: {
      howItShowsUp: "It says nothing. That's the point. Auto-Pilot is the voice that sounds like silence, like 'I'm fine, just tired.' It keeps you going through the motions so you never have to face what you're avoiding.",
      breakingFree: "Presence is the antidote. Ask yourself: 'What do I actually want right now?' and sit with whatever comes up."
    }
  },

  "People Pleaser": {
    summary: "This archetype developed to protect you from rejection and conflict.",
    image: "people-pleaser.webp",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Fear of rejection, abandonment, or being 'too much.'",
      learned: "Love is kept by not being a burden."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Fawn",
      description: "Ventral/parasympathetic blend with hyper-compliance. Appeasement as safety."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Tight chest, forced smile, soft or high-pitched voice, shallow breath."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Avoid conflict, over-accommodate, always soften edges."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "As long as everyone's happy, I'm safe."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid stating needs, avoid boundaries, avoid emotional truth."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Moments of emotional rejection: criticism, parental disapproval, being 'too much,' being punished for needs."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Chest-opening breath + vocal truth expression + grounding into self."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "Connection grows when I show my truth.",
        "My needs are safe and worthy."
      ]
    },
    detailed: {
      howItShowsUp: "It says: 'If I can just make everyone happy, then I'll be safe from abandonment.' But people-pleasing often becomes self-abandonment in disguise.",
      breakingFree: "Your worth isn't determined by others' approval. Set boundaries with love."
    }
  }
};

// Legacy alias — existing user data may reference "Performer"
protectiveProfiles["Performer"] = protectiveProfiles["Controller"];

export { protectiveProfiles };
export default protectiveProfiles;
