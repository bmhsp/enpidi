const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
    user: 'postgres',
    password: 'Byuu2003#',
    host: 'localhost',
    port: 5432,
    database: 'db_partners'
});


// ====================================================================================
// API AMBIL DATA CUSTOMER & PARTNER UNTUK DROPDOWN (DATA EXISTING) + RENDER PARTNERS
// ====================================================================================
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM master_customers ORDER BY customer_name ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Gagal muat customer' }); }
});
app.get('/api/partners', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.partner_id, 
                p.partner_name, 
                p.account_manager, 
                p.email, 
                p.phone_number,

                COUNT(DISTINCT s.service_id) AS total_sites,
                COALESCE(SUM(s.monthly_cost), 0) AS total_expense,

                (
                    SELECT service_category 
                    FROM link_detail ld
                    WHERE ld.partner_id = p.partner_id
                    GROUP BY service_category
                    ORDER BY COUNT(service_category) DESC
                    LIMIT 1
                ) AS top_service_type

            FROM master_partners p
            LEFT JOIN link_detail s ON p.partner_id = s.partner_id
            GROUP BY p.partner_id, p.partner_name, p.account_manager, p.email, p.phone_number
            ORDER BY p.partner_name ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { 
        console.error('Error muat partner:', err);
        res.status(500).json({ error: 'Gagal muat partner' }); 
    }
});


// =========================================================================
// API DASHBOARD - STATISTIK KARTU ATAS (BULAN BERJALAN)
// =========================================================================
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const totalLink = await pool.query(`SELECT COUNT(*) FROM link_detail WHERE status_link = 'ONLINE'`);
        const progressLink = await pool.query(`SELECT COUNT(*) FROM provisioning_tasks`);
        
        // Ngitung dari tanggal 1 bulan ini sampai detik ini
        const newSite = await pool.query(`
            SELECT COUNT(*) FROM link_detail 
            WHERE project = 'Activation' 
            AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        `);
        
        const terminatedMonth = await pool.query(`
            SELECT COUNT(*) FROM link_detail 
            WHERE status_link = 'TERMINATED' 
            AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        `);

        res.json({
            total_link: parseInt(totalLink.rows[0].count) || 0,
            progress_link: parseInt(progressLink.rows[0].count) || 0,
            new_site: parseInt(newSite.rows[0].count) || 0,
            terminated_month: parseInt(terminatedMonth.rows[0].count) || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal muat statistik' });
    }
});


// =========================================================================
// API DASHBOARD - GRAFIK PERBANDINGAN (TAHUN BERJALAN: JAN - DES)
// =========================================================================
app.get('/api/dashboard/chart-comparison', async (req, res) => {
    try {
        const query = `
            SELECT 
                TO_CHAR(d.month, 'Mon') as month_name,
                -- 🔥 Tambahin ::text biar PostgreSQL nggak ngambek pas di-ILIKE
                COUNT(l.id) FILTER (WHERE l.status_link::text ILIKE 'online' OR l.project::text ILIKE 'activation') as online_count,
                COUNT(l.id) FILTER (WHERE l.status_link::text ILIKE 'terminated' OR l.project::text ILIKE 'terminate') as terminated_count
            FROM (
                SELECT generate_series(
                    date_trunc('year', CURRENT_DATE),
                    date_trunc('year', CURRENT_DATE) + INTERVAL '11 months',
                    '1 month'
                ) as month
            ) d
            LEFT JOIN link_detail l ON date_trunc('month', l.created_at) = d.month
            GROUP BY d.month
            ORDER BY d.month;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error get chart data:', err);
        res.status(500).json({ error: 'Gagal muat data chart' });
    }
});


// =========================================================================
// API DASHBOARD - TOP PARTNER BERDASARKAN CASH OUTFLOW
// =========================================================================
app.get('/api/dashboard/top-partners', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.partner_name, 
                p.account_manager, 
                SUM(l.monthly_cost) as total_expense 
            FROM link_detail l
            JOIN master_partners p ON l.partner_id::varchar = p.partner_id::varchar
            -- 🔥 Tambahin ::text di sini juga
            WHERE l.status_link::text ILIKE 'online' 
            GROUP BY p.partner_name, p.account_manager 
            ORDER BY total_expense DESC 
            LIMIT 5
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error get top partners:', err);
        res.status(500).json({ error: 'Gagal muat data top partner' });
    }
});
// =========================================================================
// API DASHBOARD - GRAFIK TREN PENGELUARAN (AREA CHART)
// =========================================================================
app.get('/api/dashboard/chart-trend', async (req, res) => {
    try {
        // Narik total pengeluaran link baru per bulan selama 12 bulan terakhir
        const query = `
            SELECT 
                TO_CHAR(date_trunc('month', created_at), 'Mon') as month_short,
                SUM(monthly_cost) as total_outflow
            FROM link_detail
            WHERE status_link = 'ONLINE'
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at) ASC
            LIMIT 12;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error get chart trend:', err);
        res.status(500).json({ error: 'Gagal muat tren' });
    }
});


