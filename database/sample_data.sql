-- =============================================================================
-- Demo data for the courier platform (MySQL 8)
-- =============================================================================
-- Run *after* schema.sql. Every account below has a documented demo password;
-- these hashes are for local/demo databases only and must never be reused in
-- production.
--
--   admin@courier.dev     / AdminPass1
--   driver@courier.dev    / DriverPass1
--   customer@courier.dev  / CustomerPass1
--   rae@courier.dev       / RaePass1
-- =============================================================================

INSERT INTO users (name, email, phone, password_hash, role) VALUES
  ('Meera Admin', 'admin@courier.dev', '+91 9000000001',
   '$argon2id$v=19$m=65536,t=3,p=4$2MyiuXHN6ieC7yISjY81pQ$7Ux0tkMZl5Ml0VSr7jCZvL7vIAG1EmvDWQnjH/7sTmo', 'ADMIN'),
  ('Dev Driver', 'driver@courier.dev', '+91 9000000002',
   '$argon2id$v=19$m=65536,t=3,p=4$wQlVHkOwyv2MYW0Nx+nXdw$5p5xq2L6U8MHcmAyBeS8G9FIENpoICocYsb5pl3ri8k', 'DRIVER'),
  ('Chandra Customer', 'customer@courier.dev', '+91 9000000003',
   '$argon2id$v=19$m=65536,t=3,p=4$XLp9VbpkzbrGpCBXbOytVQ$JFRTrKMTal4A8X2mrGB6cWaAk2jGuQHxri2fh3hMavA', 'CUSTOMER'),
  ('Rae Receiver', 'rae@courier.dev', '+91 9000000004',
   '$argon2id$v=19$m=65536,t=3,p=4$l5vs3ssQWGuEDKoEVN1OyA$U90x6MuAaIFeVwZ63rU9uvuqqhMkceg+HaprIMYSxe8', 'CUSTOMER')
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @admin_id    = (SELECT user_id FROM users WHERE email = 'admin@courier.dev');
SET @driver_id   = (SELECT user_id FROM users WHERE email = 'driver@courier.dev');
SET @customer_id = (SELECT user_id FROM users WHERE email = 'customer@courier.dev');
SET @rae_id      = (SELECT user_id FROM users WHERE email = 'rae@courier.dev');

INSERT INTO parcels
  (tracking_number, sender_id, receiver_id, driver_id, weight, pickup_address,
   delivery_address, status, estimated_delivery, created_at, updated_at, delivered_at)
VALUES
  ('CPT-DEMO0001', @customer_id, @rae_id, @driver_id, 2.50,
   '12 MG Road, Bengaluru, Karnataka 560001',
   '45 Park Street, Kolkata, West Bengal 700016',
   'DELIVERED', DATE_SUB(CURDATE(), INTERVAL 2 DAY),
   DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
   DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ('CPT-DEMO0002', @customer_id, @rae_id, @driver_id, 7.75,
   '88 Residency Road, Bengaluru, Karnataka 560025',
   '21 Anna Salai, Chennai, Tamil Nadu 600002',
   'IN_TRANSIT', DATE_ADD(CURDATE(), INTERVAL 2 DAY),
   DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
  ('CPT-DEMO0003', @rae_id, @customer_id, NULL, 1.20,
   '9 Banjara Hills, Hyderabad, Telangana 500034',
   '76 Linking Road, Mumbai, Maharashtra 400050',
   'CREATED', DATE_ADD(CURDATE(), INTERVAL 4 DAY),
   DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0001', 'CREATED', 'Bengaluru', 'Shipment registered and awaiting pickup', @customer_id,
       DATE_SUB(NOW(), INTERVAL 6 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0001');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0001', 'PICKED_UP', 'Bengaluru', 'Parcel collected from sender', @driver_id,
       DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0001' AND status = 'PICKED_UP');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0001', 'IN_TRANSIT', 'Nagpur', 'Departed Bengaluru hub', @driver_id,
       DATE_SUB(NOW(), INTERVAL 4 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0001' AND status = 'IN_TRANSIT');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0001', 'DELIVERED', 'Kolkata', 'Delivered to receiver', @driver_id,
       DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0001' AND status = 'DELIVERED');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0002', 'CREATED', 'Bengaluru', 'Shipment registered and awaiting pickup', @customer_id,
       DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0002');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0002', 'PICKED_UP', 'Bengaluru', 'Parcel collected from sender', @driver_id,
       DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0002' AND status = 'PICKED_UP');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0002', 'IN_TRANSIT', 'Vellore', 'In transit to Chennai hub', @driver_id,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0002' AND status = 'IN_TRANSIT');

INSERT INTO tracking_logs
  (tracking_number, status, location, remarks, created_by, updated_at)
SELECT 'CPT-DEMO0003', 'CREATED', 'Hyderabad', 'Shipment registered and awaiting pickup', @rae_id,
       DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (SELECT 1 FROM tracking_logs WHERE tracking_number = 'CPT-DEMO0003');
