const gamesData = {
  categories: [
    {
      name: "Board & Strategy",
      games: [
        { name: "Chess", icon: "\u265f\ufe0f", domain: ["Intellectual", "Conventional"], nature: ["Complexity", "Clarity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
        { name: "Lost Ruins of Arnak", icon: "\ud83c\udfdb\ufe0f", domain: ["Intellectual", "Creative"], nature: ["Complexity", "Novelty"], inferredOrientation: 1.5, inferredKnowledgeStyle: 2.5 },
        { name: "Settlers of Catan", icon: "\ud83c\udfd7\ufe0f", domain: ["Enterprising", "Social"], nature: ["Ambiguity", "Novelty"], inferredOrientation: 4.5, inferredKnowledgeStyle: 4.5 },
        { name: "Risk", icon: "\u2694\ufe0f", domain: ["Enterprising", "Intellectual"], nature: ["Ambiguity", "Complexity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 3.0 },
        { name: "Go", icon: "\u26ab", domain: ["Intellectual", "Conventional"], nature: ["Complexity", "Clarity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
      ],
    },
    {
      name: "Video Games",
      games: [
        { name: "RPG Video Games", icon: "\ud83c\udfae", domain: ["Creative", "Intellectual"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 4.5 },
        { name: "First-Person Shooters", icon: "\ud83d\udd2b", domain: ["Realistic", "Conventional"], nature: ["Clarity", "Novelty"], inferredOrientation: 2.5, inferredKnowledgeStyle: 3.0 },
        { name: "Puzzle Games", icon: "\ud83e\udde9", domain: ["Intellectual", "Conventional"], nature: ["Complexity", "Clarity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
        { name: "Simulation / City Builders", icon: "\ud83c\udfd9\ufe0f", domain: ["Conventional", "Creative"], nature: ["Complexity", "Clarity"], inferredOrientation: 2.5, inferredKnowledgeStyle: 1.5 },
        { name: "Battle Royale", icon: "\ud83e\ude82", domain: ["Realistic", "Social"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 4.5 },
      ],
    },
    {
      name: "Physical Sports",
      games: [
        { name: "Football / Soccer", icon: "\u26bd", domain: ["Realistic", "Social"], nature: ["Clarity", "Novelty"], inferredOrientation: 3.0, inferredKnowledgeStyle: 3.0 },
        { name: "Basketball", icon: "\ud83c\udfc0", domain: ["Realistic", "Social"], nature: ["Clarity", "Novelty"], inferredOrientation: 3.0, inferredKnowledgeStyle: 3.0 },
        { name: "Rock Climbing", icon: "\ud83e\uddd7", domain: ["Realistic", "Intellectual"], nature: ["Complexity", "Ambiguity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 3.0 },
        { name: "Martial Arts", icon: "\ud83e\udd4b", domain: ["Realistic", "Conventional"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.5, inferredKnowledgeStyle: 1.5 },
        { name: "Surfing", icon: "\ud83c\udfc4", domain: ["Realistic", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 4.5 },
      ],
    },
    {
      name: "Dance & Movement",
      games: [
        { name: "Dancing (High-Energy)", icon: "\ud83d\udc83", domain: ["Creative", "Realistic"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 4.5 },
        { name: "Ballet / Contemporary", icon: "\ud83e\ude70", domain: ["Creative", "Conventional"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.5, inferredKnowledgeStyle: 1.5 },
        { name: "Capoeira", icon: "\ud83e\udd38", domain: ["Realistic", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 4.5 },
        { name: "Yoga / Tai Chi", icon: "\ud83e\uddd8", domain: ["Realistic", "Intellectual"], nature: ["Clarity", "Complexity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 1.5 },
        { name: "Freestyle Dance Battles", icon: "\ud83d\udd7a", domain: ["Creative", "Enterprising"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.5, inferredKnowledgeStyle: 4.5 },
      ],
    },
    {
      name: "Creative",
      games: [
        { name: "Drawing / Painting", icon: "\ud83c\udfa8", domain: ["Creative", "Intellectual"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 4.5 },
        { name: "Music Production", icon: "\ud83c\udfb5", domain: ["Creative", "Intellectual"], nature: ["Complexity", "Novelty"], inferredOrientation: 1.5, inferredKnowledgeStyle: 2.5 },
        { name: "Creative Writing", icon: "\u270d\ufe0f", domain: ["Creative", "Intellectual"], nature: ["Ambiguity", "Novelty"], inferredOrientation: 1.5, inferredKnowledgeStyle: 4.5 },
        { name: "Photography", icon: "\ud83d\udcf8", domain: ["Creative", "Realistic"], nature: ["Novelty", "Clarity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 3.0 },
        { name: "Woodworking / Crafts", icon: "\ud83e\udeb5", domain: ["Realistic", "Creative"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
      ],
    },
    {
      name: "Social & Party",
      games: [
        { name: "Werewolf / Mafia", icon: "\ud83d\udc3a", domain: ["Social", "Enterprising"], nature: ["Ambiguity", "Novelty"], inferredOrientation: 4.5, inferredKnowledgeStyle: 4.5 },
        { name: "Charades", icon: "\ud83c\udfad", domain: ["Social", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 4.5 },
        { name: "Karaoke", icon: "\ud83c\udfa4", domain: ["Social", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 4.5 },
        { name: "Trivia Night", icon: "\u2753", domain: ["Intellectual", "Social"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.5, inferredKnowledgeStyle: 1.5 },
        { name: "Cards Against Humanity", icon: "\ud83c\udccf", domain: ["Social", "Enterprising"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 4.5, inferredKnowledgeStyle: 4.5 },
      ],
    },
    {
      name: "Adventure & Exploration",
      games: [
        { name: "Hiking / Trekking", icon: "\ud83e\udd7e", domain: ["Realistic", "Intellectual"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 4.5 },
        { name: "Escape Rooms", icon: "\ud83d\udd10", domain: ["Intellectual", "Social"], nature: ["Complexity", "Novelty"], inferredOrientation: 2.5, inferredKnowledgeStyle: 2.5 },
        { name: "Travel / Backpacking", icon: "\u2708\ufe0f", domain: ["Social", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 4.5 },
        { name: "Geocaching", icon: "\ud83d\udccd", domain: ["Realistic", "Intellectual"], nature: ["Novelty", "Clarity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 3.0 },
        { name: "Scuba Diving", icon: "\ud83e\udd3f", domain: ["Realistic", "Intellectual"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 4.5 },
      ],
    },
    {
      name: "Mind & Strategy",
      games: [
        { name: "Poker", icon: "\ud83c\udca1", domain: ["Enterprising", "Intellectual"], nature: ["Ambiguity", "Complexity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 3.0 },
        { name: "Crosswords / Sudoku", icon: "\ud83d\udcdd", domain: ["Intellectual", "Conventional"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
        { name: "Rubik's Cube", icon: "\ud83d\udfe5", domain: ["Intellectual", "Realistic"], nature: ["Complexity", "Clarity"], inferredOrientation: 1.5, inferredKnowledgeStyle: 1.5 },
        { name: "Debate / Model UN", icon: "\ud83d\udde3\ufe0f", domain: ["Enterprising", "Intellectual"], nature: ["Complexity", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 3.0 },
        { name: "Fantasy Sports", icon: "\ud83d\udcca", domain: ["Intellectual", "Enterprising"], nature: ["Complexity", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 3.0 },
      ],
    },
    {
      name: "Collection & Mastery",
      games: [
        { name: "Trading Card Games", icon: "\ud83c\udfb4", domain: ["Intellectual", "Enterprising"], nature: ["Complexity", "Clarity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 1.5 },
        { name: "Speedrunning", icon: "\u23f1\ufe0f", domain: ["Conventional", "Intellectual"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
        { name: "Coin / Stamp Collecting", icon: "\ud83e\ude99", domain: ["Conventional", "Intellectual"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.0, inferredKnowledgeStyle: 1.5 },
        { name: "Model Building", icon: "\ud83d\udee9\ufe0f", domain: ["Realistic", "Conventional"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.5, inferredKnowledgeStyle: 1.5 },
        { name: "Cooking Competitions", icon: "\ud83d\udc68\u200d\ud83c\udf73", domain: ["Creative", "Enterprising"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.5, inferredKnowledgeStyle: 4.5 },
      ],
    },
    {
      name: "Competition & Performance",
      games: [
        { name: "Competitive Running", icon: "\ud83c\udfc3", domain: ["Realistic", "Conventional"], nature: ["Clarity", "Complexity"], inferredOrientation: 2.5, inferredKnowledgeStyle: 1.5 },
        { name: "Esports", icon: "\ud83d\udda5\ufe0f", domain: ["Intellectual", "Enterprising"], nature: ["Clarity", "Complexity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 1.5 },
        { name: "Stand-Up Comedy", icon: "\ud83d\ude02", domain: ["Enterprising", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.5, inferredKnowledgeStyle: 4.5 },
        { name: "Improv Theatre", icon: "\ud83c\udfaa", domain: ["Social", "Creative"], nature: ["Novelty", "Ambiguity"], inferredOrientation: 3.0, inferredKnowledgeStyle: 4.5 },
        { name: "Public Speaking", icon: "\ud83c\udf99\ufe0f", domain: ["Enterprising", "Social"], nature: ["Clarity", "Ambiguity"], inferredOrientation: 4.5, inferredKnowledgeStyle: 3.5 },
      ],
    },
  ],
}

export default gamesData
