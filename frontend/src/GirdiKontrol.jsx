import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

export default function GirdiKontrol() {
  const [supplierName, setSupplierName] = useState('');
  const [waybillNo, setWaybillNo] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [visualOk, setVisualOk] = useState(false);
  const [dimensionOk, setDimensionOk] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [kayitlar, setKayitlar] = useState([]);

  // Düzenleme durumu
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('approved');
  const [editReason, setEditReason] = useState('');

  // Kayıtları Getir
  const kayitlariGetir = async () => {
    const { data, error } = await supabase
      .from('incoming_quality_control')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKayitlar(data);
    }
  };

  useEffect(() => {
    kayitlariGetir();
  }, []);

  // Excel'e Aktar
  const exportToExcel = () => {
    if (kayitlar.length === 0) {
      alert('Dışa aktarılacak kayıt bulunamadı.');
      return;
    }

    const excelData = kayitlar.map((item) => ({
      'Tarih / Saat': new Date(item.created_at).toLocaleString('tr-TR'),
      'Tedarikçi Firması': item.supplier_name,
      'İrsaliye / Fatura No': item.waybill_no,
      'Malzeme / Parça Adı': item.material_name,
      'Miktar': item.quantity,
      'Görsel Kontrol': item.visual_ok ? 'OK' : 'NOK',
      'Ölçü Kontrol': item.dimension_ok ? 'OK' : 'NOK',
      'Durum': item.status === 'approved' ? 'KABUL EDİLDİ' : 'REDDEDİLDİ',
      'Red Sebebi / Not': item.rejection_reason || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Girdi Kontrol Kayitlari');

    XLSX.writeFile(workbook, `Girdi_Kontrol_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Yeni Kayıt Ekle
  const handleSubmit = async (status) => {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('incoming_quality_control').insert([
      {
        supplier_name: supplierName,
        waybill_no: waybillNo,
        material_name: materialName,
        quantity: parseInt(quantity) || 0,
        visual_ok: visualOk,
        dimension_ok: dimensionOk,
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
          ? '✅ Malzeme Kabul Edildi ve Depoya Aktarıldı.'
          : '❌ Malzeme Reddedildi! Karantinaya Alınmalı.'
      );
      setSupplierName('');
      setWaybillNo('');
      setMaterialName('');
      setQuantity('');
      setVisualOk(false);
      setDimensionOk(false);
      setRejectionReason('');
      kayitlariGetir();
    }
  };

  // Düzenle
  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setEditReason(item.rejection_reason || '');
  };

  const handleEditSave = async (id) => {
    setLoading(true);
    const { error } = await supabase
      .from('incoming_quality_control')
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

  // Sil
  const handleDelete = async (id) => {
    if (window.confirm('Bu girdi kontrol kaydını silmek istediğinizden emin misiniz?')) {
      const { error } = await supabase
        .from('incoming_quality_control')
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
      <h2>Girdi Kontrol & Malzeme Kabul Formu</h2>

      {/* FORM ALANI */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tedarikçi Firma:</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Örn: ABC Metal A.Ş."
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>İrsaliye / Fatura No:</label>
            <input
              type="text"
              value={waybillNo}
              onChange={(e) => setWaybillNo(e.target.value)}
              placeholder="Örn: IRS-2026-88"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Malzeme / Parça Adı:</label>
            <input
              type="text"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Örn: Ø30 Çelik Mil (SAE 1045)"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gelen Miktar (Adet/Kg):</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Örn: 500"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #eee' }}>
          <p style={{ fontWeight: 'bold', marginTop: 0 }}>Girdi Kontrol Kriterleri:</p>
          
          <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visualOk}
              onChange={(e) => setVisualOk(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Görsel Kontrol, Ambalaj ve Yüzey Hasarsızlık Uygun
          </label>

          <label style={{ display: 'block', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dimensionOk}
              onChange={(e) => setDimensionOk(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Ölçü ve Tolerans Kontrolü / Sertifika Uygun
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Red Sebebi / Notlar (Varsa):</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Örn: Yüzeyde paslanma mevcut, teknik resme uygun değil."
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            rows={2}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleSubmit('approved')}
            disabled={loading || !supplierName || !materialName || !visualOk || !dimensionOk}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: loading || !supplierName || !materialName || !visualOk || !dimensionOk ? 0.5 : 1
            }}
          >
            {loading ? 'İşleniyor...' : 'Kabul Et (Depoya Al)'}
          </button>

          <button
            onClick={() => handleSubmit('rejected')}
            disabled={loading || !supplierName || !materialName}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: loading || !supplierName || !materialName ? 0.5 : 1
            }}
          >
            {loading ? 'İşleniyor...' : 'Reddet (Karantina)'}
          </button>
        </div>

        {message && (
          <div style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', background: message.includes('✅') ? '#e6fffa' : '#ffebee', color: message.includes('✅') ? '#047857' : '#b91c1c', fontWeight: '500' }}>
            {message}
          </div>
        )}
      </div>

      {/* TABLO ALANI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Geçmiş Girdi Kontrol Kayıtları</h3>
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
            <th style={{ padding: '10px' }}>Tarih</th>
            <th style={{ padding: '10px' }}>Tedarikçi</th>
            <th style={{ padding: '10px' }}>Malzeme</th>
            <th style={{ padding: '10px' }}>Miktar</th>
            <th style={{ padding: '10px' }}>Durum</th>
            <th style={{ padding: '10px' }}>Açıklama / Red Sebebi</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {kayitlar.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>
                Henüz kayıtlı bir girdi kontrol işlemi bulunmuyor.
              </td>
            </tr>
          ) : (
            kayitlar.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px', fontSize: '12px' }}>
                  {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.supplier_name}</td>
                <td style={{ padding: '10px' }}>{item.material_name}</td>
                <td style={{ padding: '10px' }}>{item.quantity}</td>
                
                <td style={{ padding: '10px' }}>
                  {editingId === item.id ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ padding: '4px', borderRadius: '4px' }}
                    >
                      <option value="approved">KABUL EDİLDİ</option>
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
                      {item.status === 'approved' ? 'KABUL EDİLDİ' : 'REDDEDİLDİ'}
                    </span>
                  )}
                </td>

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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}