/**
 * 安全数值转换
 * @param value 输入值
 * @param defaultValue 默认值
 * @param options 配置选项
 * @returns 安全数值
 */
export const safeNumber = (
  value: unknown,
  defaultValue = 0,
  options: { min?: number; max?: number } = {}
): number => {
  const num = Number(value);
  let result = isNaN(num) ? defaultValue : num;
  if (options.min !== undefined) result = Math.max(result, options.min);
  if (options.max !== undefined) result = Math.min(result, options.max);
  return result;
};

/**
 * 安全日期转换
 * @param value 输入值
 * @returns 有效Date对象
 */
export const safeDate = (value: unknown): Date => {
  try {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    throw new Error('Invalid date format');
  } catch (e) {
    console.warn('Invalid date, using current date instead');
    return new Date();
  }
};