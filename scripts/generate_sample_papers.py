import os

def create_simple_pdf(filename, title, lines):
    # Construct minimal valid PDF-1.4
    stream_content = f"BT /F1 14 Tf 50 760 Td ({escape_pdf(title)}) Tj ET\n"
    y = 720
    for line in lines:
        if line.strip() == "":
            y -= 14
            continue
        stream_content += f"BT /F1 10 Tf 50 {y} Td ({escape_pdf(line)}) Tj ET\n"
        y -= 18
        if y < 60:
            break
    
    stream_bytes = stream_content.encode('latin1')
    stream_len = len(stream_bytes)
    
    objs = [
        b"%PDF-1.4\n",
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
        f"4 0 obj << /Length {stream_len} >> stream\n".encode('latin1') + stream_bytes + b"\nendstream\nendobj\n",
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
    ]
    
    offsets = [0]
    cur = 0
    full_body = b""
    for o in objs:
        full_body += o
        cur += len(o)
        offsets.append(cur)
    
    xref_table = b"xref\n0 6\n0000000000 65535 f \n"
    for i in range(5):
        xref_table += f"{offsets[i]:010d} 00000 n \n".encode('latin1')
    
    xref_start = len(full_body)
    tail = xref_table + f"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode('latin1')
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(full_body + tail)
    print(f"File created: {filename}")

def escape_pdf(text):
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

os.makedirs('contoh_naskah', exist_ok=True)

# 1. Title Page (Beridentitas)
create_simple_pdf(
    'contoh_naskah/1_Title_Page_Beridentitas.pdf',
    'Title Page: Optimasi Penjadwalan Tugas Cloud',
    [
        'Judul Lengkap: Optimasi Penjadwalan Tugas Cloud Menggunakan Algoritma Genetika',
        '',
        'Penulis Utama: Dr. Budi Santoso (Korespondensi)',
        'Afiliasi: Departemen Ilmu Komputer, Universitas Indonesia, Depok, Indonesia',
        'Email: budi.santoso@ui.ac.id | ORCID: 0000-0002-1825-0097',
        '',
        'Penulis Kedua: Ir. Siti Aminah, M.T.',
        'Afiliasi: Sekolah Teknik Elektro dan Informatika, Institut Teknologi Bandung',
        'Email: siti.aminah@itb.ac.id',
        '',
        'Pendanaan: Riset didanai oleh Hibah Penelitian Fundamental UI Kontrak No. 102/2026.',
        'Pernyataan Konflik Kepentingan: Penulis menyatakan tidak memiliki konflik kepentingan.'
    ]
)

# 2. Naskah Bocor Identitas (Untuk test AI mendeteksi bocor)
create_simple_pdf(
    'contoh_naskah/2_Naskah_BOCOR_Identitas.pdf',
    'Optimasi Penjadwalan Tugas Cloud Menggunakan Algoritma Genetika',
    [
        'Penulis: Dr. Budi Santoso, Laboratorium Komputasi Awan UI',
        'Kontak: budi.santoso@ui.ac.id | Departemen Ilmu Komputer UI Depok',
        '',
        'ABSTRAK',
        'Penelitian ini mengusulkan algoritma genetika hibrida untuk optimasi alokasi',
        'sumber daya cloud computing di Universitas Indonesia. Eksperimen di lab UI',
        'menunjukkan penghematan latensi sebesar 24 persen dibanding algoritma standar.',
        'Kata Kunci: Cloud Computing, Algoritma Genetika, Penjadwalan, UI Depok',
        '',
        '1. PENDAHULUAN',
        'Kebutuhan komputasi awan meningkat drastis seiring perkembangan machine learning.',
        'Kami mengembangkan sistem ini di kampus UI untuk mendukung ribuan node server.',
        '',
        '2. METODOLOGI & EKSPERIMEN',
        'Dataset pengujian diambil dari log server UI selama periode Januari-Maret 2026.',
        'Algoritma dioptimalkan dengan pembobotan fitness multi-objektif.',
        '',
        'UCAPAN TERIMA KASIH (ACKNOWLEDGMENTS)',
        'Penulis mengucapkan terima kasih kepada Rektor UI atas fasilitas komputasi superkomputer.'
    ]
)

# 3. Naskah Anonim Bersih (Untuk test lolos verifikasi AI)
create_simple_pdf(
    'contoh_naskah/3_Naskah_ANONIM_Bersih.pdf',
    'Optimasi Penjadwalan Tugas Cloud Menggunakan Algoritma Genetika',
    [
        'Naskah Anonim (Double-Blind Peer Review Copy - Bebas Identitas)',
        '',
        'ABSTRAK',
        'Penelitian ini mengusulkan algoritma genetika hibrida untuk optimasi alokasi',
        'sumber daya cloud computing berskala besar. Model multi-objektif dirancang untuk',
        'meminimalkan makespan dan konsumsi energi pusat data. Hasil eksperimen simulasi',
        'menunjukkan penghematan latensi hingga 24.3 persen dibanding algoritma round-robin.',
        'Kata Kunci: Cloud Computing, Algoritma Genetika, Optimasi Penjadwalan, Makespan',
        '',
        '1. PENDAHULUAN',
        'Efisiensi alokasi beban kerja pada infrastruktur awan terdistribusi menjadi tantangan',
        'kritis dalam sistem komputasi modern. Keterlambatan respon antrean seringkali',
        'disebabkan oleh distribusi komputasi yang tidak seimbang antar node.',
        '',
        '2. METODOLOGI PENELITIAN',
        'Formulasi matematika disusun menggunakan representasi kromosom berbasis urutan tugas.',
        'Operator mutasi adaptif diimplementasikan untuk mencegah konvergensi dini.',
        '',
        '3. HASIL DAN PEMBAHASAN',
        'Pengujian simulasi dilakukan terhadap 1000 tugas dengan 50 unit virtual machine.',
        'Algoritma yang diusulkan menghasilkan konvergensi optimal pada generasi ke-45.',
        '',
        '4. KESIMPULAN',
        'Pendekatan hibrida terbukti efektif meningkatkan efisiensi penjadwalan tanpa beban komputasi berlebih.'
    ]
)