// ==========================================================================================
// API DASHBOARD - STATISTIK KARTU (TOTAL LINK, PROGRESS LINK, NEW SITE, CASH OUTFLOW)
// ==========================================================================================
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const totalLink = await pool.query(`SELECT COUNT(*) FROM link_detail WHERE status_link = 'ONLINE'`);
        const progressLink = await pool.query(`SELECT COUNT(*) FROM provisioning_tasks`);
        const newSite = await pool.query(`SELECT COUNT(*) FROM link_detail WHERE project = 'Activation' AND created_at >= CURRENT_DATE - INTERVAL '1 month'`);
        
        // Ini yang bikin Rp 0 kalau belum ditambahin:
        const cashOutflow = await pool.query(`SELECT SUM(monthly_cost) as total_outflow FROM link_detail WHERE status_link = 'ONLINE'`);

        res.json({
            total_link: parseInt(totalLink.rows[0].count) || 0,
            progress_link: parseInt(progressLink.rows[0].count) || 0,
            new_site: parseInt(newSite.rows[0].count) || 0,
            cash_outflow: parseFloat(cashOutflow.rows[0].total_outflow) || 0 // Harus ngirim ini!
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal muat statistik' });
    }
});



// ====================================================================
// ======== API PROVISIONING - TRACKER (STAGING AREA) =================
// ====================================================================
// 1. Tarik Data dari Ruang Tunggu
app.get('/api/provisioning', async (req, res) => {
    try {
        const query = `
            SELECT 
                pt.*,
                c.customer_name, 
                p.partner_name 
            FROM provisioning_tasks pt
            LEFT JOIN master_customers c ON pt.customer_id = c.customer_id
            LEFT JOIN master_partners p ON pt.partner_id = p.partner_id
            ORDER BY pt.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error load provisioning:', err);
        res.status(500).json({ error: 'Gagal memuat data' });
    }
});


// =============================================================
// API PROVISIONING - TARIK DETAIL 1 DATA PROVISIONING
// =============================================================
app.get('/api/provisioning/:id', async (req, res) => {
    try {
        const query = `
            SELECT pt.*, c.customer_name, p.partner_name 
            FROM provisioning_tasks pt
            LEFT JOIN master_customers c ON pt.customer_id = c.customer_id
            LEFT JOIN master_partners p ON pt.partner_id = p.partner_id
            WHERE pt.task_id = $1
        `;
        const result = await pool.query(query, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error get detail provisioning:', err);
        res.status(500).json({ error: 'Gagal memuat detail' });
    }
});

// ===============================================
// API PROVISIONING - UPDATE PROGRESS LAPANGAN 
// ===============================================
app.put('/api/provisioning/:id/progress', async (req, res) => {
    try {
        const { progres_lapangan } = req.body;
        await pool.query('UPDATE provisioning_tasks SET progres_lapangan = $1 WHERE task_id = $2', [progres_lapangan, req.params.id]);
        res.json({ message: 'Progress berhasil diupdate!' });
    } catch (err) {
        console.error('Error update progress:', err);
        res.status(500).json({ error: 'Gagal update progress' });
    }
});


// =====================================================================================================
// API PROVISIONING - SIMPAN ORDER BARU (CUSTOMER/PARTNER BISA PILIH YANG LAMA ATAU TAMBAH YANG BARU)
// ======================================================================================================
app.post('/api/provisioning', async (req, res) => {
    try {
        const d = req.body;
        
        // 1. LOGIKA CUSTOMER (Cari atau Bikin Baru)
        let custId;
        const checkCust = await pool.query('SELECT customer_id FROM master_customers WHERE UPPER(customer_name) = UPPER($1)', [d.customer_name]);
        if (checkCust.rows.length > 0) {
            custId = checkCust.rows[0].customer_id; // Kalau udah ada, ambil ID-nya
        } else {
            // Kalau belum ada, bikin baru!
            const newCust = await pool.query('INSERT INTO master_customers (customer_name) VALUES ($1) RETURNING customer_id', [d.customer_name]);
            custId = newCust.rows[0].customer_id;
        }

        // 2. LOGIKA PARTNER (Cari atau Bikin Baru)
        let partId;
        const checkPart = await pool.query('SELECT partner_id FROM master_partners WHERE UPPER(partner_name) = UPPER($1)', [d.partner_name]);
        if (checkPart.rows.length > 0) {
            partId = checkPart.rows[0].partner_id;
        } else {
            const newPart = await pool.query('INSERT INTO master_partners (partner_name) VALUES ($1) RETURNING partner_id', [d.partner_name]);
            partId = newPart.rows[0].partner_id;
        }

        // 3. MASUKIN KE TABEL PROVISIONING
        const query = `
            INSERT INTO provisioning_tasks (
                customer_id, partner_id, customer_site, service_id, circuit_id, 
                project, service, service_category, detail_wo, sales, 
                monthly_cost, sales_order, installation_cost, ikg_cost, 
                contract_periode, contract_start, notes, progres_lapangan
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'Menunggu Jadwal'
            )
        `;
        const val = [
            custId, partId, d.customer_site, d.service_id, d.circuit_id,
            d.project, d.service, d.service_category, d.detail_wo, d.sales,
            d.monthly_cost, d.sales_order, d.installation_cost, d.ikg_cost,
            d.contract_periode, d.contract_start || null, d.notes
        ];
        
        await pool.query(query, val);
        res.json({ message: 'Order berhasil ditambahkan!' });
        
    } catch (err) {
        console.error('Error insert provisioning:', err);
        res.status(500).json({ error: 'Gagal menambah order' });
    }
});


// ===============================================================================
// API PROVISIONING - MESIN TELEPORTASI (Klik DONE -> Masuk Direktori Utama)
// ===============================================================================
app.post('/api/provisioning/:id/complete', async (req, res) => {
    const taskId = req.params.id;
    try {
        const getTask = await pool.query('SELECT * FROM provisioning_tasks WHERE task_id = $1', [taskId]);
        if (getTask.rows.length === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
        const t = getTask.rows[0];

        // Lempar SEMUA datanya ke link_detail
        const insertQuery = `
            INSERT INTO link_detail (
                created_at, customer_id, customer_site, service_id, partner_id, 
                circuit_id, project, service, service_category, detail_wo, 
                sales, status_link, monthly_cost, sales_order, installation_cost, 
                ikg_cost, contract_periode, contract_start, notes
            ) VALUES (
                CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ONLINE', $11, $12, $13, $14, $15, $16, $17
            )
        `;
        await pool.query(insertQuery, [
            t.customer_id, t.customer_site, t.service_id, t.partner_id, t.circuit_id, 
            t.project, t.service, t.service_category, t.detail_wo, t.sales, 
            t.monthly_cost, t.sales_order, t.installation_cost, t.ikg_cost, 
            t.contract_periode, t.contract_start, t.notes
        ]);

        await pool.query('DELETE FROM provisioning_tasks WHERE task_id = $1', [taskId]);
        res.json({ message: 'BOOM! Data lengkap berhasil dilempar ke Direktori Utama!' });
    } catch (err) {
        console.error('Error complete task:', err);
        res.status(500).json({ error: 'Gagal memproses penyelesaian task' });
    }
});


// =======================================================================
// ======== API DIREKTORI - TAMBAH DATA SITE / LINK BARU =================
// ======================================================================
app.post('/api/service-links', async (req, res) => {
    try {
        const d = req.body;
        
        // 1. LOGIKA CUSTOMER (Cari atau Bikin Baru)
        let custId;
        if (d.customer_id && !isNaN(d.customer_id)) {
            custId = d.customer_id;
        } else {
            // Kalau isinya huruf, kita tangkap namanya
            const custName = d.customer_name || d.customer_id;
            
            // 🛡️ TAMENG: Kalau nama customer tetep kosong, tolak mentah-mentah!
            if (!custName) throw new Error("WADUH! Nama/ID Customer kosong dari frontend!");

            const checkCust = await pool.query('SELECT customer_id FROM master_customers WHERE UPPER(customer_name) = UPPER($1)', [custName]);
            if (checkCust.rows.length > 0) {
                custId = checkCust.rows[0].customer_id; 
            } else {
                const newCust = await pool.query('INSERT INTO master_customers (customer_name) VALUES ($1) RETURNING customer_id', [custName]);
                custId = newCust.rows[0].customer_id;
            }
        }

        // 2. LOGIKA PARTNER (Cari atau Bikin Baru)
        let partId;
        if (d.partner_id && !isNaN(d.partner_id)) {
            partId = d.partner_id;
        } else {
            // Kalau isinya huruf, kita tangkap namanya
            const partName = d.partner_name || d.partner_id;

            // 🛡️ TAMENG: Kalau nama partner tetep kosong, tolak!
            if (!partName) throw new Error("WADUH! Nama/ID Partner kosong dari frontend!");

            const checkPart = await pool.query('SELECT partner_id FROM master_partners WHERE UPPER(partner_name) = UPPER($1)', [partName]);
            if (checkPart.rows.length > 0) {
                partId = checkPart.rows[0].partner_id;
            } else {
                const newPart = await pool.query('INSERT INTO master_partners (partner_name) VALUES ($1) RETURNING partner_id', [partName]);
                partId = newPart.rows[0].partner_id;
            }
        }

        // 3. MASUKIN KE TABEL LINK_DETAIL
        const query = `
            INSERT INTO link_detail (
                customer_id, project, created_at, status_link, customer_site,
                service, service_category, sales_order, detail_wo, sales,
                partner_id, service_id, circuit_id, monthly_cost, installation_cost,
                ikg_cost, contract_periode, contract_start, notes
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
        `;
        
        // 🔥 INI FIX-NYA: Pakai custId dan partId yang udah kita proses di atas!
        const values = [
            custId, d.project, d.created_at, d.status_link, d.customer_site,
            d.service, d.service_category, d.sales_order, d.detail_wo, d.sales,
            partId, d.service_id, d.circuit_id, d.monthly_cost, d.installation_cost,
            d.ikg_cost, d.contract_periode, d.contract_start, d.notes
        ];
        
        await pool.query(query, values);
        res.json({ message: 'Direktori berhasil ditambahkan!' });
        
    } catch (err) {
        console.error('Error insert Direktori:', err);
        res.status(500).json({ error: 'Gagal menambah direktori' });
    }
});


// ===================================
// API DIREKTORI - LOGS & HISTORY 
// ===================================
// 1. Ambil List Direktori (Hanya nampilin status terbaru per service_id)
app.get('/api/direktori', async (req, res) => {
    try {
        const query = `
            WITH LatestLinks AS (
                SELECT sl.*, mc.customer_name, mp.partner_name,
                       ROW_NUMBER() OVER(PARTITION BY sl.service_id ORDER BY sl.id DESC) as rn
                FROM link_detail sl
                LEFT JOIN master_customers mc ON sl.customer_id = mc.customer_id
                LEFT JOIN master_partners mp ON sl.partner_id = mp.partner_id
            )
            SELECT * FROM LatestLinks 
            WHERE rn = 1 
            ORDER BY id DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal memuat list direktori' });
    }
});
// 2. Ambil Riwayat Lengkap 1 Service ID
app.get('/api/service-links/history/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const query = `
            SELECT sl.*, mc.customer_name, mp.partner_name
            FROM link_detail sl
            LEFT JOIN master_customers mc ON sl.customer_id = mc.customer_id
            LEFT JOIN master_partners mp ON sl.partner_id = mp.partner_id
            WHERE sl.service_id = $1
            ORDER BY sl.created_at DESC, sl.id DESC
        `;
        const result = await pool.query(query, [serviceId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Riwayat Service ID tidak ditemukan' });
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Gagal mengambil riwayat service' });
    }
});
// 3. Update Record Existing (Revisi typo/salah input pada record terakhir)
app.put('/api/service-links/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            customer_site, circuit_id, service, service_category,
            sales_order, detail_wo, sales, partner_id, 
            created_at, status_link,
            monthly_cost, installation_cost, ikg_cost, 
            contract_periode, contract_start, notes
        } = req.body;

        // Update SEMUA kolom spesifik berdasarkan ID baris tabel tersebut
        const query = `
            UPDATE link_detail 
            SET customer_site = $1, circuit_id = $2, service = $3, service_category = $4,
                sales_order = $5, detail_wo = $6, sales = $7, partner_id = $8, 
                created_at = $9, status_link = $10,
                monthly_cost = $11, installation_cost = $12, ikg_cost = $13,
                contract_periode = $14, contract_start = $15, notes = $16
            WHERE id = $17 RETURNING *
        `;
        
        const values = [
            customer_site, circuit_id, service, service_category,
            sales_order, detail_wo, sales, partner_id, 
            created_at, status_link,
            monthly_cost || 0, installation_cost || 0, ikg_cost || 0, 
            contract_periode || 12, contract_start || null, notes || '',
            id
        ];

        const result = await pool.query(query, values);

        res.json({ message: 'Data sukses direvisi!', data: result.rows[0] });
    } catch (err) {
        console.error('Error Update Link:', err.message);
        res.status(500).json({ error: 'Gagal mengupdate data' });
    }
});


// =========================================================================
// API DIREKTORI - TAMBAH HISTORY LIFECYCLE (Upgrade/Downgrade/Terminate/Full Update)
// =========================================================================
app.post('/api/service-links/:id/lifecycle', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Tangkap SEMUA lemparan dari Frontend
        const { 
            project, created_at, detail_wo, monthly_cost, status_link, 
            customer_site, partner_id, service, service_category,
            sales_order, sales, circuit_id, installation_cost, ikg_cost,
            contract_periode, contract_start, notes
        } = req.body;

        // Cuma butuh narik ID Customer & Service ID lama (karena ini gak boleh diubah)
        const oldData = await pool.query('SELECT customer_id, service_id FROM link_detail WHERE id = $1', [id]);
        if (oldData.rows.length === 0) return res.status(404).json({ error: 'Data lama tidak ditemukan' });
        const d = oldData.rows[0];

        const query = `
            INSERT INTO link_detail (
                created_at, customer_id, customer_site, service_id, partner_id, circuit_id,
                project, sales_order, service, service_category, detail_wo, sales,
                status_link, monthly_cost, installation_cost, ikg_cost, 
                contract_periode, contract_start, notes
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            ) RETURNING id
        `;
        
        // Susun rapi sesuai urutan VALUES
        const values = [
            created_at,             
            d.customer_id,          // Tetap pakai lama
            customer_site,          
            d.service_id,           // Tetap pakai lama
            partner_id,             
            circuit_id,           
            project,                
            sales_order,          
            service,              
            service_category,     
            detail_wo,              
            sales,                
            status_link,            
            monthly_cost,           
            installation_cost,    
            ikg_cost,             
            contract_periode,     
            contract_start,       
            notes                 
        ];

        await pool.query(query, values);
        res.json({ 
            message: 'Lifecycle project berhasil ditambahkan ke riwayat!',
            service_id: d.service_id 
        });
    } catch (err) {
        console.error('Error insert lifecycle:', err);
        res.status(500).json({ error: 'Gagal menambah riwayat project' });
    }
});


// =========================================================================
// API DIREKTORI - AMBIL 1 DATA LINK BERDASARKAN ID (PRIMARY KEY)
// =========================================================================
app.get('/api/service-links/id/:id', async (req, res) => {
    try {
        const query = `
            SELECT l.*, c.customer_name, p.partner_name 
            FROM link_detail l
            LEFT JOIN master_customers c ON l.customer_id = c.customer_id
            LEFT JOIN master_partners p ON l.partner_id = p.partner_id
            WHERE l.id = $1
        `;
        const result = await pool.query(query, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Data tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error tarik data link:', err);
        res.status(500).json({ error: 'Gagal tarik data link' });
    }
});


// =========================================================================
// ============ API PARTNERS - LIST SEMUA PARTNER ==========================
// =========================================================================
// API nya udah ada di paling atas bareng dropdown
// karena kita butuh data partner buat dropdown juga, jadi gak perlu bikin API terpisah lagi buat list partner.


// =========================================================================
// API PARTNERS - TAMBAH PARTNER BARU (POST)
// =========================================================================
app.post('/api/partners', async (req, res) => {
    try {
        // Nangkap 5 isian dari Frontend
        const { partner_name, email, account_manager, phone_number, office_address } = req.body;

        const query = `
            INSERT INTO master_partners (partner_name, email, account_manager, phone_number, office_address)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        
        // Cemplungin ke Database
        const values = [partner_name, email || null, account_manager || null, phone_number || null, office_address || null];
        const result = await pool.query(query, values);
        
        res.status(201).json({ message: 'Partner berhasil ditambahkan', data: result.rows[0] });
    } catch (err) {
        console.error('Error tambah partner:', err.message);
        res.status(500).json({ error: 'Gagal menambahkan partner' });
    }
});


