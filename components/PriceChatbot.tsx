"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../lib/utils';

type Step = 'main' | 'sub' | 'result';

const ZERO_MSG = "아직 같은 수선 이력이 없어요. 방문해 주시면 꼼꼼히 보고 친절히 견적해 드릴게요.";

export default function PriceChatbot() {
  const [categories, setCategories] = useState<Record<string, string[]>>(DEFAULT_CATEGORIES);
  const [step, setStep] = useState<Step>('main');
  const [selectedMain, setSelectedMain] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ avgPrice: number; items: string[]; count: number; refPrice?: number } | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catDoc = await getDoc(doc(db, "settings", "categories"));
        if (catDoc.exists() && catDoc.data().list) {
          setCategories(catDoc.data().list);
        }
      } catch (e) { console.log("카테고리 로드 실패"); }
    };
    loadCategories();
  }, []);

  const mainCategories = Object.keys(categories);
  const subCategories = categories[selectedMain] || [];

  const handleSelectMain = (main: string) => {
    setSelectedMain(main);
    setSelectedSub('');
    setStep('sub');
  };

  const handleSelectSub = async (sub: string) => {
    setSelectedSub(sub);
    setIsLoading(true);
    try {
      const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = all
        .filter((t: any) => {
          const matchCat = t.category === selectedMain;
          const matchSub = t.subCategory === sub;
          const hasPrice = t.price && Number(t.price) > 0;
          return matchCat && matchSub && hasPrice;
        })
        .slice(0, 10);

      setTickets(filtered);

      const prices = filtered.map((t: any) => Number(t.price));
      const avgPrice = prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0;
      const items = filtered.map((t: any) => t.item || '').filter(Boolean);
      const count = filtered.length;

      // 0건일 때 참고 가격표 로드
      let refPrice = 0;
      if (count === 0) {
        try {
          const ptDoc = await getDoc(doc(db, "settings", "priceTable"));
          if (ptDoc.exists() && ptDoc.data().list) {
            const pt = ptDoc.data().list as Record<string, Record<string, number>>;
            refPrice = pt[selectedMain]?.[sub] || 0;
          }
        } catch (_) {}
      }

      setResult({ avgPrice, items, count, refPrice });
      setStep('result');
    } catch (e) {
      setResult({ avgPrice: 0, items: [], count: 0, refPrice: 0 });
      setStep('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('main');
    setSelectedMain('');
    setSelectedSub('');
    setResult(null);
  };

  const botBubble = (text: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
      <div style={{
        maxWidth: '85%', padding: '14px 16px', borderRadius: '18px 18px 18px 4px',
        background: '#e8f4fd', color: '#111', fontSize: '15px', lineHeight: 1.5
      }}>
        {text}
      </div>
    </div>
  );

  const btnStyle = (isMain = false) => ({
    padding: isMain ? '14px 20px' : '12px 18px',
    borderRadius: '12px', border: '2px solid #2563eb', background: 'white',
    color: '#2563eb', fontSize: isMain ? '15px' : '14px', fontWeight: 'bold',
    cursor: 'pointer', marginRight: '8px', marginBottom: '8px',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', marginBottom: '6px' }}>💬</div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>가격 문의 챗봇</h2>
        <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>수선 가격을 미리 알아보세요</p>
      </div>

      <div style={{ padding: '20px', minHeight: '200px' }}>
        {step === 'main' && (
          <>
            {botBubble('안녕하세요! 🙂 에벤에셀옷수선입니다. 어떤 상품을 맡기시려고 하시나요?')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {mainCategories.map(c => (
                <button key={c} onClick={() => handleSelectMain(c)} style={btnStyle(true)}>
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'sub' && (
          <>
            {botBubble(`좋아요! ${selectedMain}이시군요. 어떤 수선을 원하시나요?`)}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {subCategories.map((s: string) => (
                <button key={s} onClick={() => handleSelectSub(s)} style={btnStyle()} disabled={isLoading}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={handleReset} style={{ marginTop: '12px', fontSize: '13px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              ← 다시 선택
            </button>
          </>
        )}

        {step === 'result' && isLoading && (
          botBubble('잠시만 기다려주세요... 최근 데이터를 확인하고 있어요.')
        )}

        {step === 'result' && !isLoading && result && (
          <>
            {result.count > 0 ? (
              <>
                {botBubble(
                  <span>수선은 비슷한 상품이라도, 고객님의 수선 난이도에 따라 가격은 변동될 수 있습니다.</span>
                )}
                {botBubble(
                  <span><strong>{selectedMain} &gt; {selectedSub}</strong> 기준, 최근 {result.count}개 평균 금액은 <strong style={{ color: '#2563eb', fontSize: '17px' }}>{result.avgPrice.toLocaleString()}원</strong>이며,</span>
                )}
                {botBubble(
                  <span>수선 내용으로는 {result.items.join(', ')} 등이 있었습니다.</span>
                )}
              </>
            ) : (result.refPrice ?? 0) > 0 ? (
              <>
                {botBubble(
                  <span>수선은 비슷한 상품이라도, 고객님의 수선 난이도에 따라 가격은 변동될 수 있습니다.</span>
                )}
                {botBubble(
                  <span>아직 {selectedMain} &gt; {selectedSub} 수선 이력은 없어요. 참고 가격은 약 <strong style={{ color: '#2563eb', fontSize: '17px' }}>{(result.refPrice ?? 0).toLocaleString()}원</strong>입니다. 가격은 디자인·원단에 따라 변동될 수 있어요.</span>
                )}
                {botBubble(ZERO_MSG)}
              </>
            ) : (
              botBubble(ZERO_MSG)
            )}
            <button onClick={handleReset} style={{
              marginTop: '16px', padding: '12px 20px', borderRadius: '10px', border: 'none',
              background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
            }}>
              다시 문의하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
