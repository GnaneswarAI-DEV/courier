-- =============================================================================
-- Example analytical queries used by the reporting layer and for DBMS demos
-- =============================================================================

-- 1. Shipment counts per status (drives the dashboard status breakdown)
SELECT status, COUNT(*) AS parcel_count
FROM parcels
GROUP BY status
ORDER BY parcel_count DESC;

-- 2. Latest event for every shipment (correlated subquery on the natural key)
SELECT p.tracking_number, p.status, l.location, l.updated_at AS last_scan
FROM parcels p
JOIN tracking_logs l
  ON l.tracking_number = p.tracking_number
 AND l.updated_at = (
     SELECT MAX(l2.updated_at) FROM tracking_logs l2
     WHERE l2.tracking_number = p.tracking_number
 )
ORDER BY l.updated_at DESC;

-- 3. Full journey of one shipment, oldest first
SELECT tracking_number, status, location, remarks, updated_at
FROM tracking_logs
WHERE tracking_number = 'CPT-DEMO0001'
ORDER BY updated_at, log_id;

-- 4. Revenue-style volume report: parcels and total weight per sender
SELECT u.user_id, u.name, COUNT(*) AS parcels_sent, ROUND(SUM(p.weight), 2) AS total_kg
FROM users u
JOIN parcels p ON p.sender_id = u.user_id
GROUP BY u.user_id, u.name
ORDER BY parcels_sent DESC;

-- 5. Driver workload: active shipments per driver, only active drivers
SELECT u.user_id, u.name, COUNT(p.tracking_number) AS active_shipments
FROM users u
LEFT JOIN parcels p
  ON p.driver_id = u.user_id
 AND p.status NOT IN ('DELIVERED', 'CANCELLED')
WHERE u.role = 'DRIVER' AND u.is_active = 1
GROUP BY u.user_id, u.name
ORDER BY active_shipments DESC;

-- 6. Average delivery time in hours for completed shipments
SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, delivered_at)), 2) AS avg_hours
FROM parcels
WHERE status = 'DELIVERED' AND delivered_at IS NOT NULL;

-- 7. On-time delivery rate against the promised date
SELECT
  COUNT(*) AS delivered_with_due_date,
  SUM(CASE WHEN DATE(delivered_at) <= estimated_delivery THEN 1 ELSE 0 END) AS on_time,
  ROUND(
    100 * SUM(CASE WHEN DATE(delivered_at) <= estimated_delivery THEN 1 ELSE 0 END) / COUNT(*),
    1
  ) AS on_time_percent
FROM parcels
WHERE status = 'DELIVERED' AND delivered_at IS NOT NULL AND estimated_delivery IS NOT NULL;

-- 8. Daily throughput for the last 30 days
SELECT DATE(created_at) AS day,
       COUNT(*) AS created,
       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered
FROM parcels
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY day;

-- 9. Top city-to-city routes (city = second comma-separated address segment)
SELECT
  SUBSTRING_INDEX(SUBSTRING_INDEX(pickup_address, ',', 2), ',', -1) AS origin,
  SUBSTRING_INDEX(SUBSTRING_INDEX(delivery_address, ',', 2), ',', -1) AS destination,
  COUNT(*) AS shipments
FROM parcels
GROUP BY origin, destination
ORDER BY shipments DESC
LIMIT 5;

-- 10. Shipments stuck in a non-terminal state for more than five days
SELECT tracking_number, status, created_at, DATEDIFF(NOW(), created_at) AS days_open
FROM parcels
WHERE status NOT IN ('DELIVERED', 'CANCELLED')
  AND created_at < DATE_SUB(NOW(), INTERVAL 5 DAY)
ORDER BY days_open DESC;

-- 11. Accounts that have never sent or received a parcel (cleanup candidates)
SELECT u.user_id, u.name, u.email, u.role
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM parcels p WHERE p.sender_id = u.user_id)
  AND NOT EXISTS (SELECT 1 FROM parcels p WHERE p.receiver_id = u.user_id)
  AND NOT EXISTS (SELECT 1 FROM parcels p WHERE p.driver_id = u.user_id);

-- 12. Index friendliness check for the customer tracking page
EXPLAIN SELECT * FROM parcels WHERE status = 'IN_TRANSIT' ORDER BY created_at DESC LIMIT 10;
