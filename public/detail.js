const urlParams = new URLSearchParams(window.location.search);
const serviceId = urlParams.get('srv');

if (!serviceId) {
    alert('Service ID tidak valid atau kosong!');
    window.location.href = 'direktori.html';
}

function switchTab(tabName) {
    document.getElementById('tabCurrentBtn').classList.remove('active');
    document.getElementById('tabLogsBtn').classList.remove('active');
    document.getElementById('contentCurrent').style.display = 'none';
    document.getElementById('contentLogs').style.display = 'none';

    if (tabName === 'current') {
        document.getElementById('tabCurrentBtn').classList.add('active');
        document.getElementById('contentCurrent').style.display = 'flex';
    } else {
        document.getElementById('tabLogsBtn').classList.add('active');
        document.getElementById('contentLogs').style.display = 'block';
    }
}

const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Format untuk ngisi input type="date" di HTML form
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toISOString().split('T')[0];
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`http://localhost:3000/api/service-links/history/${serviceId}`);
        if (!response.ok) throw new Error('Data tidak ditemukan di database');
        
        const historyData = await response.json(); 
        if (!historyData || historyData.length === 0) throw new Error('Riwayat kosong');
        
        window.historyDataList = historyData; 
        
        const current = historyData[0]; 
        
        const custName = current.customer_name || 'UNKNOWN CUSTOMER';
        let initial = 'NA';
        if (custName.length >= 2) initial = custName.substring(0, 2).toUpperCase();
        else if (custName.length === 1) initial = custName.toUpperCase();

        // 1. Isi Header (Posisi Teks Ditukar)
        document.getElementById('detSrvIdHeader').innerText = current.service_id || '-';
        document.getElementById('detCustNameHeader').innerText = custName;
        document.getElementById('avatarInitials').innerText = initial;

       
       // 2. Isi Tab Current State (EXECUTIVE SUMMARY BARU & FULL)
        
        // Alat bantu format Rupiah
        const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

        // --- KOLOM KIRI (Teknis & Operasional) ---
        const elSite = document.getElementById('valSite');
        if (elSite) elSite.textContent = current.customer_site || '-';

        const elServiceId = document.getElementById('valServiceId');
        if (elServiceId) elServiceId.textContent = current.service_id || '-';

        const elCategory = document.getElementById('valCategory');
        if (elCategory) elCategory.textContent = current.service_category || 'Metro';

        const elService = document.getElementById('valService');
        if (elService) elService.textContent = current.service || '-';

        const elProject = document.getElementById('valProject');
        if (elProject) elProject.textContent = (current.project || '-').toUpperCase();

        const elCreatedAt = document.getElementById('valCreatedAt');
        if (elCreatedAt) elCreatedAt.textContent = current.created_at ? formatTanggal(current.created_at) : '-';

        const elSO = document.getElementById('valSO');
        if (elSO) elSO.textContent = current.sales_order || '-';

        const elSales = document.getElementById('valSales');
        if (elSales) elSales.textContent = current.sales || '-';

        const elWO = document.getElementById('valWO');
        if (elWO) elWO.textContent = current.detail_wo || '-';

        // --- KOLOM KANAN (Partner, Finansial & Status) ---
        const elPartner = document.getElementById('valPartner');
        if (elPartner) elPartner.textContent = current.partner_name || '-';

        const elCircuitId = document.getElementById('valCircuitId');
        if (elCircuitId) elCircuitId.textContent = current.circuit_id || '-';

        const elStatusLink = document.getElementById('valStatusLink');
        if (elStatusLink) {
            const statText = (current.status_link || 'ONLINE').toUpperCase();
            elStatusLink.textContent = statText;
            elStatusLink.className = statText === 'ONLINE' ? 'text-success fw-bold fs-6 text-break' : 'text-danger fw-bold fs-6 text-break';
        }

        const elMonthly = document.getElementById('valMonthly');
        if (elMonthly) elMonthly.textContent = formatRupiah(current.monthly_cost);

        const elInst = document.getElementById('valInst');
        if (elInst) elInst.textContent = formatRupiah(current.installation_cost);

        const elIkg = document.getElementById('valIkg');
        if (elIkg) elIkg.textContent = formatRupiah(current.ikg_cost);

        const elPeriode = document.getElementById('valPeriode');
        if (elPeriode) elPeriode.textContent = (current.contract_periode || 0) + ' Tahun';

        const elStart = document.getElementById('valStart');
        if (elStart) elStart.textContent = current.contract_start ? formatTanggal(current.contract_start) : '-';

        const elNotes = document.getElementById('valNotes');
        if (elNotes) elNotes.textContent = current.notes || 'Tidak ada catatan.';

        // 3. Render Tabel Logs (GAYA ACCORDION / BUKA-TUTUP)
        const logsTbody = document.getElementById('logsTableBody');
        logsTbody.innerHTML = '';

        historyData.forEach(log => {
            let badgeClass = 'bg-secondary';
            if (log.project === 'Activation' || log.project === 'Trial') badgeClass = 'bg-success';
            else if (log.project === 'Upgrade') badgeClass = 'bg-primary';
            else if (log.project === 'Terminate') badgeClass = 'bg-danger';
            else if (log.project === 'Relocation') badgeClass = 'bg-warning text-dark';

            // Siapin Rupiah & Status
            const rpMonthly = formatRupiah(log.monthly_cost);
            const rpInst = formatRupiah(log.installation_cost);
            const rpIkg = formatRupiah(log.ikg_cost);
            
            const rawStatus = log.status_link || 'ONLINE';
            const statLink = rawStatus.toString().toUpperCase().replace(/[^A-Z]/g, '');
            const statColor = statLink === 'ONLINE' ? 'text-success' : 'text-danger';

            const row = `
                <tr>
                    <td class="fw-semibold">${formatTanggal(log.created_at)}</td>
                    <td><span class="badge ${badgeClass}">${(log.project || '').toUpperCase()}</span></td>
                    <td class="fw-semibold">${log.service || '-'}</td>
                    <td>${log.sales_order || '-'}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3" 
                                data-bs-toggle="collapse" 
                                data-bs-target="#laciLog${log.id}" 
                                aria-expanded="false"
                                onclick="toggleTombolLaci(this)">
                            <i class="bi bi-chevron-down"></i> Detail
                        </button>
                    </td>
                </tr>

                <tr>
                    <td colspan="5" class="p-0 border-0">
                        <div id="laciLog${log.id}" class="collapse bg-dark"> <div class="p-4 border-bottom border-primary border-opacity-25 shadow-inner">
                                
                                <div class="mb-4 pb-3 border-bottom">
                                    <div class="text-muted small fw-bold mb-1">DETAIL WORK ORDER (WO)</div>
                                    <div class="text-dark fw-semibold text-break fs-6" style="line-height: 1.6;">${log.detail_wo || '-'}</div>
                                </div>

                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">LOKASI SITE</div>
                                            <div class="text-dark fw-bold text-break">${log.customer_site || '-'}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">SERVICE CATEGORY</div>
                                            <div class="text-dark fw-bold">${log.service_category || '-'}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">SERVICE</div>
                                            <div class="text-dark fw-bold">${log.service || '-'}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">SALES ORDER & SALES</div>
                                            <div class="text-dark fw-bold">${log.sales_order || '-'} <br><span class="text-muted fw-normal">${log.sales || '-'}</span></div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">STATUS LINK</div>
                                            <div class="fw-bold ${statColor}">${statLink}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">PARTNER & CIRCUIT ID</div>
                                            <div class="text-dark fw-bold">${log.partner_name || '-'} <br><span class="text-muted fw-normal">${log.circuit_id || '-'}</span></div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">BIAYA BULANAN</div>
                                            <div class="text-danger fw-bold fs-6">${rpMonthly}</div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="text-muted small fw-bold">BIAYA INSTALASI</div>
                                            <div class="text-danger fw-bold fs-6">${rpInst}</div>
                                            <div class="text-muted small fw-bold mt-1">IKG: <span class="text-dark">${rpIkg}</span></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-2 pt-3 border-top">
                                    <div class="text-muted small fw-bold mb-1">NOTES / CATATAN LAIN</div>
                                    <div class="text-dark small fw-semibold text-break">${log.notes || 'Tidak ada catatan.'}</div>
                                </div>

                            </div>
                        </div>
                    </td>
                </tr>
            `;
            logsTbody.innerHTML += row;
        });

    } catch (err) {
        console.error('Error saat load data:', err);
        alert('Gagal memuat halaman detail.');
    }

    // DIREKTORI - UPDATE DI HALAMAN DETAIL (HAPUS BLOK INI)
    const btnUpdateProject = document.getElementById('btnUpdateProject');
    if (btnUpdateProject) {
        btnUpdateProject.addEventListener('click', () => {
            // Kita ambil ID dari URL saat ini (misal: detail.html?id=25)
            const urlParams = new URLSearchParams(window.location.search);
            const linkId = urlParams.get('id');
            
            if (linkId) {
                // Pindah ke halaman update bawa ID-nya
                window.location.href = `update_project.html?id=${linkId}`;
            } else {
                alert("Waduh, ID Project gak ketemu bos!");
            }
        });
    }
});


