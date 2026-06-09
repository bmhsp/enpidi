-- 1. KOSONGKAN TABEL (Biar bersih dari sisa eksperimen sebelumnya)
TRUNCATE TABLE link_detail, master_partners, master_customers RESTART IDENTITY CASCADE;

-- 2. INSERT 25 MASTER CUSTOMERS
INSERT INTO master_customers (customer_name) VALUES 
('PT Lintas Logistik Nasional'), ('Bank Semesta Raya'), ('PT Artha Gemilang'), 
('Koperasi Maju Jaya'), ('PT Solusi Digital Teknologi'), ('RS Medika Sejahtera'), 
('Universitas Nusantara'), ('Hotel Grand Sentosa'), ('PT Energi Terbarukan'), 
('CV Sinar Makmur'), ('PT Global Retailindo'), ('Bank Pembangunan Daerah'), 
('PT Media Kreasi'), ('Klinik Sehat Bersama'), ('Yayasan Pendidikan Bangsa'), 
('PT Agro Sentosa Utama'), ('Kawan Lama Sejahtera'), ('PT Auto Modern Makmur'), 
('PT Surya Food Beverage'), ('PT Eka Property Indah'), ('PT Bintang Fajar'),
('RS Kasih Ibu'), ('PT Tambang Makmur'), ('Hotel Mutiara Selatan'), ('PT Logam Baja Prima');

-- 3. INSERT 15 MASTER PARTNERS
INSERT INTO master_partners (partner_name, email, account_manager, phone_number) VALUES 
('PT Telkom Indonesia', 'b2b@telkom.co.id', 'Budi Santoso', 08111234567),
('Biznet Networks', 'enterprise@biznetnetworks.com', 'Siska Amelia', 08112233445),
('Lintas Data Artha', 'info@lintasdata.com', 'Andi Pratama', 08123344556),
('Nusantara Network', 'sales@nusantaranet.co.id', 'Dimas Anggara', 08134455667),
('Moratelindo', 'corporate@moratelindo.co.id', 'Reza Pahlevi', 08145566778),
('MyRepublic Enterprise', 'enterprise@myrepublic.net.id', 'Diana Fitri', 08156677889),
('CBN Enterprise', 'corporate@cbn.net.id', 'Fajar Ramadhan', 08167788990),
('Indosat Ooredoo Hutchison', 'business@ioh.co.id', 'Citra Dewi', 08178899001),
('XL Axiata Business', 'b2b@xl.co.id', 'Hendra Kusuma', 08189900112),
('FiberStar', 'info@fiberstar.co.id', 'Rina Kartika', 08190011223),
('Icon Plus', 'sales@iconpln.co.id', 'Doni Hermawan', 08201122334),
('First Media Business', 'corporate@firstmedia.com', 'Kevin Sanjaya', 08212233445),
('Oxygen.id', 'enterprise@oxygen.id', 'Sarah Wijaya', 08223344556),
('Bali Fiber', 'info@balifiber.id', 'Bagus Putra', 08234455667),
('LinkNet Enterprise', 'sales@linknet.co.id', 'Nadia Safira', 08245566778);

-- 4. INSERT 50 LINK DETAIL (Desember 2025 - Mei 2026)
INSERT INTO link_detail 
(created_at, customer_id, customer_site, service_id, partner_id, circuit_id, project, sales_order, service, service_category, detail_wo, sales, status_link, monthly_cost, installation_cost, ikg_cost, contract_periode, contract_start, notes) 
VALUES 
-- Batch Desember 2025
('2025-12-01', 1, 'Jakarta Selatan (HQ)', 'SRV-1001', 1, 'CID-TLK-01', 'Activation', 'SO-2512-001', '100 Mbps', 'Metro', 'WO-Instalasi', 'Rizal', 'ONLINE', 15000000, 2500000, 0, 12, '2025-12-05', 'Kabel OSP ditarik dari tiang depan'),
('2025-12-05', 2, 'Surabaya (Branch)', 'SRV-1002', 2, 'CID-BIZ-01', 'Activation', 'SO-2512-002', '50 Mbps', 'Dedicated', 'WO-Tarik Kabel', 'Fanny', 'ONLINE', 8500000, 1500000, 500000, 12, '2025-12-10', 'IKG masuk lewat basement'),
('2025-12-12', 3, 'Bandung (Factory)', 'SRV-1003', 3, 'CID-LDA-01', 'Activation', 'SO-2512-003', '20 Mbps', 'VPN IP', 'WO-Setting Router', 'Rizal', 'ONLINE', 5500000, 1000000, 0, 24, '2025-12-15', 'Router disediakan partner'),
('2025-12-18', 4, 'Medan (Office)', 'SRV-1004', 4, 'CID-NUS-01', 'Activation', 'SO-2512-004', '10 Mbps', 'Wireless', 'WO-Pasang Antena', 'Tomy', 'ONLINE', 4000000, 3000000, 0, 12, '2025-12-20', 'Pemasangan tiang monopole'),
('2025-12-22', 5, 'Makassar (Data Center)', 'SRV-1005', 5, 'CID-MRT-01', 'Activation', 'SO-2512-005', '1 Gbps', 'Metro', 'WO-Cross Connect', 'Fanny', 'ONLINE', 35000000, 5000000, 2000000, 36, '2026-01-01', 'Colocation setup'),

