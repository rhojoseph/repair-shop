export default function TabButton({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 'none', padding: '8px 12px', borderRadius: '6px', border: 'none',
      background: active ? 'white' : 'transparent',
      fontWeight: active ? 'bold' : 'normal',
      color: active ? 'black' : '#666',
      cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px'
    }}>
      {name}
    </button>
  );
}
