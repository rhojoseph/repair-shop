import TicketCard from './TicketCard';

export default function ListView({ searchTerm, setSearchTerm, searchDate, setSearchDate, filteredList, toggleStatus, deleteTicket, sendSms, onPrint, onEdit }: any) {
  return (
    <>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input placeholder="🔍 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
        <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px' }} />
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {filteredList.map((ticket: any) => (
          <TicketCard key={ticket.id} ticket={ticket} toggleStatus={toggleStatus} deleteTicket={deleteTicket} sendSms={sendSms} onPrint={onPrint} onEdit={onEdit} />
        ))}
        {filteredList.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>데이터가 없습니다.</p>}
      </div>
    </>
  );
}
