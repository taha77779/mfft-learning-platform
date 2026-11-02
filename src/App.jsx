
import React, { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

export default function App() {
  const [page, setPage] = useState(
    window.location.hash === '#/admin' ? 'admin' : 'student'
  )
  const [admin, setAdmin] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [student, setStudent] = useState({
    name: '',
    phone: '',
    age: '',
    email: ''
  })
  const [createdCode, setCreatedCode] = useState('')

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
      setMessage('بيانات الدخول غير صحيحة.')
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
      setMessage('هذا الحساب ليس مسجلاً كمدير.')
      setLoading(false)
      return
    }

    setAdmin(profile)
    setLoading(false)
  }

  async function addStudent(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setCreatedCode('')

    try {
      const { data, error } = await supabase.functions.invoke(
        'admin-create-student',
        {
          body: {
            student_name: student.name.trim(),
            phone: student.phone.trim(),
            age: Number(student.age),
            email: student.email.trim() || null
          }
        }
      )

      if (error) throw error
      if (!data?.student_code) {
        throw new Error('لم يتم استلام الرقم التعريفي.')
      }

      setCreatedCode(data.student_code)
      setStudent({ name: '', phone: '', age: '', email: '' })
      setMessage('تمت إضافة الطالب بنجاح.')
    } catch (error) {
      setMessage(
        error.message || 'تعذرت إضافة الطالب. تحقق من الاتصال.'
      )
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setAdmin(null)
  }

  return (
    <div dir="rtl" style={styles.app}>
      <header style={styles.header}>
        <h1>منصة MFFT التعليمية</h1>
        <p>منصة الاختبارات والبحث العلمي</p>
      </header>

      {page === 'admin' ? (
        <main style={styles.panel}>
          {!admin ? (
            <>
              <h2>دخول المدير</h2>
              <form onSubmit={adminLogin}>
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />

                <label>كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />

                <button style={styles.button} disabled={loading}>
                  {loading ? 'جارٍ التحقق...' : 'دخول الإدارة'}
                </button>
              </form>
              {message && <p>{message}</p>}
            </>
          ) : (
            <>
              <h2>لوحة الإدارة</h2>
              <p>مرحباً {admin.full_name}</p>

              <h3>إضافة طالب جديد</h3>

              <form onSubmit={addStudent}>
                <label>اسم الطالب</label>
                <input
                  style={styles.input}
                  value={student.name}
                  onChange={e =>
                    setStudent({ ...student, name: e.target.value })
                  }
                  required
                />

                <label>رقم الهاتف</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={student.phone}
                  onChange={e =>
                    setStudent({ ...student, phone: e.target.value })
                  }
                  required
                />

                <label>العمر</label>
                <input
                  style={styles.input}
                  type="number"
                  min="5"
                  max="100"
                  value={student.age}
                  onChange={e =>
                    setStudent({ ...student, age: e.target.value })
                  }
                  required
                />

                <label>البريد الإلكتروني (اختياري)</label>
                <input
                  style={styles.input}
                  type="email"
                  value={student.email}
                  onChange={e =>
                    setStudent({ ...student, email: e.target.value })
                  }
                />

                <button style={styles.button} disabled={loading}>
                  {loading ? 'جارٍ الإضافة...' : 'إضافة الطالب'}
                </button>
              </form>

              {message && <p style={styles.message}>{message}</p>}

              {createdCode && (
                <div style={styles.result}>
                  <h3>الرقم التعريفي للطالب</h3>
                  <strong>{createdCode}</strong>
                  <p>احتفظ بهذا الرقم لتسليمه للطالب.</p>
                </div>
              )}

              <button style={styles.logout} onClick={logout}>
                تسجيل الخروج
              </button>
            </>
          )}
        </main>
      ) : (
        <main style={styles.panel}>
          <h2>دخول الطالب</h2>
          <p>مرحباً بك في منصة اختبار MFFT.</p>
          <p>سيتم تفعيل دخول الطلاب بعد تجهيز خدمة التحقق الآمن.</p>
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
    padding: '25px'
  },
  panel: {
    background: 'white',
    maxWidth: '520px',
    margin: '30px auto',
    padding: '25px',
    borderRadius: '14px',
    boxShadow: '0 3px 15px #0001'
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    margin: '8px 0 18px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px'
  },
  button: {
    width: '100%',
    padding: '13px',
    background: '#176b87',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '12px'
  },
  message: {
    marginTop: '15px',
    color: '#176b87'
  },
  result: {
    marginTop: '20px',
    padding: '18px',
    background: '#e7f5ec',
    borderRadius: '10px',
    textAlign: 'center'
  },
  logout: {
    width: '100%',
    padding: '12px',
    marginTop: '20px',
    background: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '8px'
  },
  footer: {
    textAlign: 'center',
    padding: '20px'
  }
}