-- Batch Januari 2026
('2026-01-05', 6, 'Semarang (Clinic)', 'SRV-1006', 6, 'CID-MYR-01', 'Activation', 'SO-2601-001', '100 Mbps', 'Broadband', 'WO-Instalasi Baru', 'Tomy', 'ONLINE', 2500000, 500000, 0, 12, '2026-01-08', 'Untuk wifi tamu'),
('2026-01-08', 7, 'Yogyakarta (Campus)', 'SRV-1007', 7, 'CID-CBN-01', 'Activation', 'SO-2601-002', '500 Mbps', 'Dedicated', 'WO-Trial 1 Bulan', 'Rizal', 'ONLINE', 0, 0, 0, 1, '2026-01-10', 'Masa trial POC'),
('2026-01-12', 8, 'Bali (Resort)', 'SRV-1008', 8, 'CID-IOH-01', 'Activation', 'SO-2601-003', '200 Mbps', 'Dedicated', 'WO-Tarik Fiber', 'Fanny', 'ONLINE', 18000000, 4000000, 1500000, 24, '2026-01-15', 'FO jalur bawah tanah'),
('2026-01-15', 9, 'Palembang (Plant)', 'SRV-1009', 9, 'CID-XLA-01', 'Activation', 'SO-2601-004', '30 Mbps', 'VPN IP', 'WO-Setting Mikrotik', 'Tomy', 'ONLINE', 7500000, 1500000, 0, 12, '2026-01-18', 'Koneksi ke sistem ERP pusat'),
('2026-01-20', 10, 'Balikpapan (Warehouse)', 'SRV-1010', 10, 'CID-FBS-01', 'Activation', 'SO-2601-005', '50 Mbps', 'Metro', 'WO-Instalasi', 'Rizal', 'ONLINE', 9000000, 2000000, 500000, 12, '2026-01-25', 'Jaringan CCTV'),
('2026-01-25', 11, 'Jakarta Pusat (Mall)', 'SRV-1011', 11, 'CID-ICN-01', 'Activation', 'SO-2601-006', '100 Mbps', 'Dedicated', 'WO-Aktivasi', 'Fanny', 'ONLINE', 14000000, 2500000, 1000000, 24, '2026-01-28', 'Backup link existing'),

