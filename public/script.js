// ==================================
// ======== VARIABEL GLOBAL =========
// ==================================
let globalDirectoryData = []; 
let globalPartnersData = [];
let customerSelectInstance = null;
let partnerSelectInstance = null;

let globalCustomers = [];
let globalPartners = [];

// Pagination Direktori
let currentDirPage = 1;
const DIR_PER_PAGE = 25;
// Pagination Partners
let currentPartnerPage = 1;
const PARTNER_PER_PAGE = 10;
// Pagination Partners Detail - Connected Customers
const CIRCUIT_PER_PAGE = 10;

let filteredPartnerData = []; // Buat nyimpen hasil search & sort


// =========================================================================
// ROUTER UTAMA (Jalan otomatis saat web dibuka)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🔍 [CCTV] Web direfresh, mendeteksi halaman...");

    // DASHBOARD - Statistik & Chart
    if (document.getElementById('statTotalLink')) {
        // 1. Hitung Waktu Saat Ini
        const date = new Date();
        const namaBulan = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
        const bulanIni = namaBulan[date.getMonth()];
        const tahunIni = date.getFullYear();

        // 2. Tembak Teks ke HTML
        document.querySelectorAll('.lblBulanIni').forEach(el => el.innerText = bulanIni);
        if (document.getElementById('lblTahunIni')) document.getElementById('lblTahunIni').innerText = tahunIni;

        // 3. Jalankan Mesin Dashboard
        loadDashboardStats();
        loadMainChartAndPartners();
    }

    // DIREKTORI - List Site, Search & Sort, Form Tambah Data
    if (document.getElementById('siteListBody')) {
        console.log("✅ [CCTV] Masuk Halaman Direktori / Dashboard");
        if (typeof loadDirektori === 'function') loadDirektori();
        
        // Panggil fungsi dropdown Tom Select
        if (typeof loadCustomerDropdown === 'function') loadCustomerDropdown();
        if (typeof loadPartnerDropdown === 'function') loadPartnerDropdown();
        
        if (typeof setupFormTambahData === 'function') setupFormTambahData();

        // Reset pilihan jika nama perusahaan berubah
        const inputCust = document.getElementById('inputCustomerSelect');
        if (inputCust) {
            inputCust.addEventListener('change', () => {
                const prj = document.getElementById('inputProject');
                if (prj) prj.value = 'Activation';
                handleProjectChange();
            });
        }
    }

    // DIREKTORI - Form Tambah Data (Kalau ada form tambah data, pasti butuh dropdown Tom Select yang auto-load)
    if (document.getElementById('inputCustomerSelect')) {
        loadFormSelectors();
        setupFormTambahData();
    }
    if (document.getElementById('inpDirCustomer')) {
        setupFormTambahData();
    }

    // DIREKTORI - UPDATE PROJECT
    if (document.getElementById('formUpdateProject')) {
        setupHalamanUpdate();
    }

    // PARTNER - List Partner, Search & Sort, Form Tambah Partner
    if (document.getElementById('partnerListBody')) {
        console.log("✅ [CCTV] Masuk Halaman Partner List");
        if (typeof loadPartnersList === 'function') loadPartnersList();
        if (typeof setupFormAddPartner === 'function') setupFormAddPartner();
    }

    // PARTNER - Detail Info Partner & Connected Customers
    if (document.getElementById('pdName')) {
        console.log("✅ [CCTV] Masuk Halaman Partner Detail");
        if (typeof loadPartnerDetail === 'function') loadPartnerDetail();
    }

    // EXPORT EXCEL
    const btnExport = document.getElementById('btnExportExcel');
    if (btnExport) {
        btnExport.addEventListener('click', exportDirektoriKeExcel);
    }

    setupFiturImport();
});

// ======================================
// ALAT BANTU (HELPERS)
// =======================================
const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

function handleProjectChange(element) {
    console.log("Fungsi handleProjectChange dipanggil! Tom Select aman!");
}


// ===================================================================
// ======== [DASHBOARD] STATISTIK ====================================
// ===================================================================
async function loadDashboardStats() {
    try {
        const res = await fetch('http://localhost:3000/api/dashboard/stats');
        const data = await res.json();
        
        if(document.getElementById('statTotalLink')) document.getElementById('statTotalLink').innerText = data.total_link;
        if(document.getElementById('statProgressLink')) document.getElementById('statProgressLink').innerText = data.progress_link;
        if(document.getElementById('statNewSite')) document.getElementById('statNewSite').innerText = data.new_site;
        if(document.getElementById('statTerminatedMonth')) document.getElementById('statTerminatedMonth').innerText = data.terminated_month;
    } catch (err) {
        console.error("Gagal muat statistik dashboard", err);
    }
}


// =============================================================
// [DASHBOARD] GRAFIK KECIL (SPARKLINES) & SETTING TEMA GELAP
// ==============================================================
// Bikin dummy data buat animasi grafik kecil di kartu
function renderSparklines() {
    const sparklineOptions = {
        chart: { type: 'area', height: 50, sparkline: { enabled: true } },
        stroke: { curve: 'smooth', width: 2 },
        fill: { opacity: 0.2 },
        tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: function (seriesName) { return '' } } }, marker: { show: false } }
    };

    // Kartu 1 (Biru/Ungu)
    new ApexCharts(document.querySelector("#spark1"), { ...sparklineOptions, series: [{ data: [12, 14, 18, 17, 22, 25, 30] }], colors: ['#8b5cf6'] }).render();
    // Kartu 2 (Kuning)
    new ApexCharts(document.querySelector("#spark2"), { ...sparklineOptions, series: [{ data: [5, 10, 8, 15, 12, 8, 5] }], colors: ['#f59e0b'] }).render();
    // Kartu 3 (Biru Muda)
    new ApexCharts(document.querySelector("#spark3"), { ...sparklineOptions, series: [{ data: [2, 3, 4, 6, 5, 8, 10] }], colors: ['#0dcaf0'] }).render();
    // Kartu 4 (Merah)
    new ApexCharts(document.querySelector("#spark4"), { ...sparklineOptions, series: [{ data: [100, 110, 105, 120, 125, 130, 140] }], colors: ['#dc3545'] }).render();
}


// =================================================
// [DASHBOARD] GRAFIK BESAR AREA & TOP PARTNER
// =================================================
async function loadMainChartAndPartners() {
    try {
        // 1. RENDER GRAFIK PERBANDINGAN
        const resChart = await fetch('http://localhost:3000/api/dashboard/chart-comparison');
        const dataChart = await resChart.json();

        const labels = dataChart.map(item => item.month_name);
        const dataOnline = dataChart.map(item => parseInt(item.online_count) || 0);
        const dataTerminated = dataChart.map(item => parseInt(item.terminated_count) || 0);

        const chartOptions = {
            series: [
                { name: 'New', data: dataOnline },
                { name: 'Terminated', data: dataTerminated }
            ],
            chart: { 
                type: 'area', 
                height: 320, 
                toolbar: { show: false }, 
                background: 'transparent',
                fontFamily: 'Inter, sans-serif' // 🔥 SUNTIK FONT UI LU DI SINI
            },
            theme: { mode: 'dark' },
            colors: ['#3b82f6', '#ef4444'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 }, 
            
            //  BIKIN LEGEND LEGA DAN RAPI
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '13px',
                fontWeight: 600,
                labels: { colors: '#cbd5e1' },
                itemMargin: { horizontal: 25, vertical: 0 }, // Ini jarak antarnya (di-longgarkan)
                markers: { radius: 12, width: 12, height: 12 }
            },

            //  RAPIKAN FONT SUMBU X & Y
            xaxis: { 
                categories: labels, 
                axisBorder: { show: false }, 
                axisTicks: { show: false }, 
                labels: { style: { colors: '#9ca3af', fontSize: '12px', fontWeight: 500 } } 
            },
            yaxis: { 
                labels: { style: { colors: '#9ca3af', fontSize: '12px', fontWeight: 500 } } 
            },
            grid: { borderColor: '#2d303e', strokeDashArray: 4 },
            tooltip: { theme: 'dark' }
        };

        const chartEl = document.querySelector("#chartMainArea");
        if (chartEl) {
            chartEl.innerHTML = ''; 
            new ApexCharts(chartEl, chartOptions).render();
        }

        // 2. RENDER TOP PARTNER (Tetap sama)
        const resPart = await fetch('http://localhost:3000/api/dashboard/top-partners');
        const dataPart = await resPart.json();
        
        const container = document.getElementById('topPartnersContainer');
        if (container) {
            container.innerHTML = ''; 
            const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

            dataPart.forEach((p, index) => {
                const amName = p.account_manager ? p.account_manager : 'Belum ada AM';
                const html = `
                    <div class="d-flex justify-content-between align-items-center p-2 rounded hover-dark-effect" style="transition: 0.2s;">
                        <div class="d-flex align-items-center gap-3">
                            <div class="ui-avatar fw-bold" style="background-color: #2a2d43; color: #8b5cf6; width: 30px; height: 30px;">${index + 1}</div>
                            <div>
                                <h6 class="mb-0 fw-bold text-white" style="font-size: 0.9rem;">${p.partner_name || 'Unknown'}</h6>
                                <small class="text-muted" style="font-size: 0.75rem;"> ${amName}</small>
                            </div>
                        </div>
                        <div class="fw-bold text-white">${formatter.format(p.total_expense || 0)}</div>
                    </div>
                `;
                container.innerHTML += html;
            });
        }
    } catch (err) {
        console.error("Gagal muat grafik dan top partner", err);
    }
}


