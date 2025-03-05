/**

 * 格式化日期为yyyy-mm-dd格式的字符串。

 * @param {Date | string} value - 一个Date对象或ISO格式的日期字符串。

 * @returns {string} 格式化后的日期字符串。如果输入无效，则返回"Invalid Date"。

 * @throws {TypeError} 如果value既不是Date对象也不是有效的日期字符串，则抛出TypeError。

 */

export function formatDate(value: Date | string) {
    // 检查输入是否为有效的Date对象或ISO格式的日期字符串
  
    if (!(value instanceof Date) && typeof value !== 'string') {
      throw new TypeError('Invalid input type. Expected Date or ISO date string.')
    }
  
    let date: Date
  
    if (value instanceof Date) {
      date = value
    } else {
      // 尝试将字符串转换为Date对象，考虑了ISO格式的字符串
  
      date = new Date(value)
  
      // 验证转换后的Date对象是否有效
  
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date.')
      }
    }
  
    const year = date.getFullYear()
  
    const month = date.getMonth() + 1
  
    const day = date.getDate()
  
    // 使用padStart简化条件判断，添加前导0
  
    const monthStr = month.toString().padStart(2, '0')
  
    const dayStr = day.toString().padStart(2, '0')
  
    return `${year}-${monthStr}-${dayStr}`
  }
  