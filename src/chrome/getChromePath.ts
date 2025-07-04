import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

/**
 * 从注册表获取chrome path
 * @returns chrome path
 */
const getChromePathFromRegistry = (): string | null => {
  try {
    const result = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve',
      { encoding: 'utf8' }
    )
    const match = result.match(/REG_SZ\s+(.*)/)
    if (match) {
      return match[1].trim()
    } else {
      return null
    }
  } catch (err) {
    return null
  }
}

/**
 * 
 * @returns 从常见路径中检查是否有chrome
 */
const checkCommonPaths = (): string | null => {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }
  return null
}

/**
 * 查询chrome地址
 * @returns chrome path
 */
export const getChromePath = (): string | null => {
  return getChromePathFromRegistry() || checkCommonPaths()
}