// ==========================================================
// ======= [PROVISIONING] TRACKER LIST ======================
// ==========================================================
async function loadProvisioningTasks() {
    const listBody = document.getElementById('provisioningListBody');
    if (!listBody) return; 

    try {
        console.log("Mencoba menarik data provisioning..."); // Log ke console
        
        const res = await fetch('http://localhost:3000/api/provisioning');
        if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);
        
        const tasks = await res.json();
        console.log("Data berhasil ditarik:", tasks); // Liat datanya di console
        
        listBody.innerHTML = ''; 

        if (tasks.length === 0) {
            listBody.innerHTML = `
                <div class="text-center p-5 text-muted fw-bold">
                    <i class="bi bi-check2-circle text-success" style="font-size: 3rem;"></i><br>
                    <span class="mt-2 d-block">Tidak ada task provisioning. Semua site sudah ONLINE!</span>
                </div>`;
            return;
        }

        tasks.forEach(t => {
            // 1. Pewarnaan Teks Project
            let typeColor = 'primary';
            
            if (t.project === 'Upgrade' || t.project === 'Downgrade') { 
                typeColor = 'info'; 
            } else if (t.project === 'Relocation') { 
                typeColor = 'warning'; 
            } else if (t.project === 'Terminate' || t.project === 'BOD') { 
                typeColor = 'danger'; 
            }

            // 2. Format Rupiah
            const rpCost = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(t.monthly_cost || 0));

            // 3. Gambar Baris Tabel (Space Progress Diperluas)
            const row = `
                <div class="d-flex align-items-center px-4 py-3 position-relative" style="transition: background 0.2s;">
                    
                    <div style="flex: 1.5; padding-right: 15px; min-width: 0;">
                        <div class="fw-bold text-dark text-truncate" style="font-size: 13px;">${t.customer_name || '-'}</div>
                        <div class="text-muted text-truncate" style="font-size: 11px;">${t.customer_site || '-'}</div>
                    </div>

                    <div style="flex: 1.5; padding-right: 15px; min-width: 0;">
                        <div class="fw-bold text-${typeColor} text-truncate mb-1" style="font-size: 12px;">
                            ${t.project || '-'}
                        </div>
                        <div class="fw-bold text-secondary text-truncate" style="font-size: 11px;">${t.service || '-'}</div>
                    </div>
                    
                    <div style="flex: 1.2; padding-right: 15px; min-width: 0;">
                        <div class="fw-bold text-dark text-truncate" style="font-size: 13px;">${t.partner_name || '-'}</div>
                        <div class="text-success fw-bold text-truncate" style="font-size: 12px;">${rpCost}</div>
                    </div>
                    
                    <div style="flex: 2.5; padding-right: 15px; min-width: 0;">
                        <div title="${t.progres_lapangan || 'On Progress'}" style="cursor: help;">
                            <div class="fw-bold text-secondary" style="font-size: 11px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; line-height: 1.4;">
                                ${t.progres_lapangan || 'On Progress'}
                            </div>
                        </div>
                    </div>
                    
                    <div style="width: 90px; text-align: right;">
                        <button class="btn btn-light btn-sm rounded-circle shadow-sm border border-secondary border-opacity-25" style="width: 32px; height: 32px; transition: all 0.2s;" onmouseover="this.classList.replace('btn-light', 'btn-primary'); this.querySelector('i').classList.replace('text-secondary', 'text-white')" onmouseout="this.classList.replace('btn-primary', 'btn-light'); this.querySelector('i').classList.replace('text-white', 'text-secondary')" onclick="window.location.href='provisioning_detail.html?id=${t.task_id}'" title="Lihat Detail">
                            <i class="bi bi-chevron-right text-secondary"></i>
                        </button>
                    </div>
                </div>
            `;
            listBody.innerHTML += row;
        });

    } catch (err) {
        console.error("Error load provisioning:", err);
        // 🔥 Kalau error, tampilkan pesan merah di layar!
        listBody.innerHTML = `
            <div class="text-center p-5 text-danger fw-bold">
                <i class="bi bi-exclamation-triangle-fill fs-1"></i><br>
                Gagal memproses data! Error: ${err.message}
            </div>
        `;
    }
}

// ============================================
// [PROVISIONING] DETAIL HALAMAN PROVISIONING
// ============================================
async function loadProvisioningDetail() {
    // Ambil ID dari URL (misal: provisioning_detail.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');
    
    if (!taskId) return;

    try {
        const res = await fetch(`http://localhost:3000/api/provisioning/${taskId}`);
        if (!res.ok) throw new Error("Gagal ambil detail");
        const t = await res.json();

        // 1. Tembak data ke HTML
        document.getElementById('detServiceId').textContent = t.service_id || '-';
        document.getElementById('detCustomer').textContent = t.customer_name || '-';
        document.getElementById('detSite').textContent = t.customer_site || '-';
        document.getElementById('detProject').textContent = t.project || '-';
        document.getElementById('detPartner').textContent = t.partner_name || '-';
        document.getElementById('detService').textContent = t.service || '-';
        document.getElementById('inputProgress').value = t.progres_lapangan || '';

        // 2. Pasang event tombol Save Progress
        document.getElementById('btnUpdateProgress').onclick = async () => {
            const btn = document.getElementById('btnUpdateProgress');
            const oldText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
            
            try {
                await fetch(`http://localhost:3000/api/provisioning/${taskId}/progress`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ progres_lapangan: document.getElementById('inputProgress').value })
                });
                // Ubah tombol jadi warna hijau bentar biar keliatan sukses
                btn.classList.replace('btn-primary', 'btn-success');
                btn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Tersimpan!';
                setTimeout(() => {
                    btn.classList.replace('btn-success', 'btn-primary');
                    btn.innerHTML = oldText;
                }, 2000);
            } catch (e) {
                alert("Gagal menyimpan progress");
                btn.innerHTML = oldText;
            }
        };

        // 3. Pasang event tombol COMPLETE TASK (Teleportasi)
        document.getElementById('btnDoneTask').onclick = async () => {
            if (!confirm("Yakin project ini sudah selesai? Data akan otomatis meluncur ke Direktori Utama.")) return;
            
            try {
                const finishRes = await fetch(`http://localhost:3000/api/provisioning/${taskId}/complete`, { method: 'POST' });
                if (finishRes.ok) {
                    alert("MANTAP! 🚀 Data berhasil dilempar ke Direktori Utama.");
                    // Balikin ke halaman list
                    window.location.href = 'provisioning.html';
                }
            } catch (e) {
                alert("Gagal menyelesaikan task");
            }
        };

    } catch (err) {
        console.error(err);
        alert("Gagal memuat data task.");
    }
}

