import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const [status, setStatus] = useState('confirming') // confirming | processing | done | error

  const handleUnsubscribe = async () => {
    setStatus('processing')
    try {
      const { error } = await supabase.functions.invoke('unsubscribe-email', {
        body: { email }
      })
      if (error) throw error
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (!email) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.text}>Invalid unsubscribe link.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Find My Flow</h1>

        {status === 'confirming' && (
          <>
            <p style={styles.text}>
              Unsubscribe <strong>{email}</strong> from Find My Flow emails?
            </p>
            <button onClick={handleUnsubscribe} style={styles.button}>
              Unsubscribe
            </button>
          </>
        )}

        {status === 'processing' && (
          <p style={styles.text}>Processing...</p>
        )}

        {status === 'done' && (
          <>
            <p style={styles.text}>
              You've been unsubscribed. You won't receive any more emails from this sequence.
            </p>
            <p style={styles.subtext}>
              You can always sign back into the app at any time.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={styles.text}>
              Something went wrong. Please try again or email huzz@nichuzz.com.
            </p>
            <button onClick={handleUnsubscribe} style={styles.button}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f4ff',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px 32px',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #5e17eb, #E9A23B)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '24px',
  },
  text: {
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#1a1a1a',
    marginBottom: '20px',
  },
  subtext: {
    fontSize: '14px',
    color: '#999',
  },
  button: {
    background: '#5e17eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
