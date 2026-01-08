"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// 👇 이미지 압축 기능
import imageCompression from 'browser-image-compression';

export default function Home() {
  // 👇 에러 방지를 위한 <any[]> 타입 지정
  const [tickets, setTickets] = useState<any[]>([]);
  
  // 🔍 검색 및 뷰 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [view, setView] = useState('dashboard'); 

  // 🖨️ 인쇄용 상태
  const [printTicket, setPrintTicket] = useState<any>(null);

  // 입력창 상태
  const [newItem, setNewItem] = useState({ 
    name: '', phone: '', category: '하의', item: '', price: '', paymentMethod: '카드', 
    isUrgent: false, dueDate: new Date().toISOString().split('T')[0], photoUrl: '' 
  });
  const [file, setFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. 데이터 가져오기
  useEffect(() => {
    const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // --- 📅 날짜 계산 함수 ---
  function getTodayStringFromDate(date: any) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const today = getTodayStringFromDate(new Date());
  
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = getTodayStringFromDate(d);

  const currentMonthKey = today.slice(0, 7); // "2026-01"

  // --- 📊 통계 데이터 계산 (에러 방지 Number 추가됨) ---
  const todayRevenue = tickets
    .filter(t => t.createdAt && t.createdAt.toDate && getTodayStringFromDate(t.createdAt.toDate()) === today)
    .reduce((sum, t) => sum + Number(t.price || 0), 0);
  
  const monthTickets = tickets.filter(t => t.dueDate.startsWith(currentMonthKey));
  const monthRevenue = monthTickets.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const monthCount = monthTickets.length;

  const todayTickets = tickets.filter(t => t.dueDate === today);
  const tomorrowTickets = tickets.filter(t => t.dueDate === tomorrow);

  // 6개월 추이 그래프 데이터
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${d.getFullYear()}-${m}`);
    }
    return months;
  };
  const last6Months = getLast6Months();
  const monthlyData = last6Months.map(month => {
    const revenue = tickets
      .filter(t => t.dueDate.startsWith(month))
      .reduce((sum, t) => sum + Number(t.price || 0), 0);
    return { month, revenue };
  });
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue)) || 1;

  // 카테고리/결제수단 분석 (에러 방지 Number 추가됨)
  const categoryStats = tickets.reduce((acc: any, t) => {
    const cat = t.category || '기타';
    acc[cat] = (acc[cat] || 0) + Number(t.price || 0);
    return acc;
  }, {});
  const totalForStats = Object.values(categoryStats).reduce((a: any, b: any) => Number(a) + Number(b), 0) || 1;
  
  let topCategory = '없음';
  let topCatRevenue = 0;
  Object.entries(categoryStats).forEach(([cat, rev]: any) => {
    if (Number(rev) > topCatRevenue) { 
      topCategory = cat; 
      topCatRevenue = Number(rev); 
    }
  });

  const paymentStats = tickets.reduce((acc: any, t) => {
    const method = t.paymentMethod || '카드';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});
  
  let topPayment = '카드';
  let topPaymentCount = 0;
  Object.entries(paymentStats).forEach(([method, count]: any) => {
    if (Number(count) > topPaymentCount) { 
      topPayment = method; 
      topPaymentCount = Number(count); 
    }
  });

  const avgPrice = monthCount > 0 ? Math.round(monthRevenue / monthCount) : 0;


  // --- 기능 함수들 ---
  const handlePhoneChange = (e: any) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 7) val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7);
    else if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
    setNewItem({ ...newItem, phone: val });
  };

  const uploadImage = async () => {
    if (!file) return null;
    
    try {
      const options = {
        maxSizeMB: 0.2,     // 0.2MB 이하로 줄이기
        maxWidthOrHeight: 1200, 
        useWebWorker: true, 
      };

      console.log(`원본 용량: ${file.size / 1024 / 1024} MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`압축된 용량: ${compressedFile.size / 1024 / 1024} MB`); 

      const storageRef = ref(storage, `repairs/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, compressedFile);
      return await getDownloadURL(storageRef);

    } catch (error) {
      console.log("이미지 압축 실패:", error);
      return null; 
    }
  };

  const addTicket = async (isContinuous = false) => {
    if (!newItem.name || !newItem.price) return alert("필수 입력 누락!");
    setIsUploading(true);
    let photoUrl = '';
    
    // 번호 계산
    const todaysCount = tickets.filter(t => t.createdAt && getTodayStringFromDate(t.createdAt.toDate()) === today).length;
    const dailyNumber = todaysCount + 1;

    try {
      if (file) photoUrl = await (uploadImage() as any);
      
      const newTicketData = { 
        ...newItem, 
        photoUrl, 
        status: '접수', 
        createdAt: new Date(), 
        dailyNumber: dailyNumber 
      };

      await addDoc(collection(db, "repairs"), newTicketData);
      
      // 🖨️ 자동 인쇄
      handlePrint({ 
        ...newTicketData, 
        createdAt: { toDate: () => new Date() } 
      });

      if (isContinuous) {
        setNewItem(prev => ({ ...prev, category: '하의', item: '', price: '', photoUrl: '' }));
        setFile(null);
      } else {
        setNewItem({ name: '', phone: '', category: '하의', item: '', price: '', paymentMethod: '카드', isUrgent: false, dueDate: today, photoUrl: '' });
        setFile(null);
      }
    } catch (e) { alert("에러가 발생했습니다."); } finally { setIsUploading(false); }
  };

  const toggleStatus = async (id: any, currentStatus: any) => {
    let nextStatus = currentStatus === '접수' ? '수선완료' : currentStatus === '수선완료' ? '찾아감' : '접수';
    await updateDoc(doc(db, "repairs", id), { status: nextStatus });
  };
  
  const deleteTicket = async (id: any) => confirm("삭제하시겠습니까?") && deleteDoc(doc(db, "repairs", id));
  const sendSms = (t: any) => confirm(`[${t.name}] 문자 발송?`) && alert(`[문자]\n${t.name}님, ${t.item} 수선 완료!`);

  const handlePrint = (ticket: any) => {
    setPrintTicket(ticket);
    setTimeout(() => { 
      window.print(); 
      setTimeout(() => setPrintTicket(null), 500);
    }, 500);
  };

  const downloadExcel = () => {
    if (!confirm("엑셀로 저장할까요?")) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF일련번호,이름,전화번호,종류,내용,가격,결제,상태,마감일\n";
    tickets.forEach(t => csvContent += `${t.dailyNumber || ''},${t.name},${t.phone},${t.category},${t.item},${t.price},${t.paymentMethod},${t.status},${t.dueDate}\n`);
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `수선나라_장부_${today}.csv`;
    link.click();
  };

  const filteredList = tickets.filter(t => {
    const cleanSearch = searchTerm.replace(/-/g, '');
    const cleanPhone = (t.phone || '').replace(/-/g, '');
    const matchesText = t.name.includes(searchTerm) || cleanPhone.includes(cleanSearch) || t.item.includes(searchTerm);
    return matchesText && (searchDate ? t.dueDate === searchDate : true);
  });

  return (
    <div style={{ padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* 🟢 라벨 인쇄 화면 */}
      {printTicket && (
        <div id="print-area" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px' }}>
          <div style={{ width: '300px', border: '2px solid black', padding: '15px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', borderBottom: '2px solid black', paddingBottom: '5px' }}>🧵 수선나라</h2>
            <div style={{ fontSize: '60px', fontWeight: '900', margin: '10px 0', lineHeight: '1' }}>#{printTicket.dailyNumber || '?'}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{printTicket.name}</div>
            <div style={{ fontSize: '14px', marginBottom: '15px' }}>{printTicket.phone ? printTicket.phone.slice(-4) : ''}</div>
            <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '10px 0', margin: '10px 0', fontSize: '20px', fontWeight: 'bold' }}>{printTicket.item}</div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', fontWeight:'bold' }}><span>마감: {printTicket.dueDate.slice(5)}</span><span>{printTicket.category}</span></div>
            <div style={{ marginTop: '15px', fontSize: '10px' }}>접수일: {printTicket.createdAt ? getTodayStringFromDate(printTicket.createdAt.toDate()) : today}</div>
          </div>
        </div>
      )}

      {/* 🔴 메인 앱 화면 */}
      <div className="no-print">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>🧵 수선나라 사장님앱</h1>
          <div style={{ background: '#e5e7eb', padding: '5px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
            <TabButton name="📊 대시보드" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <TabButton name="✍️ 접수하기" active={view === 'register'} onClick={() => setView('register')} />
            <TabButton name="📈 경영분석" active={view === 'stats'} onClick={() => setView('stats')} />
            <TabButton name="📝 전체목록" active={view === 'list'} onClick={() => setView('list')} />
          </div>
        </div>

        {view === 'dashboard' && (
           <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
              <div style={{ background: '#2563eb', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>오늘 매출</span>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>{todayRevenue.toLocaleString()}원</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>이번 달 누적</span>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px', color: '#333' }}>{monthRevenue.toLocaleString()}원</div>
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1e40af' }}>🚚 오늘 나갈 옷</h3>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '30px' }}>
              {todayTickets.length === 0 ? <p style={{color:'#999', textAlign:'center', padding:'20px', background:'white', borderRadius:'10px'}}>없음</p> : todayTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={handlePrint} />)}
            </div>
             <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#444' }}>📅 내일 나갈 옷</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {tomorrowTickets.length === 0 ? <p style={{color:'#999', textAlign:'center', padding:'20px', background:'white', borderRadius:'10px'}}>없음</p> : tomorrowTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={handlePrint} />)}
            </div>
           </>
        )}

        {view === 'register' && <RegisterView newItem={newItem} setNewItem={setNewItem} handlePhoneChange={handlePhoneChange} file={file} setFile={setFile} isUploading={isUploading} addTicket={addTicket} />}
        
        {view === 'stats' && (
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>📈 우리가게 분석</h2>
                <button onClick={downloadExcel} style={{ fontSize: '14px', background: '#166534', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>📥 엑셀로 저장</button>
              </div>

              {/* 1. 성적표 */}
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#444', marginBottom: '15px' }}>🏆 이번 달 성적표 ({currentMonthKey})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '2px solid #bfdbfe', textAlign: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#1e40af', fontWeight: 'bold' }}>총 매출</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e40af', marginTop: '8px' }}>{monthRevenue.toLocaleString()}원</div>
                </div>
                <div style={{ background: '#fdf2f8', padding: '20px', borderRadius: '12px', border: '2px solid #fbcfe8', textAlign: 'center' }}>
                    <span style={{ fontSize: '15px', color: '#9d174d', fontWeight: 'bold' }}>작업한 옷</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#9d174d', marginTop: '8px' }}>{monthCount}벌</div>
                </div>
              </div>

              {/* 2. 제미나이 점장 브리핑 */}
              <div style={{ background: '#f0fdf4', padding: '25px', borderRadius: '15px', marginBottom: '40px', border: '2px solid #86efac', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', marginBottom: '20px', display:'flex', alignItems:'center' }}>
                  🤖 제미나이 점장의 한마디
                </h3>
                <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'grid', gap: '15px' }}>
                  <li style={{ fontSize: '16px', color: '#333', display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🥇</span>
                    <span>
                      <strong>효자 종목은 [{topCategory}] 입니다!</strong> <br/>
                      {/* 👇 여기도 Number() 추가 */}
                      <span style={{fontSize: '14px', color: '#666'}}>지금 매출의 <strong style={{color:'#15803d'}}>{Math.round((Number(topCatRevenue)/Number(totalForStats))*100)}%</strong>를 벌어주고 있어요.</span>
                    </span>
                  </li>
                  <li style={{ fontSize: '16px', color: '#333', display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>💳</span>
                    <span>
                      <strong>손님들은 [{topPayment}] 결제를 선호해요.</strong> <br/>
                      <span style={{fontSize: '14px', color: '#666'}}>
                        {topPayment === '현금' ? '거스름돈을 미리 넉넉히 준비해두세요!' : '카드 결제가 많으니 정산이 편하겠네요!'}
                      </span>
                    </span>
                  </li>
                  <li style={{ fontSize: '16px', color: '#333', display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>💰</span>
                    <span>
                      <strong>손님 한 분당 평균 {avgPrice.toLocaleString()}원 쓰시네요.</strong> <br/>
                      <span style={{fontSize: '14px', color: '#666'}}>비싼 옷 수선이 들어오면 이 금액이 쑥 올라갈 거예요.</span>
                    </span>
                  </li>
                </ul>
              </div>

              {/* 3. 그래프 (px 단위 고정) */}
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#444', marginBottom: '15px' }}>📅 최근 6개월 매출 흐름</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '8px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                {monthlyData.map((d) => {
                  const MAX_BAR_HEIGHT = 150; 
                  // 👇 여기도 Number() 추가
                  const heightPx = d.revenue === 0 ? 2 : (Number(d.revenue) / Number(maxRevenue)) * MAX_BAR_HEIGHT;
                  
                  return (
                    <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight:'bold' }}>{d.revenue > 0 ? (d.revenue/10000).toFixed(0)+'만' : ''}</span>
                      <div style={{ width: '100%', height: `${heightPx}px`, background: d.month === currentMonthKey ? '#2563eb' : '#cbd5e1', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '12px', color: '#444', fontWeight: 'bold' }}>{d.month.split('-')[1]}월</span>
                    </div>
                  );
                })}
              </div>

              {/* 4. 매출 비중 */}
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#444', marginBottom: '15px', marginTop: '30px' }}>💰 뭐로 돈을 벌었을까?</h3>
              <div style={{ marginBottom: '30px' }}>
                {Object.entries(categoryStats).map(([cat, price]: any) => {
                  // 👇 여기도 Number() 추가
                  const percent = Math.round((Number(price) / Number(totalForStats)) * 100);
                  return (
                    <div key={cat} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '5px' }}>
                        <span style={{fontWeight:'bold'}}>{cat}</span>
                        <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{percent}% ({price.toLocaleString()}원)</span>
                      </div>
                      <div style={{ width: '100%', background: '#f3f4f6', height: '12px', borderRadius: '6px', overflow: 'hidden' }}><div style={{ width: `${percent}%`, background: '#3b82f6', height: '100%' }}></div></div>
                    </div>
                  );
                })}
              </div>
            </div>
        )}

        {view === 'list' && <ListView searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchDate={searchDate} setSearchDate={setSearchDate} filteredList={filteredList} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={handlePrint} />}
      </div>
      
      <style jsx global>{`@media print { .no-print { display: none !important; } #print-area { display: flex !important; position: absolute; left: 0; top: 0; } @page { size: auto; margin: 0mm; } }`}</style>
    </div>
  );
}

// 👇 하위 컴포넌트들도 모두 포함 (RegisterView, ListView, TabButton, TicketCard)
function RegisterView({ newItem, setNewItem, handlePhoneChange, file, setFile, isUploading, addTicket }: any) {
    const inputStyle = { padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', width: '100%', fontSize: '15px' };
    const labelStyle = { fontSize: '13px', color: '#666', marginBottom: '5px', display: 'block', fontWeight: 'bold' };
    return (
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>새 수선 접수</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>고객 이름</label><input placeholder="홍길동" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>전화번호</label><input placeholder="010-0000-0000" value={newItem.phone} onChange={handlePhoneChange} style={inputStyle} maxLength={13} /></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '80px' }}><label style={labelStyle}>종류</label><select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} style={inputStyle}>{["하의", "상의", "외투", "기타"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>수선 내용</label><input placeholder="예: 바지 기장" value={newItem.item} onChange={(e) => setNewItem({...newItem, item: e.target.value})} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>마감 예정일</label><input type="date" value={newItem.dueDate} onChange={(e) => setNewItem({...newItem, dueDate: e.target.value})} style={inputStyle} /></div>
            {/* 👇 에러 수정: e.target.files && 체크 추가 */}
            <div><label style={labelStyle}>사진 첨부</label><label style={{ ...inputStyle, display: 'block', cursor: 'pointer', background: '#f9fafb', textAlign: 'center', color: file ? '#2563eb' : '#666' }}>{file ? `📸 ${file.name}` : "📷 사진 선택"}<input type="file" accept="image/*" onChange={(e: any) => setFile(e.target.files && e.target.files[0])} style={{ display: 'none' }} /></label></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
            <div><label style={labelStyle}>금액 (원)</label><input type="number" placeholder="0" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>결제 방법</label><select value={newItem.paymentMethod} onChange={(e) => setNewItem({...newItem, paymentMethod: e.target.value})} style={inputStyle}><option value="카드">💳 카드</option><option value="현금">💵 현금</option><option value="이체">📱 이체</option></select></div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fee2e2', padding: '12px', borderRadius: '5px', color: 'red', fontWeight: 'bold', height: '46px', boxSizing: 'border-box' }}><input type="checkbox" checked={newItem.isUrgent} onChange={(e) => setNewItem({...newItem, isUrgent: e.target.checked})} style={{ marginRight: '5px' }} />급함!</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => addTicket(true)} disabled={isUploading} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>{isUploading ? "..." : "💾 저장 + 연속 접수"}</button>
            <button onClick={() => addTicket(false)} disabled={isUploading} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>{isUploading ? "..." : "✅ 저장 (끝)"}</button>
          </div>
        </div>
      </div>
    );
}

function ListView({ searchTerm, setSearchTerm, searchDate, setSearchDate, filteredList, toggleStatus, deleteTicket, sendSms, onPrint }: any) {
  return (
    <>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input placeholder="🔍 이름, 전화번호 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '16px' }} />
        <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '16px' }} />
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {filteredList.map((ticket: any) => <TicketCard key={ticket.id} ticket={ticket} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={onPrint} />)}
        {filteredList.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>데이터가 없습니다.</p>}
      </div>
    </>
  );
}

function TabButton({ name, active, onClick }: any) {
  return <button onClick={onClick} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: active ? 'white' : 'transparent', fontWeight: active ? 'bold' : 'normal', color: active ? 'black' : '#666', cursor: 'pointer', whiteSpace: 'nowrap' }}>{name}</button>;
}