// ===============================================
// [PROVISIONING] FORM ORDER BARU PROVISIONING 
// ===============================================
async function loadFormNewOrder() {
    // 1. Tarik Data Customer
    try {
        const resCust = await fetch('http://localhost:3000/api/customers');
        // 🔥 FIX: Wajib pakai globalCustomers biar otaknya nyimpen data!
        globalCustomers = await resCust.json(); 
        
        let custHtml = '<option value=""></option>';
        globalCustomers.forEach(c => { 
            custHtml += `<option value="${c.customer_name}">${c.customer_name}</option>`; 
        });
        
        $('#inpProvCustomer').html(custHtml).trigger('change'); 
    } catch (e) { console.error("Gagal load customer", e); }

    // 2. Tarik Data Partner
    try {
        const resPart = await fetch('http://localhost:3000/api/partners');
        // 🔥 FIX: Wajib pakai globalPartners juga di sini!
        globalPartners = await resPart.json(); 
        
        let partHtml = '<option value=""></option>';
        globalPartners.forEach(p => { 
            partHtml += `<option value="${p.partner_name}">${p.partner_name}</option>`; 
        });
        
        $('#inpProvPartner').html(partHtml).trigger('change');
    } catch (e) { console.error("Gagal load partner", e); }

    // 3. JALANKAN MESIN SELECT2
    $('.select2-custom').select2({
        theme: 'bootstrap-5',
        width: '100%',
        placeholder: '-- Ketik atau Pilih --',
        tags: true // Sihir biar bisa ngetik nama PT baru
    });
}
// Fitur Tombol "+ Baru" untuk Customer
function tambahCustomerBaru() {
    const namaBaru = prompt("Masukkan Nama Customer Baru:\n(Contoh: PT Angin Ribut)");
    if (namaBaru && namaBaru.trim() !== "") {
        // Otomatis bikin opsi baru dan langsung dipilih di dropdown
        const newOption = new Option(namaBaru.trim(), namaBaru.trim(), true, true);
        $('#inpProvCustomer').append(newOption).trigger('change');
    }
}
// Fitur Tombol "+ Baru" untuk Partner
function tambahPartnerBaru() {
    const namaBaru = prompt("Masukkan Nama Partner Baru:\n(Contoh: XL Axiata)");
    if (namaBaru && namaBaru.trim() !== "") {
        const newOption = new Option(namaBaru.trim(), namaBaru.trim(), true, true);
        $('#inpProvPartner').append(newOption).trigger('change');
    }
}
// Fitur Simpan Order Baru dengan Validasi & Konfirmasi Nama Baru
async function simpanOrderBaru() {
    const custName = document.getElementById('inpProvCustomer').value.trim();
    const partName = document.getElementById('inpProvPartner').value.trim();
    const serviceId = document.getElementById('inpProvServiceId').value.trim();

    if (!custName || !partName || !serviceId) {
        alert("Kolom Customer, Partner, dan Service ID WAJIB diisi!");
        return;
    }

    // =====================================================================
    //  FITUR PENDETEKSI NAMA BARU & INSTRUKSI KONFIRMASI
    // =====================================================================
    
    // Cek apakah Customer yang diketik ada di daftar pilihan
    const isCustExist = globalCustomers.some(c => c.customer_name.toLowerCase() === custName.toLowerCase());
    if (!isCustExist) {
        const konfirmasiCust = confirm(`⚠️ CUSTOMER BELUM TERDAFTAR!\n\nNama "${custName}" tidak ditemukan di dalam pilihan.\n\nKlik 'OK' jika Anda ingin sistem mendaftarkannya sebagai Customer Baru.\nKlik 'Cancel' jika Anda ingin memperbaiki ketikan.`);
        if (!konfirmasiCust) return; // Stop eksekusi kalau user pilih Cancel
    }

    // Cek apakah Partner yang diketik ada di daftar pilihan
    const isPartExist = globalPartners.some(p => p.partner_name.toLowerCase() === partName.toLowerCase());
    if (!isPartExist) {
        const konfirmasiPart = confirm(`⚠️ PARTNER ISP BELUM TERDAFTAR!\n\nNama "${partName}" tidak ditemukan di dalam pilihan.\n\nKlik 'OK' jika Anda ingin sistem mendaftarkannya sebagai Partner Baru.\nKlik 'Cancel' jika Anda ingin memperbaiki ketikan.`);
        if (!konfirmasiPart) return; // Stop eksekusi kalau user pilih Cancel
    }
    // =====================================================================

    // Kalau aman (atau user udah klik OK), susun datanya
    const payload = {
        customer_name: custName,
        partner_name: partName,
        customer_site: document.getElementById('inpProvSite').value,
        service_id: serviceId,
        circuit_id: document.getElementById('inpProvCircuitId').value,
        project: document.getElementById('inpProvProject').value,
        service_category: document.getElementById('inpProvCategory').value,
        service: document.getElementById('inpProvService').value,
        sales: document.getElementById('inpProvSales').value,
        sales_order: document.getElementById('inpProvSO').value,
        monthly_cost: document.getElementById('inpProvMonthly').value || 0,
        installation_cost: document.getElementById('inpProvInstall').value || 0,
        ikg_cost: document.getElementById('inpProvIkg').value || 0,
        contract_periode: document.getElementById('inpProvContract').value || 12,
        contract_start: document.getElementById('inpProvStartDate').value || null,
        detail_wo: document.getElementById('inpProvWO').value,
        notes: document.getElementById('inpProvNotes').value
    };

    try {
        const res = await fetch('http://localhost:3000/api/provisioning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("MANTAP! 🚀 Order Baru Berhasil Masuk Antrean Provisioning!");
            window.location.href = 'provisioning.html';
        } else {
            alert("Gagal menyimpan order. Cek terminal node.js lu.");
        }
    } catch (err) {
        alert("Koneksi ke server terputus.");
    }
}

