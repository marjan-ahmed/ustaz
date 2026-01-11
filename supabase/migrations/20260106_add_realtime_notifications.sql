-- Enable Realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ustaz_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;

-- Create the function to create service request with notifications
CREATE OR REPLACE FUNCTION create_service_request_with_notifications(
    p_user_id UUID,
    p_service_type TEXT,
    p_request_latitude FLOAT,
    p_request_longitude FLOAT,
    p_request_details TEXT DEFAULT NULL,
    p_radius_meters INTEGER DEFAULT 3000
)
RETURNS TABLE (
    request_id UUID,
    notified_count INTEGER,
    providers_notified UUID[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_request_id UUID;
    notified_provider_ids UUID[] := '{}';
    provider_record RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Insert the service request
    INSERT INTO service_requests (
        user_id,
        service_type,
        request_latitude,
        request_longitude,
        request_details,
        status,
        created_at
    ) VALUES (
        p_user_id,
        p_service_type,
        p_request_latitude,
        p_request_longitude,
        p_request_details,
        'pending_notification',
        NOW()
    ) RETURNING id INTO new_request_id;

    -- Find and notify eligible providers with server-side filtering
    FOR provider_record IN
        SELECT
            ur.userId,
            ur.firstName,
            ur.lastName,
            ST_Distance(
                ur.location,
                ST_SetSRID(ST_MakePoint(p_request_longitude, p_request_latitude), 4326)::GEOGRAPHY
            ) AS distance
        FROM ustaz_registrations ur
        WHERE
            ur.service_type = p_service_type
            AND ur.online_status = TRUE
            AND ur.provider_status = 'available'
            AND ur.location IS NOT NULL
            AND ST_DWithin(
                ur.location,
                ST_SetSRID(ST_MakePoint(p_request_longitude, p_request_latitude), 4326)::GEOGRAPHY,
                p_radius_meters
            )
        ORDER BY distance
        LIMIT 10
    LOOP
        -- Insert notification for the provider
        INSERT INTO notifications (
            recipient_user_id,
            sender_user_id,
            service_type,
            message,
            status,
            created_at,
            request_id,
            provider_distance
        ) VALUES (
            provider_record.userId,
            p_user_id,
            p_service_type,
            'New ' || p_service_type || ' service request nearby',
            'pending',
            NOW(),
            new_request_id,
            provider_record.distance
        );

        -- Add to array of notified providers
        notified_provider_ids := array_append(notified_provider_ids, provider_record.userId);
        notification_count := notification_count + 1;
    END LOOP;

    -- Update request status based on notification count
    IF notification_count > 0 THEN
        UPDATE service_requests
        SET
            notified_providers = notified_provider_ids,
            status = 'notified_multiple'
        WHERE id = new_request_id;
    ELSE
        UPDATE service_requests
        SET status = 'no_ustaz_found'
        WHERE id = new_request_id;
    END IF;

    -- Return results
    RETURN QUERY SELECT new_request_id, notification_count, notified_provider_ids;
END;
$$;

-- Function to handle provider accepting a request with race condition protection
CREATE OR REPLACE FUNCTION accept_service_request(
    p_provider_id UUID,
    p_request_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    updated_request JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    affected_rows INTEGER;
    current_request RECORD;
BEGIN
    -- Attempt to update the request with atomic operation to prevent race conditions
    UPDATE service_requests
    SET
        status = 'accepted',
        accepted_by_provider_id = p_provider_id,
        updated_at = NOW()
    WHERE
        id = p_request_id
        AND status = 'notified_multiple'  -- Only update if still available
    RETURNING * INTO current_request;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows = 0 THEN
        -- Check if already taken by another provider
        SELECT * INTO current_request FROM service_requests WHERE id = p_request_id;

        IF current_request.status = 'accepted' THEN
            RETURN QUERY SELECT FALSE, 'Request already accepted by another provider', NULL::JSONB;
        ELSE
            RETURN QUERY SELECT FALSE, 'Request no longer available', NULL::JSONB;
        END IF;
    ELSE
        -- Update provider status to busy
        UPDATE ustaz_registrations
        SET provider_status = 'busy'
        WHERE userId = p_provider_id;

        -- Update all related notifications
        UPDATE notifications
        SET
            status = CASE
                WHEN recipient_user_id = p_provider_id THEN 'accepted'
                ELSE 'taken_by_other'  -- Indicate it's taken by another provider
            END,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        -- Return the updated request data
        RETURN QUERY SELECT TRUE, 'Request accepted successfully', row_to_json(current_request)::JSONB;
    END IF;
END;
$$;

-- Function to handle provider rejecting a request
CREATE OR REPLACE FUNCTION reject_service_request(
    p_provider_id UUID,
    p_request_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update the notification status
    UPDATE notifications
    SET
        status = 'rejected',
        updated_at = NOW()
    WHERE
        request_id = p_request_id
        AND recipient_user_id = p_provider_id;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows = 0 THEN
        RETURN QUERY SELECT FALSE, 'No notification found for this provider and request';
    ELSE
        -- Check if all notified providers have rejected the request
        -- If so, update the request status to 'no_ustaz_found'
        PERFORM check_all_providers_rejected(p_request_id);

        RETURN QUERY SELECT TRUE, 'Request rejected successfully';
    END IF;
END;
$$;

-- Helper function to check if all providers have rejected a request
CREATE OR REPLACE FUNCTION check_all_providers_rejected(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
    total_notified INTEGER;
    rejected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_notified
    FROM notifications
    WHERE request_id = p_request_id;

    SELECT COUNT(*) INTO rejected_count
    FROM notifications
    WHERE request_id = p_request_id AND status = 'rejected';

    -- If all notified providers have rejected, update request status
    IF total_notified > 0 AND total_notified = rejected_count THEN
        UPDATE service_requests
        SET status = 'no_ustaz_found'
        WHERE id = p_request_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update provider online status
CREATE OR REPLACE FUNCTION update_provider_online_status(
    p_user_id UUID,
    p_online BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    UPDATE ustaz_registrations
    SET
        online_status = p_online,
        last_seen_at = NOW(),
        provider_status = CASE
            WHEN p_online THEN 'available'
            ELSE 'offline'
        END
    WHERE userId = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_service_type_status ON ustaz_registrations(service_type, online_status, provider_status);
CREATE INDEX IF NOT EXISTS idx_ustaz_registrations_location_gin ON ustaz_registrations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_status ON notifications(recipient_user_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_notified_providers ON service_requests USING GIN(notified_providers);

-- Add the necessary columns to the notifications table if they don't exist
-- (This is handled by the publication which makes the entire table available via Realtime)