-- Batch Februari 2026
('2026-02-02', 12, 'Bogor (Branch)', 'SRV-1012', 12, 'CID-FMB-01', 'Activation', 'SO-2602-001', '50 Mbps', 'Broadband', 'WO-Kabel Fiber', 'Tomy', 'ONLINE', 1500000, 500000, 0, 12, '2026-02-05', 'Standard operasional'),
('2026-02-05', 13, 'Tangerang (Studio)', 'SRV-1013', 13, 'CID-OXY-01', 'Activation', 'SO-2602-002', '300 Mbps', 'Dedicated', 'WO-Instalasi', 'Rizal', 'ONLINE', 22000000, 3000000, 0, 12, '2026-02-10', 'Kebutuhan streaming'),
('2026-02-10', 14, 'Depok (Clinic)', 'SRV-1014', 14, 'CID-BLF-01', 'Activation', 'SO-2602-003', '20 Mbps', 'VPN IP', 'WO-Setting Jaringan', 'Fanny', 'ONLINE', 4500000, 1000000, 0, 12, '2026-02-15', 'Akses SIMRS terpusat'),
('2026-02-14', 15, 'Jakarta Utara (School)', 'SRV-1015', 15, 'CID-LNK-01', 'Activation', 'SO-2602-004', '150 Mbps', 'Broadband', 'WO-Aktivasi Baru', 'Tomy', 'ONLINE', 3500000, 1000000, 0, 12, '2026-02-20', 'Jaringan lab komputer'),
('2026-02-18', 16, 'Bekasi (Plant)', 'SRV-1016', 1, 'CID-TLK-02', 'Activation', 'SO-2602-005', '100 Mbps', 'Metro', 'WO-Instalasi Baru', 'Rizal', 'ONLINE', 15500000, 2500000, 500000, 24, '2026-02-22', 'Core network'),
('2026-02-22', 17, 'Jakarta Barat (Store)', 'SRV-1017', 2, 'CID-BIZ-02', 'Activation', 'SO-2602-006', '50 Mbps', 'VPN IP', 'WO-Router 4G', 'Fanny', 'ONLINE', 8500000, 1500000, 0, 12, '2026-02-25', 'Jaringan kasir/POS'),
('2026-02-25', 18, 'Karawang (Dealer)', 'SRV-1018', 3, 'CID-LDA-02', 'Upgrade', 'SO-2602-007', '100 Mbps', 'Dedicated', 'WO-Upgrade Bandwidth', 'Tomy', 'ONLINE', 12000000, 0, 0, 12, '2026-03-01', 'Upgrade dari 50Mbps'),
('2026-02-28', 19, 'Cikarang (Factory)', 'SRV-1019', 4, 'CID-NUS-02', 'Activation', 'SO-2602-008', '20 Mbps', 'Wireless', 'WO-Pointing Radio', 'Rizal', 'ISOLIR', 5000000, 3000000, 0, 12, '2026-03-05', 'Kendala power di site'),

-- Batch Maret 2026
('2026-03-02', 20, 'Jakarta Selatan (Apartment)', 'SRV-1020', 5, 'CID-MRT-02', 'Relocation', 'SO-2603-001', '100 Mbps', 'Metro', 'WO-Pindah Lantai', 'Fanny', 'ONLINE', 15000000, 1500000, 500000, 12, '2026-03-05', 'Relokasi ke lt 15'),
('2026-03-05', 21, 'Batam (Port)', 'SRV-1021', 6, 'CID-MYR-02', 'Activation', 'SO-2603-002', '500 Mbps', 'Dedicated', 'WO-Tarik Fiber', 'Tomy', 'ONLINE', 28000000, 5000000, 1000000, 36, '2026-03-10', 'Operasional pelabuhan'),
('2026-03-08', 22, 'Banjarmasin (Branch)', 'SRV-1022', 7, 'CID-CBN-02', 'Downgrade', 'SO-2603-003', '20 Mbps', 'Dedicated', 'WO-Downgrade Link', 'Rizal', 'ONLINE', 6000000, 0, 0, 12, '2026-03-12', 'Penyesuaian budget'),
('2026-03-12', 23, 'Pekanbaru (Office)', 'SRV-1023', 8, 'CID-IOH-02', 'Activation', 'SO-2603-004', '50 Mbps', 'VPN IP', 'WO-Aktivasi', 'Fanny', 'ONLINE', 9500000, 2000000, 0, 24, '2026-03-15', 'Link redundant'),
('2026-03-15', 24, 'Manado (Retail)', 'SRV-1024', 9, 'CID-XLA-02', 'Activation', 'SO-2603-005', '10 Mbps', 'Wireless', 'WO-Pasang CPE', 'Tomy', 'ONLINE', 0, 1000000, 0, 1, '2026-03-18', 'Testing sinyal'),
('2026-03-18', 25, 'Cirebon (Warehouse)', 'SRV-1025', 10, 'CID-FBS-02', 'Activation', 'SO-2603-006', '50 Mbps', 'Broadband', 'WO-Instalasi Baru', 'Rizal', 'ONLINE', 2500000, 500000, 0, 12, '2026-03-22', 'Keperluan absen & admin'),
('2026-03-21', 1, 'Tasikmalaya (Clinic)', 'SRV-1026', 11, 'CID-ICN-02', 'Activation', 'SO-2603-007', '20 Mbps', 'VPN IP', 'WO-Aktivasi Jaringan', 'Fanny', 'ONLINE', 5000000, 1000000, 0, 12, '2026-03-25', 'VPN ke server pusat'),
('2026-03-25', 2, 'Jambi (Campus)', 'SRV-1027', 12, 'CID-FMB-02', 'Activation', 'SO-2603-008', '100 Mbps', 'Dedicated', 'WO-Tarik Kabel', 'Tomy', 'ONLINE', 13500000, 2500000, 500000, 24, '2026-03-28', 'Fasilitas e-learning'),
('2026-03-28', 3, 'Lombok (Resort)', 'SRV-1028', 13, 'CID-OXY-02', 'Activation', 'SO-2603-009', '200 Mbps', 'Dedicated', 'WO-Instalasi FO', 'Rizal', 'ONLINE', 21000000, 4000000, 1000000, 24, '2026-04-01', 'Jaringan kamar hotel'),
('2026-03-30', 4, 'Jakarta Pusat (Monas)', 'SRV-1029', 14, 'CID-BLF-02', 'BOD', 'SO-2603-010', '1 Gbps', 'Metro', 'WO-BOD Event', 'Fanny', 'ONLINE', 15000000, 0, 0, 1, '2026-04-02', 'Kebutuhan event 1 bulan'),

