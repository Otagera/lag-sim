import { Component } from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GameErrorBoundary] Crash caught:', error)
    console.error('[GameErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="themed"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          padding: '24px',
          background: 'var(--background)',
          color: 'var(--text)',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <h1 className="font-display" style={{ fontSize: '24px' }}>
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          The game encountered an unexpected error. A state snapshot has been logged to the console.
        </p>
        <pre
          style={{
            fontSize: '10px',
            color: 'var(--error-11)',
            background: 'var(--surface)',
            padding: '8px 12px',
            borderRadius: '4px',
            maxWidth: '500px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {this.state.error?.message ?? 'Unknown error'}
        </pre>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              background: 'var(--accent-solid)',
              color: 'var(--accent-on-solid)',
              border: 'none',
              borderRadius: '2px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('lagos-governor-sim-save')
              window.location.href = '/'
            }}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              padding: '6px 16px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Return to menu
          </button>
        </div>
      </div>
    )
  }
}
