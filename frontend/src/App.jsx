import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [aktifSekme, setAktifSekme] = useState('girdi_kontrol');
  
  // Girdi Kontrol State'leri
  const [girdiler, setGirdiler] = useState([]);
  const [malzemeAdi, setMalzemeAdi] = useState('');
  const [teknikOzellikler, setTeknikOzellikler] = useState('');
  const [malzemeTuru, setMalzemeTuru] = useState('');
  const [tedarikciFirma, setTedarikciFirma] = useState('');
  const [miktar, setMiktar] = useState('');
  const [kontrolSonucu, setKontrolSonucu] = useState('Kabul');

  // Doküman Master Listesi State'leri
  const [dokumanlar, setDokumanlar] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [dokumanKodu, setDokumanKodu] = useState('');
  const [dokumanAdi, setDokumanAdi] = useState('');
  const [kategori, setKategori] = useState('Talimat');
  const [format, setFormat] = useState('Word');
  
  // Dosyalar için ayrı state'ler
  const [secilenPdfDosya, setSecilenPdfDosya] = useState(null);
  const [secilenOrijinalDosya, setSecilenOrijinalDosya] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Dosya adındaki Türkçe karakterleri ve boşlukları temizleyen yardımcı fonksiyon
  const dosyaadiniTemizle = (isim) => {
    return isim
      .replace(/ç/g, "c").replace(/Ç/g, "C")
      .replace(/ğ/g, "g").replace(/Ğ/g, "G")
      .replace(/ı/g, "i").replace(/İ/g, "I")
      .replace(/ö/g, "o").replace(/Ö/g, "O")
      .replace(/ş/g, "s").replace(/Ş/g, "S")
      .replace(/ü/g, "u").replace(/Ü/g, "U")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
  };

  // Verileri Çekme
  const verileriGetir = async () => {
    const { data: girdiData } = await supabase
      .from('girdi_kontrol')
      .select('*')
      .order('id', { ascending: false });
    if (girdiData) setGirdiler(girdiData);

    const { data: dokumanData } = await supabase
      .from('dokuman_master')
      .select('*')
      .order('id', { ascending: false });
    if (dokumanData) setDokumanlar(dokumanData);
  };

  useEffect(() => {
    verileriGetir();
  }, []);

  // Girdi Ekleme
  const yeniGirdiEkle = async (e) => {
    e.preventDefault();
    if (!malzemeAdi || !tedarikciFirma) {
      alert("Lütfen Malzeme Adı ve Tedarikçi Firma alanlarını doldurun.");
      return;
    }

    const { error } = await supabase.from('girdi_kontrol').insert([
      { malzeme_adi: malzemeAdi, teknik_ozellikler: teknikOzellikler, malzeme_turu: malzemeTuru, tedarikci_firma: tedarikciFirma, miktar: miktar ? Number(miktar) : 0, kontrol_sonucu: kontrolSonucu }
    ]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert("Girdi kontrol kaydı eklendi!");
      setMalzemeAdi(''); setTeknikOzellikler(''); setMalzemeTuru(''); setTedarikciFirma(''); setMiktar('');
      verileriGetir();
    }
  };

  // Girdi Silme
  const girdiSil = async (id) => {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await supabase.from('girdi_kontrol').delete().eq('id', id);
      verileriGetir();
    }
  };

  // Yeni Doküman Ekleme veya Otomatik Revizyon Artırarak Güncelleme
  const yeniDokumanEkle = async (e) => {
    e.preventDefault();
    if (!dokumanKodu || !dokumanAdi) {
      alert("Lütfen Doküman Kodu ve Adını doldurun.");
      return;
    }

    setYukleniyor(true);
    let pdfUrl = null;
    let orijinalUrl = null;

    try {
      // 1. Aynı doküman kodundan daha önce var mı kontrol edelim (Revizyon mantığı için)
      const mevcutDokumanlar = dokumanlar.filter(d => d.dokuman_kodu.toLowerCase() === dokumanKodu.toLowerCase());
      let yeniRevizyonNo = "00";

      if (mevcutDokumanlar.length > 0) {
        // En yüksek revizyon numarasını bul ve 1 artır (Örn: "00" -> "01", "01" -> "02")
        const enYuksekRev = mevcutDokumanlar.reduce((max, doc) => {
          return parseInt(doc.revizyon_no || "0") > parseInt(max || "0") ? doc.revizyon_no : max;
        }, "00");
        
        yeniRevizyonNo = String(parseInt(enYuksekRev) + 1).padStart(2, '0');
      }

      // 2. PDF Dosyasını Yükle
      if (secilenPdfDosya) {
        const temizAd = dosyaadiniTemizle(secilenPdfDosya.name);
        const pdfAdi = `pdf_${Date.now()}_${temizAd}`;
        const { error: pdfError } = await supabase.storage
          .from('dokumanlar')
          .upload(pdfAdi, secilenPdfDosya);

        if (pdfError) throw new Error("PDF yükleme hatası: " + pdfError.message);

        const { data: pdfUrlData } = supabase.storage
          .from('dokumanlar')
          .getPublicUrl(pdfAdi);
        pdfUrl = pdfUrlData.publicUrl;
      }

      // 3. Orijinal Dosyayı Yükle
      if (secilenOrijinalDosya) {
        const temizAd = dosyaadiniTemizle(secilenOrijinalDosya.name);
        const orijinalAdi = `orijinal_${Date.now()}_${temizAd}`;
        const { error: orijinalError } = await supabase.storage
          .from('dokumanlar')
          .upload(orijinalAdi, secilenOrijinalDosya);

        if (orijinalError) throw new Error("Orijinal dosya yükleme hatası: " + orijinalError.message);

        const { data: orijinalUrlData } = supabase.storage
          .from('dokumanlar')
          .getPublicUrl(orijinalAdi);
        orijinalUrl = orijinalUrlData.publicUrl;
      }

      // 4. Veritabanına Yeni Revizyon Olarak Kaydet
      const { error: dbError } = await supabase.from('dokuman_master').insert([
        { 
          dokuman_kodu: dokumanKodu.toUpperCase(), 
          dokuman_adi: dokumanAdi, 
          kategori: kategori, 
          format: format, 
          revizyon_no: yeniRevizyonNo, 
          yayin_tarihi: new Date().toISOString().split('T')[0],
          dosya_url: pdfUrl,
          orijinal_dosya_url: orijinalUrl
        }
      ]);

      if (dbError) throw dbError;

      alert(`Doküman başarıyla kaydedildi! (Revizyon: Rev.${yeniRevizyonNo})`);
      setDokumanKodu(''); 
      setDokumanAdi(''); 
      setSecilenPdfDosya(null);
      setSecilenOrijinalDosya(null);
      verileriGetir();

    } catch (err) {
      alert(err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  // Doküman Silme
  const dokumanSil = async (id) => {
    if (window.confirm("Bu dokümanı master listeden silmek istiyor musunuz?")) {
      await supabase.from('dokuman_master').delete().eq('id', id);
      verileriGetir();
    }
  };

  // Arama filtresi
  const filtrelenmisDokumanlar = dokumanlar.filter(doc => 
    doc.dokuman_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    doc.dokuman_kodu.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    doc.kategori.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    (doc.format && doc.format.toLowerCase().includes(aramaMetni.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f6f9', margin: 0 }}>
      
      {/* Sol Menü */}
      <div style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <span style={{ backgroundColor: '#2563eb', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', marginRight: '10px' }}>KYS</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Kalite ERP</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setAktifSekme('girdi_kontrol')}
              style={{
                background: aktifSekme === 'girdi_kontrol' ? '#2563eb' : 'transparent',
                color: 'white', border: 'none', padding: '12px 15px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
              }}
            >
              📊 Girdi Kontrol Listesi
            </button>

            <button 
              onClick={() => setAktifSekme('dokuman_master')}
              style={{
                background: aktifSekme === 'dokuman_master' ? '#2563eb' : 'transparent',
                color: 'white', border: 'none', padding: '12px 15px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
              }}
            >
              📁 Doküman Master Listesi
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '15px', fontSize: '14px', color: '#94a3b8' }}>
          Kullanıcı: hazar@kalite.com
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {aktifSekme === 'girdi_kontrol' ? (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 5px 0' }}>Girdi Kontrol ve Malzeme Kabul</h1>
              <p style={{ color: '#64748b', margin: 0 }}>Gelen malzeme kayıtları ve kontrol sonuçları</p>
            </div>

            {/* Yeni Girdi Formu */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>Yeni Girdi Kontrol Kaydı Tanımla</h3>
              <form onSubmit={yeniGirdiEkle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Malzeme Adı</label>
                  <input type="text" placeholder="Örn: Cıvata" value={malzemeAdi} onChange={(e) => setMalzemeAdi(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Teknik Özellikler</label>
                  <input type="text" placeholder="Örn: M5x20" value={teknikOzellikler} onChange={(e) => setTeknikOzellikler(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Malzeme Türü</label>
                  <input type="text" placeholder="Örn: Bağlantı" value={malzemeTuru} onChange={(e) => setMalzemeTuru(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Tedarikçi Firma</label>
                  <input type="text" placeholder="Örn: Kartal Cıvata" value={tedarikciFirma} onChange={(e) => setTedarikciFirma(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Miktar</label>
                  <input type="number" placeholder="Örn: 100" value={miktar} onChange={(e) => setMiktar(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Kontrol Sonucu</label>
                  <select value={kontrolSonucu} onChange={(e) => setKontrolSonucu(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: 'white' }}>
                    <option value="Kabul">Kabul</option>
                    <option value="Şartlı Kabul">Şartlı Kabul</option>
                    <option value="Ret">Ret</option>
                  </select>
                </div>
                <div>
                  <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Kayıt Ekle</button>
                </div>
              </form>
            </div>

            {/* Girdi Listesi Tablosu */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>Girdi Kontrol Kayıtları</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Malzeme Adı</th>
                    <th style={{ padding: '10px' }}>Teknik Özellikler</th>
                    <th style={{ padding: '10px' }}>Malzeme Türü</th>
                    <th style={{ padding: '10px' }}>Tedarikçi Firma</th>
                    <th style={{ padding: '10px' }}>Miktar</th>
                    <th style={{ padding: '10px' }}>Sonuç</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {girdiler.length > 0 ? (
                    girdiler.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>{item.id}</td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.malzeme_adi}</td>
                        <td style={{ padding: '12px' }}>{item.teknik_ozellikler}</td>
                        <td style={{ padding: '12px' }}>{item.malzeme_turu}</td>
                        <td style={{ padding: '12px' }}>{item.tedarikci_firma}</td>
                        <td style={{ padding: '12px' }}>{item.miktar}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            backgroundColor: item.kontrol_sonucu === 'Kabul' ? '#dcfce7' : '#fee2e2',
                            color: item.kontrol_sonucu === 'Kabul' ? '#166534' : '#991b1b',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {item.kontrol_sonucu}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => girdiSil(item.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Sil</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Henüz kayıtlı girdi kontrol verisi bulunmuyor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 5px 0' }}>Doküman Master Listesi</h1>
              <p style={{ color: '#64748b', margin: 0 }}>Prosedürler, talimatlar ve formlar arşivi (Otomatik Revizyon Takipli)</p>
            </div>

            {/* Arama ve Yeni Doküman Ekleme Alanı */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              
              {/* Arama Kutusu */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>🔍 Doküman Arama</h3>
                <input 
                  type="text" 
                  placeholder="Talimat adı, kodu, format veya kategori yazın..." 
                  value={aramaMetni} 
                  onChange={(e) => setAramaMetni(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', marginBottom: 0 }}>Aynı kodla yeni dosya yüklerseniz sistem otomatik olarak revizyonu artırır (Örn: Rev.00 -&gt; Rev.01).</p>
              </div>

              {/* Yeni Doküman / Revizyon Ekleme Formu */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>➕ Yeni Doküman / Revizyon Ekle</h3>
                <form onSubmit={yeniDokumanEkle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Doküman Kodu (Örn: TL-01)" value={dokumanKodu} onChange={(e) => setDokumanKodu(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="Doküman Adı" value={dokumanAdi} onChange={(e) => setDokumanAdi(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                    <option value="Talimat">Talimat</option>
                    <option value="Prosedür">Prosedür</option>
                    <option value="Form">Form</option>
                    <option value="Plan">Plan</option>
                  </select>
                  <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                    <option value="Word">Word (.docx)</option>
                    <option value="Excel">Excel (.xlsx)</option>
                    <option value="PowerPoint">PowerPoint (.pptx)</option>
                  </select>
                  
                  {/* PDF Görüntüleme Dosyası */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0369a1', marginBottom: '2px' }}>📖 Görüntüleme İçin PDF Dosyası:</label>
                    <input type="file" accept=".pdf" onChange={(e) => setSecilenPdfDosya(e.target.files[0])} style={{ width: '100%', fontSize: '12px' }} />
                  </div>

                  {/* Orijinal Düzenleme Dosyası */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#166534', marginBottom: '2px' }}>✏️ Düzenleme İçin Orijinal Dosya (Word/Excel):</label>
                    <input type="file" onChange={(e) => setSecilenOrijinalDosya(e.target.files[0])} style={{ width: '100%', fontSize: '12px' }} />
                  </div>

                  <button type="submit" disabled={yukleniyor} style={{ gridColumn: 'span 2', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {yukleniyor ? 'Yükleniyor...' : 'Kaydet ve Revizyonu Yönet'}
                  </button>
                </form>
              </div>

            </div>

            {/* Doküman Listesi Tablosu */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>Kayıtlı Dokümanlar ({filtrelenmisDokumanlar.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>Doküman Kodu</th>
                    <th style={{ padding: '10px' }}>Doküman Adı</th>
                    <th style={{ padding: '10px' }}>Kategori</th>
                    <th style={{ padding: '10px' }}>Format</th>
                    <th style={{ padding: '10px' }}>Revizyon</th>
                    <th style={{ padding: '10px' }}>Yayın Tarihi</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Dosya İşlemleri</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Sil</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmisDokumanlar.length > 0 ? (
                    filtrelenmisDokumanlar.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{doc.dokuman_kodu}</td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{doc.dokuman_adi}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                            {doc.kategori}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            backgroundColor: doc.format === 'Excel' ? '#dcfce7' : doc.format === 'PowerPoint' ? '#ffedd5' : '#e0e7ff',
                            color: doc.format === 'Excel' ? '#166534' : doc.format === 'PowerPoint' ? '#9a3412' : '#3730a3',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {doc.format || 'Word'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Rev.{doc.revizyon_no || '00'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{doc.yayin_tarihi}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {/* Görüntüle Butonu (PDF) */}
                            {doc.dosya_url ? (
                              <a 
                                href={doc.dosya_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ backgroundColor: '#0284c7', color: 'white', padding: '6px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold' }}
                                title="Tarayıcıda PDF Olarak Görüntüle"
                              >
                                👁️ Görüntüle
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>PDF Yok</span>
                            )}

                            {/* Düzenle / İndir Butonu (Orijinal) */}
                            {doc.orijinal_dosya_url ? (
                              <a 
                                href={doc.orijinal_dosya_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                download
                                style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold' }}
                                title="Orijinal Formatında İndir ve Düzenle"
                              >
                                📥 Düzenle ({doc.format || 'Dosya'})
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Orijinal Yok</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => dokumanSil(doc.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '11px' }}>Sil</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Aramanıza uygun doküman bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}