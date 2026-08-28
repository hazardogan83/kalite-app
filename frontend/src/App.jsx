import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [oturumAcildi, setOturumAcildi] = useState(false);
  const [girisEmail, setGirisEmail] = useState('hazar@minyaturmakina.com');
  const [girisSifre, setGirisSifre] = useState('123456');

  const [aktifSekme, setAktifSekme] = useState('dashboard');
  const [acikMenu, setAcikMenu] = useState({ kalite: true, depo: false, uretim: false, siparis: false, yonetim: false });

  // Girdi Kontrol State'leri
  const [girdiler, setGirdiler] = useState([]);
  const [malzemeAdi, setMalzemeAdi] = useState('');
  const [teknikOzellikler, setTeknikOzellikler] = useState('');
  const [malzemeTuru, setMalzemeTuru] = useState('');
  const [tedarikciFirma, setTedarikciFirma] = useState('');
  const [irsaliyeNo, setIrsaliyeNo] = useState('');
  const [partiNo, setPartiNo] = useState('');
  const [miktar, setMiktar] = useState('');
  const [kontrolSonucu, setKontrolSonucu] = useState('Kabul');
  const [kontrolEden, setKontrolEden] = useState('');

  // Doküman Master State'leri (Yerel Yol Destekli)
  const [dokumanlar, setDokumanlar] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [dokumanKodu, setDokumanKodu] = useState('');
  const [dokumanAdi, setDokumanAdi] = useState('');
  const [kategori, setKategori] = useState('Talimat');
  const [format, setFormat] = useState('Word');
  const [yerelDosyaYolu, setYerelDosyaYolu] = useState('');

  const verileriGetir = async () => {
    const { data: girdiData } = await supabase.from('girdi_kontrol').select('*').order('id', { ascending: false });
    if (girdiData) setGirdiler(girdiData);

    const { data: dokumanData } = await supabase.from('dokuman_master').select('*').order('id', { ascending: false });
    if (dokumanData) setDokumanlar(dokumanData);
  };

  useEffect(() => {
    if (oturumAcildi) {
      verileriGetir();
    }
  }, [oturumAcildi]);

  const handleGiris = (e) => {
    e.preventDefault();
    if (girisEmail && girisSifre) {
      setOturumAcildi(true);
      setAktifSekme('dashboard');
    } else {
      alert("Lütfen e-posta ve şifre giriniz.");
    }
  };

  const menuToggle = (menuAdi) => {
    setAcikMenu(prev => ({ ...prev, [menuAdi]: !prev[menuAdi] }));
  };

  const yeniGirdiEkle = async (e) => {
    e.preventDefault();
    if (!malzemeAdi || !tedarikciFirma) {
      alert("Lütfen Malzeme Adı ve Tedarikçi Firma alanlarını doldurun.");
      return;
    }

    const { error } = await supabase.from('girdi_kontrol').insert([
      { 
        malzeme_adi: malzemeAdi, 
        teknik_ozellikler: teknikOzellikler, 
        malzeme_turu: malzemeTuru, 
        tedarikci_firma: tedarikciFirma, 
        irsaliye_no: irsaliyeNo,
        parti_no: partiNo,
        miktar: miktar ? Number(miktar) : 0, 
        kontrol_sonucu: kontrolSonucu,
        kontrol_eden: kontrolEden || 'Depo Sorumlusu'
      }
    ]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert("Girdi kontrol kaydı eklendi!");
      setMalzemeAdi(''); setTeknikOzellikler(''); setMalzemeTuru(''); setTedarikciFirma(''); setIrsaliyeNo(''); setPartiNo(''); setMiktar(''); setKontrolEden('');
      verileriGetir();
    }
  };

  const girdiSil = async (id) => {
    if (window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      await supabase.from('girdi_kontrol').delete().eq('id', id);
      verileriGetir();
    }
  };

  const yeniDokumanEkle = async (e) => {
    e.preventDefault();
    if (!dokumanKodu || !dokumanAdi) {
      alert("Lütfen Doküman Kodu ve Adını doldurun.");
      return;
    }

    const mevcutDokumanlar = dokumanlar.filter(d => d.dokuman_kodu.toLowerCase() === dokumanKodu.toLowerCase());
    let yeniRevizyonNo = "00";

    if (mevcutDokumanlar.length > 0) {
      const enYuksekRev = mevcutDokumanlar.reduce((max, doc) => {
        return parseInt(doc.revizyon_no || "0") > parseInt(max || "0") ? doc.revizyon_no : max;
      }, "00");
      yeniRevizyonNo = String(parseInt(enYuksekRev) + 1).padStart(2, '0');
    }

    const { error } = await supabase.from('dokuman_master').insert([
      { 
        dokuman_kodu: dokumanKodu.toUpperCase(), 
        dokuman_adi: dokumanAdi, 
        kategori: kategori, 
        format: format, 
        revizyon_no: yeniRevizyonNo, 
        yayin_tarihi: new Date().toISOString().split('T')[0],
        orijinal_dosya_url: yerelDosyaYolu 
      }
    ]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert(`Doküman başarıyla kaydedildi! (Revizyon: Rev.${yeniRevizyonNo})`);
      setDokumanKodu(''); 
      setDokumanAdi(''); 
      setYerelDosyaYolu('');
      verileriGetir();
    }
  };

  const dokumanSil = async (id) => {
    if (window.confirm("Bu dokümanı master listeden silmek istiyor musunuz?")) {
      await supabase.from('dokuman_master').delete().eq('id', id);
      verileriGetir();
    }
  };

  const filtrelenmisDokumanlar = dokumanlar.filter(doc => 
    doc.dokuman_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    doc.dokuman_kodu.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    doc.kategori.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    (doc.format && doc.format.toLowerCase().includes(aramaMetni.toLowerCase()))
  );

  if (!oturumAcildi) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1b4b', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2e1065', letterSpacing: '-0.5px' }}>
              MİNYATÜR <span style={{ color: '#581c87' }}>MAKİNA</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>
              Robot Sistemleri ve Otomasyon ERP / KYS
            </div>
          </div>

          <form onSubmit={handleGiris} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Kullanıcı E-posta</label>
              <input type="email" value={girisEmail} onChange={(e) => setGirisEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>Şifre</label>
              <input type="password" value={girisSifre} onChange={(e) => setGirisSifre(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
            </div>
            <button type="submit" style={{ backgroundColor: '#581c87', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '14px' }}>
              Güvenli Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f6f9', margin: 0 }}>
      
      {/* SOL MENÜ */}
      <div style={{ width: '280px', backgroundColor: '#1e1b4b', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', overflowY: 'auto' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #312e81', paddingBottom: '15px' }}>
            <div style={{ backgroundColor: '#581c87', color: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', marginRight: '10px', fontSize: '14px' }}>MM</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MİNYATÜR MAKİNA</div>
              <div style={{ fontSize: '11px', color: '#c084fc' }}>ERP & Kalite Yönetimi</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setAktifSekme('dashboard')}
              style={{ background: aktifSekme === 'dashboard' ? '#581c87' : 'transparent', color: 'white', border: 'none', padding: '12px 14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              🏠 Ana Sayfa / Kurumsal
            </button>

            {/* Kalite Yönetimi */}
            <div>
              <button 
                onClick={() => menuToggle('kalite')}
                style={{ width: '100%', background: 'transparent', color: '#cbd5e1', border: 'none', padding: '12px 14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🛡️ Kalite Yönetimi (KYS)</span>
                <span style={{ fontSize: '12px' }}>{acikMenu.kalite ? '▼' : '▶'}</span>
              </button>

              {acikMenu.kalite && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '20px', marginTop: '4px' }}>
                  <button 
                    onClick={() => setAktifSekme('dokuman_master')}
                    style={{ background: aktifSekme === 'dokuman_master' ? '#3b0764' : 'transparent', color: aktifSekme === 'dokuman_master' ? 'white' : '#c084fc', border: 'none', padding: '10px 12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    • Doküman Master Listesi
                  </button>
                </div>
              )}
            </div>

            {/* Depo & Malzeme Kabul */}
            <div>
              <button 
                onClick={() => menuToggle('depo')}
                style={{ width: '100%', background: 'transparent', color: '#cbd5e1', border: 'none', padding: '12px 14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📦 Depo & Malzeme Kabul</span>
                <span style={{ fontSize: '12px' }}>{acikMenu.depo ? '▼' : '▶'}</span>
              </button>

              {acikMenu.depo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '20px', marginTop: '4px' }}>
                  <button 
                    onClick={() => setAktifSekme('girdi_kontrol')}
                    style={{ background: aktifSekme === 'girdi_kontrol' ? '#3b0764' : 'transparent', color: aktifSekme === 'girdi_kontrol' ? 'white' : '#c084fc', border: 'none', padding: '10px 12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    • Girdi Kontrol & Kabul
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #312e81', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500' }}>Hazar</div>
            <div style={{ fontSize: '11px', color: '#c084fc' }}>hazar@minyatur.com</div>
          </div>
          <button onClick={() => setOturumAcildi(false)} style={{ background: '#312e81', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
            Çıkış
          </button>
        </div>
      </div>

      {/* ANA İÇERİK ALANI */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {aktifSekme === 'dashboard' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)', color: 'white', padding: '40px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0' }}>Minyatür Makina Robot Sistemleri</h1>
              <p style={{ color: '#e9d5ff', fontSize: '15px', margin: 0 }}>Endüstriyel Otomasyon, Kalite Yönetimi ve Entegre ERP Paneli</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #581c87' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>🛡️ Kalite Güvence & KYS</h3>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  ISO 9001 standartlarına uygun doküman master listesi, revizyon takip mekanizmaları ve yerel ağ dosya entegrasyonu.
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b0764' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>📦 Depo & Girdi Kontrol</h3>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  Tedarikçi hammadde kabul süreçleri, irsaliye takibi ve lot bazlı kalite onay mekanizmaları.
                </p>
              </div>

              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #4338ca' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>⚙️ Robotik & Otomasyon</h3>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  Özel imalat robot hücreleri, üretim hattı takibi ve mühendislik operasyonları.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* GİRDİ KONTROL */}
        {aktifSekme === 'girdi_kontrol' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>Depo Malzeme Kabul & Girdi Kontrol</h1>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
              <form onSubmit={yeniGirdiEkle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
                <input type="text" placeholder="Malzeme Adı *" value={malzemeAdi} onChange={(e) => setMalzemeAdi(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <input type="text" placeholder="Tedarikçi Firma *" value={tedarikciFirma} onChange={(e) => setTedarikciFirma(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <input type="text" placeholder="İrsaliye No" value={irsaliyeNo} onChange={(e) => setIrsaliyeNo(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="Parti / Lot No" value={partiNo} onChange={(e) => setPartiNo(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <input type="number" placeholder="Miktar" value={miktar} onChange={(e) => setMiktar(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <select value={kontrolSonucu} onChange={(e) => setKontrolSonucu(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                  <option value="Kabul">Kabul</option>
                  <option value="Şartlı Kabul">Şartlı Kabul</option>
                  <option value="Ret">Ret</option>
                </select>
                <input type="text" placeholder="Kontrol Eden" value={kontrolEden} onChange={(e) => setKontrolEden(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <button type="submit" style={{ backgroundColor: '#581c87', color: 'white', border: 'none', padding: '11px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Kaydet</button>
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                    <th style={{ padding: '10px' }}>Malzeme / Tedarikçi</th>
                    <th style={{ padding: '10px' }}>İrsaliye / Lot</th>
                    <th style={{ padding: '10px' }}>Miktar</th>
                    <th style={{ padding: '10px' }}>Karar</th>
                    <th style={{ padding: '10px' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {girdiler.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <td style={{ padding: '12px' }}><b>{item.malzeme_adi}</b><br/><span style={{ color: '#64748b' }}>{item.tedarikci_firma}</span></td>
                      <td style={{ padding: '12px' }}>{item.irsaliye_no || '-'}<br/><span style={{ color: '#64748b' }}>{item.parti_no}</span></td>
                      <td style={{ padding: '12px' }}>{item.miktar}</td>
                      <td style={{ padding: '12px' }}>{item.kontrol_sonucu}</td>
                      <td style={{ padding: '12px' }}><button onClick={() => girdiSil(item.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Sil</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DOKÜMAN MASTER LİSTESİ (YEREL YOL DESTEKLİ) */}
        {aktifSekme === 'dokuman_master' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>Doküman Master Listesi (Yerel Ağ / PC Bağlantılı)</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              
              {/* Arama */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>🔍 Doküman Ara</h3>
                <input 
                  type="text" 
                  placeholder="Kod, ad veya kategori ara..." 
                  value={aramaMetni} 
                  onChange={(e) => setAramaMetni(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              {/* Yerel Yol ile Ekleme Formu */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>🔗 Yerel Dosya Yolu ile Tanımla</h3>
                <form onSubmit={yeniDokumanEkle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Doküman Kodu (Örn: PR-01)" value={dokumanKodu} onChange={(e) => setDokumanKodu(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="Doküman Adı" value={dokumanAdi} onChange={(e) => setDokumanAdi(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                    <option value="Talimat">Talimat</option>
                    <option value="Prosedür">Prosedür</option>
                    <option value="Form">Form</option>
                  </select>
                  <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                    <option value="Word">Word (.docx)</option>
                    <option value="Excel">Excel (.xlsx)</option>
                    <option value="PDF">PDF (.pdf)</option>
                  </select>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <input type="text" placeholder="Dosya Yolu / Link (Örn: file:///C:/KYS/talimat.docx)" value={yerelDosyaYolu} onChange={(e) => setYerelDosyaYolu(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>

                  <button type="submit" style={{ gridColumn: 'span 2', backgroundColor: '#581c87', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Sisteme Kaydet
                  </button>
                </form>
              </div>

            </div>

            {/* Liste */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>Kod</th>
                    <th style={{ padding: '10px' }}>Adı</th>
                    <th style={{ padding: '10px' }}>Kategori</th>
                    <th style={{ padding: '10px' }}>Revizyon</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Dosyaya Eriş</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Sil</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrelenmisDokumanlar.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#581c87' }}>{doc.dokuman_kodu}</td>
                      <td style={{ padding: '12px' }}>{doc.dokuman_adi}</td>
                      <td style={{ padding: '12px' }}>{doc.kategori}</td>
                      <td style={{ padding: '12px' }}>Rev.{doc.revizyon_no || '00'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {doc.orijinal_dosya_url ? (
                          <a href={doc.orijinal_dosya_url} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#16a34a', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>
                            📂 Dosyayı Aç
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Yol Tanımlanmadı</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => dokumanSil(doc.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}