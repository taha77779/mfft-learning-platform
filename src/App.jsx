
import React, { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

export default function App() {
  const [page, setPage] = useState(
    window.location.hash === '#/admin' ? 'admin' : 'student'
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const changePage = () => {
      setPage(window.location.hash === '#/admin' ? 'admin' : 'student')
    }
    window.addEventListener('hashchange', changePage)
    return () => window.removeEventListener('hashchange', changePage)
  }, [])

  async function adminLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('admins')
      .select('id, full_name')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setMessage('هذا الحساب غير مسجل كمدير للمنصة.')
      setLoading(false)
      return
    }

    setAdmin(profile)
    setLoading(false)
  }

  async function adminLogout() {
    await supabase.auth.signOut()
    setAdmin(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div dir="rtl" style={styles.app}>
      <header style={styles.header}>
        <h1>منصة MFFT التعليمية</h1>
        <p>منصة الاختبارات والبحث العلمي</p>
      </header>

      {page === 'admin' ? (
        <main style={styles.panel}>
          {admin ? (
            <>
              <h2>لوحة الإدارة</h2>
              <p>مرحباً {admin.full_name}</p>
              <div style={styles.grid}>
                <div style={styles.card}>إدارة الطلاب</div>
                <div style={styles.card}>إدارة الاختبارات</div>
                <div style={styles.card}>إدارة الأسئلة والصور</div>
                <div style={styles.card}>المحاولات والنتائج</div>
              </div>
              <button style={styles.button} onClick={adminLogout}>
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <h2>دخول المدير</h2>
              <form onSubmit={adminLogin}>
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <label>كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button style={styles.button} disabled={loading}>
                  {loading ? 'جارٍ التحقق...' : 'دخول الإدارة'}
                </button>
              </form>
              {message && <p style={styles.error}>{message}</p>}
            </>
          )}
        </main>
      ) : (
        <main style={styles.panel}>
          <h2>دخول الطالب</h2>
          <p>مرحباً بك في منصة اختبار MFFT.</p>
          <p>سيتم تجهيز تسجيل دخول الطلاب بعد إعداد التحقق الآمن من بياناتهم.</p>
        </main>
      )}

      <footer style={styles.footer}>
        جميع الحقوق محفوظة © منصة MFFT
      </footer>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: 'Arial, sans-serif',
    color: '#1e293b'
  },
  header: {
    background: '#123b5d',
    color: 'white',
    textAlign: 'center',
    padding: '28px 15px'
  },
  panel: {
    background: 'white',
    maxWidth: '520px',
    margin: '35px auto',
    padding: '25px',
    borderRadius: '14px',
    boxShadow: '0 3px 15px #0001'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    margin: '25px 0'
  },
  card: {
    background: '#eaf2f8',
    padding: '20px 10px',
    borderRadius: '10px',
    textAlign: 'center'
  },
  button: {
    width: '100%',
    padding: '13px',
    marginTop: '18px',
    background: '#176b87',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  error: { color: '#c0392b', marginTop: '15px' },
  footer: { textAlign: 'center', padding: '20px' }
}