function TicketCard({ ticket, toggleStatus, deleteTicket, sendSms, onPrint }: any) {
  const getStatusColor = (s: any) => {
    if (s === '수선완료') return { bg: '#dcfce7', text: '#166534' };
    if (s === '찾아감') return { bg: '#374151', text: '#ffffff' }; 
    return { bg: '#fef9c3', text: '#854d0e' };
  };
  const statusColor = getStatusColor(ticket.status);
  const cardOpacity = ticket.status === '찾아감' ? 0.6 : 1;

  return (
    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', borderLeft: ticket.isUrgent ? '5px solid #ef4444' : '5px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', opacity: cardOpacity }}>
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minWidth:'40px', background:'#f3f4f6', borderRadius:'8px', fontSize:'18px', fontWeight:'900', color:'#333' }}>#{ticket.dailyNumber || '?'}</div>
        {ticket.photoUrl && <img src={ticket.photoUrl} alt="사진" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', background: '#eee' }} />}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {ticket.isUrgent && <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>급!</span>}
            <strong style={{ fontSize: '16px' }}>{ticket.name}</strong>
            <span style={{ fontSize: '13px', color: '#666' }}>{ticket.phone}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#444', textDecoration: ticket.status === '찾아감' ? 'line-through' : 'none' }}>{ticket.item}</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{ticket.dueDate} <span style={{ color: '#2563eb', fontWeight: 'bold', marginLeft: '5px' }}>{Number(ticket.price).toLocaleString()}원</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
        <button onClick={() => onPrint(ticket)} style={{ padding: '6px', borderRadius: '6px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}>🖨️ 라벨</button>
        <button onClick={() => toggleStatus(ticket.id, ticket.status)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: statusColor.bg, color: statusColor.text, fontSize: '12px', fontWeight: 'bold' }}>{ticket.status}</button>
        {ticket.status === '수선완료' && <button onClick={() => sendSms(ticket)} style={{ padding: '6px', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}>문자</button>}
        <button onClick={() => deleteTicket(ticket.id)} style={{ padding: '6px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', border: 'none', cursor: 'pointer', fontSize: '12px' }}>삭제</button>
      </div>
    </div>
  );
}