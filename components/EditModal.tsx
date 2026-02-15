"use client";

import { useState } from 'react';
import { formatPhone } from '../lib/utils';

export default function EditModal({ ticket, categories, onSave, onClose }: any) {
  const [editData, setEditData] = useState({
    name: ticket.name || '',
    phone: ticket.phone || '',
    category: ticket.category || '',
    subCategory: ticket.subCategory || '',
    item: ticket.item || '',
    price: ticket.price || '',
    paymentMethod: ticket.paymentMethod || '카드',
    isUrgent: ticket.isUrgent || false,
    receivedDate: ticket.receivedDate || '',
    dueDate: ticket.dueDate || '',
  });

  const mainCategories = Object.keys(categories || {});
  const subCategories = categories?.[editData.category] || [];

  const handlePhoneChange = (e: any) => {
    setEditData({ ...editData, phone: formatPhone(e.target.value) });
  };

  const inputStyle: any = { padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', width: '100%', fontSize: '14px', color: '#000', fontWeight: 'bold' };
  const labelStyle: any = { fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block', fontWeight: 'bold' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>수선 수정</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 이름, 전화번호 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>고객 이름</label><input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>전화번호</label><input value={editData.phone} onChange={handlePhoneChange} style={inputStyle} maxLength={13} /></div>
          </div>

          {/* 카테고리 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>대분류</label>
              <select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value, subCategory: '' })} style={inputStyle}>
                {mainCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>소분류</label>
              <select value={editData.subCategory} onChange={(e) => setEditData({ ...editData, subCategory: e.target.value })} style={inputStyle}>
                <option value="">선택</option>
                {subCategories.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* 수선 내용 */}
          <div><label style={labelStyle}>수선 내용</label><input value={editData.item} onChange={(e) => setEditData({ ...editData, item: e.target.value })} style={inputStyle} /></div>

          {/* 날짜 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>맡긴 날짜</label><input type="date" value={editData.receivedDate} onChange={(e) => setEditData({ ...editData, receivedDate: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>마감일</label><input type="date" value={editData.dueDate} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} style={inputStyle} /></div>
          </div>

          {/* 금액, 결제, 급함 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
            <div><label style={labelStyle}>금액</label><input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>결제</label><select value={editData.paymentMethod} onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })} style={inputStyle}><option value="카드">💳 카드</option><option value="현금">💵 현금</option><option value="이체">📱 이체</option><option value="후불">📋 후불</option></select></div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fee2e2', padding: '0 10px', borderRadius: '5px', color: 'red', fontWeight: 'bold', height: '42px', fontSize: '12px' }}>
              <input type="checkbox" checked={editData.isUrgent} onChange={(e) => setEditData({ ...editData, isUrgent: e.target.checked })} style={{ marginRight: '5px' }} />급함
            </label>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <button onClick={onClose} style={{ background: '#e5e7eb', color: '#333', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
            <button onClick={() => onSave(ticket.id, editData)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
