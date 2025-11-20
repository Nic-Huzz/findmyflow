# Find My Flow

An interactive web application that helps users discover their personality archetypes through an engaging, gamified experience. Users explore their protective patterns and essence archetypes via a swipe-based selection system, receive personalized insights, and can dive deeper with the Healing Compass tool.

## Features

- **Interactive Archetype Discovery** - Tinder-style swipe interface for exploring personality archetypes
- **Dual Archetype System**
  - **Protective Archetypes** - Patterns that may be blocking your flow (Perfectionist, People Pleaser, Controller, Performer, Ghost)
  - **Essence Archetypes** - Your core authentic self (Radiant Rebel, Compassionate Leader, Playful Creator, and more)
- **Battle Phase** - Tournament-style selection to narrow down your top archetype
- **Passwordless Authentication** - Magic link email authentication via Supabase
- **Personalized Profile** - View your archetype results with detailed descriptions
- **Healing Compass** - Advanced exploration tool for deeper self-discovery
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18.2 with Vite 5.0
- **Routing**: React Router DOM 7.9
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Magic Link (OTP)
- **Deployment**: Vercel
- **Code Quality**: ESLint
- **Styling**: CSS (Custom stylesheets)

## Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- (Optional) Vercel account for deployment

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Nic-Huzz/findmyflow.git
cd findmyflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find these values:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

See [VERCEL_ENV_VARIABLE_SETUP.md](./VERCEL_ENV_VARIABLE_SETUP.md) for more details.

### 4. Setup Supabase Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# The schema file is located at:
supabase-setup.sql
```

This creates the `lead_flow_profiles` table with Row Level Security policies.

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code quality checks

## Project Structure

```
findmyflow/
├── src/
│   ├── App.jsx                      # Main chat flow component (lead magnet)
│   ├── AppRouter.jsx                # Route configuration
│   ├── Profile.jsx                  # User profile page
│   ├── HealingCompass.jsx           # Advanced exploration tool
│   ├── HybridArchetypeFlow.jsx      # Swipe/battle selection component
│   ├── AuthGate.jsx                 # Protected route wrapper
│   ├── auth/
│   │   └── AuthProvider.jsx         # Authentication context & magic link
│   ├── lib/
│   │   ├── supabaseClient.js        # Supabase client configuration
│   │   ├── promptResolver.js        # Template variable interpolation
│   │   └── templates/               # Dynamic text templates
│   ├── data/
│   │   ├── essenceProfiles.js       # Essence archetype definitions
│   │   ├── protectiveProfiles.js    # Protective archetype definitions
│   │   └── personaProfiles.js       # Persona definitions
│   └── *.css                        # Component stylesheets
├── public/
│   ├── lead-magnet-slide-flow.json  # Main conversation flow configuration
│   ├── protective-archetypes.json   # Protective archetype cards
│   ├── essence-archetypes.json      # Essence archetype cards
│   ├── Healing_compass_flow.json    # Healing compass flow
│   └── images/archetypes/           # Archetype illustrations
├── .env.example                     # Environment variable template
├── .env.local                       # Your local environment (not in Git)
├── package.json                     # Dependencies and scripts
├── vite.config.js                   # Vite configuration
├── vercel.json                      # Vercel deployment config
└── README.md                        # This file
```

## Architecture Overview

### Flow System

The app uses a JSON-based conversation flow system:
- Flow definitions in `public/*.json` files
- `promptResolver.js` handles variable interpolation (`{{user_name}}`)
- Supports multiple step types: text input, options, hybrid swipe

### Authentication Flow

1. User completes lead magnet flow and provides email
2. Profile saved to Supabase `lead_flow_profiles` table
3. Magic link sent via Supabase Auth
4. User clicks link, authenticated, redirected to `/me`
5. Profile page fetches user data from Supabase

### Archetype Selection

1. **Swipe Phase** - User swipes through archetype cards (right = interested, left = pass)
2. **Battle Phase** - Head-to-head tournament with swiped archetypes
3. **Result Phase** - Final archetype revealed with detailed insights

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The `vercel.json` file is already configured for SPA routing.

See [VERCEL_ENV_VARIABLE_SETUP.md](./VERCEL_ENV_VARIABLE_SETUP.md) for detailed deployment instructions.

## Development Workflow

### Adding New Flow Steps

1. Edit `public/lead-magnet-slide-flow.json`
2. Add step with required fields: `step`, `step_order_index`, `prompt_template`
3. Use `{{variable_name}}` for dynamic content
4. Test in development mode

### Adding New Archetypes

1. Add archetype data to `src/data/essenceProfiles.js` or `protectiveProfiles.js`
2. Add corresponding image to `public/images/archetypes/`
3. Update JSON files in `public/` directory

### Database Schema Changes

Run SQL directly in Supabase SQL Editor or use the utility scripts:
- `check-table-schema.js` - Check table structure
- `update-table-schema.js` - Update table schema
- `test-healing-compass-insert.js` - Test data insertion

## Security

- **API Keys**: Never commit API keys to Git. Use environment variables.
- **Row Level Security**: Supabase RLS policies protect user data
- **Magic Link Auth**: Passwordless authentication reduces attack surface
- **Environment Variables**: All secrets stored in `.env.local` (gitignored)

## Troubleshooting

### "Missing Supabase environment variables" Error

Make sure you've created `.env.local` with your Supabase credentials. See step 3 in Getting Started.

### Magic Link Not Arriving

1. Check spam folder
2. Verify email configuration in Supabase Dashboard → Authentication → Email Templates
3. Check Supabase logs for email delivery errors

### Archetypes Not Loading

1. Check browser console for errors
2. Verify JSON files exist in `public/` directory
3. Check network tab for failed fetch requests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or feedback, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ using React, Vite, and Supabase**
