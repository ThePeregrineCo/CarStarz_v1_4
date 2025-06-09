-- Add vehicle_videos table for YouTube videos
CREATE TABLE IF NOT EXISTS vehicle_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_videos
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Create index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_videos_vehicle_id ON vehicle_videos(vehicle_id);

-- Enable row level security
ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_videos
CREATE POLICY "Videos are viewable by everyone"
    ON vehicle_videos FOR SELECT
    USING (true);

CREATE POLICY "Users can insert videos to their own vehicles"
    ON vehicle_videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update videos on their own vehicles"
    ON vehicle_videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete videos on their own vehicles"
    ON vehicle_videos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_vehicle_videos_updated_at
    BEFORE UPDATE ON vehicle_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();