// =========================================================================
// LOGIKA FORM UPDATE PROJECT (Nambah History Baru)
// =========================================================================

// Fungsi biar formnya langsung keisi data lama pas dibuka
function siapkanDataUpdateProject() {
    if (!window.historyDataList || window.historyDataList.length === 0) return;
    const current = window.historyDataList[0];
    
    // Default Tanggal Eksekusi diset hari ini
    document.getElementById('updTanggal').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('updStatusLink').value = current.status_link || 'Online';
    document.getElementById('updServiceCategory').value = current.service_category || 'Metro';
    document.getElementById('updService').value = current.service || '';
    document.getElementById('updSite').value = current.customer_site || '';
    document.getElementById('updPartner').value = current.partner_id || '';
    document.getElementById('updCircuit').value = current.circuit_id || '';
    document.getElementById('updSO').value = current.sales_order || '';
    document.getElementById('updSales').value = current.sales || '';
    
    document.getElementById('updContractPeriode').value = current.contract_periode || 1;
    document.getElementById('updMonthlyCost').value = current.monthly_cost || 0;
    document.getElementById('updInstCost').value = current.installation_cost || 0;
    document.getElementById('updContractStart').value = formatDateForInput(current.contract_start);
    
    document.getElementById('updWO').value = ''; // Kosongin biar user nulis WO yang baru
    document.getElementById('updNotes').value = current.notes || '';
}