// ==================================================
// [PROVISIONING] TELEPORT DATA DONE TO DIREKTORI
// ==================================================
async function selesaikanProvisioning(taskId) {
    if (!confirm("Yakin project ini sudah selesai? Data akan otomatis masuk ke Direktori Utama dan Tagihan Partner akan bertambah.")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/provisioning/${taskId}/complete`, {
            method: 'POST'
        });
        
        if (res.ok) {
            alert("MANTAP! 🚀 Data berhasil dilempar ke Direktori Utama.");
            loadProvisioningTasks(); // Refresh tabelnya
        } else {
            alert("Gagal menyelesaikan task.");
        }
    } catch (err) {
        alert("Koneksi server terputus.");
    }
}

// ===================================
// [PROVISIONING] PEMANGGIL OTOMATIS
// ===================================
window.addEventListener('DOMContentLoaded', () => {
    // Jalankan tracker list
    if (document.getElementById('provisioningListBody')) {
        setTimeout(() => { loadProvisioningTasks(); }, 100); 
    }
    // Jalankan halaman detail
    if (document.getElementById('detServiceId')) {
        loadProvisioningDetail();
    }
}); 
// Jalankan loader form jika di halaman provisioning_new.html
if (document.getElementById('inpProvCustomer')) {
    loadFormNewOrder();
}


// ================================================================
// === [DIREKTORI] FUNGSI HALAMAN DIREKTORI =======================
// ================================================================
async function loadDirektori() {
    const listBody = document.getElementById('siteListBody');
    if (!listBody) return;

    try {
        const response = await fetch('http://localhost:3000/api/direktori');
        const data = await response.json();
        globalDirectoryData = Array.isArray(data) ? data : [];
        
        // 🔥 JURUS FIX KOSONG: Lempar datanya ke mesin potong dulu!
        applySearchAndSort(); 
        
    } catch (err) {
        console.error('Error load direktori:', err);
        listBody.innerHTML = '<div class="alert alert-danger m-3">Gagal memuat data.</div>';
    }
}

// ===================================================
// [DIREKETORI] SEARACH & SORT BY HALAMAN DIREKTORI
// ===================================================
function applySearchAndSort() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect'); 
    
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    const sortTipe = sortSelect ? sortSelect.value : 'terbaru';

    // 1. Saring Data
    filteredDirData = globalDirectoryData.filter(site => {
        const srvId = (site.service_id || '').toLowerCase();
        const custName = (site.customer_name || '').toLowerCase();
        const custSite = (site.customer_site || '').toLowerCase();
        const circId = (site.circuit_id || '').toLowerCase();
        const partner = (site.partner_name || '').toLowerCase();

        return srvId.includes(keyword) || custName.includes(keyword) || custSite.includes(keyword) || circId.includes(keyword) || partner.includes(keyword); 
    });

    // 2. Urutkan Data
    if (sortTipe === 'terbaru') {
        filteredDirData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortTipe === 'terlama') {
        filteredDirData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortTipe === 'az') {
        filteredDirData.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
    } else if (sortTipe === 'za') {
        filteredDirData.sort((a, b) => (b.customer_name || '').localeCompare(a.customer_name || ''));
    }

    // 3. Reset ke halaman 1, lalu Gambar!
    currentDirPage = 1;
    renderDirektori();
}

// ================================
// [DIREKTORI] FUNGSI PAGINATION
// ================================
function changeDirPage(direction) {
    const totalPages = Math.ceil(filteredDirData.length / DIR_PER_PAGE);
    const newPage = currentDirPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentDirPage = newPage;
        renderDirektori();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ================================
// [DIREKTORI] FUNGSI LIST SITE
// ================================
function renderDirektori() {
    const listBody = document.getElementById('siteListBody');
    if (!listBody) return;
    listBody.innerHTML = '';

    const dataLength = filteredDirData.length;

    if (dataLength === 0) {
        listBody.innerHTML = `<div class="text-center text-muted p-5 fw-bold">Data site tidak ditemukan.</div>`;
        document.getElementById('dirPaginationInfo').textContent = '0 Data';
        document.getElementById('btnPrevDir').disabled = true;
        document.getElementById('btnNextDir').disabled = true;
        return;
    }

    // 🔥 Rumus Potong Kertas
    const startIndex = (currentDirPage - 1) * DIR_PER_PAGE;
    const endIndex = startIndex + DIR_PER_PAGE;
    const paginatedData = filteredDirData.slice(startIndex, endIndex);

    paginatedData.forEach((site, index) => {
        const globalIndex = startIndex + index; // Biar no urut gak reset jadi 1 tiap pindah page
        const rawStatus = site.status_link || 'ONLINE';
        const statusText = rawStatus.toString().toUpperCase();
        const badgeClass = statusText.includes('ONLINE') ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';

        const item = `
            <div class="ui-row px-4 py-3 d-flex align-items-center">
                <div style="width: 48px; font-size:13px;" class="text-muted fw-bold">${globalIndex + 1}</div>
                <div style="flex: 3; padding-right: 15px; min-width: 0;">
                    <div class="text-main text-truncate fw-bold text-dark" style="cursor: pointer;" onclick="window.location.href='detail.html?srv=${site.service_id}'">${site.customer_name || '-'}</div>
                    <div class="text-sub text-truncate text-muted small">${site.customer_site || '-'}</div>
                </div>
                <div style="flex: 1.5; padding-right: 15px; min-width: 0;">
                    <div class="text-main text-truncate fw-bold text-dark">${site.service || '-'}</div>
                    <div class="text-sub text-truncate text-primary small fw-bold">${site.service_id || '-'}</div>
                </div>
                <div style="flex: 1.5; padding-right: 15px; min-width: 0;">
                    <div class="text-main text-truncate fw-bold text-dark">${site.partner_name || '-'}</div>
                    <div class="text-sub text-truncate text-muted small">${site.circuit_id || '-'}</div>
                </div>
                <div style="flex: 0.7; padding-right: 15px;">
                    <span class="badge ${badgeClass} px-3 py-1 rounded-pill shadow-sm" style="font-size: 11px; letter-spacing: 0.5px;">${statusText}</span>
                </div>
                <div style="width: 50px; text-align: right;">
                    <button class="btn btn-sm btn-dark rounded-circle border" title="View Detail" onclick="window.location.href='detail.html?srv=${site.service_id}'">
                        <i class="bi bi-arrow-right text-primary"></i>
                    </button>
                </div>
            </div>
        `;
        listBody.innerHTML += item;
    });

    // Update Tulisan Info & Kunci Tombol
    const totalPages = Math.ceil(dataLength / DIR_PER_PAGE);
    const endView = endIndex > dataLength ? dataLength : endIndex;
    
    document.getElementById('dirPaginationInfo').textContent = `${startIndex + 1}-${endView} dari ${dataLength} Site`;
    document.getElementById('btnPrevDir').disabled = (currentDirPage === 1);
    document.getElementById('btnNextDir').disabled = (currentDirPage === totalPages);
}


// =========================================================================
// [DIREKTORI] FUNGSI TAMBAH DATA LINK BARU (FULL PAGE)
// =========================================================================
async function setupFormTambahData() {
    // 1. CARI ELEMENNYA DULU
    // 🔥 PENTING: Pastikan ID ini SAMA PERSIS dengan ID <select> di HTML lu!
    const elCust = document.getElementById('inpDirCustomer'); 
    const elPart = document.getElementById('inpDirPartner');  

    // 🔥 SAKLAR PENGAMAN: Kalau elemennya nggak ada (misal lagi di halaman lain), stop di sini!
    if (!elCust || !elPart) return; 

    // 2. Tarik Data Customer
    try {
        const resCust = await fetch('http://localhost:3000/api/customers');
        let globalCustomers = await resCust.json(); 
        
        let custHtml = '<option value=""></option>';
        globalCustomers.forEach(c => { 
            custHtml += `<option value="${c.customer_name}">${c.customer_name}</option>`; 
        });
        elCust.innerHTML = custHtml; 
    } catch (e) { console.error("Gagal load customer", e); }

    // 3. Tarik Data Partner
    try {
        const resPart = await fetch('http://localhost:3000/api/partners');
        let globalPartners = await resPart.json(); 
        
        let partHtml = '<option value=""></option>';
        globalPartners.forEach(p => { 
            partHtml += `<option value="${p.partner_name}">${p.partner_name}</option>`; 
        });
        elPart.innerHTML = partHtml;
    } catch (e) { console.error("Gagal load partner", e); }

    // 4. JALANKAN MESIN TOM SELECT
    new TomSelect(elCust, {
        create: true, // Bisa ngetik nama baru
        sortField: { field: "text", direction: "asc" },
        placeholder: '-- Ketik atau Pilih Customer --'
    });

    new TomSelect(elPart, {
        create: true, // Bisa ngetik nama baru
        sortField: { field: "text", direction: "asc" },
        placeholder: '-- Ketik atau Pilih Partner --'
    });
}


// =========================================================================
// [DIREKTORI] FUNGSI SIMPAN (VERSI JENIUS & ANTI-CRASH)
// =========================================================================
async function simpanDirektoriBaru(event) {
    if (event) event.preventDefault();

    try {
        const custVal = $('#inpDirCustomer').val();
        const partVal = $('#inpDirPartner').val();
        
        const custName = custVal ? custVal.trim() : '';
        const partName = partVal ? partVal.trim() : '';
        const serviceIdVal = (document.getElementById('inpDirServiceId')?.value || '').trim();
        const siteVal = (document.getElementById('inpDirSite')?.value || '').trim();

        if (!custName || !partName || !serviceIdVal) {
            alert("⚠️ Peringatan: Kolom Customer, Partner, dan Service ID WAJIB diisi bos!");
            return; 
        }

        const btnSubmit = document.querySelector('#formAddSite button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Menyimpan...';
        }

        let finalCustomerId = custName; // Default-nya kita kirim namanya aja
        let finalPartnerId = partName;  // Default-nya kita kirim namanya aja

        // ==============================================================
        // CUMA BUTUH KONFIRMASINYA AJA, BIKIN BARUNYA BIAR SERVER YANG URUS!
        // ==============================================================
        const custExist = globalCustomers.find(c => (c.customer_name || '').toLowerCase() === custName.toLowerCase());
        if (!custExist) {
            const konfirmasiCust = confirm(`⚠️ CUSTOMER BELUM TERDAFTAR!\n\nNama "${custName}" tidak ditemukan di dalam pilihan.\n\nKlik 'OK' jika Anda ingin sistem mendaftarkannya sebagai Customer Baru.`);
            if (!konfirmasiCust) {
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = 'Submit'; }
                return; 
            }
            // 🔥 KITA HAPUS FETCH-NYA DI SINI! Backend udah pinter!
        } else {
            // Kalau udah ada, kita kirim ID angkanya
            finalCustomerId = custExist.id || custExist.customer_id;
        }

        const partExist = globalPartners.find(p => (p.partner_name || '').toLowerCase() === partName.toLowerCase());
        if (!partExist) {
            const konfirmasiPart = confirm(`⚠️ PARTNER ISP BELUM TERDAFTAR!\n\nNama "${partName}" tidak ditemukan di dalam pilihan.\n\nKlik 'OK' jika Anda ingin sistem mendaftarkannya sebagai Partner Baru.`);
            if (!konfirmasiPart) {
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = 'Submit'; }
                return; 
            }
             // KITA HAPUS FETCH-NYA DI SINI JUGA!
        } else {
            finalPartnerId = partExist.id || partExist.partner_id;
        }

        // ==============================================================
        // KIRIM DATA UTAMA KE DATABASE (CUMA 1 KALI TEMBAK API)
        // ==============================================================
        const bodyData = {
            customer_id: finalCustomerId, // Bisa berupa Angka ID atau Teks Nama
            customer_name: custName,      // Kita suapin namanya juga biar backend gak pusing
            partner_id: finalPartnerId,   // Bisa berupa Angka ID atau Teks Nama
            partner_name: partName,       // Kita suapin namanya juga
            project: document.getElementById('inpDirProject')?.value || 'Activation',
            created_at: document.getElementById('inpDirTanggal')?.value || null, 
            status_link: document.getElementById('inpDirStatusLink')?.value || 'Online', 
            customer_site: siteVal,
            service: document.getElementById('inpDirServiceDetail')?.value || '',
            service_category: document.getElementById('inputServiceCategory')?.value || 'Metro', 
            sales_order: document.getElementById('inpDirSalesOrder')?.value || '',
            detail_wo: document.getElementById('inpDirDetailWO')?.value || '',
            sales: document.getElementById('inpDirSales')?.value || '',
            service_id: serviceIdVal,
            circuit_id: document.getElementById('inpDirCircuitId')?.value || '', 
            monthly_cost: document.getElementById('inpDirMonthlyCost')?.value || 0,
            installation_cost: document.getElementById('inpDirInstCost')?.value || 0, 
            ikg_cost: document.getElementById('inpDirIkgCost')?.value || 0,           
            contract_periode: document.getElementById('inpDirContractPeriode')?.value || 12,
            contract_start: document.getElementById('inpDirContractStart')?.value || document.getElementById('inpDirTanggal')?.value || null,
            notes: document.getElementById('inpDirNotes')?.value || ''
        };

        const res = await fetch('http://localhost:3000/api/service-links', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData) 
        });

        if (res.ok) {
            alert("MANTAP! 🚀 Data Baru Berhasil Masuk Direktori!");
            window.location.href = 'direktori.html';
        } else {
            const errData = await res.json();
            alert("Gagal: " + (errData.error || 'Cek terminal node.js lu.'));
        }

    } catch (err) {
        console.error("CRASH DI JAVASCRIPT:", err);
        alert("Waduh, ada error koneksi bos! Cek server udah nyala belum.");
    } finally {
        const btnSubmit = document.querySelector('#formAddSite button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Submit';
        }
    }
}


// =========================================================================
// [ DIREKTORI ] UPDATE PROJECT FUNGSI HALAMAN UPDATE PROJECT
// =========================================================================
async function setupHalamanUpdate() {
    // 1. Tangkap ID dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = urlParams.get('id');

    if (!linkId) {
        alert("ID Link tidak ditemukan!");
        window.location.href = 'direktori.html';
        return;
    }

    // Tombol Back langsung pakai history biar aman
    const btnBack = document.getElementById('btnBackToDetail');
    if (btnBack) {
        btnBack.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back(); // Otomatis balik ke halaman detail sebelumnya
        });
    }

    // 2. Ambil data lama & Load Dropdown Partner
    try {
        const [resLink, resPartner] = await Promise.all([
            fetch(`http://localhost:3000/api/service-links/id/${linkId}`),
            fetch('http://localhost:3000/api/partners')
        ]);

        if (!resLink.ok) throw new Error("Gagal ambil data link dari server");
        
        if (resPartner.ok) {
            const partners = await resPartner.json();
            let optHtml = '<option value="">-- Pilih Partner --</option>';
            partners.forEach(p => { optHtml += `<option value="${p.partner_id}">${p.partner_name}</option>`; });
            document.getElementById('inpUpdPartner').innerHTML = optHtml;
        }

        const data = await resLink.json();

        // Header Read Only
        document.getElementById('readCustomerName').textContent = `${data.customer_name || '-'} - ${data.customer_site || '-'}`;
        document.getElementById('readServiceId').textContent = `${data.service_id || '-'} (${data.partner_name || '-'})`;
        
        // Isi Default Form Komplit
        document.getElementById('inpUpdStatus').value = data.status_link || 'Online';
        document.getElementById('inpUpdTanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('inpUpdSite').value = data.customer_site || '';
        document.getElementById('inpUpdCategory').value = data.service_category || '';
        document.getElementById('inpUpdService').value = data.service || '';
        document.getElementById('inpUpdPartner').value = data.partner_id || '';
        document.getElementById('inpUpdCircuit').value = data.circuit_id || '';
        document.getElementById('inpUpdSO').value = data.sales_order || '';
        document.getElementById('inpUpdSales').value = data.sales || '';
        document.getElementById('inpUpdBiaya').value = data.monthly_cost || 0; 
        document.getElementById('inpUpdInstCost').value = data.installation_cost || 0; 
        document.getElementById('inpUpdIkgCost').value = data.ikg_cost || 0; 
        document.getElementById('inpUpdPeriode').value = data.contract_periode || 1; 
        
        if(data.contract_start) {
            document.getElementById('inpUpdContractStart').value = data.contract_start.split('T')[0];
        }
        document.getElementById('inpUpdNotes').value = data.notes || '';

        // SULAP DROPDOWN PARTNER BIAR BISA DIKETIK
        const elPartner = document.getElementById('inpUpdPartner');
        if (elPartner) {
            new TomSelect(elPartner, {
                create: false,
                sortField: {
                    field: "text",
                    direction: "asc"
                },
                placeholder: "-- Ketik atau Pilih Partner --"
            });
        }

        // Daftar ID kolom yang mau dibikin pudar (kecuali Project, Tanggal, Status, WO karena itu wajib baru)
        const kolomExisting = [
            'inpUpdSite', 'inpUpdCategory', 'inpUpdService', 
            'inpUpdCircuit', 'inpUpdSO', 'inpUpdSales', 'inpUpdBiaya',
            'inpUpdInstCost', 'inpUpdIkgCost', 'inpUpdPeriode', 'inpUpdContractStart', 'inpUpdNotes'
        ];

        kolomExisting.forEach(id => {
            const el = document.getElementById(id);
            // Kalau elemennya ada dan isinya gak kosong, kasih efek pudar
            if (el && el.value !== '') {
                el.classList.add('data-existing');

                // Pas user ngetik / milih opsi baru, efek pudarnya langsung dihapus permanen
                el.addEventListener('input', function() {
                    this.classList.remove('data-existing');
                });
            }
        });

    } catch (err) {
        console.error(err);
        alert("Gagal memuat data dari server!");
    }

    // 3. Setup form submit
    const formUpdate = document.getElementById('formUpdateProject');
    if (formUpdate) {
        formUpdate.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const btnSubmit = formUpdate.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Memproses...';

            // Bungkus FULL DATA
            const bodyData = {
                project: document.getElementById('inpUpdProject').value,
                created_at: document.getElementById('inpUpdTanggal').value,
                status_link: document.getElementById('inpUpdStatus').value,
                detail_wo: document.getElementById('inpUpdWO').value,
                
                customer_site: document.getElementById('inpUpdSite').value, 
                service_category: document.getElementById('inpUpdCategory').value,
                service: document.getElementById('inpUpdService').value,
                partner_id: document.getElementById('inpUpdPartner').value,   
                circuit_id: document.getElementById('inpUpdCircuit').value,
                sales_order: document.getElementById('inpUpdSO').value,
                sales: document.getElementById('inpUpdSales').value,
                
                monthly_cost: document.getElementById('inpUpdBiaya').value || 0,
                installation_cost: document.getElementById('inpUpdInstCost').value || 0,
                ikg_cost: document.getElementById('inpUpdIkgCost').value || 0,
                contract_periode: document.getElementById('inpUpdPeriode').value || 1,
                contract_start: document.getElementById('inpUpdContractStart').value || null,
                notes: document.getElementById('inpUpdNotes').value
            };

            try {
                const resUpdate = await fetch(`http://localhost:3000/api/service-links/${linkId}/lifecycle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
                });

                if (resUpdate.ok) {
                    // 🔥 1. Ekstrak bekal dari server
                    const resData = await resUpdate.json(); 
                    
                    alert("Mantap! Project berhasil di-update dan masuk ke History! 😎");
                    
                    // 🔥 2. Pulang bawa bekal service_id (Anti-undefined club!)
                    window.location.href = `detail.html?srv=${resData.service_id}`;
                } else {
                    const errData = await resUpdate.json();
                    alert("Gagal update project: " + (errData.error || "Server error"));
                }
            } catch (error) {
                console.error("Crash Update:", error);
                alert("Koneksi ke server putus bos!");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Simpan Update';
            }
        });
    }
}

// Fungsi otomatis: Kalau di dropdown pilih "Terminate", status link otomatis berubah jadi "Terminated"
window.cekStatusTerminate = function() {
    const jenis = document.getElementById('inpUpdProject').value;
    const statusSelect = document.getElementById('inpUpdStatus');
    if (jenis === 'Terminate') {
        statusSelect.value = 'Terminated';
    } else {
        statusSelect.value = 'Online'; // Default selain terminate
    }
};


// ===========================================================================
// ====== [PARTNERS] LOAD PARTNER LIST =======================================
// ===========================================================================
async function loadPartnersList() {
    const listBody = document.getElementById('partnerListBody');
    if (!listBody) return;

    try {
        const response = await fetch('http://localhost:3000/api/partners');
        if (response.ok) {
            globalPartnersData = await response.json();
        } else {
            globalPartnersData = [];
        }
        
        // JURUS FIX KOSONG: Lempar datanya ke mesin potong dulu!
        applyPartnerSearchAndSort(); 
        
    } catch (err) {
        console.error(err);
        listBody.innerHTML = '<div class="alert alert-danger m-3">Gagal memuat data partner.</div>';
    }
}


// =================================================
// [PARTNERS] SEARCH & SORT BY HALAMAN LIST PARTNER
// =================================================
function applyPartnerSearchAndSort() {
    const searchInput = document.getElementById('searchPartnerInput');
    const sortSelect = document.getElementById('sortPartnerSelect');
    
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    const sortTipe = sortSelect ? sortSelect.value : 'az'; 

    // 1. Saring Data
    filteredPartnerData = globalPartnersData.filter(p => {
        const pName = (p.partner_name || '').toLowerCase();
        const amName = (p.account_manager || '').toLowerCase();
        return pName.includes(keyword) || amName.includes(keyword);
    });

    // 2. Urutkan Data
    if (sortTipe === 'az') {
        filteredPartnerData.sort((a, b) => (a.partner_name || '').localeCompare(b.partner_name || ''));
    } else if (sortTipe === 'pengeluaran_terbesar') {
        filteredPartnerData.sort((a, b) => Number(b.total_expense || 0) - Number(a.total_expense || 0));
    } else if (sortTipe === 'site_terbanyak') {
        filteredPartnerData.sort((a, b) => Number(b.total_sites || 0) - Number(a.total_sites || 0));
    }

    // 3. Reset ke halaman 1 tiap kali nyari/sort, lalu Gambar!
    currentPartnerPage = 1;
    renderPartners();
}


// ==============================================
// [PARTNERS] FUNSGI PAGINATION LIST PARTNER
// ==============================================
function changePartnerPage(direction) {
    const totalPages = Math.ceil(filteredPartnerData.length / PARTNER_PER_PAGE);
    const newPage = currentPartnerPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPartnerPage = newPage;
        renderPartners();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================
// [PARTNERS] RENDER PARTNER 
// ============================
function renderPartners() {
    const listBody = document.getElementById('partnerListBody');
    if (!listBody) return;
    listBody.innerHTML = '';

    const dataLength = filteredPartnerData.length;
    
    if (dataLength === 0) {
        listBody.innerHTML = '<div class="text-center p-5 text-muted fw-bold">Tidak ada partner yang ditemukan.</div>';
        document.getElementById('partnerPaginationInfo').textContent = '0 Data';
        document.getElementById('btnPrevPartner').disabled = true;
        document.getElementById('btnNextPartner').disabled = true;
        return;
    }

    // Rumus Potong Kertas
    const startIndex = (currentPartnerPage - 1) * PARTNER_PER_PAGE;
    const endIndex = startIndex + PARTNER_PER_PAGE;
    const paginatedData = filteredPartnerData.slice(startIndex, endIndex);

    const avatarColors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc'];
    
    paginatedData.forEach((p, index) => {
        // Ambil warna berdasarkan index asli biar warnanya konsisten
        const globalIndex = startIndex + index;
        const initial = p.partner_name ? p.partner_name.substring(0, 2).toUpperCase() : 'NA';
        const colorBg = avatarColors[globalIndex % avatarColors.length];
        const encodedName = encodeURIComponent(p.partner_name);
        
        const rpExpense = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(p.total_expense || 0));
        const topService = p.top_service_type || '-';

        const item = `
            <div class="ui-row px-4 py-3 d-flex align-items-center">
                <div style="width: 48px;" class="text-muted fw-bold">${globalIndex + 1}</div>
                <div style="flex: 2; display: flex; align-items: center; padding-right: 15px; min-width: 0;">
                    <div class="ui-avatar shadow-sm" style="background-color: ${colorBg};">${initial}</div>
                    <div style="min-width: 0;">
                        <div class="text-main text-truncate fw-bold text-dark" style="cursor: pointer;" onclick="window.location.href='partner_detail.html?name=${encodedName}'">${p.partner_name}</div>
                        <div class="text-sub text-truncate text-muted small">${p.email || '-'}</div>
                    </div>
                </div>
                <div style="flex: 1.5; padding-right: 15px;" class="text-main text-truncate">${p.account_manager || '-'}</div>
                <div style="flex: 1.5; padding-right: 15px;" class="text-success fw-bold">${rpExpense}</div>
                <div style="flex: 1; padding-right: 15px;" class="text-main text-truncate">${topService}</div>
                <div style="flex: 0.7; padding-right: 15px;" class="text-main fw-bold text-dark">${p.total_sites || 0} </div>
                <div style="width: 50px; text-align: right;">
                    <button class="btn btn-sm btn-light rounded-circle border" title="View Circuits" onclick="window.location.href='partner_detail.html?name=${encodedName}'">
                        <i class="bi bi-arrow-right text-primary"></i>
                    </button>
                </div>
            </div>
        `;
        listBody.innerHTML += item;
    });

    // Update Tulisan Info & Kunci Tombol
    const totalPages = Math.ceil(dataLength / PARTNER_PER_PAGE);
    const endView = endIndex > dataLength ? dataLength : endIndex;
    
    document.getElementById('partnerPaginationInfo').textContent = `${startIndex + 1}-${endView} dari ${dataLength} Partner`;
    document.getElementById('btnPrevPartner').disabled = (currentPartnerPage === 1);
    document.getElementById('btnNextPartner').disabled = (currentPartnerPage === totalPages);
}

// =================================================
// [PARTNERS] ADD PARTNER BARU VIA POP UP (MODAL)
// ================================================
function setupFormAddPartner() {
    const formAddPartner = document.getElementById('formAddPartner');
    if (formAddPartner) {
        formAddPartner.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Bungkus 5 data sekaligus!
            const payload = {
                partner_name: document.getElementById('inputPartnerName').value,
                email: document.getElementById('inputPartnerEmail').value,
                account_manager: document.getElementById('inputPartnerAM').value,
                phone_number: document.getElementById('inputPartnerPhone').value,
                office_address: document.getElementById('inputPartnerAddress') ? document.getElementById('inputPartnerAddress').value : '' 
            };
            try {
                const response = await fetch('http://localhost:3000/api/partners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    alert('Partner berhasil ditambahkan!');
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Gagal menyimpan data: ${errorData.error}`);
                }
            } catch (err) {
                alert('Gagal! Koneksi ke server terputus.');
            }
        });
    }
}

