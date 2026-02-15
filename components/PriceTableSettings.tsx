"use client";

import { useState, useEffect } from 'react';

/** 참고 가격표: { "바지": { "단수선": 5000, "기장수선": 4000 }, ... } */
export type PriceTable = Record<string, Record<string, number>>;

export default function PriceTableSettings({ categories, priceTable, onSave }: { categories: Record<string, string[]>; priceTable: PriceTable; onSave: (table: PriceTable) => void }) {
  const [prices, setPrices] = useState<PriceTable>(priceTable || {});

  useEffect(() => {
    setPrices(priceTable || {});
  }, [priceTable]);

  const handleChange = (main: string, sub: string, value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    setPrices(prev => {
      const next = { ...prev };
      if (!next[main]) next[main] = {};
      if (num > 0) {
        next[main][sub] = num;
      } else {
        delete next[main][sub];
        if (Object.keys(next[main]).length === 0) delete next[main];
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(prices);
  };

  const inputStyle: any = { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '90px', textAlign: 'right' };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>참고 가격표</h2>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
        가격 문의 챗봇에서 <strong>수선 이력이 0건</strong>일 때 이 참고 가격을 안내합니다. 비워두면 기본 안내 문구만 표시됩니다.
      </p>

      <div style={{ marginBottom: '20px' }}>
        {Object.entries(categories || {}).map(([main, subs]) => (
          <div key={main} style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#f9fafb', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{main}</div>
            <div style={{ padding: '12px 14px', display: 'grid', gap: '10px' }}>
              {subs.map((sub: string) => (
                <div key={sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#444' }}>{sub}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={prices[main]?.[sub] || ''}
                      onChange={(e) => handleChange(main, sub, e.target.value)}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: '13px', color: '#666' }}>원</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{
        padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none',
        borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
      }}>
        저장하기
      </button>
    </div>
  );
}
