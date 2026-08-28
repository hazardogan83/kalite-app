import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aktifSekme, setAktifSekme] = useState('dof'); // 'dof' veya 'dokumanlar'

  // DÖF Durumları
  const [dofListesi, setDofListesi] = useState([]);
  const [tanim, setTanim] = useState('');
  const [sorumlu, setSorumlu] = useState('');

  // Örnek Doküman Listesi (Harici diskin geldiğinde gerçek dosyalar buraya bağlanacak)
  const [dokumanlar, setDokumanlar] = useState([
    { id: 1, kod: 'FRM-014', ad: 'Kalibrasyon Takip Listesi', tip: 'Excel (.xlsx)', kategori: 'Kalibrasyon', tarih: '2026-08-20' },
    { id: 2, kod: 'PRC-003', ad: 'DÖF ve 8D Yönetim Prosedürü', tip: 'Word (.docx)', kategori: 'DÖF / 8D', tarih: '2026-08-15' },
    { id: 3, kod: 'PRN-001', ad: 'Kalite Oryantasyon Sunumu', tip: 'PowerPoint (.pptx)', kategori: 'Eğitim', tarih: '2026-08-10' },
    { id: 4, kod: 'TLM-008', ad: 'Girdi Kontrol Talimatı', tip: 'PDF (.pdf)', kategori: 'Girdi Kontrol', tarih: '2026-08-01' },
  ]);

  const [yeniDokuman, setYeniDokuman] = useState({ kod: '', ad: '', tip: 'Excel (.xlsx)', kategori: 'Genel' });

  // Veritabanından DÖF Kayıtlarını Çekme
  const fetchDoflar = async () => {
    const { data, error } = await supabase.from('dof_kayitlari').select('*').order('id', { ascending: false });
    if (!error && data) {
      setDofListesi(data);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDoflar();
    }
  }, [isLoggedIn]);

  // Yeni DÖF Ekleme
  const handleDofEkle = async (e) => {
    e.preventDefault();
    if (!tanim || !sorumlu) return;

    const yeniNo = `DOF-2026-0${dofListesi.length + 1}`;
    const { error } = await supabase.from('dof_kayitlari').insert([
      { dof_no: yeniNo, tanim, sorumlu, durum: 'Devam Ediyor' }
    ]);

    if (!error) {
      setTanim('');
      setSorumlu('');
      fetchDoflar();
    }
  };

  // DÖF Kapatma
  const handleDofKapat = async (id) => {
    const { error } = await supabase.from('dof_kayitlari').update({ durum: 'Kapatıldı' }).eq('id', id);
    if (!error) fetchDoflar();
  };

  // DÖF Silme
  const handleDofSil = async (id) => {
    const { error } = await supabase.from('dof_kayitlari').delete().eq('id', id);
    if (!error) fetchDoflar();
  };

  // Doküman Ekleme
  const handleDokumanEkle = (e) => {
    e.preventDefault();
    if (!yeniDokuman.kod || !yeniDokuman.ad) return;

    const eklenecek = {
      id: Date.now(),
      ...yeniDokuman,
      tarih: new Date().toISOString().split('T')[0]
    };

    setDokumanlar([eklenecek, ...dokumanlar]);
    setYeniDokuman({ kod: '', ad: '', tip: 'Excel (.xlsx)', kategori: 'Genel' });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="bg-blue-600 text-white w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xl shadow">
              KYS
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Kalite Yönetim Sistemi</h2>
            <p className="text-slate-500 text-sm mt-1">ERP Entegre Modülü Giriş Paneli</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta Adresi</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@kalite.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition shadow-md"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sol Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg font-bold">KYS</div>
            <span className="font-semibold text-lg tracking-wide">Kalite ERP</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setAktifSekme('dof')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg font-medium transition ${
                aktifSekme === 'dof' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>⚠️ DÖF / 8D Takibi</span>
            </button>

            <button
              onClick={() => setAktifSekme('dokumanlar')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg font-medium transition ${
                aktifSekme === 'dokumanlar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>📁 Doküman Yönetimi</span>
            </button>
          </nav>
        </div>

        <button
          onClick={() => setIsLoggedIn(false)}
          className="text-slate-400 hover:text-white text-sm font-medium text-left pt-4 border-t border-slate-800"
        >
          🚪 Çıkış Yap
        </button>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {aktifSekme === 'dof' ? 'DÖF & 8D Süreç Yönetimi' : 'Kalite Sistem Dokümanları'}
            </h1>
            <p className="text-slate-500 text-sm">Sistem aktif kayıt ve belge merkezi</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 shadow-sm">
            Kullanıcı: <span className="font-semibold text-slate-800">{email}</span>
          </div>
        </header>

        {/* --- DÖF MODÜLÜ --- */}
        {aktifSekme === 'dof' && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Yeni DÖF Kaydı Oluştur</h3>
              <form onSubmit={handleDofEkle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Uygunsuzluk Tanımı (Örn: Tolerans Sapması)"
                  value={tanim}
                  onChange={(e) => setTanim(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Sorumlu Birim/Kişi"
                  value={sorumlu}
                  onChange={(e) => setSorumlu(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition shadow-sm"
                >
                  + Kaydı Veritabanına Ekle
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Canlı Veritabanı DÖF Kayıtları</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                      <th className="pb-3 font-semibold">No</th>
                      <th className="pb-3 font-semibold">Süreç / Tanım</th>
                      <th className="pb-3 font-semibold">Sorumlu</th>
                      <th className="pb-3 font-semibold">Durum</th>
                      <th className="pb-3 font-semibold text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {dofListesi.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-400">
                          Henüz veritabanında kayıt yok.
                        </td>
                      </tr>
                    ) : (
                      dofListesi.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 font-medium">{item.dof_no}</td>
                          <td className="py-3">{item.tanim}</td>
                          <td className="py-3">{item.sorumlu}</td>
                          <td className="py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                item.durum === 'Kapatıldı'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.durum}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {item.durum !== 'Kapatıldı' && (
                              <button
                                onClick={() => handleDofKapat(item.id)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition"
                              >
                                Kapat
                              </button>
                            )}
                            <button
                              onClick={() => handleDofSil(item.id)}
                              className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- DOKÜMAN YÖNETİMİ MODÜLÜ --- */}
        {aktifSekme === 'dokumanlar' && (
          <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Sisteme Yeni Doküman Tanımla</h3>
              <form onSubmit={handleDokumanEkle} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Doküman Kodu (Örn: FRM-015)"
                  value={yeniDokuman.kod}
                  onChange={(e) => setYeniDokuman({ ...yeniDokuman, kod: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Doküman Adı (Örn: Ölçüm Formu)"
                  value={yeniDokuman.ad}
                  onChange={(e) => setYeniDokuman({ ...yeniDokuman, ad: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <select
                  value={yeniDokuman.tip}
                  onChange={(e) => setYeniDokuman({ ...yeniDokuman, tip: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option>Excel (.xlsx)</option>
                  <option>Word (.docx)</option>
                  <option>PowerPoint (.pptx)</option>
                  <option>PDF (.pdf)</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition shadow-sm"
                >
                  + Doküman Ekle
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Aktif Kalite Dokümanları Listesi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                      <th className="pb-3 font-semibold">Kod</th>
                      <th className="pb-3 font-semibold">Doküman Adı</th>
                      <th className="pb-3 font-semibold">Dosya Formatı</th>
                      <th className="pb-3 font-semibold">Kategori</th>
                      <th className="pb-3 font-semibold text-right">Erişim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {dokumanlar.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-3 font-semibold text-blue-600">{doc.kod}</td>
                        <td className="py-3 font-medium text-slate-800">{doc.ad}</td>
                        <td className="py-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">
                            {doc.tip}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{doc.kategori}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => alert(`${doc.ad} dosyası açılıyor/indirilıyor... (Bilgisayardan çalıştırma komutu buraya bağlanacak)`)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                          >
                            📄 Dosyayı Aç
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}