-- Batch April 2026
('2026-04-02', 5, 'Samarinda (Office)', 'SRV-1030', 15, 'CID-LNK-02', 'Terminate', 'SO-2604-001', '50 Mbps', 'Broadband', 'WO-Cabut Perangkat', 'Tomy', 'OFFLINE', 0, 0, 0, 0, '2026-04-05', 'Kantor tutup cabang'),
('2026-04-05', 6, 'Padang (Branch)', 'SRV-1031', 1, 'CID-TLK-03', 'Activation', 'SO-2604-002', '30 Mbps', 'VPN IP', 'WO-Aktivasi', 'Rizal', 'ONLINE', 6500000, 1500000, 0, 12, '2026-04-08', 'Koneksi standard'),
('2026-04-08', 7, 'Bengkulu (Plant)', 'SRV-1032', 2, 'CID-BIZ-03', 'Activation', 'SO-2604-003', '10 Mbps', 'Wireless', 'WO-Pointing Antena', 'Fanny', 'ONLINE', 4500000, 2500000, 0, 12, '2026-04-12', 'Backup via radio'),
('2026-04-10', 8, 'Palu (Warehouse)', 'SRV-1033', 3, 'CID-LDA-03', 'Activation', 'SO-2604-004', '100 Mbps', 'Metro', 'WO-Instalasi', 'Tomy', 'ONLINE', 16000000, 3000000, 1000000, 24, '2026-04-15', 'Tarik kabel 2KM'),
('2026-04-14', 9, 'Kendari (Store)', 'SRV-1034', 4, 'CID-NUS-03', 'Activation', 'SO-2604-005', '20 Mbps', 'Broadband', 'WO-Aktivasi Baru', 'Rizal', 'ONLINE', 1800000, 500000, 0, 12, '2026-04-18', 'POS system'),
('2026-04-18', 10, 'Ambon (Port)', 'SRV-1035', 5, 'CID-MRT-03', 'Upgrade', 'SO-2604-006', '200 Mbps', 'Dedicated', 'WO-Upgrade Kapasitas', 'Fanny', 'ONLINE', 25000000, 0, 0, 24, '2026-04-20', 'Upgrade bandwidth'),
('2026-04-22', 11, 'Jayapura (Clinic)', 'SRV-1036', 6, 'CID-MYR-03', 'Activation', 'SO-2604-007', '50 Mbps', 'VPN IP', 'WO-Setting Mikrotik', 'Tomy', 'ONLINE', 12000000, 2000000, 0, 12, '2026-04-25', 'Via VSAT/Fiber hybrid'),
('2026-04-25', 12, 'Sorong (Factory)', 'SRV-1037', 7, 'CID-CBN-03', 'Activation', 'SO-2604-008', '100 Mbps', 'Metro', 'WO-Instalasi', 'Rizal', 'ISOLIR', 18000000, 4000000, 0, 12, '2026-04-28', 'Telat bayar billing'),
('2026-04-28', 13, 'Ternate (Branch)', 'SRV-1038', 8, 'CID-IOH-03', 'Activation', 'SO-2604-009', '20 Mbps', 'Wireless', 'WO-Instalasi Radio', 'Fanny', 'ONLINE', 5500000, 2500000, 0, 12, '2026-05-02', 'Area remote'),
('2026-04-30', 14, 'Tarakan (Site)', 'SRV-1039', 9, 'CID-XLA-03', 'Activation', 'SO-2604-010', '50 Mbps', 'Dedicated', 'WO-Tarik FO', 'Tomy', 'ONLINE', 14500000, 3000000, 500000, 24, '2026-05-05', 'Jaringan tambang'),

