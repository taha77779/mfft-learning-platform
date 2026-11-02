import React from 'react'

export default function App() {
  return (
    <div className="app" dir="rtl">
      <header className="header">
        <h1>منصة MFFT التعليمية</h1>
        <p>منصة الاختبارات والبحث العلمي</p>
      </header>

      <main className="login">
        <h2>دخول الطالب</h2>
        <p>أدخل بيانات الدخول للبدء</p>

        <form onSubmit={(e) => e.preventDefault()}>
          <label>الرقم التعريفي</label>
          <input
            type="text"
            placeholder="أدخل الرقم التعريفي"
          />

          <label>الرمز السري</label>
          <input
            type="password"
            placeholder="أدخل الرمز السري"
          />

          <button type="submit">دخول</button>
        </form>
      </main>

      <footer>
        جميع الحقوق محفوظة © منصة MFFT
      </footer>
    </div>
  )
}
