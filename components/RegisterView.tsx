"use client";

export default function RegisterView({ newItem, setNewItem, handlePhoneChange, file, setFile, isUploading, addTicket, categories }: any) {
  const inputStyle: any = {
    padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px',
    width: '100%', fontSize: '15px', color: '#000', fontWeight: 'bold'
  };
  const labelStyle: any = { fontSize: '13px', color: '#666', marginBottom: '5px', display: 'block', fontWeight: 'bold' };

  const mainCategories = Object.keys(categories || {});
  const subCategories = categories?.[newItem.category] || [];

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#111' }}>새 수선 접수</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 이름, 전화번호 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label style={labelStyle}>고객 이름</label><input placeholder="홍길동" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>전화번호</label><input placeholder="번호 입력" value={newItem.phone} onChange={handlePhoneChange} style={inputStyle} maxLength={13} /></div>
        </div>

        {/* 2단계 카테고리 + 수선 내용 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>대분류</label>
            <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value, subCategory: '' })} style={inputStyle}>
              {mainCategories.length === 0 && <option value="">없음</option>}
              {mainCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>소분류</label>
            <select value={newItem.subCategory || ''} onChange={(e) => setNewItem({ ...newItem, subCategory: e.target.value })} style={inputStyle}>
              <option value="">선택</option>
              {subCategories.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>수선 내용</label>
          <input placeholder="예: 바지 기장 줄임 3cm" value={newItem.item} onChange={(e) => setNewItem({ ...newItem, item: e.target.value })} style={inputStyle} />
        </div>

        {/* 맡긴 날짜, 마감일 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label style={labelStyle}>맡긴 날짜</label><input type="date" value={newItem.receivedDate} onChange={(e) => setNewItem({ ...newItem, receivedDate: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>마감일</label><input type="date" value={newItem.dueDate} onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })} style={inputStyle} /></div>
        </div>

        {/* 사진 */}
        <div>
          <label style={labelStyle}>사진</label>
          <label style={{ ...inputStyle, display: 'block', cursor: 'pointer', background: '#f9fafb', textAlign: 'center', color: file ? '#2563eb' : '#666', fontSize: '13px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {file ? `📸 ${file.name}` : "📷 사진 선택"}
            <input type="file" accept="image/*" onChange={(e: any) => setFile(e.target.files && e.target.files[0])} style={{ display: 'none' }} />
          </label>
        </div>

        {/* 금액, 결제, 급함 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div><label style={labelStyle}>금액</label><input type="number" placeholder="0" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>결제</label><select value={newItem.paymentMethod} onChange={(e) => setNewItem({ ...newItem, paymentMethod: e.target.value })} style={inputStyle}><option value="카드">💳 카드</option><option value="현금">💵 현금</option><option value="이체">📱 이체</option></select></div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#fee2e2', padding: '0 10px', borderRadius: '5px', color: 'red', fontWeight: 'bold', height: '44px', fontSize: '13px' }}>
            <input type="checkbox" checked={newItem.isUrgent} onChange={(e) => setNewItem({ ...newItem, isUrgent: e.target.checked })} style={{ marginRight: '5px' }} />급함
          </label>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
          <button onClick={() => addTicket(true)} disabled={isUploading} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{isUploading ? "..." : "💾 연속 접수"}</button>
          <button onClick={() => addTicket(false)} disabled={isUploading} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>{isUploading ? "..." : "✅ 저장 완료"}</button>
        </div>
      </div>
    </div>
  );
}
