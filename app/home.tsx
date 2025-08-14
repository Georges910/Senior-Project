
import { Link, useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const handleLogout = () => {
    router.replace('/login');
  };
  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, minHeight: '80vh' }}>
      <h2>Welcome Home!</h2>
      <p>You are now logged in.</p>
      <button onClick={handleLogout} style={{ padding: 10, fontSize: 16, background: '#e00', color: '#fff', border: 'none', borderRadius: 4, marginBottom: 16, width: 120, alignSelf: 'center' }}>
        Logout
      </button>
      <div style={{ flex: 1 }} />
      <nav style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100%',
        background: '#f0f0f0',
        borderTop: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        zIndex: 100
      }}>
        <Link href="../profile" style={{ color: '#0070f3', fontWeight: '500' }}>Profile</Link>
        <Link href="../page1" style={{ color: '#0070f3', fontWeight: '500' }}>Page1</Link>
        <Link href="../page2" style={{ color: '#0070f3', fontWeight: '500' }}>Page2</Link>
        <Link href="../page3" style={{ color: '#0070f3', fontWeight: '500' }}>Page3</Link>
      </nav>
    </div>
  );
}
