// Protective Archetype Profiles
// These are the patterns that developed to protect you from pain

const protectiveProfiles = {
  "People Pleaser": {
    summary: "This archetype developed to protect you from rejection and conflict.",
    image: "people-pleaser.png",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Fear of rejection, abandonment, or being \"too much.\"",
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
      belief: "If I make others happy, I'll be safe and wanted."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid stating needs, avoid boundaries, avoid emotional truth."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Moments of emotional rejection: criticism, parental disapproval, being \"too much,\" being punished for needs."
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
  },

  Performer: {
    summary: "This archetype developed to protect you from being unliked or rejected.",
    image: "the-performer.png",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Wound around worth = achievement.",
      learned: "I must earn approval to deserve love."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Sympathetic flight/fight",
      description: "Hustle, drive, overexertion."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Fast talking, chest forward, jaw tension, eye intensity."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Overworking, impressing, achieving, striving."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "If I do more, I'll be enough."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid rest, avoid stillness, avoid vulnerability without performance."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Achievement-based love, comparison, conditional approval."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Strong exhale (\"hah!\"), shaking arms/torso, breath that interrupts intensity."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "My worth exists without performance.",
        "I am enough even when still."
      ]
    },
    detailed: {
      howItShowsUp: "It performs: 'If I can just be what others want, then I'll be safe from rejection.' But performing often becomes self-abandonment in disguise.",
      breakingFree: "Your authentic self is enough. You don't need to perform for love."
    }
  },

  Controller: {
    summary: "This archetype developed to protect you from chaos and unpredictability.",
    image: "the-controller.png",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Chaos, unpredictability, or emotional volatility.",
      learned: "If I don't manage everything, I will get hurt."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Sympathetic fight",
      description: "Control as safety."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Clenched jaw, stiff posture, narrow eyes, rigid shoulders."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Micro-managing, overplanning, dominating decisions."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "Safety comes from controlling outcomes."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid letting others lead, avoid trusting, avoid surrender."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Exposure to chaos: yelling, household instability, unsafe adults."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Vocal release (growl, sound), stomping, powerful shaking."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "I am safe when I loosen my grip.",
        "Life supports me when I soften."
      ]
    },
    detailed: {
      howItShowsUp: "It insists: 'If I can just control everything, then I'll be safe from disappointment.' But control often becomes chaos in disguise.",
      breakingFree: "Release the need to control. Trust the process and your own resilience."
    }
  },

  Perfectionist: {
    summary: "This archetype developed to protect you from criticism and failure.",
    image: "perfectionist.png",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Shame around \"not good enough.\"",
      learned: "Mistakes = humiliation."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Freeze + sympathetic blend",
      description: "High-focus freeze."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Stillness, tension in forehead, precise movements, shallow breath."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Overdetail, overcontrol, procrastination (fear of imperfect action)."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "If I get it perfect, I can avoid shame."
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
      howItShowsUp: "It whispers: 'If I can just get it perfect, then I'll be safe from judgment.' But perfectionism often becomes procrastination in disguise — keeping you stuck in endless prep mode. Exhausting, isn't it?",
      breakingFree: "Remember: done is better than perfect. Progress over perfection. Your essence is waiting to emerge."
    }
  },

  Ghost: {
    summary: "This archetype developed to protect you from being hurt or disappointed.",
    image: "the-ghost.png",
    emotionalWound: {
      title: "Emotional Wound",
      fear: "Overwhelm, emotional intensity, unsafe closeness.",
      learned: "Disappearing keeps me safe."
    },
    nervousSystemPattern: {
      title: "Nervous System Pattern",
      pattern: "Dorsal vagal freeze",
      description: "Collapse / withdrawal."
    },
    somaticExpression: {
      title: "Somatic Expression",
      description: "Low energy, slumped posture, slow speaking or none."
    },
    behavioralStrategy: {
      title: "Behavioral Strategy",
      description: "Avoid relationships, disappear, numbness, isolation."
    },
    coreNarrative: {
      title: "Core Narrative",
      belief: "Being close is dangerous. Numb is safer."
    },
    avoidancePattern: {
      title: "Avoidance Pattern",
      description: "Avoid connection, avoid emotion, avoid vulnerability."
    },
    splinterMomentType: {
      title: "Splinter Moment Type",
      description: "Emotional overload, betrayal, intense conflict, abandonment terror."
    },
    dischargePatternNeeded: {
      title: "Discharge Pattern Needed",
      description: "Gentle breath, slow rocking, co-regulation, micro-activation."
    },
    rewiringOpportunity: {
      title: "Rewiring Opportunity",
      affirmations: [
        "Connection feels grounding.",
        "I can stay and still feel safe."
      ]
    },
    detailed: {
      howItShowsUp: "It whispers: 'If I can just stay invisible, then I'll be safe from pain.' But hiding often becomes isolation in disguise.",
      breakingFree: "Showing up is brave. Your presence matters, even when it feels risky."
    }
  }
};

export { protectiveProfiles };
export default protectiveProfiles;
