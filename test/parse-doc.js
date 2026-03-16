#!/usr/bin/env node

const filename = process.argv[2]
if (!filename) {
  console.error('❌ 你还没指定要处理哪个文件')
  process.exit(1)
}
if (!/\.html?/.test(filename)) {
  console.error('❌ 你指定的文件不是 Word 另存为网页文件的格式')
  process.exit(2)
}

const fs = require('fs')
const path = require('path')

// 添加错误处理
try {
  console.error(`📖 正在读取：${filename}`)
  const html = fs.readFileSync(path.resolve(filename), 'utf-8')
  console.error(`📊 原始大小：${(html.length / 1024).toFixed(2)} KB`)

  console.error('🔧 正在处理...')
  const result = html
    .replace(/[\s\S\n]*(?=<div)|(?<=div>)[\s\S\n]*/g, '')
    .replace(/<\/?(ins|u|span|o:p|font)[\s\S\n]*?>/g, '')
    .replace(/<h1[\s\S\n]*?>(.*?)<\/h1>/g, '<b>$1</b>')
    .replace(/(?<=<(?:p|b|div))[\s\S\n]*?(?=>)/g, '')
    .replace(/(&nbsp;|&#9;)+/g, ' ')
    .replace(/<b>\s*<\/b>/g, '')
    .replace(/<\/b><b>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace('div', 'div class="agreement"')
    .replace(/<!\[if !supportLists\]>(.+?)\s+<!\[endif\]>/g, (match, p1) => {
      let level = 0
      if (/^\d+\.$/.test(p1)) level = 1
      if (/^\d+\.\d+$/.test(p1)) level = 2
      if (/^\d+\.\d+\.\d+$/.test(p1)) level = 3
      if (/^\(.+\)$/.test(p1)) level = 3
      return `<span class="level-${level}">${p1}</span>`
    })

  // 输出到文件而非控制台
  const outputPath = filename.replace(/\.html?$/, '.clean.html')
  fs.writeFileSync(outputPath, result, 'utf-8')
  
  console.error(`✅ 处理完成！`)
  console.error(`📁 输出文件：${outputPath}`)
  console.error(`📊 处理后大小：${(result.length / 1024).toFixed(2)} KB`)
  
} catch (err) {
  console.error(`❌ 处理失败：${err.message}`)
  process.exit(3)
}