-- Batch Mei 2026 (Update Terbaru)
('2026-05-02', 15, 'Gorontalo (Office)', 'SRV-1040', 10, 'CID-FBS-03', 'Activation', 'SO-2605-001', '100 Mbps', 'Metro', 'WO-Instalasi FO', 'Rizal', 'ONLINE', 15500000, 2500000, 0, 12, '2026-05-08', 'Main link office'),
('2026-05-05', 16, 'Manokwari (Store)', 'SRV-1041', 11, 'CID-ICN-03', 'Activation', 'SO-2605-002', '30 Mbps', 'Broadband', 'WO-Aktivasi', 'Fanny', 'ONLINE', 2500000, 500000, 0, 12, '2026-05-10', 'Standard operasional'),
('2026-05-08', 17, 'Bontang (Plant)', 'SRV-1042', 12, 'CID-FMB-03', 'Relocation', 'SO-2605-003', '50 Mbps', 'VPN IP', 'WO-Pindah Gedung', 'Tomy', 'ONLINE', 8500000, 2000000, 500000, 12, '2026-05-12', 'Pindah ke area utara'),
('2026-05-10', 18, 'Kupang (Warehouse)', 'SRV-1043', 13, 'CID-OXY-03', 'Activation', 'SO-2605-004', '20 Mbps', 'Wireless', 'WO-Pointing', 'Rizal', 'ONLINE', 4500000, 2500000, 0, 12, '2026-05-15', 'Solusi sementara FO putus'),
('2026-05-12', 19, 'Denpasar (HQ)', 'SRV-1044', 14, 'CID-BLF-03', 'Upgrade', 'SO-2605-005', '300 Mbps', 'Dedicated', 'WO-Upgrade FO', 'Fanny', 'ONLINE', 21000000, 0, 0, 24, '2026-05-18', 'Kebutuhan data center'),
('2026-05-15', 20, 'Mataram (Clinic)', 'SRV-1045', 15, 'CID-LNK-03', 'Activation', 'SO-2605-006', '50 Mbps', 'VPN IP', 'WO-Setting Mikrotik', 'Tomy', 'ONLINE', 7500000, 1500000, 0, 12, '2026-05-20', 'Link medis aman'),
('2026-05-18', 21, 'Banyuwangi (Port)', 'SRV-1046', 1, 'CID-TLK-04', 'Activation', 'SO-2605-007', '100 Mbps', 'Metro', 'WO-Instalasi Baru', 'Rizal', 'ONLINE', 16500000, 3000000, 1000000, 24, '2026-05-22', 'CCTV Pelabuhan'),
('2026-05-20', 22, 'Cilegon (Factory)', 'SRV-1047', 2, 'CID-BIZ-04', 'Activation', 'SO-2605-008', '200 Mbps', 'Dedicated', 'WO-Tarik Fiber', 'Fanny', 'ONLINE', 19000000, 3500000, 0, 12, '2026-05-25', 'Jalur masuk lewat IKG pabrik'),
('2026-05-22', 23, 'Serang (Office)', 'SRV-1048', 3, 'CID-LDA-04', 'Activation', 'SO-2605-009', '50 Mbps', 'Broadband', 'WO-Trial 2 Minggu', 'Tomy', 'ONLINE', 0, 500000, 0, 1, '2026-05-25', 'POC untuk tender'),
('2026-05-25', 24, 'Surakarta (Campus)', 'SRV-1049', 4, 'CID-NUS-04', 'Activation', 'SO-2605-010', '1 Gbps', 'Dedicated', 'WO-Cross Connect', 'Rizal', 'ONLINE', 45000000, 5000000, 2000000, 36, '2026-05-28', 'Jaringan antar rektorat');