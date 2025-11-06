# Magic Link Authentication Flow

## 📋 Complete User Journey After Magic Link Click

---

## **Step-by-Step Flow**

### **1. User Completes Lead Magnet Flow** (`/`)
- User goes through all flow steps (questions, swipe flows, etc.)
- User enters email at final step (`lead_q8_email_capture`)
- Profile data is saved to Supabase database (`lead_flow_profiles` table)
- Magic link email is sent automatically

**Code Location:** `src/App.jsx` lines 190-248

---

### **2. Magic Link Email Sent**
- Email sent via Supabase Auth (`signInWithOtp`)
- **Redirect URL configured:** `${window.location.origin}/me`
- User receives email with clickable magic link

**Code Location:** `src/auth/AuthProvider.jsx` lines 41-69
```javascript
emailRedirectTo: `${window.location.origin}/me`
```

---

### **3. User Clicks Magic Link in Email** 🔗
- Link contains authentication token from Supabase
- Browser navigates to: `https://yourdomain.com/me#access_token=...&refresh_token=...`
- Supabase automatically processes the token from URL hash

**How it works:**
- Supabase handles token extraction from URL hash
- Validates the token
- Creates authenticated session

---

### **4. Authentication State Change Detected**
- `AuthProvider` listens for auth changes via `onAuthStateChange`
- When token is processed, Supabase fires `SIGNED_IN` event
- `AuthProvider` updates user state: `setUser(session?.user ?? null)`

**Code Location:** `src/auth/AuthProvider.jsx` lines 29-35
```javascript
supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('🔐 Auth state changed:', event, session?.user?.email)
    setUser(session?.user ?? null)
    setLoading(false)
  }
)
```

---

### **5. User Redirected to `/me` Route**
- Router matches `/me` route
- Route is wrapped with `<AuthGate>` component

**Code Location:** `src/AppRouter.jsx` lines 25-29
```javascript
<Route path="/me" element={
  <AuthGate>
    <Profile />
  </AuthGate>
} />
```

---

### **6. AuthGate Checks Authentication**
- `AuthGate` checks if user is authenticated
- **If NOT authenticated:** Shows email input form to request new magic link
- **If authenticated:** Renders `<Profile />` component (children)

**Code Location:** `src/AuthGate.jsx` lines 39-41
```javascript
if (user) {
  return children  // Renders Profile component
}
```

---

### **7. Profile Component Loads User Data**
- Fetches user profile from Supabase database
- Queries `lead_flow_profiles` table filtering by authenticated user's email
- Gets most recent profile: `.order('created_at', { ascending: false }).limit(1)`

**Code Location:** `src/Profile.jsx` lines 21-47

---

### **8. User Sees Their Profile Page** 🎉
The Profile component displays:

**Archetype Cards:**
- **Essence Archetype** with image, poetic line, superpower, north star, vision
- **Protective Archetype** with image, summary, how it shows up, breaking free
- Expandable sections to learn more

**Journey Stage:**
- Persona badge showing current journey stage

**Continue Journey Section:**
- Button to navigate to `/healing-compass` (Healing Compass flow)
- Share Profile button

**User Info:**
- User's email displayed in header
- Sign Out button

**Code Location:** `src/Profile.jsx` lines 93-201

---

## 🔄 **Complete Flow Diagram**

```
1. User completes flow (/) 
   ↓
2. Email entered → Profile saved to DB
   ↓
3. Magic link sent (redirects to /me)
   ↓
4. User clicks email link
   ↓
5. Browser → /me#access_token=...
   ↓
6. Supabase processes token
   ↓
7. AuthProvider detects SIGNED_IN event
   ↓
8. User state updated (authenticated)
   ↓
9. Router matches /me route
   ↓
10. AuthGate checks: user authenticated ✅
    ↓
11. Profile component renders
    ↓
12. Fetches user data from Supabase
    ↓
13. Displays archetype cards & profile
    ↓
14. User can navigate to /healing-compass
```

---

## 🔐 **Key Authentication Components**

### **AuthProvider** (`src/auth/AuthProvider.jsx`)
- Manages authentication state
- Provides `signInWithMagicLink()` function
- Listens for auth state changes
- Exposes `user`, `loading`, `signOut` to app

### **AuthGate** (`src/AuthGate.jsx`)
- Protected route wrapper
- Shows login form if not authenticated
- Renders children (protected content) if authenticated
- Used by `/me` and `/healing-compass` routes

### **Profile Component** (`src/Profile.jsx`)
- Fetches and displays user's archetype data
- Shows essence, protective, and persona information
- Navigation to healing compass
- Sign out functionality

---

## 📊 **Database Query Details**

When Profile component loads, it queries:

**Table:** `lead_flow_profiles`

**Query:**
```javascript
supabase
  .from('lead_flow_profiles')
  .select('*')
  .eq('email', user?.email)  // Filter by authenticated user's email
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

**Returns:**
- Most recent profile for the authenticated user's email
- Includes: `essence_archetype`, `protective_archetype`, `persona`, `user_name`, `context`, etc.

---

## ⚠️ **Error Handling**

### **If User Not Authenticated:**
- `AuthGate` shows email input form
- User can request new magic link
- Prevents access to protected routes

### **If Profile Not Found:**
- Profile component shows error: "No profile data found. Please complete the lead magnet flow first."
- User would need to complete flow again (shouldn't happen if flow worked)

### **If Magic Link Fails:**
- Original flow shows error message in chat
- User can try again or continue anyway

---

## 🔗 **Related Routes**

### **Protected Routes (Require Authentication):**
- `/me` → Profile page (archetype display)
- `/healing-compass` → Healing journey flow

### **Public Routes:**
- `/` → Main lead magnet flow (no auth required)

---

## ✅ **Summary**

**User clicks magic link → Authenticated → Redirected to `/me` → Sees profile with archetypes**

The flow is **automatic** - Supabase handles token processing, and React Router + AuthGate handle route protection. The user experience is seamless after clicking the email link.

