# iPalsam Feed - Mobile App

Expo + React Native mobile app for the iPalsam social feed.

## Tech Stack

- **Expo SDK 54** (managed workflow)
- **Expo Router** (file-based navigation)
- **NativeWind v4** (Tailwind CSS for React Native)
- **TanStack Query v5** (data fetching)
- **Zustand** (auth state)
- **expo-secure-store** (JWT token storage)
- **expo-notifications** (push notifications)
- **expo-image** (cached image loading)
- **react-native-reanimated** (animations)

## Setup

```bash
npm install
```

Create a `.env` file:

```
EXPO_PUBLIC_API_URL=https://ipalsam.com
```

## Development

```bash
npx expo start
```

## Backend API

The app communicates with the iPalsam Next.js backend via `/api/mobile/*` routes.
JWT tokens are used for authentication (not session cookies).

### Key endpoints:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/mobile/auth/login` | POST | Login (phone + password) |
| `/api/mobile/feed` | GET | Feed posts |
| `/api/mobile/posts` | POST | Create post |
| `/api/mobile/posts/:id/like` | POST | Toggle like |
| `/api/mobile/explore` | GET | Discover profiles |
| `/api/mobile/notifications` | GET | Notifications |
| `/api/mobile/profile/:phone` | GET | Public profile |

## Project Structure

```
app/           # Expo Router screens
  (auth)/      # Login
  (tabs)/      # Main tabs (feed, explore, profile, notifications, settings)
  profile/     # Public profile [phone]
components/    # Reusable UI components
  posts/       # PostCard, CreatePostForm
  profile/     # ProfileHeader
  ui/          # Avatar, VerifiedBadge, EmptyState
lib/           # Core utilities
  api.ts       # API client with JWT
  auth.ts      # Auth store (Zustand + SecureStore)
  types.ts     # TypeScript types
```