// Proses Kirim Data (Submit)
const formUpdate = document.getElementById('formUpdateProject');
if(formUpdate) {
    formUpdate.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.historyDataList || window.historyDataList.length === 0) return;
        
        const baseData = window.historyDataList[0]; // Ambil Customer ID & Service ID lama

        const payload = {
            customer_id: baseData.customer_id, // Gak bisa diubah
            service_id: baseData.service_id,   // Gak bisa diubah
            
            project: document.getElementById('updProject').value,
            created_at: document.getElementById('updTanggal').value,
            status_link: document.getElementById('updStatusLink').value,
            service_category: document.getElementById('updServiceCategory').value,
            service: document.getElementById('updService').value,
            customer_site: document.getElementById('updSite').value,
            partner_id: document.getElementById('updPartner').value,
            circuit_id: document.getElementById('updCircuit').value,
            sales_order: document.getElementById('updSO').value,
            sales: document.getElementById('updSales').value,
            contract_periode: document.getElementById('updContractPeriode').value || 1,
            monthly_cost: document.getElementById('updMonthlyCost').value || 0,
            installation_cost: document.getElementById('updInstCost').value || 0,
            ikg_cost: 0, // Sengaja disembunyiin biar form gak terlalu panjang, kalau butuh tinggal tambah
            contract_start: document.getElementById('updContractStart').value || null,
            detail_wo: document.getElementById('updWO').value,
            notes: document.getElementById('updNotes').value
        };

        const btnSubmit = formUpdate.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Menyimpan... <span class="spinner-border spinner-border-sm"></span>';
        }

        try {
            const response = await fetch('http://localhost:3000/api/service-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(`Pekerjaan ${payload.project} berhasil ditambahkan ke History!`);
                window.location.reload(); 
            } else {
                const errData = await response.json();
                alert('Gagal mengupdate project: ' + errData.error);
            }
        } catch (err) {
            console.error(err);
            alert('Gagal! Koneksi ke server terputus.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Simpan Project Baru';
            }
        }
    });
}


