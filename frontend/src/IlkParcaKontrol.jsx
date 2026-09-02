import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function IlkParcaKontrol({ itemId, operatorId }) {
  const [workOrderCode, setWorkOrderCode] = useState('');
  const [criticalOk, setCriticalOk] = useState(false);
  const [surfaceOk, setSurfaceOk] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      if (status === 'approved') {
        setWorkOrderCode('');
        setCriticalOk(false);
        setSurfaceOk(false);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>İlk Parça Onay Formu (FAI)</h2>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>İş Emri Kodu / No:</label>
        <input
          type="text"
          value={workOrderCode}
          onChange={(e) => setWorkOrderCode(e.target.value)}
          placeholder="Örn: IE-2026-0412"
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
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
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          rows={3}
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
            opacity: loading || !workOrderCode ? 0.5 : 1
          }}
        >
          {loading ? 'İşleniyor...' : 'Setup Reddet'}
        </button>
      </div>

      {message && (
        <div style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', background: message.includes('✅') ? '#e6fffa' : '#ffebee' }}>
          {message}
        </div>
      )}
    </div>
  );
}