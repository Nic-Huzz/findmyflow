import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './CareerClarityQuiz.css';

const CareerClarityQuiz = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState('intro');
  const [currentNeed, setCurrentNeed] = useState(0);
  const [currentStructural, setCurrentStructural] = useState(0);
  const [needAnswers, setNeedAnswers] = useState({});
  const [structuralAnswers, setStructuralAnswers] = useState({});
  const [animating, setAnimating] = useState(false);
  const [expandedNeeds, setExpandedNeeds] = useState({});
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [quizResultId, setQuizResultId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(`career-quiz-${crypto.randomUUID()}`);
  }, []);

  // The 6 Core Needs with Accomplish <-> Connect spectrum
  const needs = [
    {
      id: 'growth',
      name: 'Growth',
      icon: '🌱',
      accomplish: {
        name: 'Skill & Mastery',
        description: 'Getting better at your craft, leveling up your capabilities',
        vibe: 'I want to become excellent at what I do'
      },
      connect: {
        name: 'Personal Development',
        description: 'Growing as a human, becoming who you\'re meant to be',
        vibe: 'I want my growth to shape me as a person'
      },
      question: 'When you think about growth, which of these feels more energizing to you right now?',
      accomplishUnmet: {
        seen: "You want to get better at things — real skill development, tangible improvement. But you're not being stretched. You're stagnating, and it's killing you slowly.",
        jobFix: {
          what: "A role with genuine learning curve and skill development",
          how: ["Ask for stretch assignments in your current role", "Negotiate for training/certification budget", "Propose leading a project outside your comfort zone", "Find a mentor who'll push you"],
          where: "Roles with steep learning curves, technical depth, or clear mastery progression. Think: growing companies, technical specializations, or roles where you're slightly underqualified."
        },
        ownThingFix: {
          why: "Building your own thing is a masterclass in everything. You'll learn more in 6 months than 5 years in a role that's not stretching you.",
          unlock: "When you build your own thing, every day is a stretch assignment. Marketing, sales, product, operations — you'll develop faster than any job could offer."
        },
        checklistItem: "Offers genuine skill development and learning opportunities"
      },
      connectUnmet: {
        seen: "You want growth that goes deeper than skills — the kind that shapes who you are as a person. Training programs feel hollow. You're hungry for transformation, not just improvement.",
        jobFix: {
          what: "A role where personal growth is part of the culture",
          how: ["Seek companies with strong coaching/development cultures", "Find a role where you can mentor others (teaching transforms you)", "Look for mission-driven organizations where the work itself grows you", "Consider a role change that challenges your identity, not just your skills"],
          where: "Purpose-driven organizations, coaching/consulting roles, leadership positions, social enterprises, or any role where who you become matters as much as what you produce."
        },
        ownThingFix: {
          why: "Nothing will grow you as a person faster than building something from nothing. Every fear, every limiting belief, every edge you have — you'll meet them all.",
          unlock: "Entrepreneurship is personal development on hard mode. You won't just build a business; you'll build yourself."
        },
        checklistItem: "Supports personal growth, not just professional development"
      },
      accomplishMet: "Your mastery needs are being fed. You're learning, improving, getting sharper. This is working — protect it.",
      connectMet: "Your work is growing you as a person. You're becoming more of who you want to be. This is rare — protect it."
    },
    {
      id: 'freedom',
      name: 'Freedom',
      icon: '🦅',
      accomplish: {
        name: 'Autonomy & Control',
        description: 'Independence over how, when, and where you work',
        vibe: 'I want to run my own show and make my own calls'
      },
      connect: {
        name: 'Life Integration',
        description: 'Space for your whole self — relationships, health, interests',
        vibe: 'I want work that leaves room for the rest of my life'
      },
      question: 'When you think about freedom, which matters more to you right now?',
      accomplishUnmet: {
        seen: "You want control over your work — the ability to decide how things get done. But you're micromanaged, over-processed, drowning in approvals. Your judgment isn't trusted, and it's suffocating.",
        jobFix: {
          what: "A role with real decision-making authority and minimal oversight",
          how: ["Have a direct conversation with your manager about autonomy", "Document your wins and use them to negotiate more independence", "Propose a trial period of reduced check-ins", "Look for internal moves to less hierarchical teams"],
          where: "Smaller companies, remote-first cultures, senior IC roles, consulting, or any environment that values output over presence."
        },
        ownThingFix: {
          why: "You want to make your own calls. In employment, you'll always be operating within someone else's constraints, needing someone else's approval.",
          unlock: "When you build your own thing, every decision is yours. No approvals, no bureaucracy, no waiting for permission. Just you and the consequences of your choices — which is exactly what you want."
        },
        checklistItem: "Provides genuine autonomy and decision-making authority"
      },
      connectUnmet: {
        seen: "Work has consumed your life. It's not about how you work — it's that work leaves no room for anything else. Relationships, health, interests — they're getting squeezed out, and you're losing yourself.",
        jobFix: {
          what: "A role with genuine boundaries between work and life",
          how: ["Set and communicate clear boundaries (and enforce them)", "Negotiate for flexibility — remote days, adjusted hours", "Identify what's truly required vs. self-imposed overwork", "Have an honest conversation about sustainable workload"],
          where: "Companies with genuine work-life balance (check Glassdoor reviews), roles with clear scope, European companies, or industries with less 'always-on' culture."
        },
        ownThingFix: {
          why: "Here's the truth: building your own thing can be even more consuming at first. But the difference is you're designing it. You can build a business that serves your life, not the other way around.",
          unlock: "Ownership means you set the rules. Want to work 4 days a week? Want summers off? Want to travel while you work? You can design that — but only if you own the thing."
        },
        checklistItem: "Respects boundaries and allows for a full life outside work"
      },
      accomplishMet: "You have the independence you need. You control your work, make your own calls. This is valuable — don't trade it away lightly.",
      connectMet: "Your work makes room for life. You're not sacrificing relationships, health, or yourself. This balance is rare — protect it."
    },
    {
      id: 'visibility',
      name: 'Visibility',
      icon: '✨',
      accomplish: {
        name: 'Recognition & Credit',
        description: 'Being acknowledged for your achievements and contributions',
        vibe: 'I want my work to be seen and appreciated'
      },
      connect: {
        name: 'Authentic Belonging',
        description: 'Being known as a whole person, not just your output',
        vibe: 'I want to be myself at work, not perform a role'
      },
      question: 'When you think about being seen at work, which resonates more right now?',
      accomplishUnmet: {
        seen: "You're doing great work, but it's invisible. Credit goes elsewhere, contributions go unnoticed, your impact isn't recognized. You're not asking for a parade — just acknowledgment that your work matters.",
        jobFix: {
          what: "A role where contributions are visible and recognized",
          how: ["Document and communicate your wins more proactively", "Ask your manager how recognition works — literally ask", "Seek projects with higher visibility", "Build relationships with leadership who can see your work"],
          where: "Smaller companies where individuals stand out, client-facing roles, companies with strong recognition cultures, or roles with clear attribution."
        },
        ownThingFix: {
          why: "In your own thing, your work IS the thing. There's no middleman taking credit, no invisibility. If it succeeds, it's because of you — and everyone knows it.",
          unlock: "Ownership means your name is on the door. Every win is visibly yours. Every client knows who built this. Recognition isn't something you wait for — it's built into the structure."
        },
        checklistItem: "Has clear recognition and attribution for contributions"
      },
      connectUnmet: {
        seen: "You're tired of being seen only as a function. People know your output but not you. You're performing a professional role, wearing a mask, hiding the parts of yourself that don't fit the job description. It's exhausting.",
        jobFix: {
          what: "A culture where you can be your whole self",
          how: ["Test the waters — share something personal and see how it lands", "Find your people within the org — the authentic ones exist", "Seek out employee groups or communities within the company", "Consider whether it's the culture or your own walls holding you back"],
          where: "Values-driven companies, smaller teams, creative industries, companies with strong cultures of psychological safety, or startups where formality is lower."
        },
        ownThingFix: {
          why: "When you build your own thing, you ARE the brand. There's no mask because you're not fitting into someone else's culture — you're creating your own.",
          unlock: "Your business can be an expression of who you actually are. Your values, your personality, your quirks — they become features, not bugs."
        },
        checklistItem: "Has a culture where you can show up as your authentic self"
      },
      accomplishMet: "Your work is seen and valued. You get the recognition you deserve. This matters more than people admit — don't let anyone tell you it's vanity.",
      connectMet: "You can be yourself here. People know you as a person, not just a role. This belonging is precious."
    },
    {
      id: 'progress',
      name: 'Progress',
      icon: '🚀',
      accomplish: {
        name: 'Career Advancement',
        description: 'Clear path forward — promotions, titles, expanding scope',
        vibe: 'I want to know I\'m moving up and going somewhere'
      },
      connect: {
        name: 'Tangible Impact',
        description: 'Seeing real results that help real people',
        vibe: 'I want to see that my work actually matters to someone'
      },
      question: 'When you think about progress, which feels more important right now?',
      accomplishUnmet: {
        seen: "You want to advance — next level, bigger scope, more responsibility — but you're stuck. The path forward is unclear or blocked. You're ready for more, and there's nowhere to go.",
        jobFix: {
          what: "A role with a clear growth trajectory",
          how: ["Have a direct conversation: 'What would it take for me to get promoted?'", "Get specific blockers identified and addressed", "Explore lateral moves that open new advancement paths", "Set a timeline — if no progress in X months, reassess"],
          where: "Growing companies with headcount expansion, industries with clear career ladders, companies where you can see people getting promoted, or roles that build transferable leverage."
        },
        ownThingFix: {
          why: "In employment, your advancement depends on someone else's decisions, someone else's budget, someone else's timeline. There's a ceiling, and you didn't put it there.",
          unlock: "When you own the thing, there's no ceiling. Your 'advancement' is only limited by what you can build. No waiting for permission to grow."
        },
        checklistItem: "Offers a clear path for advancement and growing responsibility"
      },
      connectUnmet: {
        seen: "Another promotion won't help. You're not hungry for titles — you're hungry for impact. You want to see that your work actually helps real people, changes something, matters. Right now, it feels like you're pushing papers for no one.",
        jobFix: {
          what: "A role with visible, tangible impact on real people",
          how: ["Request more customer/user exposure — see who you're serving", "Seek roles closer to the end user or customer", "Ask to join customer success calls or site visits", "Look for projects with measurable human outcomes"],
          where: "Customer-facing roles, B2C companies, healthcare, education, social impact, consulting (where you see transformation), or any role where you witness the results of your work."
        },
        ownThingFix: {
          why: "When you build something of your own, you see the impact directly. Every customer, every thank you, every problem solved — it's your impact, unfiltered.",
          unlock: "Imagine getting messages from people whose lives you've changed. That's not a fantasy — it's what happens when you build something that serves people directly."
        },
        checklistItem: "Provides visible, tangible impact on real people"
      },
      accomplishMet: "Your trajectory is clear. You're moving, growing, advancing. This momentum is fuel — use it well.",
      connectMet: "You can see your impact. Real people benefit from your work. This connection to meaning is what most people are searching for."
    },
    {
      id: 'security',
      name: 'Security',
      icon: '🛡️',
      accomplish: {
        name: 'Financial Stability',
        description: 'Strong compensation that supports your life goals',
        vibe: 'I want to be well-paid and financially secure'
      },
      connect: {
        name: 'Values Integrity',
        description: 'Working for something you believe in, ethically aligned',
        vibe: 'I want to feel proud of what my company does'
      },
      question: 'When you think about security at work, which feels more essential right now?',
      accomplishUnmet: {
        seen: "You're underpaid, or financially stressed, or both. Money isn't everything — but financial instability undermines everything else. You can't think about fulfillment when you're worried about rent.",
        jobFix: {
          what: "A role with compensation that matches your market value",
          how: ["Research market rates — know your number", "Prepare a clear case and ask directly", "Consider whether it's base, bonus, equity, or benefits that matter most", "Be willing to move for significant increases"],
          where: "High-paying industries (tech, finance, consulting), companies in growth mode, roles where your specific skills are scarce, or markets with higher compensation norms."
        },
        ownThingFix: {
          why: "Employment has a ceiling. Your salary is always limited by what someone else decides you're worth. Ownership has no ceiling — but it also has no floor.",
          unlock: "Building your own thing means your income is uncapped. But be honest: do you have runway? If you're financially stressed now, stabilize first, then build."
        },
        checklistItem: "Provides compensation that matches market value and supports your goals"
      },
      connectUnmet: {
        seen: "The paycheck is fine, but something feels compromised. There's a gap between what your company does and what you believe in. You might be making money, but you're losing something else — your integrity, your pride, your sense of being on the right side.",
        jobFix: {
          what: "An organization whose values and behavior align with yours",
          how: ["Get honest about what specifically bothers you", "Explore whether change is possible from within", "Research companies known for values alignment", "Consider B-corps, non-profits, or mission-driven organizations"],
          where: "B-corporations, social enterprises, non-profits, companies with strong ethical reputations, or industries that inherently align with your values."
        },
        ownThingFix: {
          why: "In someone else's company, you're always serving someone else's values — or lack thereof. You can try to influence from within, but you don't control it.",
          unlock: "When you build your own thing, your values ARE the company's values. Every decision reflects what you believe. There's no compromise because there's no one to compromise with."
        },
        checklistItem: "Operates in a way that aligns with your personal values"
      },
      accomplishMet: "Your financial needs are handled. You're compensated fairly. This stability is a foundation — it lets you focus on other things.",
      connectMet: "You believe in what you're doing. Your company's behavior aligns with your values. This integrity is more valuable than people realize."
    },
    {
      id: 'stimulation',
      name: 'Stimulation',
      icon: '⚡',
      accomplish: {
        name: 'Intellectual Challenge',
        description: 'Complex problems that stretch your thinking',
        vibe: 'I want to solve hard problems that engage my brain'
      },
      connect: {
        name: 'Relational Energy',
        description: 'Working with people who inspire and support you',
        vibe: 'I want to work with people I genuinely like and respect'
      },
      question: 'When you think about what energizes you at work, which matters more right now?',
      accomplishUnmet: {
        seen: "You're bored. The problems are too easy, too repetitive, or already solved. Your brain is capable of so much more, and it's atrophying. This isn't laziness — it's a mind that needs to be challenged.",
        jobFix: {
          what: "A role with genuinely complex, stimulating problems",
          how: ["Seek out the hardest problems in your current org", "Propose new initiatives that don't exist yet", "Move toward R&D, strategy, or innovation functions", "Consider whether you've actually explored what's available"],
          where: "Early-stage companies (where everything is hard), technical roles with depth, consulting (new problems constantly), or industries undergoing transformation."
        },
        ownThingFix: {
          why: "Building a business is the ultimate intellectual challenge. Marketing, product, sales, operations, finance — it never gets boring because it never stops demanding everything you have.",
          unlock: "You'll use parts of your brain you didn't know existed. Every day is a new problem. If you're bored in employment, you'll never be bored building your own thing."
        },
        checklistItem: "Offers genuinely complex and intellectually stimulating work"
      },
      connectUnmet: {
        seen: "The work might be fine, but the people aren't. You're surrounded by colleagues you don't connect with, don't respect, or actively drain you. Who you work with shapes your entire experience — and right now, it's shaping it badly.",
        jobFix: {
          what: "A team of people who inspire and energize you",
          how: ["Identify who in your current org you DO connect with", "Seek opportunities to work more closely with those people", "Consider whether it's the team or the broader culture", "Interview your potential colleagues, not just the role"],
          where: "Companies known for strong culture, smaller teams, industries that attract people like you, or teams where you've met the people and felt the energy."
        },
        ownThingFix: {
          why: "When you build your own thing, you choose who you work with. Clients, collaborators, employees — they're all your choice.",
          unlock: "Imagine only working with people you genuinely like and respect. That's not a fantasy when you own the thing — it's a design decision."
        },
        checklistItem: "Has team members and colleagues who inspire and energize you"
      },
      accomplishMet: "You're mentally engaged. The work challenges you. This stimulation is a genuine form of fulfillment — don't undervalue it.",
      connectMet: "You've found your people. The relationships energize you. This human element makes everything else sustainable."
    }
  ];

  // The 5 Structural Fit Questions
  const structuralQuestions = [
    {
      id: 'locus',
      name: 'Feedback Style',
      question: 'How do you typically know when you\'re doing well?',
      icon: '🎯',
      optionA: {
        label: 'External signals',
        description: 'Reviews, praise, metrics, recognition from others',
        value: 'external'
      },
      optionB: {
        label: 'Internal knowing',
        description: 'My own standards, gut feeling, personal assessment',
        value: 'internal'
      },
      employmentSignal: 'external'
    },
    {
      id: 'structure',
      name: 'Structure Preference',
      question: 'How do you experience organisational rules and processes?',
      icon: '🏛️',
      optionA: {
        label: 'Helpful scaffolding',
        description: 'Structure provides clarity, reduces chaos, helps me focus',
        value: 'supportive'
      },
      optionB: {
        label: 'Unnecessary friction',
        description: 'Most rules feel arbitrary; I work better designing my own systems',
        value: 'constraining'
      },
      employmentSignal: 'supportive'
    },
    {
      id: 'risk',
      name: 'Financial Style',
      question: 'How do you relate to income variability?',
      icon: '🎲',
      optionA: {
        label: 'Stability-oriented',
        description: 'Predictable income is important; I want to know what\'s coming',
        value: 'security'
      },
      optionB: {
        label: 'Variability-tolerant',
        description: 'I can handle unpredictable income if the potential is there',
        value: 'tolerant'
      },
      employmentSignal: 'security'
    },
    {
      id: 'energy',
      name: 'Energy Source',
      question: 'What most fuels your motivation at work?',
      icon: '🔋',
      optionA: {
        label: 'Team momentum',
        description: 'Being part of something, shared goals, collaborative energy',
        value: 'collaborative'
      },
      optionB: {
        label: 'Personal ownership',
        description: 'Full responsibility, being the one who makes it happen',
        value: 'sovereign'
      },
      employmentSignal: 'collaborative'
    },
    {
      id: 'identity',
      name: 'Work-Life Relationship',
      question: 'How central is work to your sense of identity?',
      icon: '🪞',
      optionA: {
        label: 'Work as a means',
        description: 'Work funds and enables my life; my identity lives elsewhere',
        value: 'vehicle'
      },
      optionB: {
        label: 'Work as expression',
        description: 'My work is an extension of who I am; I need it to feel like mine',
        value: 'expression'
      },
      employmentSignal: 'vehicle'
    }
  ];

  const handleNeedAnswer = (needId, field, value) => {
    setNeedAnswers(prev => ({
      ...prev,
      [needId]: { ...prev[needId], [field]: value }
    }));
  };

  const handleStructuralAnswer = (questionId, value) => {
    setStructuralAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const canProceedNeed = () => {
    const current = needs[currentNeed];
    return needAnswers[current.id]?.selection !== undefined &&
           needAnswers[current.id]?.met !== undefined;
  };

  const canProceedStructural = () => {
    const current = structuralQuestions[currentStructural];
    return structuralAnswers[current.id] !== undefined;
  };

  const nextNeed = () => {
    setAnimating(true);
    setTimeout(() => {
      if (currentNeed < needs.length - 1) {
        setCurrentNeed(prev => prev + 1);
      } else {
        setStage('structural');
      }
      setAnimating(false);
    }, 300);
  };

  const nextStructural = () => {
    setAnimating(true);
    setTimeout(() => {
      if (currentStructural < structuralQuestions.length - 1) {
        setCurrentStructural(prev => prev + 1);
      } else {
        setStage('results');
      }
      setAnimating(false);
    }, 300);
  };

  const prevNeed = () => {
    if (currentNeed > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentNeed(prev => prev - 1);
        setAnimating(false);
      }, 300);
    }
  };

  const prevStructural = () => {
    setAnimating(true);
    setTimeout(() => {
      if (currentStructural > 0) {
        setCurrentStructural(prev => prev - 1);
      } else {
        setStage('needs');
        setCurrentNeed(needs.length - 1);
      }
      setAnimating(false);
    }, 300);
  };

  const toggleNeedExpanded = (needId) => {
    setExpandedNeeds(prev => ({
      ...prev,
      [needId]: !prev[needId]
    }));
  };

  const saveResults = async (results) => {
    try {
      const { data, error } = await supabase
        .from('career_clarity_leads')
        .insert({
          session_id: sessionId,
          need_answers: needAnswers,
          structural_answers: structuralAnswers,
          path_result: results.path,
          orientation: results.isAccomplishOriented ? 'accomplish' : results.isConnectOriented ? 'connect' : 'blend',
          unmet_needs: results.unmetNeeds.map(n => n.id),
          accomplish_score: results.accomplishCount,
          employment_score: results.employmentSignals
        })
        .select()
        .single();

      if (data) {
        setQuizResultId(data.id);
      }
      if (error) {
        console.error('Error saving results:', error);
      }
      return data;
    } catch (err) {
      console.error('Error saving results:', err);
      return null;
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (email && !isSubmitting) {
      setIsSubmitting(true);
      try {
        if (quizResultId) {
          await supabase
            .from('career_clarity_leads')
            .update({ email: email })
            .eq('id', quizResultId);
        }
        setEmailSubmitted(true);
      } catch (err) {
        console.error('Error saving email:', err);
      }
      setIsSubmitting(false);
    }
  };

  const calculateResults = () => {
    const needResults = needs.map(need => {
      const answer = needAnswers[need.id] || {};
      const selection = answer.selection;
      const met = answer.met;

      const isAccomplish = selection === 'left';
      const isConnect = selection === 'right';
      const isBlend = selection === 'both';
      const isUnmet = met === 'no' || met === 'partial';

      return {
        ...need,
        selection,
        met,
        isAccomplish,
        isConnect,
        isBlend,
        isUnmet
      };
    });

    const accomplishCount = needResults.filter(n => n.isAccomplish).length;
    const connectCount = needResults.filter(n => n.isConnect).length;
    const isAccomplishOriented = accomplishCount > connectCount;
    const isConnectOriented = connectCount > accomplishCount;

    const structuralResults = structuralQuestions.map(q => {
      const answer = structuralAnswers[q.id];
      const pointsToEmployment = answer === q.employmentSignal;
      return { ...q, answer, pointsToEmployment };
    });

    const employmentSignals = structuralResults.filter(s => s.pointsToEmployment).length;
    const independenceSignals = 5 - employmentSignals;
    const isEmploymentOriented = employmentSignals >= 3;
    const isIndependenceOriented = independenceSignals >= 3;

    const path = isIndependenceOriented ? 'own-thing' : 'job';
    const unmetNeeds = needResults.filter(n => n.isUnmet);

    let quadrant;
    if (isIndependenceOriented && isAccomplishOriented) quadrant = 'independence-accomplish';
    else if (isIndependenceOriented && isConnectOriented) quadrant = 'independence-connect';
    else if (isIndependenceOriented) quadrant = 'independence-blend';
    else if (isEmploymentOriented && isAccomplishOriented) quadrant = 'employment-accomplish';
    else if (isEmploymentOriented && isConnectOriented) quadrant = 'employment-connect';
    else quadrant = 'employment-blend';

    const results = {
      needs: needResults,
      structural: structuralResults,
      accomplishCount,
      connectCount,
      employmentSignals,
      independenceSignals,
      isAccomplishOriented,
      isConnectOriented,
      isEmploymentOriented,
      isIndependenceOriented,
      path,
      quadrant,
      unmetNeeds
    };

    // Save results to Supabase
    saveResults(results);

    return results;
  };

  const getPathContent = (results) => {
    const { path, isAccomplishOriented, isConnectOriented, unmetNeeds } = results;

    if (path === 'own-thing') {
      return {
        headline: "Your Path: Build Your Own Thing",
        subhead: isAccomplishOriented
          ? "You want to win — and you want to do it on your own terms"
          : isConnectOriented
          ? "You want meaning and impact — and you need to own it"
          : "You want freedom and ownership — employment will always feel constraining",
        seenMessage: `You've probably known this for a while, but maybe didn't trust it. The data is clear: your structural preferences point strongly toward ownership and independence. A job — even a great one — is unlikely to give you what you need. This isn't about being unemployable or difficult. It's about being wired for sovereignty.`,
        validationPoints: [
          "You trust your own judgment more than external validation",
          "Structure feels like friction, not support",
          "You can handle financial uncertainty for the right opportunity",
          "You're energized by ownership, not just participation",
          "Your work is an expression of who you are"
        ],
        clarityMessage: unmetNeeds.length > 0
          ? `You have ${unmetNeeds.length} unmet need${unmetNeeds.length > 1 ? 's' : ''} right now. Here's why building your own thing is likely to solve ${unmetNeeds.length > 1 ? 'them' : 'it'}:`
          : "Your needs are mostly met, but your structural profile still points to ownership. You might be in a good situation now, but you'll likely feel the pull toward building your own thing eventually.",
        ctaHeadline: "Ready to figure out what to build?",
        ctaBody: "Find My Flow helps you identify business opportunities based on your skills, the problems you care about, and the people you want to serve.",
        ctaButton: "Start Find My Flow",
        ctaLink: "/get-started"
      };
    } else {
      return {
        headline: "Your Path: Find the Right Job",
        subhead: isAccomplishOriented
          ? "You want mastery, growth, and recognition — inside a structure that supports you"
          : isConnectOriented
          ? "You want meaning, connection, and impact — inside an organisation that shares your values"
          : "You want fulfilment — and the right job can absolutely provide it",
        seenMessage: `You don't need to burn it all down. You don't need to "escape the matrix." You need a job that actually delivers what you value. The good news: that job exists. The challenge is knowing exactly what to look for — and now you do.`,
        validationPoints: [
          "You appreciate external feedback and recognition systems",
          "Structure helps you focus rather than constraining you",
          "Financial stability matters to your wellbeing",
          "You're energized by teams and shared missions",
          "You can thrive in a role without needing it to be your total self-expression"
        ],
        clarityMessage: unmetNeeds.length > 0
          ? `You have ${unmetNeeds.length} unmet need${unmetNeeds.length > 1 ? 's' : ''} right now. These are specific, fixable gaps — not reasons to abandon employment entirely. Here's what your next job needs to have:`
          : "Your needs are mostly met. Your restlessness might be coming from somewhere else — or you might just need minor adjustments rather than a big change.",
        ctaHeadline: "Ready to find roles that fit?",
        ctaBody: "The Flow Finder helps you identify career opportunities that match your specific needs — based on your skills, the problems you want to solve, and the impact you want to have.",
        ctaButton: "Start Flow Finder",
        ctaLink: "/nikigai/skills"
      };
    }
  };

  // Progress Dots Component
  const ProgressDots = ({ total, current }) => (
    <div className="ccq-progress-dots">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`ccq-progress-dot ${
            i < current ? 'completed' : i === current ? 'active' : ''
          }`}
        />
      ))}
    </div>
  );

  // Three-button value selector
  const ValueSelector = ({ value, onChange, leftOption, rightOption }) => {
    return (
      <div className="ccq-value-selector">
        <button
          onClick={() => onChange('left')}
          className={`ccq-value-btn ${value === 'left' ? 'selected-purple' : ''}`}
        >
          <div className="ccq-value-label">{leftOption}</div>
        </button>
        <button
          onClick={() => onChange('both')}
          className={`ccq-value-btn ${value === 'both' ? 'selected-gold' : ''}`}
        >
          <div className="ccq-value-label">Both</div>
        </button>
        <button
          onClick={() => onChange('right')}
          className={`ccq-value-btn ${value === 'right' ? 'selected-purple' : ''}`}
        >
          <div className="ccq-value-label">{rightOption}</div>
        </button>
      </div>
    );
  };

  const MetButton = ({ selected, value, onClick, children }) => (
    <button
      onClick={() => onClick(value)}
      className={`ccq-met-btn ${selected ? `selected-${value}` : ''}`}
    >
      {children}
    </button>
  );

  const StructuralOption = ({ option, selected, onClick }) => (
    <button
      onClick={onClick}
      className={`ccq-structural-option ${selected ? 'selected' : ''}`}
    >
      <div className={`ccq-structural-label ${selected ? 'selected' : ''}`}>
        {option.label}
      </div>
      <div className="ccq-structural-desc">{option.description}</div>
    </button>
  );

  // ============ SCREENS ============

  // INTRO SCREEN
  if (stage === 'intro') {
    return (
      <div className="ccq-container">
        <div className="ccq-content ccq-intro">
          <div className="ccq-intro-header">
            <div className="ccq-badge">Career Clarity Quiz</div>
            <h1 className="ccq-headline">
              Should You Find a{' '}
              <span className="ccq-gold-text">Different Job</span>
              {' '}or{' '}
              <span className="ccq-gold-text">Build Your Own Thing</span>?
            </h1>
            <p className="ccq-subheadline">
              4 minutes to clarity. No fluff. Just answers.
            </p>
          </div>

          <div className="ccq-info-card">
            <h3 className="ccq-info-title">
              <span>⚖️</span> Before You Start
            </h3>
            <p className="ccq-info-text">
              There are no right answers. Some people thrive in employment. Some people need to build their own thing. Neither is better — they're just different.
            </p>
            <p className="ccq-info-bold">
              Your job is to answer honestly about what you actually want.
            </p>
          </div>

          <div className="ccq-parts-list">
            <div className="ccq-part-card">
              <span className="ccq-part-icon">🔍</span>
              <div>
                <div className="ccq-part-title">Part 1: Your Core Needs</div>
                <div className="ccq-part-desc">What do you value, and is your work delivering it?</div>
              </div>
            </div>
            <div className="ccq-part-card">
              <span className="ccq-part-icon">🏗️</span>
              <div>
                <div className="ccq-part-title">Part 2: Your Working Style</div>
                <div className="ccq-part-desc">Are you wired for employment or independence?</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStage('needs')}
            className="ccq-primary-btn"
          >
            Start the Quiz →
          </button>
          <p className="ccq-note">
            11 questions • ~4 minutes
          </p>
        </div>
      </div>
    );
  }

  // NEEDS ASSESSMENT SCREEN
  if (stage === 'needs') {
    const current = needs[currentNeed];
    const answer = needAnswers[current.id] || {};
    const selection = answer.selection;
    const isAccomplish = selection === 'left';
    const isConnect = selection === 'right';

    return (
      <div className="ccq-container">
        <div className="ccq-content">
          <ProgressDots total={needs.length} current={currentNeed} />

          <div className="ccq-section-label">Part 1: Core Needs</div>

          <div className={`ccq-question-content ${animating ? 'animating' : ''}`}>
            <div className="ccq-need-header">
              <span className="ccq-need-icon">{current.icon}</span>
              <h2 className="ccq-need-name">{current.name}</h2>
            </div>

            {/* Two option descriptions */}
            <div className="ccq-options-preview">
              <div className={`ccq-option-preview ${isAccomplish ? 'selected' : ''}`}>
                <div className="ccq-option-name">{current.accomplish.name}</div>
                <div className="ccq-option-vibe">"{current.accomplish.vibe}"</div>
              </div>
              <div className={`ccq-option-preview ${isConnect ? 'selected' : ''}`}>
                <div className="ccq-option-name">{current.connect.name}</div>
                <div className="ccq-option-vibe">"{current.connect.vibe}"</div>
              </div>
            </div>

            {/* Value selector */}
            <div className="ccq-question-card">
              <p className="ccq-question-text">{current.question}</p>
              <ValueSelector
                value={selection}
                onChange={(val) => handleNeedAnswer(current.id, 'selection', val)}
                leftOption={current.accomplish.name.split(' ')[0]}
                rightOption={current.connect.name.split(' ')[0]}
              />
            </div>

            {/* Met buttons */}
            <div className="ccq-question-card">
              <p className="ccq-question-text">Is this need being met in your current work?</p>
              <div className="ccq-met-buttons">
                <MetButton selected={answer.met === 'yes'} value="yes" onClick={(val) => handleNeedAnswer(current.id, 'met', val)}>
                  <div className="ccq-met-symbol">✓</div>
                  <div className="ccq-met-label">Yes</div>
                </MetButton>
                <MetButton selected={answer.met === 'partial'} value="partial" onClick={(val) => handleNeedAnswer(current.id, 'met', val)}>
                  <div className="ccq-met-symbol">◐</div>
                  <div className="ccq-met-label">Partially</div>
                </MetButton>
                <MetButton selected={answer.met === 'no'} value="no" onClick={(val) => handleNeedAnswer(current.id, 'met', val)}>
                  <div className="ccq-met-symbol">✗</div>
                  <div className="ccq-met-label">No</div>
                </MetButton>
              </div>
            </div>

            {/* Navigation */}
            <div className="ccq-nav-buttons">
              {currentNeed > 0 && (
                <button onClick={prevNeed} className="ccq-back-btn">
                  Back
                </button>
              )}
              <button
                onClick={nextNeed}
                disabled={!canProceedNeed()}
                className={`ccq-next-btn ${canProceedNeed() ? '' : 'disabled'}`}
              >
                {currentNeed === needs.length - 1 ? 'Next Section →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STRUCTURAL QUESTIONS SCREEN
  if (stage === 'structural') {
    const current = structuralQuestions[currentStructural];
    const answer = structuralAnswers[current.id];

    return (
      <div className="ccq-container">
        <div className="ccq-content">
          <ProgressDots total={structuralQuestions.length} current={currentStructural} />

          <div className="ccq-section-label">Part 2: Working Style</div>

          <div className={`ccq-question-content ${animating ? 'animating' : ''}`}>
            <div className="ccq-need-header">
              <span className="ccq-need-icon">{current.icon}</span>
              <h2 className="ccq-need-name">{current.name}</h2>
              <p className="ccq-structural-question">{current.question}</p>
            </div>

            <div className="ccq-structural-options">
              <StructuralOption
                option={current.optionA}
                selected={answer === current.optionA.value}
                onClick={() => handleStructuralAnswer(current.id, current.optionA.value)}
              />
              <StructuralOption
                option={current.optionB}
                selected={answer === current.optionB.value}
                onClick={() => handleStructuralAnswer(current.id, current.optionB.value)}
              />
            </div>

            <div className="ccq-nav-buttons">
              <button onClick={prevStructural} className="ccq-back-btn">
                Back
              </button>
              <button
                onClick={nextStructural}
                disabled={!canProceedStructural()}
                className={`ccq-next-btn ${canProceedStructural() ? '' : 'disabled'}`}
              >
                {currentStructural === structuralQuestions.length - 1 ? 'See My Results →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (stage === 'results') {
    const results = calculateResults();
    const pathContent = getPathContent(results);
    const { path, unmetNeeds } = results;

    return (
      <div className="ccq-container">
        <div className="ccq-content ccq-results">

          {/* PATH HEADLINE */}
          <div className="ccq-results-header">
            <div className={`ccq-path-badge ${path === 'own-thing' ? 'independence' : 'employment'}`}>
              {path === 'own-thing' ? '🚀 Independence Path' : '🏢 Employment Path'}
            </div>
            <h1 className="ccq-results-headline">
              <span className="ccq-gold-text">
                {pathContent.headline.replace('Your Path: ', '')}
              </span>
            </h1>
            <p className="ccq-results-subhead">{pathContent.subhead}</p>
          </div>

          {/* SEEN MESSAGE */}
          <div className={`ccq-seen-card ${path === 'own-thing' ? 'independence' : 'employment'}`}>
            <h3 className="ccq-seen-title">
              <span>💡</span> Here's Why You're Feeling This Way
            </h3>
            <p className="ccq-seen-text">{pathContent.seenMessage}</p>
          </div>

          {/* VALIDATION POINTS */}
          <div className="ccq-validation-card">
            <h3 className="ccq-validation-title">Your profile suggests:</h3>
            <div className="ccq-validation-list">
              {pathContent.validationPoints.map((point, i) => (
                <div key={i} className="ccq-validation-item">
                  <span className="ccq-validation-check">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CLARITY MESSAGE */}
          <div className="ccq-clarity-section">
            <h2 className="ccq-clarity-title">What Needs to Change</h2>
            <p className="ccq-clarity-text">{pathContent.clarityMessage}</p>
          </div>

          {/* UNMET NEEDS - EXPANDABLE */}
          {unmetNeeds.length > 0 && (
            <div className="ccq-unmet-needs">
              {unmetNeeds.map(need => {
                const isExpanded = expandedNeeds[need.id];
                const isAccomplish = need.isAccomplish;
                const isConnect = need.isConnect;
                const unmetData = isAccomplish ? need.accomplishUnmet : isConnect ? need.connectUnmet : need.accomplishUnmet;
                const fixData = path === 'own-thing' ? unmetData.ownThingFix : unmetData.jobFix;

                return (
                  <div key={need.id} className="ccq-unmet-card">
                    <button
                      onClick={() => toggleNeedExpanded(need.id)}
                      className="ccq-unmet-header"
                    >
                      <span className="ccq-unmet-icon">{need.icon}</span>
                      <div className="ccq-unmet-info">
                        <div className="ccq-unmet-name">{need.name}</div>
                        <div className="ccq-unmet-meta">
                          {isAccomplish ? need.accomplish.name : isConnect ? need.connect.name : 'Blend'} •
                          <span className="ccq-unmet-status">Unmet</span>
                        </div>
                      </div>
                      <span className={`ccq-unmet-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    </button>

                    {isExpanded && (
                      <div className="ccq-unmet-content">
                        <div className="ccq-unmet-seen">
                          <p>{unmetData.seen}</p>
                        </div>

                        {path === 'job' ? (
                          <>
                            <div className="ccq-fix-section">
                              <h4 className="ccq-fix-title gold">What You Need</h4>
                              <p className="ccq-fix-text">{fixData.what}</p>
                            </div>
                            <div className="ccq-fix-section">
                              <h4 className="ccq-fix-title gold">How to Get It</h4>
                              <ul className="ccq-fix-list">
                                {fixData.how.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="ccq-fix-section">
                              <h4 className="ccq-fix-title gold">Where to Find It</h4>
                              <p className="ccq-fix-text">{fixData.where}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="ccq-fix-section">
                              <h4 className="ccq-fix-title purple">Why Employment Won't Fix This</h4>
                              <p className="ccq-fix-text">{fixData.why}</p>
                            </div>
                            <div className="ccq-fix-section">
                              <h4 className="ccq-fix-title purple">What Building Your Own Thing Unlocks</h4>
                              <p className="ccq-fix-text">{fixData.unlock}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CHECKLIST - Job Path Only */}
          {path === 'job' && unmetNeeds.length > 0 && (
            <div className="ccq-checklist-card">
              <h3 className="ccq-checklist-title">
                <span>📋</span> Your Next Role Checklist
              </h3>
              <p className="ccq-checklist-intro">Based on your unmet needs, your next job should have:</p>
              <ul className="ccq-checklist-items">
                {unmetNeeds.map(need => {
                  const checklistItem = need.isAccomplish
                    ? need.accomplishUnmet.checklistItem
                    : need.isConnect
                    ? need.connectUnmet.checklistItem
                    : need.accomplishUnmet.checklistItem;
                  return (
                    <li key={need.id} className="ccq-checklist-item">
                      <span className="ccq-checklist-box">☐</span>
                      <span>{checklistItem}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* EMAIL CAPTURE */}
          <div className="ccq-email-card">
            {!emailSubmitted ? (
              <>
                <h3 className="ccq-email-title">
                  <span>📧</span> Save Your Results
                </h3>
                <p className="ccq-email-text">
                  Get a copy of your full analysis sent to your inbox — plus actionable next steps.
                </p>
                <form onSubmit={handleEmailSubmit} className="ccq-email-form">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="ccq-email-input"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ccq-email-submit"
                  >
                    {isSubmitting ? '...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="ccq-email-success">
                <span className="ccq-email-success-icon">✉️</span>
                <p className="ccq-email-success-text">Results sent to {email}</p>
                <p className="ccq-email-success-note">Check your inbox for your full analysis</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className={`ccq-cta-card ${path === 'own-thing' ? 'independence' : 'employment'}`}>
            <h3 className="ccq-cta-headline">{pathContent.ctaHeadline}</h3>
            <p className="ccq-cta-body">{pathContent.ctaBody}</p>
            <button
              onClick={() => navigate(pathContent.ctaLink)}
              className="ccq-cta-btn"
            >
              {pathContent.ctaButton} <span>→</span>
            </button>
          </div>

          {/* RESET */}
          <div className="ccq-reset">
            <button
              onClick={() => {
                setStage('intro');
                setCurrentNeed(0);
                setCurrentStructural(0);
                setNeedAnswers({});
                setStructuralAnswers({});
                setExpandedNeeds({});
                setEmail('');
                setEmailSubmitted(false);
                setQuizResultId(null);
              }}
              className="ccq-reset-btn"
            >
              ← Start Over
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
};

export default CareerClarityQuiz;