// =========================================================================
// API PARTNERS - DATA DETAIL 1 PARTNER (Untuk Halaman Profil Partner)
// =========================================================================
app.get('/api/partners/detail/:name', async (req, res) => {
    const partnerName = req.params.name; 

    try {
        const query = `
            SELECT 
                mp.partner_id,
                mp.partner_name,
                mp.email,
                mp.account_manager,
                mp.phone_number,
                mp.office_address,

                -- HITUNG TOTAL SITE & TOTAL PENGELUARAN 
                COUNT(DISTINCT d.service_id) AS total_sites,
                COALESCE(SUM(d.monthly_cost), 0) AS total_expense,

                -- Hitung Service Type Paling Banyak Dipakai
                (
                    SELECT service_category 
                    FROM link_detail ld
                    WHERE ld.partner_id = mp.partner_id
                    GROUP BY service_category
                    ORDER BY COUNT(service_category) DESC
                    LIMIT 1
                ) AS top_service_type
                
            FROM master_partners mp
            LEFT JOIN link_detail d ON mp.partner_id = d.partner_id
            -- Pake TRIM dan LOWER biar kebal spasi dan huruf besar/kecil
            WHERE TRIM(LOWER(mp.partner_name)) = TRIM(LOWER($1))
            GROUP BY mp.partner_id, mp.partner_name, mp.email, mp.account_manager, mp.phone_number, mp.office_address
        `;
        
        const result = await pool.query(query, [partnerName]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "Partner tidak ditemukan" });
        }
    } catch (err) {
        console.error("Error dari API Detail Partner:", err);
        res.status(500).json({ error: "Gagal narik detail partner" });
    }
});