// =============================================
// [PARTNER DETAIL PARTNER & CONNECTED CIRCUITS
// =============================================
function switchTab(tabName) {
    document.getElementById('tabOverview').classList.remove('active');
    document.getElementById('tabCircuits').classList.remove('active');
    document.getElementById('contentOverview').style.display = 'none';
    document.getElementById('contentCircuits').style.display = 'none';

    if (tabName === 'overview') {
        document.getElementById('tabOverview').classList.add('active');
        document.getElementById('contentOverview').style.display = 'block';
    } else {
        document.getElementById('tabCircuits').classList.add('active');
        document.getElementById('contentCircuits').style.display = 'block';
    }
}
// Detail partner
async function loadPartnerDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const partnerName = urlParams.get('name');
    if (!partnerName) return;

    // =========================================================
    // 1. TARIK DATA OVERVIEW PARTNER
    // =========================================================
    try {
        console.log("1. Meminta data untuk partner:", partnerName);
        
        const resDetail = await fetch(`http://localhost:3000/api/partners/detail/${encodeURIComponent(partnerName)}`);
        
        console.log("2. Status dari server:", resDetail.status);

        if (resDetail.ok) {
            const data = await resDetail.json();
            window.currentPartnerData = data;
            console.log("3. Data yang didapat dari database:", data); // Kita intip isi aslinya di sini
            
            const rpExpense = new Intl.NumberFormat('id-ID', { 
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
            }).format(Number(data.total_expense || 0));

            const setEl = (id, val) => { 
                const el = document.getElementById(id);
                if (el) el.textContent = val; 
            };

            setEl('pdName', data.partner_name || '-');
            setEl('cardName', data.partner_name || '-');
            setEl('infoAM', data.account_manager || '-');
            setEl('infoPhone', data.phone_number || '-');
            setEl('infoAddress', data.office_address || 'Alamat belum diatur');
            
            setEl('infoTotalSites', `${data.total_sites || 0} Sites Connected`);
            setEl('infoTotalExpense', rpExpense);
            setEl('infoTopService', data.top_service_type || 'Belum ada layanan');

            const elAvatar = document.getElementById('pdAvatar');
            if (elAvatar) elAvatar.textContent = (data.partner_name || 'NA').substring(0, 2).toUpperCase();

            const elEmail = document.getElementById('pdEmail');
            if (elEmail) elEmail.innerHTML = `<i class="bi bi-envelope"></i> ${data.email || '-'}`;

            setEl('cardEmail', data.email || '-');
            
        } else {
            console.warn("Server menolak atau data tidak ditemukan (Status 404/500)");
        }
    } catch (err) {
        console.error("Error Detail saat menghubungi API:", err);
    }

    // ===================================
    // 2. TARIK DATA CONNECTED CIRCUITS 
    // ===================================
    try {
        const resCircuits = await fetch(`http://localhost:3000/api/partners/circuits/${encodeURIComponent(partnerName)}`);
        const circuitBody = document.getElementById('partnerCircuitBody');
        if (!circuitBody) return; 

        if (resCircuits.ok) {
            // 🔥 Tangkap datanya lalu simpan ke Variabel Global!
            window.globalCircuitData = await resCircuits.json();
            window.filteredCircuitData = [...window.globalCircuitData]; // Bikin kopian buat filter
            window.currentCircuitPage = 1; // Mulai dari halaman 1
            
            // Panggil mesin gambarnya!
            applyCircuitSearch(); 
        }
    } catch (err) { console.error("JS Error:", err); }
}

