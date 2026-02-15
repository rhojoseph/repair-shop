export default function TicketCard({ ticket, toggleStatus, deleteTicket, sendSms, onPrint, onEdit }: any) {
  const getStatusColor = (s: string) => {
    if (s === '요청') return { bg: '#e0e7ff', text: '#3730a3' };
    if (s === '수선완료') return { bg: '#dcfce7', text: '#166534' };
    if (s === '찾아감') return { bg: '#374151', text: '#ffffff' };
    return { bg: '#fef9c3', text: '#854d0e' }; // 접수
  };
  const statusColor = getStatusColor(ticket.status);
  const cardOpacity = ticket.status === '찾아감' ? 0.6 : 1;

  const categoryLabel = ticket.subCategory
    ? `${ticket.category}/${ticket.subCategory}`
    : ticket.category;

  return (
    <div style={{ background: 'white', padding: '12px', borderRadius: '10px', borderLeft: ticket.isUrgent ? '5px solid #ef4444' : ticket.status === '요청' ? '5px solid #6366f1' : '5px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', opacity: cardOpacity, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '35px', height: '35px', background: '#f3f4f6', borderRadius: '8px', fontSize: '16px', fontWeight: '900', color: '#333', flexShrink: 0 }}>
          #{ticket.dailyNumber || '?'}
        </div>
        {ticket.photoUrl && (
          <img src={ticket.photoUrl} alt="사진" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: '#eee', flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
            {ticket.isUrgent && <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0 }}>급!</span>}
            {ticket.status === '요청' && <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0 }}>요청</span>}
            {ticket.paymentMethod === '후불' && <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0 }}>후불</span>}
            <strong style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#111' }}>{ticket.name}</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>{ticket.phone ? ticket.phone.slice(-4) : ''}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#444', textDecoration: ticket.status === '찾아감' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: '#888', fontSize: '11px' }}>[{categoryLabel}]</span> {ticket.item}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {ticket.receivedDate && <span style={{ marginRight: '6px' }}>맡김:{ticket.receivedDate.slice(5)}</span>}
            마감:{ticket.dueDate?.slice(5)} <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{Number(ticket.price || 0).toLocaleString()}</span>
            {ticket.paymentMethod === '후불' && <span style={{ marginLeft: '4px', color: '#b45309', fontSize: '11px', fontWeight: 'bold' }}>(후불)</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', marginLeft: '5px', flexShrink: 0 }}>
        <button onClick={() => onPrint(ticket)} style={{ padding: '5px', borderRadius: '5px', background: '#333', color: 'white', border: 'none', fontSize: '11px', cursor: 'pointer' }}>🖨️</button>
        {onEdit && <button onClick={() => onEdit(ticket)} style={{ padding: '5px', borderRadius: '5px', background: '#dbeafe', color: '#1e40af', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>수정</button>}
        <button onClick={() => toggleStatus(ticket.id, ticket.status)} style={{ padding: '5px 8px', borderRadius: '5px', border: 'none', background: statusColor.bg, color: statusColor.text, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>{ticket.status}</button>
        {ticket.status === '수선완료' && <button onClick={() => sendSms(ticket)} style={{ padding: '5px', borderRadius: '5px', background: '#3b82f6', color: 'white', border: 'none', fontSize: '11px', cursor: 'pointer' }}>문자</button>}
        <button onClick={() => deleteTicket(ticket.id)} style={{ padding: '5px', borderRadius: '5px', background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
      </div>
    </div>
  );
}