// =============================================================================
// API PARTNERS - GET DETAIL UNTUK CONNECTED CUSTOMERS DI PARTNERS DETAIL 
// =============================================================================
app.get('/api/circuit-detail/:service_id', async (req, res) => {
    try {
        const query = `
            SELECT 
                cd.*, 
                mc.customer_name,
                mp.partner_name
            FROM link_detail cd
            LEFT JOIN master_customers mc ON cd.customer_id = mc.customer_id
            LEFT JOIN master_partners mp ON cd.partner_id = mp.partner_id
            WHERE cd.service_id = $1
        `;
        const result = await pool.query(query, [req.params.service_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error circuit detail:', err.message);
        res.status(500).json({ error: 'Gagal mengambil detail circuit' });
    }
});


// =============================================================================
// API 8 PARTNERS - DETAIL PARTNER (GET SINGLE PARTNER UNTUK HEADER)
// =============================================================================
app.get('/api/partners/detail/:name', async (req, res) => {
    const partnerName = req.params.name;
    try {
        const query = `SELECT * FROM master_partners WHERE partner_name = $1`;
        const result = await pool.query(query, [partnerName]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error detail partner:', err.message);
        res.status(500).json({ error: 'Gagal mengambil detail partner' });
    }
});


// =============================================================================
// API PARTNERS - LIST CUSTOMER / SERVICE ID BERDASARKAN PARTNER (GET)
// =============================================================================
app.get('/api/partners/circuits/:name', async (req, res) => {
    const partnerName = req.params.name;
    try {
        const query = `
            SELECT DISTINCT ON (cd.service_id)
                mc.customer_name, 
                cd.customer_site,
                cd.service_id, 
                cd.service AS partner_service, 
                cd.service_category,
                cd.circuit_id, 
                cd.monthly_cost, 
                cd.status_link,
                cd.created_at
            FROM link_detail cd
            LEFT JOIN master_customers mc ON cd.customer_id = mc.customer_id
            LEFT JOIN master_partners mp ON cd.partner_id = mp.partner_id
            WHERE mp.partner_name = $1 
            ORDER BY cd.service_id, cd.created_at DESC
        `;
        const result = await pool.query(query, [partnerName]);
        
        // Urutkan ulang hasilnya di JS agar yang paling baru update ada di atas
        const sortedRows = result.rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.json(sortedRows);
    } catch (err) {
        console.error('🔥 Error SQL Circuits:', err.message);
        res.status(500).json({ error: err.message }); // Bawa pesan error ke HTML
    }
});


// ========================================================
// API PARTNERS - UPDATE DATA PARTNER (INLINE EDIT)
// ========================================================
app.put('/api/partners/:id', async (req, res) => {
    const partnerId = req.params.id;
    const { partner_name, email, account_manager, phone_number, office_address } = req.body;

    try {
        const query = `
            UPDATE master_partners 
            SET 
                partner_name = $1, 
                email = $2, 
                account_manager = $3, 
                phone_number = $4, 
                office_address = $5
            WHERE partner_id = $6
        `;
        
        const values = [partner_name, email, account_manager, phone_number, office_address, partnerId];
        await pool.query(query, values);

        res.json({ message: "Profil partner berhasil diupdate!" });
    } catch (err) {
        console.error("Error update partner:", err);
        res.status(500).json({ error: "Gagal mengupdate profil partner di database" });
    }
});



// ===============================
// COMMAND : NODE SERVER.JS
// ===============================
app.listen(port, () => console.log(`🚀 LinkBase Backend v2.0 aktif di port ${port}`));