// =======================================
// [PARTNER] INLINE EDIT PROFIL PARTNER
// =======================================
function toggleEditPartner(isEdit) {
    const modeBaca = document.getElementById('modeBacaPartner');
    const modeEdit = document.getElementById('modeEditPartner');
    const btnMulai = document.getElementById('btnMulaiEdit');

    if (isEdit) {
        // Nyalakan form Edit
        modeBaca.classList.add('d-none');
        modeEdit.classList.remove('d-none');
        btnMulai.classList.add('d-none');
    } else {
        // Balik ke mode Baca
        modeBaca.classList.remove('d-none');
        modeEdit.classList.add('d-none');
        btnMulai.classList.remove('d-none');
    }
}
// Tombol "Edit" di klik, mulai proses edit
function mulaiEditPartner() {
    toggleEditPartner(true);
    
    // Isi otomatis formnya pakai data yang disimpen di memori tadi
    const p = window.currentPartnerData;
    if (p) {
        document.getElementById('editPartnerName').value = p.partner_name || '';
        document.getElementById('editPartnerAM').value = p.account_manager || '';
        document.getElementById('editPartnerEmail').value = p.email || '';
        document.getElementById('editPartnerPhone').value = p.phone_number || '';
        document.getElementById('editPartnerAddress').value = p.office_address || '';
    }
}
// Tombol "Simpan" di klik, kirim data ke server
async function simpanEditPartner() {
    const p = window.currentPartnerData;
    if (!p || !p.partner_id) return alert("Error: ID Partner tidak ditemukan!");

    const btnSimpan = document.getElementById('btnSimpanEdit');
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = 'Menyimpan...';

    // Ambil isi baru dari form
    const payload = {
        partner_name: document.getElementById('editPartnerName').value,
        account_manager: document.getElementById('editPartnerAM').value,
        email: document.getElementById('editPartnerEmail').value,
        phone_number: document.getElementById('editPartnerPhone').value,
        office_address: document.getElementById('editPartnerAddress').value
    };

    try {
        const response = await fetch(`http://localhost:3000/api/partners/${p.partner_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Mantap! Profil Partner berhasil diupdate 😎');
            // Kalau nama partner diganti, URL atas juga harus ganti biar gak error pas reload
            window.location.href = `partner_detail.html?name=${encodeURIComponent(payload.partner_name)}`;
        } else {
            const errData = await response.json();
            alert('Gagal update data: ' + errData.error);
        }
    } catch (err) {
        alert('Koneksi server terputus.');
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = 'Simpan Perubahan';
    }
}

// ====================================================================================
// [PARTNERS] SEARCH & PAGINATION UNTUK TAB CONNECTED CUSTOMERS (DALAM PARTNER DETAIL)
// ====================================================================================
function applyCircuitSearch() {
    const keyword = (document.getElementById('searchCircuitInput')?.value || '').toLowerCase();
    
    // 1. Saring Data
    window.filteredCircuitData = window.globalCircuitData.filter(c => {
        const name = (c.customer_name || '').toLowerCase();
        const site = (c.customer_site || '').toLowerCase();
        const srvId = (c.service_id || '').toLowerCase();
        const circId = (c.circuit_id || '').toLowerCase();
        
        return name.includes(keyword) || site.includes(keyword) || srvId.includes(keyword) || circId.includes(keyword);
    });

    // 2. Balikin ke halaman 1 kalau lagi ngetik search
    window.currentCircuitPage = 1; 
    
    // 3. Gambar hasilnya!
    renderCircuitTable();
}
// Fungsi untuk tombol pagination "Sebelumnya" dan "Berikutnya"
function changeCircuitPage(direction) {
    const totalPages = Math.ceil(window.filteredCircuitData.length / CIRCUIT_PER_PAGE);
    const newPage = window.currentCircuitPage + direction;
    
    // Cegah kebablasan
    if (newPage >= 1 && newPage <= totalPages) {
        window.currentCircuitPage = newPage;
        renderCircuitTable();

        document.getElementById('contentCircuits').scrollIntoView({ behavior: 'smooth' });
    }
}
// Render Connected Customers
function renderCircuitTable() {
    const circuitBody = document.getElementById('partnerCircuitBody');
    if (!circuitBody) return;
    circuitBody.innerHTML = '';

    const dataLength = window.filteredCircuitData.length;
    
    // Kalo kosong / gak ketemu pas disearch
    if (dataLength === 0) {
        circuitBody.innerHTML = '<div class="text-center p-5 text-muted fw-bold">Tidak ada data circuit yang ditemukan.</div>';
        document.getElementById('circuitPaginationInfo').textContent = '0 Data';
        document.getElementById('btnPrevCircuit').disabled = true;
        document.getElementById('btnNextCircuit').disabled = true;
        return;
    }

    // 🔥 RUMUS PEMOTONG KERTAS (PAGINATION)
    const startIndex = (window.currentCircuitPage - 1) * CIRCUIT_PER_PAGE;
    const endIndex = startIndex + CIRCUIT_PER_PAGE;
    const paginatedData = window.filteredCircuitData.slice(startIndex, endIndex);

    // Mulai menggambar baris sesuai data yang dipotong
    paginatedData.forEach(c => {
        let cost = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(c.monthly_cost || 0));
        let statusClass = (c.status_link || 'ONLINE').toUpperCase() === 'ONLINE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle';
        
        const row = `
            <div class="ui-row px-4 py-3 d-flex align-items-center">
                <div style="flex: 2; padding-right: 15px; min-width: 0;">
                    <div class="text-main text-truncate fw-bold text-dark">${c.customer_name || '-'}</div>
                    <div class="text-sub text-truncate text-muted small">${c.customer_site || '-'}</div>
                </div>
                <div style="flex: 1; padding-right: 15px;" class="text-main text-primary">${c.service_id || '-'}</div>
                <div style="flex: 1; padding-right: 15px;" class="text-sub text-truncate">${c.partner_service || '-'}</div>
                <div style="flex: 1; padding-right: 15px;" class="text-sub text-dark fw-semibold text-truncate">${c.service_category || '-'}</div>
                <div style="flex: 1; padding-right: 15px;" class="text-sub text-truncate fw-bold">${c.circuit_id || '-'}</div>
                <div style="flex: 1; padding-right: 15px;" class="text-main fw-bold">${cost}</div>
                <div style="flex: 0.5; padding-right: 15px;">
                    <span class="badge ${statusClass} rounded-pill px-2 py-1" style="font-size: 11px;">${(c.status_link || 'ONLINE').toUpperCase()}</span>
                </div>
                <div style="width: 50px; text-align: right;">
                    <button class="btn btn-sm btn-light rounded-circle" title="Lihat Detail Lengkap" onclick="window.location.href='detail.html?srv=${c.service_id}'">
                        <i class="bi bi-file-earmark-text text-primary"></i>
                    </button>
                </div>
            </div>
        `;
        circuitBody.innerHTML += row;
    });

    // Update Tulisan Info & Kunci Tombol
    const totalPages = Math.ceil(dataLength / CIRCUIT_PER_PAGE);
    
    // Ngasih tau lagi di data ke berapa (misal: 1-20 dari 150)
    const endView = endIndex > dataLength ? dataLength : endIndex;
    document.getElementById('circuitPaginationInfo').textContent = `${startIndex + 1}-${endView} dari ${dataLength} Site`;

    // Kunci tombol kalo udah mentok
    document.getElementById('btnPrevCircuit').disabled = (window.currentCircuitPage === 1);
    document.getElementById('btnNextCircuit').disabled = (window.currentCircuitPage === totalPages);
}



// =========================================================================
// FITUR EXPORT TO EXCEL (DIREKTORI)
// =========================================================================
async function exportDirektoriKeExcel() {
    try {
        // Ganti teks tombol biar keliatan lagi mikir
        const btn = document.getElementById('btnExportExcel');
        const teksAsli = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
        btn.disabled = true;

        // 1. Tarik semua data dari API Direktori lu
        const res = await fetch('http://localhost:3000/api/direktori');
        if (!res.ok) throw new Error("Gagal ambil data dari server");
        const data = await res.json();

        // 2. Rapihin datanya sebelum dimasukin ke Excel (Pilih kolom yang penting aja)
        const dataBersih = data.map((d, index) => ({
            "No": index + 1,
            "Customer": d.customer_name || '-',
            "Lokasi Site": d.customer_site || '-',
            "Service ID": d.service_id || '-',
            "Partner ISP": d.partner_name || '-',
            "Circuit ID": d.circuit_id || '-',
            "Kategori": d.service_category || '-',
            "Layanan (BW)": d.service || '-',
            "Biaya Bulanan (MRC)": Number(d.monthly_cost) || 0,
            "Biaya Instalasi (OTC)": Number(d.installation_cost) || 0,
            "Sales / AM": d.sales || '-',
            "Status Link": d.status_link || '-',
            "Update Terakhir": d.created_at ? d.created_at.split('T')[0] : '-'
        }));

        // 3. Proses bikin file Excel pakai SheetJS
        const worksheet = XLSX.utils.json_to_sheet(dataBersih);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Link");

        // 4. Download Filenya! (Format penamaan: Direktori_Link_Tanggal)
        const tanggalHariIni = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Direktori_Link_${tanggalHariIni}.xlsx`);

        // Balikin tombol ke semula
        btn.innerHTML = teksAsli;
        btn.disabled = false;

    } catch (err) {
        console.error("Error Export:", err);
        alert("Gagal mengekspor data ke Excel!");
        
        const btn = document.getElementById('btnExportExcel');
        btn.innerHTML = '<i class="bi bi-file-earmark-excel me-1"></i> Export Excel';
        btn.disabled = false;
    }
}


