import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import {ErrorBoundary} from './ErrorBoundary'
import {ToastProvider} from './components/Toast'

const container = document.getElementById('root')

if (!container) {
  document.body.innerHTML = '<div style="padding:20px;color:#fff;background:#0b1014;">错误：找不到 root 容器</div>'
} else {
  container.innerHTML = '<div style="padding:20px;color:#0f0;background:#0b1014;font-size:18px;">React 加载中...</div>'
  try {
    const root = createRoot(container)
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ToastProvider>
            <App/>
          </ToastProvider>
        </ErrorBoundary>
      </React.StrictMode>
    )
  } catch (err) {
    container.innerHTML = `<div style="padding:20px;color:#fff;background:#0b1014;white-space:pre-wrap;">React 渲染出错：<br/>${err instanceof Error ? err.message : String(err)}<br/><br/>${err instanceof Error ? err.stack : ''}</div>`
  }
}
