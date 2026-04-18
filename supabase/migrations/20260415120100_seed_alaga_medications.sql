-- Seed medication data for Alaga demo

INSERT INTO medications (name, dosage, purpose, time_of_day, frequency, pill_photo_url)
SELECT *
FROM (
  VALUES
    (
      'Amlodipine',
      '1 tablet',
      'For high blood pressure',
      '8:00 AM',
      'Once daily',
      'https://images.unsplash.com/photo-1740592756330-adb8c1f5fbe7?w=400&h=400&fit=crop'
    ),
    (
      'Metformin',
      '1 tablet',
      'For diabetes',
      '8:00 AM',
      'Once daily',
      'https://images.unsplash.com/photo-1549477880-6703139139c5?w=400&h=400&fit=crop'
    ),
    (
      'Calcium',
      '1 capsule',
      'For bone health',
      '1:00 PM',
      'Once daily',
      'https://images.unsplash.com/photo-1659019479940-e3fd3fba24d8?w=400&h=400&fit=crop'
    ),
    (
      'Vitamin D',
      '1 capsule',
      'For bone & immune health',
      '7:00 PM',
      'Once daily',
      'https://images.unsplash.com/photo-1565071783280-719b01b29912?w=400&h=400&fit=crop'
    )
) AS seed_data(name, dosage, purpose, time_of_day, frequency, pill_photo_url)
WHERE NOT EXISTS (
  SELECT 1
  FROM medications existing
  WHERE existing.name = seed_data.name
    AND existing.dosage = seed_data.dosage
    AND COALESCE(existing.time_of_day, '') = COALESCE(seed_data.time_of_day, '')
);