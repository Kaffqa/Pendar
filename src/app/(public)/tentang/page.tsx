// src/app/(public)/tentang/page.tsx
import { BookOpen, Shield, Users, Mail } from 'lucide-react';

export default function TentangPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-slate-200 pb-8 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tentang Pendar
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Visi, misi, dan dewan redaksi jurnal ilmiah berintegritas tinggi.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Fokus dan Ruang Lingkup
          </h2>
          <p className="text-xs text-slate-600">
            <strong>Pendar: Jurnal Rekayasa dan Sains Komputasi</strong> mempublikasikan artikel hasil penelitian orisinal dan kajian mendalam di bidang ilmu komputer, sistem informasi, kecerdasan artifisial, dan rekayasa perangkat lunak.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Kebijakan Open Access
          </h2>
          <p className="text-xs text-slate-600">
            Pendar menjunjung tinggi prinsip bahwa riset ilmiah yang didanai publik harus dapat diakses secara bebas oleh masyarakat luas. Tidak ada biaya berlangganan untuk membaca dan mengunduh artikel terbitan kami.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Etika Publikasi & Integritas Peer Review
          </h2>
          <p className="text-xs text-slate-600">
            Setiap naskah yang masuk dievaluasi melalui sistem Double-Blind Peer Review dengan dukungan otomatisasi sanitasi metadata, sehingga peninjau dan penulis saling tidak mengetahui identitas satu sama lain demi menjamin objektivitas akademis murni.
          </p>
        </section>

        <section className="pt-6 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Kontak Redaksi: redaksi@pendar.ac.id</span>
          </div>
        </section>
      </div>
    </div>
  );
}
