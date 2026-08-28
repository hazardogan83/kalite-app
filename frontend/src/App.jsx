import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [aktifSekme, setAktifSekme] = useState('dokumanlar'); // 'dokumanlar' veya 'girdi_kontrol'
  const [girdiler, setGirdiler] = useState([]);

  // girdi_kontrol tablosundan verileri çekme
  const girdileriGetir = async () => {
    const { data, error } = await supabase
      .from('girdi_kontrol')
      .select('*');

    if (error) {
      console.error("Veriler çekilemedi:", error.message);
    } else {
      setGirdiler(data);
    }
  };

  useEffect(() => {
    girdileriGetir();
  }, []);

  // Kayıt silme fonksiyonu
  const girdiSil = async (id) => {
    if (window.confirm("Bu girdi kontrol kaydını silmek istediğinize emin misiniz?")) {
      const { error } = await supabase
        .from('girdi_kontrol')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Silme hatası: " + error.message);
      } else {
        alert("Kayıt başarıyla silindi!");
        girdileriGetir();
      }
    }
  };

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
              onClick={() => setAktifSekme('dokumanlar')}
              style={{
                background: aktifSekme === 'dokumanlar' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '12px 15px',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📁 Doküman Yönetimi
            </button>

            <button 
              onClick={() => setAktifSekme('girdi_kontrol')}
              style={{
                background: aktifSekme === 'girdi_kontrol' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '12px 15px',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📊 Girdi Kontrol Listesi
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '15px', fontSize: '14px', color: '#94a3b8' }}>
          Kullanıcı: hazar@kalite.com
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {aktifSekme === 'dokumanlar' ? (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 5px 0' }}>Kalite Sistem Dokümanları</h1>
              <p style={{ color: '#64748b', margin: 0 }}>Sistem aktif kayıt ve belge merkezi</p>
            </div>

            {/* Örnek Dokümanlar Tablosu */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b' }}>Aktif Kalite Dokümanları Listesi</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>Kod</th>
                    <th style={{ padding: '10px' }}>Doküman Adı</th>
                    <th style={{ padding: '10px' }}>Dosya Formatı</th>
                    <th style={{ padding: '10px' }}>Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#2563eb', fontWeight: '500' }}>FRM-014</td>
                    <td style={{ padding: '12px' }}>Kalibrasyon Takip Listesi</td>
                    <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Excel (.xlsx)</span></td>
                    <td style={{ padding: '12px' }}>Kalibrasyon</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#2563eb', fontWeight: '500' }}>PRC-003</td>
                    <td style={{ padding: '12px' }}>DÖF ve 8D Yönetim Prosedürü</td>
                    <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Word (.docx)</span></td>
                    <td style={{ padding: '12px' }}>DÖF / 8D</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 5px 0' }}>Girdi Kontrol ve Malzeme Kabul</h1>
              <p style={{ color: '#64748b', margin: 0 }}>Gelen malzeme kayıtları ve kontrol sonuçları</p>
            </div>

            {/* Girdi Kontrol Verileri Tablosu */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Malzeme Adı</th>
                    <th style={{ padding: '10px' }}>Teknik Özellikler</th>
                    <th style={{ padding: '10px' }}>Malzeme Türü</th>
                    <th style={{ padding: '10px' }}>Tedarikçi Firma</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {girdiler && girdiler.length > 0 ? (
                    girdiler.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>{item.id}</td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.malzeme_adi}</td>
                        <td style={{ padding: '12px' }}>{item.teknik_ozellikler}</td>
                        <td style={{ padding: '12px' }}>{item.malzeme_turu}</td>
                        <td style={{ padding: '12px' }}>{item.tedarikci_firma}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            onClick={() => girdiSil(item.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        Henüz kayıtlı girdi kontrol verisi bulunmuyor.
                      </td>
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