// =========================================================================
// FUNGSI KHUSUS BUAT NGISI DROPDOWN PARTNER DI FORM EDIT
// =========================================================================
// Ganti fungsi lama jadi ini biar 2 dropdown (Edit & Update) keisi semua
async function loadPartnerDropdownEdit() {
    const selEdit = document.getElementById('editPartner');
    const selUpd = document.getElementById('updPartner');
    try {
        const res = await fetch('http://localhost:3000/api/partners');
        if (res.ok) {
            const partners = await res.json();
            let options = '<option value="">-- Pilih Partner ISP --</option>';
            partners.forEach(p => { options += `<option value="${p.partner_id}">${p.partner_name}</option>`; });
            if (selEdit) selEdit.innerHTML = options;
            if (selUpd) selUpd.innerHTML = options; // Ngisi form update project juga!
        }
    } catch (err) { console.error(err); }
}


// Panggil fungsi ini otomatis saat halaman detail.js dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadPartnerDropdownEdit();
});



// =========================================================================
// FITUR INLINE EDIT (EDIT DI TKP)
// =========================================================================

// Fungsi Saklar Tampilan
function toggleEditMode(isEdit) {
    const modeBaca = document.getElementById('modeBacaDetail');
    const modeEdit = document.getElementById('modeEditDetail');
    
    const btnMulai = document.getElementById('btnMulaiEdit');
    const btnBatal = document.getElementById('btnBatalEdit');
    const btnSimpan = document.getElementById('btnSimpanEdit');

    if (isEdit) {
        // Nyalakan Edit
        modeBaca.classList.add('d-none');
        modeEdit.classList.remove('d-none');
        btnMulai.classList.add('d-none');
        btnBatal.classList.remove('d-none');
        btnSimpan.classList.remove('d-none');
        
        // Isi data ke dalam form otomatis
        isiDataKeFormInline();
    } else {
        // Matikan Edit (Batal)
        modeBaca.classList.remove('d-none');
        modeEdit.classList.add('d-none');
        btnMulai.classList.remove('d-none');
        btnBatal.classList.add('d-none');
        btnSimpan.classList.add('d-none');
    }
}

