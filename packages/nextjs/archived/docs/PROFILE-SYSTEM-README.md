# CarStarz Profile System

This document provides instructions for setting up and testing the new profile system for CarStarz, which includes User Profiles, Business Profiles, and Club Profiles.

## Features

- **User Profiles**: Display and edit user information, including social links
- **Business Profiles**: Business information with Google Maps integration
- **Club Profiles**: Car club management with members and events
- **API Routes**: Backend support for all profile operations
- **Database Schema**: Relational database design for profiles

## Setup Instructions

### 1. Set Environment Variables

Make sure your Supabase environment variables are set:

```bash
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Run Setup Script

Execute the setup script to create the database schema and seed test data:

```bash
cd packages/nextjs
chmod +x run-profile-setup.sh
./run-profile-setup.sh
```

This script will:
- Apply the database schema changes
- Seed test data for profiles
- Display URLs for testing

### 3. Start Development Server

Start the Next.js development server:

```bash
npm run dev
```

## Testing the Profiles

Once the setup is complete and the development server is running, you can test the profiles using the following URLs:

### User Profile
```
http://localhost:3000/user/testuser
```

### Business Profile
```
http://localhost:3000/business/{business_id}
```
(The business ID will be displayed in the console output after running the setup script)

### Club Profile
```
http://localhost:3000/club/{club_id}
```
(The club ID will be displayed in the console output after running the setup script)

## Google Maps Integration

The Business Profile includes integration with Google Maps:

1. Business profiles display a "View on Google Maps" button
2. Clicking this button opens the business location on Google Maps
3. When editing a business profile, you can set the Google Maps URL

## API Endpoints

The following API endpoints are available for testing:

### User Profiles
- `GET /api/user-profiles?walletAddress={address}` - Get user by wallet address
- `GET /api/user-profiles?username={username}` - Get user by username
- `PATCH /api/user-profiles?walletAddress={address}` - Update user profile
- `POST /api/user-profiles?action=check-username` - Check username availability

### Business Profiles
- `GET /api/business-profiles?id={id}` - Get business by ID
- `GET /api/business-profiles?userId={userId}` - Get businesses by user ID
- `POST /api/business-profiles` - Create a new business
- `PATCH /api/business-profiles?id={id}` - Update business profile

### Club Profiles
- `GET /api/club-profiles?id={id}` - Get club by ID
- `GET /api/club-profiles?creatorId={creatorId}` - Get clubs by creator ID
- `POST /api/club-profiles` - Create a new club
- `PATCH /api/club-profiles?id={id}` - Update club profile

## Database Schema

The profile system uses the following tables:

- `users` - User profiles
- `businesses` - Business profiles
- `clubs` - Club profiles
- `social_links` - Social media links for profiles
- `services` - Services offered by businesses
- `club_memberships` - Club membership information
- `club_vehicles` - Vehicles associated with clubs
- `club_events` - Events organized by clubs
- `follows` - Social follow relationships

## Next Steps

1. **Complete Club Features**: Implement member management and events
2. **Enhance Business Profiles**: Add portfolio management and reviews
3. **User Dashboard**: Create a dashboard for users to manage all their profiles