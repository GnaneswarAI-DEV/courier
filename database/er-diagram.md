# Entity-Relationship Diagram

Three entities. `users` plays three roles in `parcels` (sender, receiver, driver),
and `tracking_logs` records the append-only history of each shipment.

```mermaid
erDiagram
    USERS ||--o{ PARCELS : "sends (sender_id)"
    USERS ||--o{ PARCELS : "receives (receiver_id)"
    USERS ||--o{ PARCELS : "delivers (driver_id, nullable)"
    USERS ||--o{ TRACKING_LOGS : "records (created_by, nullable)"
    PARCELS ||--o{ TRACKING_LOGS : "has history"

    USERS {
        int     user_id PK
        string  name
        string  email UK
        string  phone
        string  password_hash
        enum    role "ADMIN | DRIVER | CUSTOMER"
        bool    is_active
        datetime created_at
    }

    PARCELS {
        string  tracking_number PK
        int     sender_id FK
        int     receiver_id FK
        int     driver_id FK "nullable"
        decimal weight "kg, > 0"
        string  pickup_address
        string  delivery_address
        enum    status
        date    estimated_delivery "nullable"
        datetime created_at
        datetime updated_at
        datetime delivered_at "nullable"
    }

    TRACKING_LOGS {
        bigint  log_id PK
        string  tracking_number FK
        enum    status
        string  location
        string  remarks "nullable"
        int     created_by FK "nullable"
        datetime updated_at
    }
```

## Cardinality

| Relationship | Cardinality | Notes |
| --- | --- | --- |
| user → sent parcels | 1 : N | required (`sender_id` NOT NULL) |
| user → received parcels | 1 : N | required (`receiver_id` NOT NULL) |
| user → assigned parcels | 1 : N | optional; a parcel may await assignment |
| parcel → tracking events | 1 : N | at least one (`CREATED`); cascade delete |
| user → tracking events authored | 1 : N | optional for system-generated events |

## Normalisation

- **1NF** – every column is atomic; addresses are single free-text values.
- **2NF** – all non-key columns depend on the whole primary key
  (`tracking_number` for parcels, `log_id` for logs).
- **3NF** – no transitive dependencies: user details live only in `users`, and
  a log references its parcel by key instead of copying parcel attributes.
  The obvious exception is the intentional denormalisation of `status` on
  `parcels` (current state, needed for fast filtering) while `tracking_logs`
  holds the history.

## Constraints that encode business rules

| Rule | Enforcement |
| --- | --- |
| Email uniqueness (case-insensitive) | unique index + lowercased value in service |
| Weight must be positive | `CHECK (weight > 0)` |
| Only known statuses/roles | `CHECK` on enumerated string columns |
| History cannot outlive its parcel | `ON DELETE CASCADE` from logs to parcels |
| Users with parcel history cannot be deleted | `ON DELETE RESTRICT` + service check |
| Legal status transitions | application state machine (see `app/models/enums.py`) |

## Index rationale

| Index | Supports |
| --- | --- |
| `uq_users_email` | login lookup and duplicate detection |
| `ix_parcels_status` | dashboard status breakdown, admin filters |
| `ix_parcels_sender_status` | customer "my shipments" filtered by status |
| `ix_parcels_receiver_status` | incoming shipment list |
| `ix_parcels_driver_status` | driver work queue |
| `ix_tracking_logs_parcel_time` | shipment timeline in chronological order |
