import React, { useState, useEffect } from 'react';
import GirdiKontrol from './GirdiKontrol';
import IlkParcaKontrol from './IlkParcaKontrol';
import { supabase } from './supabaseClient';

export default function App() {
  const [oturumAcildi, setOturumAcildi] = useState(false);
  const [girisEmail, setGirisEmail] = useState('hazar@minyaturmakina.com');
  const [girisSifre, setGirisSifre] = useState('123456');

  const [aktifSekme, setAktifSekme] = useState('dashboard');
  const [acikMenu, setAcikMenu] = useState({ 
    kalite: true, 
    depo: true, 
    uretim: false, 
    siparis: false, 
    yonetim: false 
  });

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

  // Doküman Master State'leri
  const [dokumanlar, setDokumanlar] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [dokumanKodu, setDokumanKodu] = useState('');
  const [dokumanAdi, setDokumanAdi] = useState('');
  const [kategori, setKategori] = useState('Prosedür');
  const [format, setFormat] = useState('Word');
  const [yerelDosyaYolu, setYerelDosyaYolu] = useState('');
  
  // Hangi butonun kopyalandığını takip etmek için (Görsel geri bildirim)
  const [kopyalananId, setKopyalananId] = useState(null);

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
        kontrol_eden: kontrolEden || 'Hazar'
      }
    ]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      alert("Girdi kontrol kaydı başarıyla eklendi!");
      setMalzemeAdi(''); setTeknikOzellikler(''); setMalzemeTuru(''); setTedarikciFirma(''); setIrsaliyeNo(''); setPartiNo(''); setMiktar(''); setKontrolEden('');
      verileriGetir();
    }
  };

  const girdiSil = async (id) => {
    if (window.confirm("Bu girdi kontrol kaydını silmek istediğinize emin misiniz?")) {
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

  const yoluPanoyaKopyala = (yol, id) => {
    navigator.clipboard.writeText(yol).then(() => {
      setKopyalananId(id);
      setTimeout(() => {
        setKopyalananId(null);
      }, 2000); // 2 saniye sonra butonu eski haline getir
    }).catch(err => {
      console.error("Kopyalama hatası: ", err);
    });
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
                  <button 
                    style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '10px 12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    • Ölçü Kontrol & Kalibrasyon
                  </button>
                </div>
              )}
            </div>

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
<div>
  <button
    onClick={() => setAktifSekme('ilk_parca')}
    style={{ background: aktifSekme === 'ilk_parca' ? '#3b0764' : 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'left', padding: '8px 12px', cursor: 'pointer' }}
  >
    • İlk Parça Kontrol (FAI)
  </button>
</div>
            <div>
              <button 
                onClick={() => menuToggle('uretim')}
                style={{ width: '100%', background: 'transparent', color: '#cbd5e1', border: 'none', padding: '12px 14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>⚙️ Üretim & Talaşlı İmalat</span>
                <span style={{ fontSize: '12px' }}>{acikMenu.uretim ? '▼' : '▶'}</span>
              </button>
            </div>

            <div>
              <button 
                onClick={() => menuToggle('siparis')}
                style={{ width: '100%', background: 'transparent', color: '#cbd5e1', border: 'none', padding: '12px 14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🚚 Sipariş & Sevkiyat</span>
                <span style={{ fontSize: '12px' }}>{acikMenu.siparis ? '▼' : '▶'}</span>
              </button>
            </div>

            <div>
              <button 
                onClick={() => menuToggle('yonetim')}
                style={{ width: '100%', background: 'transparent', color: '#cbd5e1', border: 'none', padding: '12px 14px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📊 Yönetim & Raporlar</span>
                <span style={{ fontSize: '12px' }}>{acikMenu.yonetim ? '▼' : '▶'}</span>
              </button>
            </div>

          </div>
        </div>

        <div style={{ borderTop: '1px solid #312e81', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500' }}>Hazar</div>
            <div style={{ fontSize: '11px', color: '#c084fc' }}>hazar@minyaturmakina.com</div>
          </div>
          <button onClick={() => setOturumAcildi(false)} style={{ background: '#312e81', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
            Çıkış
          </button>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {aktifSekme === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)', color: 'white', padding: '40px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              <div>
                <div style={{ background: 'rgba(255,255,255,0.15)', display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>KURUMSAL ERP & KYS PORTALI</div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0' }}>Minyatür Makina Robot Sistemleri</h1>
                <p style={{ color: '#e9d5ff', fontSize: '15px', margin: 0, maxWidth: '700px' }}>Özel makina imalatı, robotik otomasyon hücreleri, fikstür-aparat sistemleri ve yüksek hassasiyetli talaşlı imalat çözümleriyle kalite standartlarını bir üst seviyeye taşıyoruz.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', minWidth: '180px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Aktif Modül</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>Depo & KYS Entegre</div>
              </div>
            </div>

            <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>🏭 Faaliyet Alanlarımız & Uzmanlıklar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #581c87' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>🤖 Özel Makine İmalatı</h4>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Endüstriyel otomasyon hatları, özel amaçlı makineler ve robotik hücre entegrasyonları.</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #3b0764' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>⚙️ Hassas Talaşlı İmalat</h4>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Alüminyum ve çelik parçaların CNC tezgahlarda yüksek hassasiyetle işlenmesi.</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #4338ca' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>📐 Fikstür & Aparat Tasarımı</h4>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Kaynak, montaj ve kalite kontrol fikstürlerinin özel tasarımı ve imalatı.</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #6d28d9' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>⚡ EV & Batarya Çözümleri</h4>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Elektrikli araç batarya taşıyıcıları ve tren yolcu bagaj seperatör sistemleri üretimi.</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>🚀 Hızlı Sistem Özeti</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Kayıtlı Doküman Sayısı</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#581c87', marginTop: '5px' }}>{dokumanlar.length} Adet</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Malzeme Kabul Kayıtları</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b0764', marginTop: '5px' }}>{girdiler.length} Adet</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Sistem Durumu</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🟢</span> Aktif & Senkronize
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GİRDİ KONTROL */}
        {/* İLK PARÇA KONTROL (FAI) */}
{aktifSekme === 'ilk_parca' && <IlkParcaKontrol />}
        {aktifSekme === 'girdi_kontrol' && <GirdiKontrol />}
        

        {/* DOKÜMAN MASTER LİSTESİ */}
        {aktifSekme === 'dokuman_master' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>Doküman Master Listesi</h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0, marginBottom: '20px' }}>Prosedürler, talimatlar ve formlar arşivi</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              
              {/* Arama Alanı */}
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

              {/* Yeni Doküman Ekleme Formu */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '15px' }}>🔗 Yerel Dosya Yolu ile Tanımla</h3>
                <form onSubmit={yeniDokumanEkle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Doküman Kodu (Örn: PR-01)" value={dokumanKodu} onChange={(e) => setDokumanKodu(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="Doküman Adı" value={dokumanAdi} onChange={(e) => setDokumanAdi(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                    <option value="Prosedür">Prosedür</option>
                    <option value="Talimat">Talimat</option>
                    <option value="Form">Form</option>
                  </select>
                  
                  <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                    <option value="Word">Word (.docx)</option>
                    <option value="Excel">Excel (.xlsx)</option>
                    <option value="PDF">PDF (.pdf)</option>
                  </select>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <input 
                      type="text" 
                      placeholder="Dosya Yolu (Örn: D:/Kalite/KYS/KEK_13.doc)" 
                      value={yerelDosyaYolu} 
                      onChange={(e) => setYerelDosyaYolu(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <button type="submit" style={{ gridColumn: 'span 2', backgroundColor: '#581c87', color: 'white', border: 'none', padding: '11px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Sisteme Kaydet
                  </button>
                </form>
              </div>

            </div>

            {/* Liste Tablosu */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
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
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#581c87' }}>{doc.dokuman_kodu}</td>
                      <td style={{ padding: '12px' }}>{doc.dokuman_adi}</td>
                      <td style={{ padding: '12px' }}>{doc.kategori}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Rev.{doc.revizyon_no || '00'}</span></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {doc.orijinal_dosya_url ? (
                          <button 
                            onClick={() => yoluPanoyaKopyala(doc.orijinal_dosya_url, doc.id)} 
                            style={{ 
                              backgroundColor: kopyalananId === doc.id ? '#15803d' : '#16a34a', 
                              color: 'white', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            {kopyalananId === doc.id ? '✓ Kopyalandı!' : '📋 Yolu Kopyala'}
                          </button>
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