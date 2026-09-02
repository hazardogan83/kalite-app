import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function IlkParcaKontrol({ itemId, operatorId }) {
  const [workOrderCode, setWorkOrderCode] = useState('');
  const [criticalOk, setCriticalOk] = useState(false);
  const [surfaceOk, setSurfaceOk] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [kayitlar, setKayitlar] = useState([]);

  // Geçmiş kayıtları Supabase'den çekme fonksiyonu
  const kayitlariGetir = async () => {
    const { data, error } = await supabase
      .from('process_quality_control')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKayitlar(data);
    }
  };

  useEffect(() => {
    kayitlariGetir();
  }, []);

  const handleSubmit = async (status) => {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('process_quality_control').insert([
      {
        work_order_code: workOrderCode,
        item_id: itemId || null,
        operator_id: operatorId || null,
        critical_dimensions_ok: criticalOk,
        surface_finish_ok: surfaceOk,
        status: status,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage(`Hata oluştu: ${error.message}`);
    } else {
      setMessage(
        status === 'approved'
          ? '✅ İlk Parça Onaylandı! Seri imalata geçilebilir.'
          : '❌ İlk Parça Reddedildi! Setup düzeltilmeli.'
      );
      setWorkOrderCode('');
      setCriticalOk(false);
      setSurfaceOk(false);
      setRejectionReason('');
      
      // Kayıt başarıyla eklendiğinde tabloyu anında güncelle
      kayitlariGetir();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>İlk Parça Onay Formu (FAI)</h2>

      {/* FORM ALANI */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>İş Emri Kodu / No:</label>
          <input
            type="text"
            value={workOrderCode}
            onChange={(e) => setWorkOrderCode(e.target.value)}
            placeholder="Örn: IE-2026-0412"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #eee' }}>
          <p style={{ fontWeight: 'bold', marginTop: 0 }}>Kalite Kontrol Kriterleri (Senin Kontrolün):</p>
          
          <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={criticalOk}
              onChange={(e) => setCriticalOk(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Kritik Ölçüler ve Toleranslar Uygun
          </label>

          <label style={{ display: 'block', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={surfaceOk}
              onChange={(e) => setSurfaceOk(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Yüzey Pürüzlülüğü ve Çapak Kontrolü Uygun
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Red Sebebi (Reddedilirse):</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Örn: Çap ölçüsü +0.02mm tolerans dışı çıktı."
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            rows={2}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleSubmit('approved')}
            disabled={loading || !workOrderCode || !criticalOk || !surfaceOk}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: loading || !workOrderCode || !criticalOk || !surfaceOk ? 0.5 : 1
            }}
          >
            {loading ? 'İşleniyor...' : 'İmalata Onay Ver'}
          </button>

          <button
            onClick={() => handleSubmit('rejected')}
            disabled={loading || !workOrderCode}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: loading || !workOrderCode ? 0.5 : 1
            }}
          >
            {loading ? 'İşleniyor...' : 'Setup Reddet'}
          </button>
        </div>

        {message && (
          <div style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', background: message.includes('✅') ? '#e6fffa' : '#ffebee', color: message.includes('✅') ? '#047857' : '#b91c1c', fontWeight: '500' }}>
            {message}
          </div>
        )}
      </div>

      {/* GEÇMİŞ KAYITLAR TABLOSU */}
      <h3>Geçmiş FAI Kontrol Kayıtları</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white', border: '1px solid #e5e7eb' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '10px' }}>Tarih / Saat</th>
            <th style={{ padding: '10px' }}>İş Emri No</th>
            <th style={{ padding: '10px' }}>Durum</th>
            <th style={{ padding: '10px' }}>Kritik Ölçü</th>
            <th style={{ padding: '10px' }}>Yüzey Kontrol</th>
            <th style={{ padding: '10px' }}>Açıklama / Red Sebebi</th>
          </tr>
        </thead>
        <tbody>
          {kayitlar.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>
                Henüz kayıtlı bir FAI kontrolü bulunmuyor.
              </td>
            </tr>
          ) : (
            kayitlar.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px', fontSize: '13px' }}>
                  {new Date(item.created_at).toLocaleString('tr-TR')}
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.work_order_code}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    background: item.status === 'approved' ? '#10b981' : '#ef4444'
                  }}>
                    {item.status === 'approved' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{item.critical_dimensions_ok ? 'OK' : 'NOK'}</td>
                <td style={{ padding: '10px' }}>{item.surface_finish_ok ? 'OK' : 'NOK'}</td>
                <td style={{ padding: '10px', fontSize: '13px', color: '#4b5563' }}>
                  {item.rejection_reason || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}