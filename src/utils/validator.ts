// 定义规则类型，分别为字符串和数字添加专有的检测规则
interface ValidationRules {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'undefined';
  minLength?: number;  // 字符串最小长度
  maxLength?: number;  // 字符串最大长度
  minValue?: number;   // 数字最小值
  maxValue?: number;   // 数字最大值
  pattern?: RegExp;    // 用于正则表达式检测
}

// 定义检测结果的类型
interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * 检测参数的方法
 * @param param - 需要检测的参数
 * @param rules - 检测规则对象 (可以包含类型检测、长度、大小、正则等)
 * @param isRequired - 是否必填，true 表示必填
 * @returns 检测结果 { isValid: boolean, message: string }
 */
export function validateParam(
  param: any, 
  rules: ValidationRules = {}, 
  isRequired: boolean = true
): ValidationResult {
  // 如果参数是必填，且为空值
  if (isRequired && (param === undefined || param === null || param === '')) {
    return { isValid: false, message: '该参数为必填项' };
  }

  // 如果参数非必填，且为空值，直接通过
  if (!isRequired && (param === undefined || param === null || param === '')) {
    return { isValid: true, message: '参数可选且为空' };
  }

  // 检查参数类型
  if (rules.type && typeof param !== rules.type) {
    return { isValid: false, message: `参数类型应为 ${rules.type}` };
  }

  // 针对字符串的检测：检查最小长度和最大长度
  if (rules.type === 'string') {
    if (rules.minLength && param.length < rules.minLength) {
      return { isValid: false, message: `字符串长度不能少于 ${rules.minLength} 个字符` };
    }
    if (rules.maxLength && param.length > rules.maxLength) {
      return { isValid: false, message: `字符串长度不能超过 ${rules.maxLength} 个字符` };
    }
  }

  // 针对数字的检测：检查最小值和最大值
  if (rules.type === 'number') {
    if (rules.minValue !== undefined && param < rules.minValue) {
      return { isValid: false, message: `数字不能小于 ${rules.minValue}` };
    }
    if (rules.maxValue !== undefined && param > rules.maxValue) {
      return { isValid: false, message: `数字不能大于 ${rules.maxValue}` };
    }
  }

  // 检查参数是否匹配正则表达式
  if (rules.pattern && !rules.pattern.test(param)) {
    return { isValid: false, message: `参数格式不正确` };
  }

  // 如果通过所有检测
  return { isValid: true, message: '参数有效' };
}
