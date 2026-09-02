import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

export default function IlkParcaKontrol({ itemId, operatorId }) {
  const [workOrderCode, setWorkOrderCode] = useState('');
  const [criticalOk, setCriticalOk] = useState(false);
  const [surfaceOk, setSurfaceOk] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [kayitlar, setKayitlar] = useState([]);
  
  // Düzenleme durumu için state'ler
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('approved');
  const [editReason, setEditReason] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Kayıtları Çek
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

  // Excel'e Aktar Fonksiyonu
  const exportToExcel = () => {
    if (kayitlar.length === 0) {
      alert('Dışa aktarılacak kayıt bulunamadı.');
      return;
    }

    const excelData = kayitlar.map((item) => ({
      'Tarih / Saat': new Date(item.created_at).toLocaleString('tr-TR'),
      'İş Emri No': item.work_order_code,
      'Durum': item.status === 'approved' ? 'ONAYLANDI' : 'REDDEDİLDİ',
      'Kritik Ölçü': item.critical_dimensions_ok ? 'OK' : 'NOK',
      'Yüzey Kontrol': item.surface_finish_ok ? 'OK' : 'NOK',
      'Açıklama / Red Sebebi': item.rejection_reason || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FAI Kayitlari');

    XLSX.writeFile(workbook, `FAI_Kontrol_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Yeni Kayıt Ekleme
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
      kayitlariGetir();
    }
  };

  // Düzenleme Modunu Başlat
  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setEditReason(item.rejection_reason || '');
  };

  // Güncellemeyi Kaydet
  const handleEditSave = async (id) => {
    setLoading(true);
    const { error } = await supabase
      .from('process_quality_control')
      .update({
        status: editStatus,
        rejection_reason: editReason,
      })
      .eq('id', id);

    setLoading(false);
    if (!error) {
      setEditingId(null);
      kayitlariGetir();
    } else {
      alert(`Güncelleme hatası: ${error.message}`);
    }
  };

  // Kayıt Silme
  const handleDelete = async (id) => {
    if (window.confirm('Bu FAI kaydını silmek istediğinizden emin misiniz?')) {
      const { error } = await supabase
        .from('process_quality_control')
        .delete()
        .eq('id', id);

      if (!error) {
        kayitlariGetir();
      } else {
        alert(`Silme hatası: ${error.message}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Geçmiş FAI Kontrol Kayıtları</h3>
        <button
          onClick={exportToExcel}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📊 Excel'e Aktar
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white', border: '1px solid #e5e7eb' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '10px' }}>Tarih / Saat</th>
            <th style={{ padding: '10px' }}>İş Emri No</th>
            <th style={{ padding: '10px' }}>Durum</th>
            <th style={{ padding: '10px' }}>Kritik Ölçü</th>
            <th style={{ padding: '10px' }}>Yüzey Kontrol</th>
            <th style={{ padding: '10px' }}>Açıklama / Red Sebebi</th>
            {isAuthorized && <th style={{ padding: '10px', textAlign: 'center' }}>İşlemler</th>}
          </tr>
        </thead>
        <tbody>
          {kayitlar.length === 0 ? (
            <tr>
              <td colSpan={isAuthorized ? 7 : 6} style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>
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
                  {editingId === item.id ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ padding: '4px', borderRadius: '4px' }}
                    >
                      <option value="approved">ONAYLANDI</option>
                      <option value="rejected">REDDEDİLDİ</option>
                    </select>
                  ) : (
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
                  )}
                </td>

                <td style={{ padding: '10px' }}>{item.critical_dimensions_ok ? 'OK' : 'NOK'}</td>
                <td style={{ padding: '10px' }}>{item.surface_finish_ok ? 'OK' : 'NOK'}</td>
                
                <td style={{ padding: '10px', fontSize: '13px', color: '#4b5563' }}>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      style={{ width: '100%', padding: '4px' }}
                    />
                  ) : (
                    item.rejection_reason || '-'
                  )}
                </td>

                {isAuthorized && (
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {editingId === item.id ? (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleEditSave(item.id)} style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Kaydet</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>İptal</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleEditStart(item)} style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Düzenle</button>
                        <button onClick={() => handleDelete(item.id)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sil</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}