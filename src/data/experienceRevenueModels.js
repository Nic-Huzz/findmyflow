/**
 * experienceRevenueModels.js — How each dome experience makes money
 *
 * Tags each experience with INTRINSIC revenue models only (primary first).
 * ad_sponsorship is NOT tagged on individual experiences (unless the experience
 * IS content creation). Instead, content creation acts as a MULTIPLIER:
 * if the user's dome has content creation experiences rated Vibe Rise,
 * ad_sponsorship unlocks for ALL their other experiences.
 *
 * Revenue model tags:
 * - session_fees: people pay per class/session/lesson
 * - project_fees: clients pay per project/gig/deliverable
 * - wage: employed salary/hourly
 * - ad_sponsorship: (only on content creation experiences) audience → brand deals/ads
 * - ticket_sales: people buy tickets to your event/show
 * - venue_revenue: you own the space, revenue from occupancy/bookings
 * - product_sales: you make/sell a physical or digital product
 * - coaching_packages: clients buy transformation/outcome packages
 * - membership: monthly recurring from community/subscription
 * - commission: % of a transaction, door revenue, referral fees
 * - returns_capital: you earn from the activity itself (investing, poker)
 */

export const EXPERIENCE_REVENUE_MODELS = {
  // ── MOVEMENT ──────────────────────────────────────────────────────────────
  'Driving / Road trips':                     ['session_fees', 'ticket_sales'],
  'Jogging / recreational running':           ['session_fees', 'coaching_packages'],
  'CrossFit / high-intensity training':       ['session_fees', 'membership', 'venue_revenue'],
  'Hiking / nature walk':                     ['session_fees', 'ticket_sales'],
  'Yoga':                                     ['session_fees', 'membership', 'venue_revenue'],
  'Studio fitness class':                     ['session_fees', 'wage'],
  'Cold plunge / ice bath':                   ['session_fees', 'venue_revenue'],
  'Scouting / camping':                       ['session_fees', 'wage'],
  'Ecstatic dance':                           ['session_fees', 'ticket_sales', 'venue_revenue'],
  'Martial arts':                             ['session_fees', 'membership', 'venue_revenue'],
  'BJJ / MMA':                               ['session_fees', 'membership', 'venue_revenue'],
  'Surfing':                                  ['session_fees', 'coaching_packages'],
  'Rock climbing / bouldering':               ['session_fees', 'venue_revenue'],
  'Swimming / ocean':                         ['session_fees', 'coaching_packages'],
  'Going out dancing / clubbing':             ['commission', 'ticket_sales', 'venue_revenue'],
  'Cycling':                                  ['session_fees', 'coaching_packages'],
  'Skiing / snowboarding':                    ['session_fees', 'wage'],
  'Fishing':                                  ['session_fees', 'ticket_sales'],
  'Horse riding':                             ['session_fees', 'venue_revenue'],

  // ── NOURISHMENT ───────────────────────────────────────────────────────────
  'Farm-to-table dining':                     ['ticket_sales', 'venue_revenue'],
  'Cooking for others / hosting dinner':      ['session_fees', 'ticket_sales'],
  'Gardening / growing food':                 ['session_fees', 'product_sales'],
  'Visiting a farmers market':                ['product_sales', 'venue_revenue'],
  'Trying a cuisine you\'ve never had':       ['session_fees', 'ticket_sales'],
  'Baking':                                   ['session_fees', 'product_sales'],

  // ── STYLE ─────────────────────────────────────────────────────────────────
  'Wearing clothes that express who you are':  ['coaching_packages', 'project_fees'],
  'Tattoo / body art / piercings':             ['session_fees', 'project_fees'],
  'Fashion design':                            ['product_sales', 'project_fees'],

  // ── TOOLS ─────────────────────────────────────────────────────────────────
  'Coding / building software':               ['wage', 'project_fees'],
  'Product design':                           ['wage', 'project_fees'],
  'Graphic design':                           ['wage', 'project_fees'],
  'Investing / trading':                      ['returns_capital', 'wage', 'coaching_packages'],
  'Spreadsheets / data':                      ['wage', 'project_fees'],

  // ── BONDS ─────────────────────────────────────────────────────────────────
  'Going on a date':                          ['coaching_packages', 'ticket_sales'],
  'Retreat':                                  ['ticket_sales', 'coaching_packages'],
  'Being part of an online community':        ['membership', 'coaching_packages'],
  'Mastermind group':                         ['membership', 'coaching_packages'],
  'Volunteering / giving back':               ['coaching_packages', 'session_fees'],
  'Pet ownership / caring for animals':       ['session_fees', 'coaching_packages'],
  'Drinks with friends / hanging out':        ['ticket_sales', 'commission', 'venue_revenue'],
  'Vulnerable conversation':                  ['session_fees', 'membership'],
  'Caring for kids':                          ['session_fees', 'wage'],

  // ── SHELTER ───────────────────────────────────────────────────────────────
  'Van life':                                 ['product_sales', 'project_fees'],
  'Renovating / building':                    ['project_fees', 'wage'],
  'Living abroad':                            ['coaching_packages', 'project_fees'],
  'Making something with your hands':         ['product_sales', 'session_fees'],
  'Hosting people in your home':              ['venue_revenue', 'session_fees'],
  'Interior / spatial design':                ['project_fees', 'wage'],

  // ── STORY ─────────────────────────────────────────────────────────────────
  'Photography / videography':                ['project_fees', 'session_fees', 'ad_sponsorship'],
  'Playing a musical instrument':             ['session_fees', 'ticket_sales'],
  'Singing':                                  ['session_fees', 'ticket_sales'],
  'Rapping / freestyle':                      ['ticket_sales', 'product_sales'],
  'Teaching / facilitating a workshop':       ['session_fees', 'coaching_packages'],
  'Dancing (creative / performance)':         ['session_fees', 'ticket_sales'],
  'Acting / improv / theatre':                ['session_fees', 'ticket_sales', 'wage'],
  'Creative writing':                         ['product_sales', 'ad_sponsorship', 'project_fees'],
  'Creating short-form video (Reels, TikTok)': ['ad_sponsorship', 'project_fees'],
  'Stand-up comedy':                          ['ticket_sales', 'session_fees'],
  'Live music / concerts / festivals':        ['ticket_sales', 'commission', 'venue_revenue'],
  'Reading a novel':                          ['product_sales', 'session_fees'],
  'Journaling / writing':                     ['coaching_packages', 'product_sales'],
  'Listening to podcasts':                    ['ad_sponsorship', 'project_fees'],
  'Creating / editing video':                 ['project_fees', 'wage', 'ad_sponsorship'],
  'Art class / painting / pottery':           ['session_fees', 'product_sales'],
  'Public speaking / presenting':             ['session_fees', 'coaching_packages'],
  'Selling / pitching':                       ['coaching_packages', 'wage'],
  'Coaching / mentoring someone':             ['coaching_packages', 'session_fees'],
  'Going to the cinema / watching a great film': ['ticket_sales', 'venue_revenue'],
  'Researching / going down rabbit holes':    ['project_fees', 'wage'],

  // ── PLAY ──────────────────────────────────────────────────────────────────
  'Playing video games':                      ['coaching_packages', 'ticket_sales', 'wage'],
  'Board games / Games night':                ['ticket_sales', 'venue_revenue'],
  'Playing team sport':                       ['session_fees', 'coaching_packages'],
  'Watching live sport':                      ['ticket_sales', 'venue_revenue', 'commission'],
  'Poker':                                    ['returns_capital', 'coaching_packages', 'ticket_sales'],
  'LEGO / construction toys':                 ['session_fees', 'project_fees'],
  'DJing / playing a set for a crowd':        ['session_fees', 'ticket_sales'],
  'Travel / exploring a new place':           ['session_fees', 'ticket_sales'],
  'Puzzles / escape rooms':                   ['venue_revenue', 'ticket_sales'],
  'Adrenaline / thrill ride':                 ['session_fees', 'ticket_sales'],

  // ── FIRE ──────────────────────────────────────────────────────────────────
  'Campfire / fire pit gathering':            ['venue_revenue', 'ticket_sales'],
  'Candle ritual / hygge':                    ['product_sales', 'session_fees'],
  'Fire ceremony':                            ['session_fees', 'ticket_sales'],

  // ── HEALING ───────────────────────────────────────────────────────────────
  'Cacao ceremony':                           ['session_fees', 'ticket_sales'],
  'Psilocybin therapy':                       ['session_fees', 'coaching_packages'],
  'Pranayama / breathwork':                   ['session_fees', 'coaching_packages', 'membership'],
  'Mindfulness meditation (MBSR)':            ['session_fees', 'coaching_packages', 'wage'],
  'Therapy / counselling':                    ['session_fees', 'wage'],
  'Sound bath (attending)':                   ['session_fees', 'ticket_sales'],
  'Sauna / deliberate heat':                  ['venue_revenue', 'session_fees'],
  'Spiritual practice':                       ['session_fees', 'coaching_packages'],

  // ── SLEEP ─────────────────────────────────────────────────────────────────
  'Lucid dreaming':                           ['coaching_packages', 'product_sales'],
  'Intentional napping':                      ['coaching_packages', 'session_fees'],
  'Float tank / sensory deprivation':         ['venue_revenue', 'membership'],
  'Being in nature without an activity':      ['session_fees', 'ticket_sales'],
}

