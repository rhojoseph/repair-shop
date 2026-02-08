"use client";

import { useState } from 'react';

export default function CategorySettings({ categories, onSave }: any) {
  const [cats, setCats] = useState<Record<string, string[]>>(categories || {});
  const [newMain, setNewMain] = useState('');
  const [newSub, setNewSub] = useState('');
  const [selectedMain, setSelectedMain] = useState<string>(Object.keys(categories || {})[0] || '');

  const inputStyle: any = { padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#000' };
  const btnStyle: any = { padding: '10px 15px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' };

  const addMainCategory = () => {
    if (!newMain.trim()) return;
    if (cats[newMain.trim()]) return alert('이미 존재하는 대분류입니다.');
    const updated = { ...cats, [newMain.trim()]: [] };
    setCats(updated);
    setSelectedMain(newMain.trim());
    setNewMain('');
    onSave(updated);
  };

  const deleteMainCategory = (cat: string) => {
    if (!confirm(`[${cat}] 대분류를 삭제하시겠습니까?`)) return;
    const updated = { ...cats };
    delete updated[cat];
    setCats(updated);
    if (selectedMain === cat) setSelectedMain(Object.keys(updated)[0] || '');
    onSave(updated);
  };

  const addSubCategory = () => {
    if (!selectedMain || !newSub.trim()) return;
    if (cats[selectedMain]?.includes(newSub.trim())) return alert('이미 존재하는 소분류입니다.');
    const updated = { ...cats, [selectedMain]: [...(cats[selectedMain] || []), newSub.trim()] };
    setCats(updated);
    setNewSub('');
    onSave(updated);
  };

  const deleteSubCategory = (sub: string) => {
    if (!selectedMain) return;
    const updated = { ...cats, [selectedMain]: cats[selectedMain].filter(s => s !== sub) };
    setCats(updated);
    onSave(updated);
  };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#111' }}>카테고리 관리</h2>

      {/* 대분류 */}
      <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#444', marginBottom: '10px' }}>대분류</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input value={newMain} onChange={(e) => setNewMain(e.target.value)} placeholder="새 대분류 이름" style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addMainCategory()} />
        <button onClick={addMainCategory} style={{ ...btnStyle, background: '#2563eb', color: 'white' }}>추가</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {Object.keys(cats).map(cat => (
          <div key={cat} onClick={() => setSelectedMain(cat)} style={{
            padding: '8px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
            background: selectedMain === cat ? '#2563eb' : '#f3f4f6',
            color: selectedMain === cat ? 'white' : '#333',
            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            {cat}
            <span onClick={(e) => { e.stopPropagation(); deleteMainCategory(cat); }} style={{ fontSize: '11px', cursor: 'pointer', opacity: 0.7 }}>✕</span>
          </div>
        ))}
      </div>

      {/* 소분류 */}
      {selectedMain && (
        <>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#444', marginBottom: '10px' }}>
            [{selectedMain}]의 소분류
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="새 소분류 이름" style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addSubCategory()} />
            <button onClick={addSubCategory} style={{ ...btnStyle, background: '#16a34a', color: 'white' }}>추가</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(cats[selectedMain] || []).map((sub: string) => (
              <div key={sub} style={{
                padding: '6px 12px', borderRadius: '15px', fontSize: '13px',
                background: '#f0fdf4', color: '#166534', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #86efac'
              }}>
                {sub}
                <span onClick={() => deleteSubCategory(sub)} style={{ fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}>✕</span>
              </div>
            ))}
            {(cats[selectedMain] || []).length === 0 && <p style={{ color: '#999', fontSize: '13px' }}>소분류가 없습니다. 추가해주세요.</p>}
          </div>
        </>
      )}
    </div>
  );
}
