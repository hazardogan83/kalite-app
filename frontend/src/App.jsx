import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [dokumanlar, setDokumanlar] = useState([]);

  // Dokümanları veritabanından çeken fonksiyon
  const dokumanlariGetir = async () => {
    const { data, error } = await supabase
      .from('dokumanlar')
      .select('*');

    if (error) {
      console.error("Dokümanlar çekilemedi:", error.message);
    } else {
      setDokumanlar(data);
    }
  };

  useEffect(() => {
    dokumanlariGetir();
  }, []);

  // Doküman silme fonksiyonu
  const dokumanSil = async (id) => {
    if (window.confirm("Bu dokümanı silmek istediğinize emin misiniz?")) {
      const { error } = await supabase
        .from('dokumanlar')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Silme hatası: " + error.message);
      } else {
        alert("Doküman başarıyla silindi!");
        dokumanlariGetir(); // Ekranı güncelle
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Doküman Yönetim Sistemi</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Kod</th>
            <th>Doküman Adı</th>
            <th>Format</th>
            <th>Kategori</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {dokumanlar && dokumanlar.map((dokuman) => (
            <tr key={dokuman.id}>
              <td>{dokuman.kod}</td>
              <td>{dokuman.adi}</td>
              <td>{dokuman.format}</td>
              <td>{dokuman.kategori}</td>
              <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {dokuman.url && (
                  <a href={dokuman.url} target="_blank" rel="noreferrer">
                    Dosyayı Aç
                  </a>
                )}
                
                {/* SİL BUTONU */}
                <button 
                  onClick={() => dokumanSil(dokuman.id)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}