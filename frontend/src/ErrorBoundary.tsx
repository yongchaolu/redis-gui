import React from 'react'

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = {hasError: false, error: ''}
  }

  static getDerivedStateFromError(err: Error) {
    return {hasError: true, error: err.message + '\n' + err.stack}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 20, color: '#fff', background: '#0b1014', whiteSpace: 'pre-wrap'}}>
          <h2 style={{color: '#d93f32'}}>渲染错误</h2>
          <div>{this.state.error}</div>
        </div>
      )
    }
    return this.props.children
  }
}
