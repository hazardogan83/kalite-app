import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
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
        girdileriGetir(); // Ekranı güncelle
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Girdi Kontrol ve Malzeme Kabul Listesi</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Malzeme Adı</th>
            <th>Teknik Özellikler</th>
            <th>Malzeme Türü</th>
            <th>Tedarikçi Firma</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {girdiler && girdiler.length > 0 ? (
            girdiler.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.malzeme_adi}</td>
                <td>{item.teknik_ozellikler}</td>
                <td>{item.malzeme_turu}</td>
                <td>{item.tedarikci_firma}</td>
                <td>
                  <button 
                    onClick={() => girdiSil(item.id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>
                Henüz kayıtlı girdi kontrol verisi bulunmuyor.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}