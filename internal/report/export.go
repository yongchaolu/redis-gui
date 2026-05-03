package report

import (
	"fmt"
	"html"
	"strings"

	"redis-gui/internal/model"
)

func ToHTML(report model.AnalysisReport) string {
	var findings strings.Builder
	for _, item := range report.Findings {
		findings.WriteString(fmt.Sprintf(`<article class="finding %s"><h2>%s</h2><p><b>证据：</b>%s</p><p><b>建议：</b>%s</p></article>`,
			html.EscapeString(string(item.Severity)), html.EscapeString(item.Title), html.EscapeString(item.Evidence), html.EscapeString(item.Recommendation)))
	}
	if len(report.Findings) == 0 {
		findings.WriteString(`<article class="finding low"><h2>未发现风险</h2><p>本次只读诊断未发现需要立即处理的问题。</p></article>`)
	}
	return fmt.Sprintf(`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>%s Redis 性能分析报告</title>
<style>
body{margin:0;background:#0b1014;color:#d8e3ea;font-family:Arial,"Microsoft YaHei",sans-serif}
main{max-width:960px;margin:0 auto;padding:40px}
.hero{border:1px solid rgba(255,255,255,.12);background:#111922;border-radius:28px;padding:28px}
.score{font-size:64px;font-weight:900;color:#74f0a7}
.finding{margin-top:16px;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:20px;background:#172331}
.critical,.high{border-color:rgba(217,63,50,.45)}.medium{border-color:rgba(255,189,90,.45)}.low{border-color:rgba(116,240,167,.35)}
p{color:#9db0bd;line-height:1.7}
</style>
</head>
<body><main><section class="hero"><p>Redis Lens 报告</p><h1>%s</h1><div class="score">%d/100</div><p>%s</p></section>%s</main></body></html>`,
		html.EscapeString(report.Connection), html.EscapeString(report.Connection), report.Score, html.EscapeString(report.Summary), findings.String())
}