// =========================================================================
// FITUR IMPORT EXCEL KE DATABASE (VERSI BAWEL BUAT DEBUGGING)
// =========================================================================
function setupFiturImport() {
    console.log("🔎 [TRACKING] Fungsi setupFiturImport mulai dijalankan...");

    const btnTrigger = document.getElementById('btnTriggerImport');
    const inpFile = document.getElementById('inpImportExcel');

    // Cek apakah tombolnya beneran ketemu di HTML
    if (!btnTrigger) {
        console.error("🚨 FATAL: Elemen dengan ID 'btnTriggerImport' TIDAK DITEMUKAN di HTML!");
        return;
    }
    if (!inpFile) {
        console.error("🚨 FATAL: Elemen dengan ID 'inpImportExcel' TIDAK DITEMUKAN di HTML!");
        return;
    }

    console.log("✅ [TRACKING] Tombol dan Input File berhasil ditemukan! Memasang sensor klik...");

    // Pas tombol diklik
    btnTrigger.addEventListener('click', (e) => {
        e.preventDefault(); // Mencegah tombol ngereload halaman kalau dia ada di dalam <form>
        console.log("🖱️ [TRACKING] Tombol Import diklik! Membuka File Explorer...");
        inpFile.click();
    });

    // Pas file Excel udah dipilih
    inpFile.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) {
            console.log("⚠️ [TRACKING] Batal milih file.");
            return;
        }

        console.log(`📄 [TRACKING] File dipilih: ${file.name} | Ukuran: ${file.size} bytes`);

        // Ubah teks tombol
        const teksAsli = btnTrigger.innerHTML;
        btnTrigger.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyedot Data...';
        btnTrigger.disabled = true;

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                console.log("⚙️ [TRACKING] Sedang membaca isi Excel pakai SheetJS...");
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                console.log(`🚀 [TRACKING] Berhasil ekstrak ${jsonData.length} baris! Mengirim ke server...`);

                const res = await fetch('http://localhost:3000/api/service-links/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });

                const hasil = await res.json();

                if (res.ok) {
                    alert(`Gila bos! ${hasil.berhasil} baris data berhasil mendarat di database! 😎🚀`);
                    window.location.reload();
                } else {
                    alert("Waduh, gagal import bos: " + hasil.error);
                }
            } catch (err) {
                console.error("💥 [TRACKING] Crash saat proses Import:", err);
                alert("File Excel rusak atau formatnya nggak sesuai!");
            } finally {
                btnTrigger.innerHTML = teksAsli;
                btnTrigger.disabled = false;
                inpFile.value = ''; 
            }
        };
        reader.readAsArrayBuffer(file);
    });
}
