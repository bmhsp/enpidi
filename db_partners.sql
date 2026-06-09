-- ==============================================================================
-- MASTER SCRIPT DATABASE LINKBASE (RESET & INIT)
-- ==============================================================================

-- 1. Bersihkan sisa tabel lama biar nggak bentrok
DROP TABLE IF EXISTS link_detail, master_customers, master_partners, provisioning_tasks CASCADE;
DROP TYPE IF EXISTS project_type CASCADE;
DROP TYPE IF EXISTS service_type CASCADE;

-- 2. Buat List ENUM
CREATE TYPE project_type AS ENUM ('Activation', 'Upgrade', 'Downgrade', 'Relocation', 'Terminate', 'BOD');
CREATE TYPE service_type AS ENUM ('Metro', 'Dedicated', 'Broadband', 'Wireless', 'VPN IP', 'Backbone');

-- 3. TABEL 1: MASTER CUSTOMER
CREATE TABLE master_customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) UNIQUE
);

-- 4. TABEL 2: MASTER PARTNERS
CREATE TABLE master_partners (
    partner_id SERIAL PRIMARY KEY,
    partner_name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    account_manager VARCHAR(255),
    phone_number NUMERIC DEFAULT 0,
    office_address VARCHAR(255)
);

-- 5. TABEL 3: LINK DETAIL (Direktori Utama)
CREATE TABLE link_detail (
    id SERIAL PRIMARY KEY,
    created_at DATE,
    customer_id INT REFERENCES master_customers(customer_id),
    customer_site VARCHAR(255),
    service_id VARCHAR(100), 
    partner_id INT REFERENCES master_partners(partner_id),
    circuit_id VARCHAR(100),
    project project_type,
    sales_order VARCHAR(255),
    service VARCHAR(255),
    service_category service_type,
    detail_wo VARCHAR(255),
    sales VARCHAR(255),
    status_link VARCHAR(255),
    monthly_cost NUMERIC DEFAULT 0,
    installation_cost NUMERIC DEFAULT 0,
    ikg_cost NUMERIC DEFAULT 0,
    contract_periode NUMERIC DEFAULT 1,
    contract_start DATE,
    notes VARCHAR(255)
);


-- 6. TABEL 4: PROVISIONING TASKS (Ruang Tunggu)
CREATE TABLE provisioning_tasks (
    task_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES master_customers(customer_id),
    partner_id INT REFERENCES master_partners(partner_id),
    customer_site VARCHAR(255),
    service_id VARCHAR(100),
    circuit_id VARCHAR(100),
    project project_type,
    service VARCHAR(255),
    service_category service_type,
    detail_wo VARCHAR(255),
    sales VARCHAR(255),
    monthly_cost NUMERIC DEFAULT 0,
    sales_order VARCHAR(255),
    installation_cost NUMERIC DEFAULT 0,
    ikg_cost NUMERIC DEFAULT 0,
    contract_periode NUMERIC DEFAULT 1,
    contract_start DATE,
    notes VARCHAR(255),
    progres_lapangan VARCHAR(255) DEFAULT 'On Progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