// Fungsi ini dipanggil dari tombol Edit di Header Atas
function mulaiEditTKP() {
    // 1. Nyalakan mode edit form
    toggleEditMode(true);
    
    // 2. Bikin layar otomatis meluncur (scroll) mulus ke arah form
    const areaEdit = document.getElementById('modeEditDetail');
    if (areaEdit) {
        areaEdit.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Fungsi narik data lama ke form Inline
function isiDataKeFormInline() {
    if (!window.historyDataList || window.historyDataList.length === 0) return;
    const current = window.historyDataList[0];

    document.getElementById('inlSite').value = current.customer_site || '';
    document.getElementById('inlCategory').value = current.service_category || '-';
    document.getElementById('inlService').value = current.service || '';
    document.getElementById('inlStatusLink').value = current.status_link || 'Online';
    
    // Copy dropdown partner yang tadi udah dibikin
    document.getElementById('inlPartner').innerHTML = document.getElementById('updPartner').innerHTML;
    document.getElementById('inlPartner').value = current.partner_id || '';
    
    document.getElementById('inlCircuitId').value = current.circuit_id || '';
    document.getElementById('inlMonthly').value = current.monthly_cost || 0;
    document.getElementById('inlInst').value = current.installation_cost || 0;
    document.getElementById('inlIkg').value = current.ikg_cost || 0;
    
    document.getElementById('inlTanggal').value = formatDateForInput(current.created_at);
    document.getElementById('inlPeriode').value = current.contract_periode || 1;
    document.getElementById('inlStart').value = formatDateForInput(current.contract_start);
    
    document.getElementById('inlSO').value = current.sales_order || '';
    document.getElementById('inlSales').value = current.sales || '';
    document.getElementById('inlWO').value = current.detail_wo || '';
    document.getElementById('inlNotes').value = current.notes || '';
}

// Fungsi Simpan Perubahan
async function simpanEditInline() {
    if (!window.historyDataList || window.historyDataList.length === 0) return;
    const currentId = window.historyDataList[0].id; // Primary Key baris yang diedit
    
    // Bungkus semua data baru
    const payload = {
        customer_site: document.getElementById('inlSite').value,
        service_category: document.getElementById('inlCategory').value,
        service: document.getElementById('inlService').value,
        status_link: document.getElementById('inlStatusLink').value,
        partner_id: document.getElementById('inlPartner').value,
        circuit_id: document.getElementById('inlCircuitId').value,
        monthly_cost: document.getElementById('inlMonthly').value || 0,
        installation_cost: document.getElementById('inlInst').value || 0,
        ikg_cost: document.getElementById('inlIkg').value || 0,
        created_at: document.getElementById('inlTanggal').value,
        contract_periode: document.getElementById('inlPeriode').value || 1,
        contract_start: document.getElementById('inlStart').value || null,
        sales_order: document.getElementById('inlSO').value,
        sales: document.getElementById('inlSales').value,
        detail_wo: document.getElementById('inlWO').value,
        notes: document.getElementById('inlNotes').value
    };

    const btnSimpan = document.getElementById('btnSimpanEdit');
    btnSimpan.innerHTML = 'Menyimpan...';
    btnSimpan.disabled = true;

    try {
        // Tembak ke API PUT yang udah lu punya sebelumnya
        const response = await fetch(`http://localhost:3000/api/service-links/${currentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Mantap! Data berhasil diperbarui langsung di TKP 😎');
            window.location.reload();
        } else {
            const errData = await response.json();
            alert('Gagal nyimpen data: ' + errData.error);
        }
    } catch (err) {
        alert('Koneksi terputus dari server.');
    } finally {
        btnSimpan.innerHTML = '<i class="bi bi-save"></i> Simpan Perubahan';
        btnSimpan.disabled = false;
    }
}


// =========================================================================
// FUNGSI ANIMASI TOMBOL LACI (DETAIL <--> TUTUP)
// =========================================================================
window.toggleTombolLaci = function(btn) {
    // Kasih jeda waktu dikit (50ms) biar Bootstrap selesai ngerubah status aria-expanded
    setTimeout(() => {
        const isBuka = btn.getAttribute('aria-expanded') === 'true';
        
        if (isBuka) {
            // Pas laci kebuka: Ganti teks jadi Tutup & Warna jadi abu-abu
            btn.innerHTML = '<i class="bi bi-chevron-up"></i> Tutup';
            btn.classList.replace('btn-outline-primary', 'btn-secondary');
        } else {
            // Pas laci ketutup: Balik lagi jadi Detail & Warna primary
            btn.innerHTML = '<i class="bi bi-chevron-down"></i> Detail';
            btn.classList.replace('btn-secondary', 'btn-outline-primary');
        }
    }, 50); 
};


// =========================================================
// [DETAIL] FUNGSI PINDAH KE HALAMAN UPDATE PROJECT
// =========================================================
function pindahKeUpdate() {
    // Kita gak usah pusing nyari di URL.
    // Kita ambil aja ID (Primary Key) dari data history terbaru yang udah ke-load di layar!
    if (window.historyDataList && window.historyDataList.length > 0) {
        const currentId = window.historyDataList[0].id;
        
        // Langsung bawa ngacir ke halaman sebelah bawa ID-nya
        window.location.href = `update_project.html?id=${currentId}`;
    } else {
        alert("Waduh, Data Project belum selesai dimuat bos! Tunggu bentar.");
    }
}