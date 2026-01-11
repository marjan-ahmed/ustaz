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

-- Create index for better performance on location column
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_location_gin
ON ustaz_registrations
USING GIST(location);

-- Create indexes for filtering columns
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_service_type
ON ustaz_registrations (service_type);

CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_online_status
ON ustaz_registrations (online_status);

CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_provider_status
ON ustaz_registrations (provider_status);