import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function GirdiKontrol() {
  const [kayitlar, setKayitlar] = useState([]);
  const [form, setForm] = useState({
    malzeme_adi: '',
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
    const { data, error } = await supabase
      .from('girdi_kontrol')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setKayitlar(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('girdi_kontrol').insert([form]);
    if (!error) {
      setForm({
        malzeme_adi: '',
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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Girdi Kontrol & Malzeme Kabul Modülü</h2>

      {/* Kayıt Formu */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', maxWidth: '600px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Malzeme Adı / Kodu" 
          value={form.malzeme_adi} 
          onChange={(e) => setForm({...form, malzeme_adi: e.target.value})} 
          required 
        />
        
        <select value={form.malzeme_turu} onChange={(e) => setForm({...form, malzeme_turu: e.target.value})}>
          <option value="Hammadde">Hammadde</option>
          <option value="Sarf Malzeme">Sarf Malzeme</option>
          <option value="Yarı Mamül">Yarı Mamül</option>
        </select>

        <input 
          type="text" 
          placeholder="Tedarikçi Firma" 
          value={form.tedarikci_firma} 
          onChange={(e) => setForm({...form, tedarikci_firma: e.target.value})} 
          required 
        />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="İrsaliye No" 
            value={form.irsaliye_no} 
            onChange={(e) => setForm({...form, irsaliye_no: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="Parti / Lot No" 
            value={form.parti_lot_no} 
            onChange={(e) => setForm({...form, parti_lot_no: e.target.value})} 
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="Miktar" 
            value={form.miktar} 
            onChange={(e) => setForm({...form, miktar: e.target.value})} 
            required 
          />
          <select value={form.birim} onChange={(e) => setForm({...form, birim: e.target.value})}>
            <option value="Adet">Adet</option>
            <option value="Kg">Kg</option>
            <option value="Metre">Metre</option>
            <option value="Litre">Litre</option>
            <option value="Paket">Paket</option>
          </select>
        </div>

        <select value={form.kontrol_sonucu} onChange={(e) => setForm({...form, kontrol_sonucu: e.target.value})}>
          <option value="Onaylandı">Onaylandı (Uygun)</option>
          <option value="Şartlı Kabul">Şartlı Kabul</option>
          <option value="Reddedildi">Reddedildi (Hatalı/Uygunsuz)</option>
        </select>

        <textarea 
          placeholder="Açıklama / Kontrol Notları" 
          value={form.aciklama} 
          onChange={(e) => setForm({...form, aciklama: e.target.value})} 
        />

        <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Girdi Kontrol Kaydını Kaydet
        </button>
      </form>

      {/* Kayıt Tablosu */}
      <h3>Giriş Yapılan Malzemeler</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Tarih</th>
            <th>Malzeme Adı</th>
            <th>Tür</th>
            <th>Tedarikçi</th>
            <th>Lot / İrsaliye</th>
            <th>Miktar</th>
            <th>Sonuç</th>
          </tr>
        </thead>
        <tbody>
          {kayitlar.map((item) => (
            <tr key={item.id}>
              <td>{new Date(item.created_at).toLocaleDateString('tr-TR')}</td>
              <td>{item.malzeme_adi}</td>
              <td>{item.malzeme_turu}</td>
              <td>{item.tedarikci_firma}</td>
              <td>{item.parti_lot_no} / {item.irsaliye_no}</td>
              <td>{item.miktar} {item.birim}</td>
              <td style={{ 
                color: item.kontrol_sonucu === 'Onaylandı' ? 'green' : item.kontrol_sonucu === 'Reddedildi' ? 'red' : 'orange',
                fontWeight: 'bold'
              }}>
                {item.kontrol_sonucu}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}