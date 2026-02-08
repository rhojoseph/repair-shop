"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { getTodayStringFromDate, formatPhone, DEFAULT_CATEGORIES } from '../../lib/utils';

export default function CustomerPage() {
  const [view, setView] = useState<'menu' | 'track' | 'request'>('menu');
  const [categories, setCategories] = useState<Record<string, string[]>>(DEFAULT_CATEGORIES);

  // 조회용
  const [trackName, setTrackName] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResults, setTrackResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 접수 요청용
  const today = getTodayStringFromDate(new Date());
  const [reqData, setReqData] = useState({
    name: '', phone: '', category: Object.keys(DEFAULT_CATEGORIES)[0] || '바지',
    subCategory: '', item: '', note: ''
  });
  const [reqFile, setReqFile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  // 카테고리 로드
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

  useEffect(() => {
    const mainCats = Object.keys(categories);
    if (mainCats.length > 0 && !mainCats.includes(reqData.category)) {
      setReqData(prev => ({ ...prev, category: mainCats[0], subCategory: '' }));
    }
  }, [categories]);

  // 조회
  const handleSearch = async () => {
    if (!trackName && !trackPhone) return alert("이름 또는 전화번호를 입력하세요.");
    setIsSearching(true);
    try {
      const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const cleanInput = trackPhone.replace(/-/g, '');
      const results = all.filter((t: any) => {
        const cleanPhone = (t.phone || '').replace(/-/g, '');
        const nameMatch = trackName ? t.name?.includes(trackName) : true;
        const phoneMatch = cleanInput ? cleanPhone.includes(cleanInput) : true;
        return nameMatch && phoneMatch;
      });

      setTrackResults(results);
    } catch (e) {
      alert("조회 중 오류가 발생했습니다.");
    } finally { setIsSearching(false); }
  };

  // 접수 요청
  const handleSubmitRequest = async () => {
    if (!reqData.name || !reqData.item) return alert("이름과 수선 내용은 필수입니다.");
    setIsSubmitting(true);

    try {
      let photoUrl = '';
      if (reqFile) {
        try {
          const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true };
          const compressed = await imageCompression(reqFile, options);
          const storageRef = ref(storage, `requests/${Date.now()}_${reqFile.name}`);
          await uploadBytes(storageRef, compressed);
          photoUrl = await getDownloadURL(storageRef);
        } catch (e) { console.log("이미지 업로드 실패"); }
      }

      await addDoc(collection(db, "repairs"), {
        name: reqData.name,
        phone: reqData.phone,
        category: reqData.category,
        subCategory: reqData.subCategory,
        item: reqData.item,
        photoUrl,
        status: '요청',
        createdAt: new Date(),
        receivedDate: today,
        dueDate: '',
        price: '',
        paymentMethod: '',
        isUrgent: false,
        dailyNumber: 0,
      });

      setSubmitDone(true);
    } catch (e) { alert("접수 요청 중 오류가 발생했습니다."); } finally { setIsSubmitting(false); }
  };

  const handlePhoneChange = (e: any, setter: (val: string) => void) => {
    setter(formatPhone(e.target.value));
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case '요청': return { label: '접수 요청됨', color: '#6366f1', bg: '#e0e7ff', icon: '📩' };
      case '접수': return { label: '수선 진행 중', color: '#854d0e', bg: '#fef9c3', icon: '🧵' };
      case '수선완료': return { label: '수선 완료!', color: '#166534', bg: '#dcfce7', icon: '✅' };
      case '찾아감': return { label: '수령 완료', color: '#ffffff', bg: '#374151', icon: '👋' };
      default: return { label: status, color: '#666', bg: '#f3f4f6', icon: '📋' };
    }
  };

  const inputStyle: any = { padding: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', width: '100%', fontSize: '16px', color: '#000', fontWeight: 'bold' };
  const labelStyle: any = { fontSize: '13px', color: '#666', marginBottom: '6px', display: 'block', fontWeight: 'bold' };
  const mainCategories = Object.keys(categories);
  const subCategories = categories?.[reqData.category] || [];

  return (
    <div style={{ padding: '15px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '10px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', marginBottom: '5px' }}>🧵 수선나라</h1>
        {view !== 'menu' && (
          <button onClick={() => { setView('menu'); setTrackResults(null); setSubmitDone(false); }} style={{ fontSize: '13px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            ← 처음으로
          </button>
        )}
      </div>

      {/* 메뉴 */}
      {view === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
          <button onClick={() => setView('track')} style={{
            padding: '25px', borderRadius: '16px', border: 'none',
            background: 'white', cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>내 수선 조회</div>
            <div style={{ fontSize: '13px', color: '#666' }}>이름과 전화번호로 수선 상태를 확인하세요</div>
          </button>

          <button onClick={() => setView('request')} style={{
            padding: '25px', borderRadius: '16px', border: 'none',
            background: 'white', cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✍️</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>수선 접수 요청</div>
            <div style={{ fontSize: '13px', color: '#666' }}>수선할 옷 정보를 미리 보내주세요</div>
          </button>
        </div>
      )}

      {/* 조회 */}
      {view === 'track' && (
        <div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '15px' }}>내 수선 조회</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><label style={labelStyle}>이름</label><input placeholder="홍길동" value={trackName} onChange={(e) => setTrackName(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>전화번호 (뒷자리도 가능)</label><input placeholder="0000" value={trackPhone} onChange={(e) => handlePhoneChange(e, setTrackPhone)} style={inputStyle} maxLength={13} /></div>
              <button onClick={handleSearch} disabled={isSearching} style={{
                padding: '14px', background: '#2563eb', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px'
              }}>
                {isSearching ? '조회 중...' : '🔍 조회하기'}
              </button>
            </div>
          </div>

          {/* 결과 */}
          {trackResults !== null && (
            <div>
              {trackResults.length === 0 ? (
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>😅</div>
                  <p style={{ fontSize: '15px', color: '#666' }}>검색 결과가 없습니다.</p>
                  <p style={{ fontSize: '13px', color: '#999', marginTop: '5px' }}>이름과 전화번호를 다시 확인해주세요.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <p style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>총 {trackResults.length}건</p>
                  {trackResults.map((t: any) => {
                    const status = getStatusInfo(t.status);
                    const catLabel = t.subCategory ? `${t.category}/${t.subCategory}` : t.category;
                    return (
                      <div key={t.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#111' }}>{t.item}</span>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: status.bg, color: status.color }}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>[{catLabel}]</span>
                          {t.dueDate && <span>마감: {t.dueDate}</span>}
                          {t.price && <span>금액: {Number(t.price).toLocaleString()}원</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 접수 요청 */}
      {view === 'request' && !submitDone && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '5px' }}>수선 접수 요청</h2>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '15px' }}>요청 후 사장님이 확인하면 가격과 마감일이 정해집니다.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>이름 *</label><input placeholder="홍길동" value={reqData.name} onChange={(e) => setReqData({ ...reqData, name: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>전화번호</label><input placeholder="010-0000-0000" value={reqData.phone} onChange={(e) => handlePhoneChange(e, (v) => setReqData({ ...reqData, phone: v }))} style={inputStyle} maxLength={13} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>대분류</label>
                <select value={reqData.category} onChange={(e) => setReqData({ ...reqData, category: e.target.value, subCategory: '' })} style={inputStyle}>
                  {mainCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>소분류</label>
                <select value={reqData.subCategory} onChange={(e) => setReqData({ ...reqData, subCategory: e.target.value })} style={inputStyle}>
                  <option value="">선택</option>
                  {subCategories.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>수선 내용 *</label>
              <input placeholder="예: 바지 기장 줄여주세요" value={reqData.item} onChange={(e) => setReqData({ ...reqData, item: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>사진 (선택)</label>
              <label style={{ ...inputStyle, display: 'block', cursor: 'pointer', background: '#f9fafb', textAlign: 'center', color: reqFile ? '#2563eb' : '#666', fontSize: '14px' }}>
                {reqFile ? `📸 ${reqFile.name}` : "📷 사진 선택"}
                <input type="file" accept="image/*" onChange={(e: any) => setReqFile(e.target.files && e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>

            <button onClick={handleSubmitRequest} disabled={isSubmitting} style={{
              padding: '16px', background: '#2563eb', color: 'white', border: 'none',
              borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px'
            }}>
              {isSubmitting ? '전송 중...' : '📩 접수 요청 보내기'}
            </button>
          </div>
        </div>
      )}

      {/* 접수 완료 */}
      {view === 'request' && submitDone && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>접수 요청 완료!</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>사장님이 확인 후 가격과 마감일을 알려드릴게요.</p>
          <button onClick={() => { setSubmitDone(false); setReqData({ name: '', phone: '', category: Object.keys(categories)[0] || '바지', subCategory: '', item: '', note: '' }); setReqFile(null); }} style={{
            padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            추가 요청하기
          </button>
        </div>
      )}
    </div>
  );
}
