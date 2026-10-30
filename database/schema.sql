-- =============================================================================
-- Courier Parcel Tracking & Delivery Management - MySQL 8 schema
-- =============================================================================
-- This file is the human-readable equivalent of the Alembic migration in
-- backend/alembic/versions/0001_initial_schema.py. The migration is the source
-- of truth for the running application; keep both in sync when the schema
-- changes.
--
-- It is safe to run against an empty database. It does NOT drop data.
--   mysql -u <user> -p -h <host> --ssl-mode=REQUIRED defaultdb < schema.sql
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- users: every actor (customer / driver / administrator)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120)    NOT NULL,
    email         VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20)     NULL,
    password_hash VARCHAR(255)    NOT NULL,
    role          VARCHAR(20)     NOT NULL DEFAULT 'CUSTOMER',
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'DRIVER', 'CUSTOMER'))
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- parcels: one row per shipment. tracking_number is the natural primary key
-- because it is the identifier customers and support staff actually use.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcels (
    tracking_number    VARCHAR(24)   NOT NULL,
    sender_id          INT UNSIGNED  NOT NULL,
    receiver_id        INT UNSIGNED  NOT NULL,
    driver_id          INT UNSIGNED  NULL,
    weight             DECIMAL(8, 2) NOT NULL,
    pickup_address     VARCHAR(255)  NOT NULL,
    delivery_address   VARCHAR(255)  NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'CREATED',
    estimated_delivery DATE          NULL,
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
    delivered_at       DATETIME      NULL,
    PRIMARY KEY (tracking_number),
    KEY ix_parcels_status (status),
    KEY ix_parcels_sender_status (sender_id, status),
    KEY ix_parcels_receiver_status (receiver_id, status),
    KEY ix_parcels_driver_status (driver_id, status),
    CONSTRAINT ck_parcels_weight_positive CHECK (weight > 0),
    CONSTRAINT fk_parcels_sender FOREIGN KEY (sender_id)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_parcels_receiver FOREIGN KEY (receiver_id)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_parcels_driver FOREIGN KEY (driver_id)
        REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT ck_parcels_status CHECK (
        status IN ('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
                   'DELIVERED', 'FAILED', 'CANCELLED')
    )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tracking_logs: append-only event history. Deleting a parcel removes its
-- history through ON DELETE CASCADE - there is never a log without a parcel.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking_logs (
    log_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tracking_number VARCHAR(24)     NOT NULL,
    status          VARCHAR(20)     NOT NULL,
    location        VARCHAR(255)    NOT NULL,
    remarks         VARCHAR(500)    NULL,
    created_by      INT UNSIGNED    NULL,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY ix_tracking_logs_parcel_time (tracking_number, updated_at),
    CONSTRAINT fk_tracking_logs_parcel FOREIGN KEY (tracking_number)
        REFERENCES parcels (tracking_number) ON DELETE CASCADE,
    CONSTRAINT fk_tracking_logs_user FOREIGN KEY (created_by)
        REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Alembic bookkeeping (only needed if you bootstrap with this file instead of
-- `alembic upgrade head`). The revision matches 0001_initial.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    PRIMARY KEY (version_num)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO alembic_version (version_num)
SELECT '0001_initial'
WHERE NOT EXISTS (SELECT 1 FROM alembic_version);
select * from users;
