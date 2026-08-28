import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function GirdiKontrol() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    malzeme_adi: '',
    teknik_ozellikler: '',
    malzeme_turu: 'Hammadde',
    tedarikci_firma: '',
    irsaliye_no: '',
    parti_lot_no: '',
    miktar: '',
    birim: 'Adet',
    kontrol_sonucu: 'Onaylandı',
    aciklama: ''
  });

  useEffect(() => {
    kayitlariGetir();
  }, []);

  const kayitlariGetir = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('girdi_kontrol')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Kayıtlar çekilirken hata oluştu:', error);
    } else {
      setKayitlar(data || []);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.malzeme_adi || !formData.tedarikci_firma || !formData.miktar) {
      alert('Lütfen zorunlu alanları (Malzeme Adı, Tedarikçi, Miktar) doldurun.');
      return;
    }

    const { error } = await supabase.from('girdi_kontrol').insert([formData]);

    if (error) {
      alert('Kayıt eklenirken hata oluştu: ' + error.message);
    } else {
      alert('Malzeme kontrol kaydı başarıyla eklendi!');
      setFormData({
        malzeme_adi: '',
        teknik_ozellikler: '',
        malzeme_turu: 'Hammadde',
        tedarikci_firma: '',
        irsaliye_no: '',
        parti_lot_no: '',
        miktar: '',
        birim: 'Adet',
        kontrol_sonucu: 'Onaylandı',
        aciklama: ''
      });
      kayitlariGetir();
    }
  };

  // EXCEL'E AKTARMA FONKSİYONU
  const exceleAktar = () => {
    if (kayitlar.length === 0) {
      alert('Excel’e aktarılacak kayıt bulunamadı.');
      return;
    }

    const excelData = kayitlar.map((k) => ({
      'Tarih': new Date(k.created_at).toLocaleDateString('tr-TR'),
      'Malzeme Adı': k.malzeme_adi,
      'Teknik Özellikler': k.teknik_ozellikler || '-',
      'Malzeme Türü': k.malzeme_turu,
      'Tedarikçi Firma': k.tedarikci_firma,
      'İrsaliye No': k.irsaliye_no || '-',
      'Parti / Lot No': k.parti_lot_no || '-',
      'Miktar': k.miktar,
      'Birim': k.birim,
      'Kontrol Sonucu': k.kontrol_sonucu,
      'Açıklama': k.aciklama || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Girdi Kontrol');
    XLSX.writeFile(workbook, `Girdi_Kontrol_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // PDF'E AKTARMA FONKSİYONU
  const pdfAktar = () => {
    if (kayitlar.length === 0) {
      alert('PDF’e aktarılacak kayıt bulunamadı.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text('GIRDİ KONTROL VE MALZEME KABUL RAPORU', 14, 15);

    const tableColumn = [
      'Tarih',
      'Malzeme Adı',
      'Teknik Özellik',
      'Tür',
      'Tedarikçi',
      'İrsaliye No',
      'Lot No',
      'Miktar',
      'Sonuç'
    ];

    const tableRows = kayitlar.map((k) => [
      new Date(k.created_at).toLocaleDateString('tr-TR'),
      k.malzeme_adi,
      k.teknik_ozellikler || '-',
      k.malzeme_turu,
      k.tedarikci_firma,
      k.irsaliye_no || '-',
      k.parti_lot_no || '-',
      `${k.miktar} ${k.birim}`,
      k.kontrol_sonucu
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' }
    });

    doc.save(`Girdi_Kontrol_Raporu_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Girdi Kontrol ve Gelen Malzeme Kayıt Modülü</h2>

      {/* MALZEME GİRİŞ FORMU */}
      <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Yeni Gelen Malzeme Kaydı</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label>Malzeme Adı *</label>
            <input type="text" name="malzeme_adi" value={formData.malzeme_adi} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} placeholder="Örn: M8 Civata" />
          </div>

          <div>
            <label>Teknik Özellikler</label>
            <input type="text" name="teknik_ozellikler" value={formData.teknik_ozellikler} onChange={handleChange} style={{ width: '100%', padding: '8px' }} placeholder="Örn: 8.8 Kalite, Paslanmaz" />
          </div>

          <div>
            <label>Malzeme Türü *</label>
            <select name="malzeme_turu" value={formData.malzeme_turu} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="Hammadde">Hammadde</option>
              <option value="Sarf Malzeme">Sarf Malzeme</option>
              <option value="Yarı Mamül">Yarı Mamül</option>
            </select>
          </div>

          <div>
            <label>Tedarikçi Firma *</label>
            <input type="text" name="tedarikci_firma" value={formData.tedarikci_firma} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} placeholder="Örn: ABC A.Ş." />
          </div>

          <div>
            <label>İrsaliye No</label>
            <input type="text" name="irsaliye_no" value={formData.irsaliye_no} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div>
            <label>Parti / Lot No</label>
            <input type="text" name="parti_lot_no" value={formData.parti_lot_no} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div>
            <label>Miktar *</label>
            <input type="number" name="miktar" value={formData.miktar} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
          </div>

          <div>
            <label>Birim</label>
            <select name="birim" value={formData.birim} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="Adet">Adet</option>
              <option value="Kg">Kg</option>
              <option value="Metre">Metre</option>
              <option value="Litre">Litre</option>
              <option value="Paket">Paket</option>
            </select>
          </div>

          <div>
            <label>Kontrol Sonucu *</label>
            <select name="kontrol_sonucu" value={formData.kontrol_sonucu} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
              <option value="Onaylandı">Onaylandı</option>
              <option value="Şartlı Kabul">Şartlı Kabul</option>
              <option value="Reddedildi">Reddedildi</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <label>Açıklama / Notlar</label>
          <textarea name="aciklama" value={formData.aciklama} onChange={handleChange} style={{ width: '100%', padding: '8px', height: '60px' }}></textarea>
        </div>

        <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Kayıt Ekle
        </button>
      </form>

      {/* BUTONLAR VE TABLO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>Gelen Malzeme Kayıt Listesi ({kayitlar.length})</h3>
        <div>
          <button onClick={exceleAktar} style={{ padding: '8px 15px', background: '#1d6f42', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
            📊 Excel'e Aktar
          </button>
          <button onClick={pdfAktar} style={{ padding: '8px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            📄 PDF Raporu Al
          </button>
        </div>
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#e9ecef' }}>
            <tr>
              <th>Tarih</th>
              <th>Malzeme Adı</th>
              <th>Teknik Özellik</th>
              <th>Tür</th>
              <th>Tedarikçi</th>
              <th>İrsaliye No</th>
              <th>Lot No</th>
              <th>Miktar</th>
              <th>Kontrol Sonucu</th>
            </tr>
          </thead>
          <tbody>
            {kayitlar.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>Henüz kayıt bulunmuyor.</td>
              </tr>
            ) : (
              kayitlar.map((k) => (
                <tr key={k.id}>
                  <td>{new Date(k.created_at).toLocaleDateString('tr-TR')}</td>
                  <td><b>{k.malzeme_adi}</b></td>
                  <td>{k.teknik_ozellikler || '-'}</td>
                  <td>{k.malzeme_turu}</td>
                  <td>{k.tedarikci_firma}</td>
                  <td>{k.irsaliye_no || '-'}</td>
                  <td>{k.parti_lot_no || '-'}</td>
                  <td>{k.miktar} {k.birim}</td>
                  <td style={{
                    fontWeight: 'bold',
                    color: k.kontrol_sonucu === 'Onaylandı' ? 'green' : k.kontrol_sonucu === 'Reddedildi' ? 'red' : 'orange'
                  }}>
                    {k.kontrol_sonucu}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}