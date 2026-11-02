
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
    name: '', phone: '', age: '', email: ''
  })
  const [createdCode, setCreatedCode] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentSession, setStudentSession] = useState(null)

  const [tests, setTests] = useState([])
  const [testTitle, setTestTitle] = useState('')
  const [testInstructions, setTestInstructions] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const changePage = () => {
      setPage(window.location.hash === '#/admin' ? 'admin' : 'student')
      setMessage('')
    }
    window.addEventListener('hashchange', changePage)
    return () => window.removeEventListener('hashchange', changePage)
  }, [])

  useEffect(() => {
    if (admin) loadTests()
  }, [admin])

  async function adminLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
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
      if (!data?.student_code) throw new Error('لم يتم استلام الرقم التعريفي.')

      setCreatedCode(data.student_code)
      setStudent({ name: '', phone: '', age: '', email: '' })
      setMessage('تمت إضافة الطالب بنجاح.')
    } catch (error) {
      setMessage(error.message || 'تعذرت إضافة الطالب.')
    }

    setLoading(false)
  }

  async function studentLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setStudentSession(null)

    try {
      const { data, error } = await supabase.functions.invoke(
        'student-login',
        {
          body: {
            student_code: studentCode.trim().toUpperCase(),
            phone: studentPhone.trim()
          }
        }
      )

      if (error) throw error
      if (!data?.success || !data?.token || !data?.student) {
        throw new Error(data?.error || 'تعذر تسجيل الدخول.')
      }

      setStudentSession(data)
      setMessage('تم تسجيل الدخول بنجاح.')
    } catch (error) {
      setMessage(error.message || 'تعذر تسجيل الدخول.')
    }

    setLoading(false)
  }

  async function loadTests() {
    const { data, error } = await supabase
      .from('mfft_tests')
      .select('id, title, instructions, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('تعذر تحميل الاختبارات: ' + error.message)
      return
    }

    setTests(data || [])
  }

  async function saveTest(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const values = {
        title: testTitle.trim(),
        instructions: testInstructions.trim()
      }

      if (!values.title) throw new Error('أدخل عنوان الاختبار.')

      let result

      if (editingId) {
        result = await supabase
          .from('mfft_tests')
          .update(values)
          .eq('id', editingId)
      } else {
        result = await supabase
          .from('mfft_tests')
          .insert({
            ...values,
            is_active: false,
            created_by: admin.id
          })
      }

      if (result.error) throw result.error

      setTestTitle('')
      setTestInstructions('')
      setEditingId(null)
      setMessage(editingId ? 'تم تحديث الاختبار.' : 'تم إنشاء الاختبار.')
      await loadTests()
    } catch (error) {
      setMessage(error.message || 'تعذر حفظ الاختبار.')
    }

    setLoading(false)
  }

  function editTest(test) {
    setEditingId(test.id)
    setTestTitle(test.title || '')
    setTestInstructions(test.instructions || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleTest(test) {
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('mfft_tests')
      .update({ is_active: !test.is_active })
      .eq('id', test.id)

    if (error) {
      setMessage('تعذر تغيير حالة الاختبار: ' + error.message)
    } else {
      setMessage('تم تحديث حالة الاختبار.')
      await loadTests()
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setAdmin(null)
    setTests([])
  }

  function studentLogout() {
    setStudentSession(null)
    setStudentCode('')
    setStudentPhone('')
    setMessage('تم تسجيل الخروج.')
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
              {message && <p style={styles.message}>{message}</p>}
            </>
          ) : (
            <>
              <h2>لوحة الإدارة</h2>
              <p>مرحباً {admin.full_name}</p>

              <hr />
              <h3>إضافة طالب جديد</h3>

              <form onSubmit={addStudent}>
                <label>اسم الطالب</label>
                <input
                  style={styles.input}
                  value={student.name}
                  onChange={e => setStudent({ ...student, name: e.target.value })}
                  required
                />

                <label>رقم الهاتف</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={student.phone}
                  onChange={e => setStudent({ ...student, phone: e.target.value })}
                  required
                />

                <label>العمر</label>
                <input
                  style={styles.input}
                  type="number"
                  min="5"
                  max="100"
                  value={student.age}
                  onChange={e => setStudent({ ...student, age: e.target.value })}
                  required
                />

                <label>البريد الإلكتروني (اختياري)</label>
                <input
                  style={styles.input}
                  type="email"
                  value={student.email}
                  onChange={e => setStudent({ ...student, email: e.target.value })}
                />

                <button style={styles.button} disabled={loading}>
                  {loading ? 'جارٍ الإضافة...' : 'إضافة الطالب'}
                </button>
              </form>

              {createdCode && (
                <div style={styles.result}>
                  <h3>الرقم التعريفي للطالب</h3>
                  <strong>{createdCode}</strong>
                  <p>احتفظ بهذا الرقم لتسليمه للطالب.</p>
                </div>
              )}

              <hr />
              <h3>إدارة الاختبارات</h3>

              <form onSubmit={saveTest}>
                <label>عنوان الاختبار</label>
                <input
                  style={styles.input}
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder="مثلاً: اختبار MFFT"
                  required
                />

                <label>تعليمات الاختبار</label>
                <textarea
                  style={{ ...styles.input, minHeight: 110 }}
                  value={testInstructions}
                  onChange={e => setTestInstructions(e.target.value)}
                  placeholder="اكتب تعليمات الاختبار للطلاب..."
                />

                <button style={styles.button} disabled={loading}>
                  {loading
                    ? 'جارٍ الحفظ...'
                    : editingId
                      ? 'حفظ التعديلات'
                      : 'إنشاء اختبار'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    style={styles.logout}
                    onClick={() => {
                      setEditingId(null)
                      setTestTitle('')
                      setTestInstructions('')
                    }}
                  >
                    إلغاء التعديل
                  </button>
                )}
              </form>

              {message && <p style={styles.message}>{message}</p>}

              <h3>الاختبارات المسجلة ({tests.length})</h3>

              {tests.length === 0 ? (
                <p>لا توجد اختبارات حتى الآن.</p>
              ) : (
                tests.map(test => (
                  <div key={test.id} style={styles.testCard}>
                    <h4>{test.title}</h4>
                    <p>{test.instructions || 'لا توجد تعليمات.'}</p>
                    <p>
                      الحالة:{' '}
                      <strong>
                        {test.is_active ? 'نشط' : 'غير نشط'}
                      </strong>
                    </p>

                    <button
                      style={styles.smallButton}
                      onClick={() => editTest(test)}
                    >
                      تعديل
                    </button>

                    <button
                      style={styles.smallButton}
                      disabled={loading}
                      onClick={() => toggleTest(test)}
                    >
                      {test.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </div>
                ))
              )}

              <button style={styles.logout} onClick={logout}>
                تسجيل الخروج
              </button>
            </>
          )}
        </main>
      ) : (
        <main style={styles.panel}>
          {!studentSession ? (
            <>
              <h2>دخول الطالب</h2>
              <p>أدخل الرقم التعريفي ورقم الهاتف المسجل لدى الإدارة.</p>

              <form onSubmit={studentLogin}>
                <label>الرقم التعريفي</label>
                <input
                  style={styles.input}
                  value={studentCode}
                  onChange={e => setStudentCode(e.target.value)}
                  placeholder="MFFT-XXXXXXXX"
                  required
                />

                <label>رقم الهاتف</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={studentPhone}
                  onChange={e => setStudentPhone(e.target.value)}
                  required
                />

                <button style={styles.button} disabled={loading}>
                  {loading ? 'جارٍ التحقق...' : 'دخول الطالب'}
                </button>
              </form>

              {message && <p style={styles.message}>{message}</p>}
            </>
          ) : (
            <>
              <h2>مرحباً {studentSession.student.student_name}</h2>
              <p>تم التحقق من بياناتك بنجاح.</p>
              <p>الرقم التعريفي: {studentSession.student.student_code}</p>
              <p>سيظهر الاختبار هنا بعد استكمال نظام الأسئلة.</p>
              <button style={styles.logout} onClick={studentLogout}>
                تسجيل الخروج
              </button>
            </>
          )}
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
  smallButton: {
    padding: '9px 14px',
    margin: '5px',
    background: '#176b87',
    color: 'white',
    border: 'none',
    borderRadius: '7px'
  },
  testCard: {
    border: '1px solid #cbd5e1',
    borderRadius: '9px',
    padding: '14px',
    margin: '12px 0'
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
