"use client";

import { useState, useMemo } from 'react';
import { getReceivedDateStr, getDayOfWeek, DAY_NAMES } from '../lib/utils';

export default function StatsView({ tickets, today, onDownloadExcel }: any) {
  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);

  // 기간 내 티켓 (맡긴일 기준)
  const rangeTickets = useMemo(() => {
    return tickets.filter((t: any) => {
      const rd = getReceivedDateStr(t);
      if (!rd) return false;
      return rd >= startDate && rd <= endDate;
    });
  }, [tickets, startDate, endDate]);

  // 기간 내 매출
  const rangeRevenue = rangeTickets.reduce((sum: number, t: any) => sum + Number(t.price || 0), 0);
  const rangeCount = rangeTickets.length;

  // 요일별 통계
  const dayStats = useMemo(() => {
    const stats: Record<number, { revenue: number; count: number }> = {};
    for (let i = 0; i < 7; i++) stats[i] = { revenue: 0, count: 0 };
    rangeTickets.forEach((t: any) => {
      const day = getDayOfWeek(getReceivedDateStr(t));
      if (day >= 0) {
        stats[day].revenue += Number(t.price || 0);
        stats[day].count += 1;
      }
    });
    return stats;
  }, [rangeTickets]);

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    const acc: Record<string, number> = {};
    rangeTickets.forEach((t: any) => {
      const cat = t.subCategory ? `${t.category}/${t.subCategory}` : (t.category || '기타');
      acc[cat] = (acc[cat] || 0) + Number(t.price || 0);
    });
    return acc;
  }, [rangeTickets]);

  const totalForStats = Object.values(categoryStats).reduce((a, b) => a + b, 0) || 1;

  // 최근 6개월 (맡긴일 기준)
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const dd = new Date();
      dd.setMonth(dd.getMonth() - i);
      const m = String(dd.getMonth() + 1).padStart(2, '0');
      months.push(`${dd.getFullYear()}-${m}`);
    }
    return months;
  };
  const last6Months = getLast6Months();
  const monthlyData = last6Months.map(month => {
    const revenue = tickets
      .filter((t: any) => getReceivedDateStr(t).startsWith(month))
      .reduce((sum: number, t: any) => sum + Number(t.price || 0), 0);
    return { month, revenue };
  });
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue)) || 1;
  const currentMonthKey = today.slice(0, 7);

  // 결제 수단 통계
  const paymentStats = rangeTickets.reduce((acc: Record<string, number>, t: any) => {
    const method = t.paymentMethod || '카드';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  let topPayment = '카드';
  let topPaymentCount = 0;
  Object.entries(paymentStats).forEach(([method, count]) => {
    const c = Number(count);
    if (c > topPaymentCount) { topPayment = method; topPaymentCount = c; }
  });

  const avgPrice = rangeCount > 0 ? Math.round(rangeRevenue / rangeCount) : 0;

  const boxStyle = (bg: string, border: string) => ({ background: bg, padding: '15px', borderRadius: '10px', border: `1px solid ${border}`, textAlign: 'center' as const });
  const sectionTitle = { fontSize: '16px', fontWeight: 'bold' as const, color: '#444', marginBottom: '10px' };

  return (
    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>📈 우리가게 분석</h2>
        <button onClick={onDownloadExcel} style={{ fontSize: '12px', background: '#166534', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>엑셀저장</button>
      </div>

      {/* 기간 선택 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={sectionTitle}>📅 분석 기간 (맡긴일 기준)</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
          <span style={{ color: '#666' }}>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
        </div>
      </div>

      {/* 기간 내 성적 */}
      <h3 style={sectionTitle}>🏆 선택 기간 성적</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
        <div style={boxStyle('#eff6ff', '#bfdbfe')}>
          <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 'bold' }}>총 매출</span>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e40af', marginTop: '5px' }}>{rangeRevenue.toLocaleString()}원</div>
        </div>
        <div style={boxStyle('#fdf2f8', '#fbcfe8')}>
          <span style={{ fontSize: '13px', color: '#9d174d', fontWeight: 'bold' }}>작업한 옷</span>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#9d174d', marginTop: '5px' }}>{rangeCount}벌</div>
        </div>
      </div>

      {/* 제미나이 점장 */}
      <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #86efac', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803d', marginBottom: '10px' }}>🤖 제미나이 점장의 한마디</h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
          {Object.keys(categoryStats).length > 0 && (() => {
            const topCat = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
            return (
              <li style={{ fontSize: '14px', color: '#333', display: 'flex', alignItems: 'start', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🥇</span>
                <span>
                  <strong>효자 종목은 [{topCat[0]}] 입니다!</strong><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>지금 매출의 <strong style={{ color: '#15803d' }}>{Math.round((topCat[1] / totalForStats) * 100)}%</strong>를 벌어주고 있어요.</span>
                </span>
              </li>
            );
          })()}
          <li style={{ fontSize: '14px', color: '#333', display: 'flex', alignItems: 'start', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>💳</span>
            <span>
              <strong>손님들은 [{topPayment}] 결제를 선호해요.</strong><br />
              <span style={{ fontSize: '12px', color: '#666' }}>
                {topPayment === '후불' ? '후불이 많으니 찾아올 때 결제받는 걸 잊지 마세요!' : topPayment === '현금' ? '거스름돈을 미리 넉넉히 준비해두세요!' : '카드 결제가 많으니 정산이 편하겠네요!'}
              </span>
            </span>
          </li>
          <li style={{ fontSize: '14px', color: '#333', display: 'flex', alignItems: 'start', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>💰</span>
            <span>
              <strong>손님 한 분당 평균 {avgPrice.toLocaleString()}원 쓰시네요.</strong><br />
              <span style={{ fontSize: '12px', color: '#666' }}>비싼 옷 수선이 들어오면 이 금액이 쑥 올라갈 거예요.</span>
            </span>
          </li>
        </ul>
      </div>

      {/* 요일별 매출 */}
      <h3 style={sectionTitle}>📆 요일별 매출</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '25px', fontSize: '11px' }}>
        {DAY_NAMES.map((name, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 'bold', color: '#444', marginBottom: '4px' }}>{name}</div>
            <div style={{ color: '#2563eb', fontWeight: 'bold' }}>{(dayStats[i]?.revenue || 0).toLocaleString()}원</div>
            <div style={{ color: '#999', fontSize: '10px' }}>{dayStats[i]?.count || 0}건</div>
          </div>
        ))}
      </div>

      {/* 최근 6개월 매출 (맡긴일 기준) */}
      <h3 style={sectionTitle}>📅 최근 6개월 매출 (맡긴일 기준)</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '5px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        {monthlyData.map((d) => {
          const MAX_BAR_HEIGHT = 120;
          const heightPx = d.revenue === 0 ? 2 : (d.revenue / maxRevenue) * MAX_BAR_HEIGHT;
          return (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>{d.revenue > 0 ? (d.revenue / 10000).toFixed(0) : ''}</span>
              <div style={{ width: '100%', height: `${heightPx}px`, background: d.month === currentMonthKey ? '#2563eb' : '#cbd5e1', borderRadius: '4px 4px 0 0' }}></div>
              <span style={{ fontSize: '10px', color: '#444' }}>{d.month.split('-')[1]}월</span>
            </div>
          );
        })}
      </div>

      {/* 카테고리별 매출 */}
      <h3 style={{ ...sectionTitle, marginTop: '20px' }}>💰 카테고리별 매출</h3>
      <div style={{ marginBottom: '20px' }}>
        {Object.entries(categoryStats)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, price]) => {
            const percent = Math.round((price / totalForStats) * 100);
            return (
              <div key={cat} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold' }}>{cat}</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{percent}% ({price.toLocaleString()}원)</span>
                </div>
                <div style={{ width: '100%', background: '#f3f4f6', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${percent}%`, background: '#3b82f6', height: '100%' }}></div></div>
              </div>
            );
          })}
        {Object.keys(categoryStats).length === 0 && <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '20px' }}>선택 기간에 데이터가 없습니다.</p>}
      </div>
    </div>
  );
}
