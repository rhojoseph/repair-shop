"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { getTodayStringFromDate, formatPhone, DEFAULT_CATEGORIES, getReceivedDateStr } from '../../lib/utils';

import TabButton from '../../components/TabButton';
import TicketCard from '../../components/TicketCard';
import RegisterView from '../../components/RegisterView';
import ListView from '../../components/ListView';
import EditModal from '../../components/EditModal';
import CategorySettings from '../../components/CategorySettings';
import PriceTableSettings, { type PriceTable } from '../../components/PriceTableSettings';
import StatsView from '../../components/StatsView';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

export default function AdminPage() {
  // 인증 상태
  const [isAuth, setIsAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // 데이터
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>(DEFAULT_CATEGORIES);
  const [priceTable, setPriceTable] = useState<PriceTable>({});

  // 뷰 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [view, setView] = useState('dashboard');

  // 인쇄
  const [printTicket, setPrintTicket] = useState<any>(null);

  // 수정 모달
  const [editingTicket, setEditingTicket] = useState<any>(null);

  // 입력 상태
  const today = getTodayStringFromDate(new Date());
  const [newItem, setNewItem] = useState({
    name: '', phone: '', category: Object.keys(DEFAULT_CATEGORIES)[0] || '바지', subCategory: '',
    item: '', price: '', paymentMethod: '카드',
    isUrgent: false, receivedDate: today, dueDate: today, photoUrl: ''
  });
  const [file, setFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('admin_auth');
      if (saved === 'true') setIsAuth(true);
    }
  }, []);

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuth(true);
      setPasswordError(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_auth', 'true');
      }
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuth(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_auth');
    }
  };

  // 데이터 로드
  useEffect(() => {
    if (!isAuth) return;

    const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 카테고리 로드
    const loadCategories = async () => {
      try {
        const catDoc = await getDoc(doc(db, "settings", "categories"));
        if (catDoc.exists() && catDoc.data().list) {
          setCategories(catDoc.data().list);
        } else {
          await setDoc(doc(db, "settings", "categories"), { list: DEFAULT_CATEGORIES });
        }
      } catch (e) {
        console.log("카테고리 로드 실패:", e);
      }
    };
    loadCategories();

    // 참고 가격표 로드
    const loadPriceTable = async () => {
      try {
        const ptDoc = await getDoc(doc(db, "settings", "priceTable"));
        if (ptDoc.exists() && ptDoc.data().list) {
          setPriceTable(ptDoc.data().list);
        }
      } catch (e) {
        console.log("가격표 로드 실패:", e);
      }
    };
    loadPriceTable();

    return () => unsubscribe();
  }, [isAuth]);

  // newItem의 category가 변경되면 categories에 맞게 초기화
  useEffect(() => {
    const mainCats = Object.keys(categories);
    if (mainCats.length > 0 && !mainCats.includes(newItem.category)) {
      setNewItem(prev => ({ ...prev, category: mainCats[0], subCategory: '' }));
    }
  }, [categories]);

  // 비밀번호 입력 화면
  if (!isAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f3f4f6', fontFamily: 'sans-serif', padding: '20px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔑</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginBottom: '5px' }}>사장님 전용</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>비밀번호를 입력하세요</p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호"
            style={{
              width: '100%', padding: '14px', border: `2px solid ${passwordError ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '10px', fontSize: '16px', textAlign: 'center', marginBottom: '10px',
              outline: 'none'
            }}
          />
          {passwordError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>비밀번호가 틀렸습니다.</p>}
          <button onClick={handleLogin} style={{
            width: '100%', padding: '14px', background: '#2563eb', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            입장하기
          </button>
        </div>
      </div>
    );
  }

  // --- 날짜 계산 ---
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = getTodayStringFromDate(d);
  const currentMonthKey = today.slice(0, 7);

  // --- 통계 (맡긴일 기준) ---
  const todayRevenue = tickets
    .filter(t => getReceivedDateStr(t) === today)
    .reduce((sum, t) => sum + Number(t.price || 0), 0);

  const monthTickets = tickets.filter(t => getReceivedDateStr(t).startsWith(currentMonthKey));
  const monthRevenue = monthTickets.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const monthCount = monthTickets.length;

  const todayTickets = tickets.filter(t => t.dueDate === today);
  const tomorrowTickets = tickets.filter(t => t.dueDate === tomorrow);

  // 요청 티켓
  const requestTickets = tickets.filter(t => t.status === '요청');

  // --- 기능 함수 ---
  const handlePhoneChange = (e: any) => {
    setNewItem({ ...newItem, phone: formatPhone(e.target.value) });
  };

  const uploadImage = async () => {
    if (!file) return null;
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
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
    const todaysCount = tickets.filter(t => t.createdAt && t.createdAt.toDate && getTodayStringFromDate(t.createdAt.toDate()) === today).length;
    const dailyNumber = todaysCount + 1;

    try {
      if (file) photoUrl = await (uploadImage() as any);
      const newTicketData = {
        ...newItem, photoUrl, status: '접수', createdAt: new Date(), dailyNumber
      };
      await addDoc(collection(db, "repairs"), newTicketData);

      handlePrint({ ...newTicketData, createdAt: { toDate: () => new Date() } });

      if (isContinuous) {
        setNewItem(prev => ({ ...prev, subCategory: '', item: '', price: '', photoUrl: '' }));
        setFile(null);
      } else {
        const firstCat = Object.keys(categories)[0] || '바지';
        setNewItem({ name: '', phone: '', category: firstCat, subCategory: '', item: '', price: '', paymentMethod: '카드', isUrgent: false, receivedDate: today, dueDate: today, photoUrl: '' });
        setFile(null);
      }
    } catch (e) { alert("에러가 발생했습니다."); } finally { setIsUploading(false); }
  };

  const toggleStatus = async (id: any, currentStatus: any) => {
    let nextStatus = '접수';
    if (currentStatus === '요청') nextStatus = '접수';
    else if (currentStatus === '접수') nextStatus = '수선완료';
    else if (currentStatus === '수선완료') nextStatus = '찾아감';
    else nextStatus = '접수';
    await updateDoc(doc(db, "repairs", id), { status: nextStatus });
  };

  const deleteTicket = async (id: any) => confirm("삭제하시겠습니까?") && deleteDoc(doc(db, "repairs", id));
  const sendSms = (t: any) => confirm(`[${t.name}] 문자 발송?`) && alert(`[문자]\n${t.name}님, ${t.item} 수선 완료!`);

  const handlePrint = (ticket: any) => {
    setPrintTicket(ticket);
    setTimeout(() => { window.print(); setTimeout(() => setPrintTicket(null), 500); }, 500);
  };

  const handleEdit = (ticket: any) => {
    setEditingTicket(ticket);
  };

  const handleSaveEdit = async (id: string, editData: any) => {
    try {
      await updateDoc(doc(db, "repairs", id), editData);
      setEditingTicket(null);
    } catch (e) { alert("수정 실패!"); }
  };

  const saveCategories = async (updatedCats: Record<string, string[]>) => {
    setCategories(updatedCats);
    try {
      await setDoc(doc(db, "settings", "categories"), { list: updatedCats });
    } catch (e) { alert("카테고리 저장 실패!"); }
  };

  const savePriceTable = async (table: PriceTable) => {
    setPriceTable(table);
    try {
      await setDoc(doc(db, "settings", "priceTable"), { list: table });
      alert("참고 가격표가 저장되었습니다.");
    } catch (e) { alert("가격표 저장 실패!"); }
  };

  const downloadExcel = () => {
    if (!confirm("엑셀로 저장할까요?")) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF일련번호,이름,전화번호,대분류,소분류,내용,가격,결제,상태,맡긴날,마감일\n";
    tickets.forEach(t => csvContent += `${t.dailyNumber || ''},${t.name},${t.phone},${t.category},${t.subCategory || ''},${t.item},${t.price},${t.paymentMethod},${t.status},${t.receivedDate || ''},${t.dueDate}\n`);
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `에벤에셀옷수선_장부_${today}.csv`;
    link.click();
  };

  const filteredList = tickets.filter(t => {
    const cleanSearch = searchTerm.replace(/-/g, '');
    const cleanPhone = (t.phone || '').replace(/-/g, '');
    const matchesText = t.name?.includes(searchTerm) || cleanPhone.includes(cleanSearch) || t.item?.includes(searchTerm);
    return matchesText && (searchDate ? t.dueDate === searchDate : true);
  });

  return (
    <div style={{ padding: '10px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>

      {/* 인쇄 화면 */}
      {printTicket && (
        <div id="print-area" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px' }}>
          <div style={{ width: '300px', border: '2px solid black', padding: '15px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', borderBottom: '2px solid black', paddingBottom: '5px' }}>🧵 에벤에셀옷수선</h2>
            <div style={{ fontSize: '60px', fontWeight: '900', margin: '10px 0', lineHeight: '1' }}>#{printTicket.dailyNumber || '?'}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{printTicket.name}</div>
            <div style={{ fontSize: '14px', marginBottom: '15px' }}>{printTicket.phone ? printTicket.phone.slice(-4) : ''}</div>
            <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '10px 0', margin: '10px 0', fontSize: '20px', fontWeight: 'bold' }}>{printTicket.item}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
              <span>마감: {printTicket.dueDate?.slice(5)}</span>
              <span>{printTicket.subCategory ? `${printTicket.category}/${printTicket.subCategory}` : printTicket.category}</span>
            </div>
            <div style={{ marginTop: '15px', fontSize: '10px' }}>접수일: {printTicket.createdAt ? getTodayStringFromDate(printTicket.createdAt.toDate()) : today}</div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingTicket && (
        <EditModal ticket={editingTicket} categories={categories} onSave={handleSaveEdit} onClose={() => setEditingTicket(null)} />
      )}

      {/* 메인 */}
      <div className="no-print">
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>🧵 에벤에셀옷수선 사장님앱</h1>
            <button onClick={handleLogout} style={{ fontSize: '12px', color: '#999', background: 'none', border: '1px solid #ddd', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>로그아웃</button>
          </div>

          {/* 요청 알림 */}
          {requestTickets.length > 0 && (
            <div onClick={() => setView('list')} style={{ background: '#e0e7ff', padding: '10px 15px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📩</span>
              <span style={{ fontSize: '14px', color: '#3730a3', fontWeight: 'bold' }}>고객 요청 {requestTickets.length}건이 있습니다</span>
            </div>
          )}

          <div style={{ background: '#e5e7eb', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
            <TabButton name="📊 대시보드" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <TabButton name="✍️ 접수" active={view === 'register'} onClick={() => setView('register')} />
            <TabButton name="📈 분석" active={view === 'stats'} onClick={() => setView('stats')} />
            <TabButton name="📝 목록" active={view === 'list'} onClick={() => setView('list')} />
            <TabButton name="💰 가격표" active={view === 'pricetable'} onClick={() => setView('pricetable')} />
            <TabButton name="⚙️ 설정" active={view === 'settings'} onClick={() => setView('settings')} />
          </div>
        </div>

        {/* 대시보드 */}
        {view === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#2563eb', color: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>오늘 매출</span>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px' }}>{todayRevenue.toLocaleString()}원</div>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>이번 달 누적</span>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '5px', color: '#333' }}>{monthRevenue.toLocaleString()}원</div>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1e40af' }}>🚚 오늘 나갈 옷</h3>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '25px' }}>
              {todayTickets.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '10px', fontSize: '14px' }}>없음</p> : todayTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={handlePrint} onEdit={handleEdit} />)}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#444' }}>📅 내일 나갈 옷</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {tomorrowTickets.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '10px', fontSize: '14px' }}>없음</p> : tomorrowTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={handlePrint} onEdit={handleEdit} />)}
            </div>
          </>
        )}

        {/* 접수 */}
        {view === 'register' && (
          <RegisterView
            newItem={newItem} setNewItem={setNewItem}
            handlePhoneChange={handlePhoneChange}
            file={file} setFile={setFile}
            isUploading={isUploading} addTicket={addTicket}
            categories={categories}
          />
        )}

        {/* 분석 */}
        {view === 'stats' && <StatsView tickets={tickets} today={today} onDownloadExcel={downloadExcel} />}

        {/* 목록 */}
        {view === 'list' && (
          <ListView
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            searchDate={searchDate} setSearchDate={setSearchDate}
            filteredList={filteredList} toggleStatus={toggleStatus}
            deleteTicket={deleteTicket} sendSms={sendSms}
            onPrint={handlePrint} onEdit={handleEdit}
          />
        )}

        {/* 참고 가격표 */}
        {view === 'pricetable' && (
          <PriceTableSettings categories={categories} priceTable={priceTable} onSave={savePriceTable} />
        )}

        {/* 설정 */}
        {view === 'settings' && (
          <CategorySettings categories={categories} onSave={saveCategories} />
        )}
      </div>

      <style jsx global>{`@media print { .no-print { display: none !important; } #print-area { display: flex !important; position: absolute; left: 0; top: 0; } @page { size: auto; margin: 0mm; } }`}</style>
    </div>
  );
}
