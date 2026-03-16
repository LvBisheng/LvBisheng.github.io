#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const filename = process.argv[2]
if (!filename) {
  console.error('❌ 你还没指定要处理哪个文件')
  process.exit(1)
}
if (!/\.html?$/i.test(filename)) {
  console.error('❌ 你指定的文件不是 Word 另存为网页文件的格式')
  process.exit(2)
}

// === 定义 HTML 头部和尾部 ===
const htmlHeader = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
  

        .header {
            font-weight: 500;
            margin: 1em 0;
            color: #242424;
            font-size: 16px;
            line-height: 24px;
        }

        p>span[class="level-1"]+b,
        .level-1 {
            color: #242424;
        }

        .gray {
            color: #242424;
        }

        .gray>b {
            font-weight: 400;
        }

        p {
            margin: 1em 0;
        }

        .level-1,
        .level-2,
        .level-3 {
            display: inline-block;
            width: 2em;
        }

        .level-3 {
            padding-left: 2em;
        }
    </style>
</head>

<body>
`

const htmlFooter = `
</body>

</html>`

try {
  console.error(`📖 正在读取：${filename}`)
  const rawHtml = fs.readFileSync(path.resolve(filename), 'utf-8')
  console.error(`📊 原始大小：${(rawHtml.length / 1024).toFixed(2)} KB`)

  console.error('🔧 正在清理代码...')
  
  // 1. 提取 <body> 内部的有效内容，避免 Word 生成的 <head> 干扰
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let html = bodyMatch ? bodyMatch[1] : rawHtml

  let result = html
    // 2. 清理 <style>, <script>, <xml> 等标签及其包含的*所有内部代码*
    .replace(/<(style|script|xml)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // 3. 仅清理无用标签的外壳（保留内部文字内容）
    .replace(/<\/?(ins|u|span|o:p|font|meta|link)(?:\s[^>]*)?>/gi, '')
    // 4. 处理 h1 标签
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '<b>$1</b>')
    // 5. 安全地清理 p, b, div 的属性，防止误伤 >
    .replace(/<(p|b|div)\s+[^>]*>/gi, '<$1>')
    // 6. 替换特殊空格
    .replace(/(&nbsp;|&#9;)+/gi, ' ')
    // 7. 清理空标签和合并连续加粗
    .replace(/<b>\s*<\/b>/gi, '')
    .replace(/<\/b>\s*<b>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    // 8. 处理 Word 的列表符号
    .replace(/<!\[if !supportLists\]>([\s\S]*?)<!\[endif\]>/gi, (match, p1) => {
      let level = 0
      const text = p1.trim()
      if (/^\d+\.$/.test(text)) level = 1
      else if (/^\d+\.\d+$/.test(text)) level = 2
      else if (/^\d+\.\d+\.\d+$/.test(text)) level = 3
      else if (/^\(.+\)$/.test(text)) level = 3
      return `<span class="level-${level}">${text}</span>`
    })

  // 9. 将最前面的第一个 <div> 替换为带有 class 的 div
  result = result.replace(/<div>/, '<div class="agreement">')

  // === 拼接最终的 HTML ===
  const finalOutput = `${htmlHeader}${result}${htmlFooter}`

  // === 处理文件输出 ===
  const parsedPath = path.parse(filename)
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.clean.html`)
  
  // 写入新文件 (写入 finalOutput 而不是 result)
  fs.writeFileSync(outputPath, finalOutput, 'utf-8')
  
  console.error(`✅ 处理完成！`)
  console.error(`📁 输出文件：${outputPath}`)
  console.error(`📊 处理后大小：${(finalOutput.length / 1024).toFixed(2)} KB`)
  
} catch (err) {
  console.error(`❌ 处理失败：${err.message}`)
  process.exit(3)
}