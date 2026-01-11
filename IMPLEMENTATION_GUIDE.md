# Ustaz Service Request System Implementation Guide

## Overview
This document outlines the implementation of the service request and provider matching system for the Ustaz application. The system enables users to request services (electrician, plumbing, etc.) and match with nearby providers based on location, service type, and availability.

## Database Schema Changes

### Required Columns Added to `ustaz_registrations`
```sql
-- Add online status column
ALTER TABLE ustaz_registrations ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT FALSE;

-- Add last seen timestamp column
ALTER TABLE ustaz_registrations ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create enum type for provider status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_status_type') THEN
        CREATE TYPE provider_status_type AS ENUM ('available', 'busy', 'offline');
    END IF;
END
$$;

-- Add provider status column with enum type
ALTER TABLE ustaz_registrations ADD COLUMN IF NOT EXISTS provider_status provider_status_type DEFAULT 'available';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_online_status ON ustaz_registrations(online_status);
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_service_type ON ustaz_registrations(service_type);
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_provider_status ON ustaz_registrations(provider_status);

-- Create index for location column for PostGIS queries
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_location_gin
ON ustaz_registrations
USING GIST(location);
```

### Custom Database Function for Distance Calculation
```sql
-- This SQL function finds providers nearby using PostGIS geography functions
-- It filters by service type, online status, and distance from the given coordinates

CREATE OR REPLACE FUNCTION find_providers_nearby_with_distance(
  lat_input FLOAT,
  lng_input FLOAT,
  radius_input FLOAT DEFAULT 3000,  -- Default 3km in meters
  type_input TEXT
)
RETURNS TABLE (
  userId UUID,
  firstName TEXT,
  lastName TEXT,
  email TEXT,
  phoneNumber TEXT,
  phoneCountryCode TEXT,
  service_type TEXT,
  city TEXT,
  country TEXT,
  avatarUrl TEXT,
  experienceYears INTEGER,
  experienceDetails TEXT,
  distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.userId,
    ur.firstName,
    ur.lastName,
    ur.email,
    ur.phoneNumber,
    ur.phoneCountryCode,
    ur.service_type,
    ur.city,
    ur.country,
    ur.avatarUrl,
    ur.experienceYears,
    ur.experienceDetails,
    ST_Distance(
      ur.location,
      ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::GEOGRAPHY
    ) AS distance
  FROM ustaz_registrations ur
  WHERE
    ur.service_type = type_input
    AND ur.online_status = TRUE
    AND ur.provider_status = 'available'
    AND ur.location IS NOT NULL
    AND ST_DWithin(
      ur.location,
      ST_SetSRID(ST_MakePoint(lng_input, lat_input), 4326)::GEOGRAPHY,
      radius_input
    )
  ORDER BY distance
  LIMIT 10;  -- Return top 10 closest providers
END;
$$;
```

## API Endpoints

### 1. Find Nearby Providers (`/api/find-nearby-providers`)
- **Method**: POST
- **Purpose**: Find providers near a given location for a specific service type
- **Request Body**:
  ```json
  {
    "serviceType": "Electrician Service",
    "userLat": 24.8607,
    "userLng": 67.0011,
    "radiusKm": 3
  }
  ```
- **Response**:
  ```json
  {
    "providers": [
      {
        "id": "provider-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "1234567890",
        "phoneCountryCode": "+1",
        "serviceType": "Electrician Service",
        "city": "Karachi",
        "country": "Pakistan",
        "avatarUrl": "https://example.com/avatar.jpg",
        "experienceYears": 5,
        "experienceDetails": "Experienced electrician...",
        "distance": 1200  // in meters
      }
    ]
  }
  ```

### 2. Create Service Request (`/api/create-service-request`)
- **Method**: POST
- **Purpose**: Create a new service request and notify nearby providers
- **Request Body**:
  ```json
  {
    "userId": "user-id",
    "serviceType": "Plumbing",
    "userLat": 24.8607,
    "userLng": 67.0011,
    "requestDetails": "Fix leaking pipe",
    "radiusKm": 3
  }
  ```
- **Response**:
  ```json
  {
    "message": "Service request created and notifications sent successfully",
    "requestId": "request-id",
    "providersNotified": 3,
    "providers": [
      {
        "id": "provider-id",
        "firstName": "John",
        "lastName": "Doe",
        "distance": 1200
      }
    ]
  }
  ```

### 3. Handle Service Request (`/api/handle-service-request`)
- **Method**: POST
- **Purpose**: Allow providers to accept or reject service requests
- **Request Body**:
  ```json
  {
    "providerId": "provider-id",
    "requestId": "request-id",
    "action": "accept"  // or "reject"
  }
  ```
- **Response** (for accept):
  ```json
  {
    "message": "Service request accepted successfully",
    "request": {
      // request object with updated status
    }
  }
  ```

### 4. Update Provider Location (`/api/update-provider-location`)
- **Method**: POST
- **Purpose**: Update provider's live location during service
- **Request Body**:
  ```json
  {
    "providerId": "provider-id",
    "requestId": "request-id",
    "latitude": 24.8607,
    "longitude": 67.0011
  }
  ```

## Real-time Features

### Provider Notifications
- Providers receive real-time notifications only when they are online (`online_status = true`) and available (`provider_status = 'available'`)
- Notifications are sent to providers within the specified radius (default 3km)
- Uses Supabase Realtime to push notifications instantly to provider dashboards

### Live Location Tracking
- Once a provider accepts a request, their location is tracked in real-time
- Users can track their assigned provider's location during service
- Location updates are secured - only the requesting user or the assigned provider can access location data

## Race Condition Handling

### Request Acceptance
- Uses database-level atomic updates to prevent multiple providers from accepting the same request
- When a provider attempts to accept a request, the system checks the current status
- Only updates the request status if it's still available (`status = 'notified_multiple'`)
- If another provider has already accepted, returns an appropriate error

## Edge Cases Handled

1. **No Providers Found**: When no providers are available within the radius, the request status is updated to `no_ustaz_found`

2. **All Providers Reject**: When all notified providers reject a request, the status is updated to `no_ustaz_found`

3. **Provider Goes Offline After Accepting**: The system relies on client-side status updates, but could be enhanced with heartbeat mechanisms

4. **Network Issues**: API endpoints include proper error handling and fallback mechanisms

5. **Invalid Coordinates**: All location-based endpoints validate coordinate ranges

6. **Unauthorized Access**: All endpoints verify user permissions before allowing actions

## Security Considerations

- Provider status is verified before allowing location updates
- Users can only access location data for their own requests
- Request acceptance is limited to providers who were notified
- All database operations use parameterized queries to prevent SQL injection

## Performance Optimizations

- Database indexes on frequently queried columns (service_type, online_status, provider_status)
- PostGIS indexes for location-based queries
- Limited results (top 5-10 providers) to reduce data transfer
- Efficient RPC calls for distance calculations

## Integration with Frontend

The API endpoints are designed to work with the existing frontend components:
- Process page can call `/api/find-nearby-providers` to show available providers
- Dashboard can use real-time subscriptions to receive notifications
- Map components can fetch live location data via `/api/update-provider-location`