// Revenue model display metadata
export const REVENUE_MODEL_META = {
  session_fees:      { label: 'Session / class fees', icon: '🎟', description: 'People pay per class, lesson, or session' },
  project_fees:      { label: 'Project / gig fees', icon: '📋', description: 'Clients pay per project or deliverable' },
  wage:              { label: 'Wage / salary', icon: '💼', description: 'Employed hourly or salaried' },
  ad_sponsorship:    { label: 'Ad deals / sponsorships', icon: '📢', description: 'Build an audience, brands pay for access' },
  ticket_sales:      { label: 'Ticket sales', icon: '🎫', description: 'People buy tickets to your event or show' },
  venue_revenue:     { label: 'Venue / facility', icon: '🏠', description: 'You own the space, revenue from bookings' },
  product_sales:     { label: 'Product sales', icon: '📦', description: 'You make and sell a physical or digital product' },
  coaching_packages: { label: 'Coaching packages', icon: '🎯', description: 'Clients buy transformation packages' },
  membership:        { label: 'Membership / subscription', icon: '🔄', description: 'Monthly recurring from your community' },
  commission:        { label: 'Commission / referrals', icon: '🤝', description: 'You earn a % of each transaction' },
  returns_capital:   { label: 'Returns / capital gains', icon: '📈', description: 'You earn from the activity itself (investing, playing)' },
}

/**
 * Content creation experiences that act as a MULTIPLIER.
 * If ANY of these are Vibe Rise in the user's dome, ad_sponsorship
 * unlocks for ALL their other experiences.
 *
 * Logic: "You also love making content. That means everything you do
 * can also earn through brand deals and sponsorships."
 */
export const CONTENT_MULTIPLIER_EXPERIENCES = [
  'Creating short-form video (Reels, TikTok)',
  'Creating / editing video',
  'Photography / videography',
  'Listening to podcasts',
  'Creative writing',
  'Journaling / writing',
  'Public speaking / presenting',
]
