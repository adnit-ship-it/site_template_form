import { describe, expect, it } from 'vitest'
import {
  convertToInternationalFormat,
  validateField,
  validateFieldWithRules,
  ValidationRules,
} from '../../utils/validation'

describe('convertToInternationalFormat', () => {
  it('converts a 10-digit US number to +1 format', () => {
    expect(convertToInternationalFormat('1234567890')).toBe('+11234567890')
  })

  it('strips non-digit characters before converting', () => {
    expect(convertToInternationalFormat('(123) 456-7890')).toBe('+11234567890')
  })

  it('returns null for empty or nullish input', () => {
    expect(convertToInternationalFormat('')).toBeNull()
    expect(convertToInternationalFormat(null)).toBeNull()
    expect(convertToInternationalFormat(undefined)).toBeNull()
  })

  it('returns null when the number does not have exactly 10 digits', () => {
    expect(convertToInternationalFormat('12345')).toBeNull()
    expect(convertToInternationalFormat('11234567890')).toBeNull()
  })
})

describe('validateField — required', () => {
  const rule = ValidationRules.required('This field is required')

  it('fails on empty string, null, and undefined', () => {
    expect(validateField('', rule).isValid).toBe(false)
    expect(validateField(null, rule).isValid).toBe(false)
    expect(validateField(undefined, rule).isValid).toBe(false)
  })

  it('passes on any non-empty value', () => {
    expect(validateField('x', rule).isValid).toBe(true)
    expect(validateField(0, rule).isValid).toBe(true)
  })

  it('returns the configured message on failure', () => {
    expect(validateField('', rule).message).toBe('This field is required')
  })
})

describe('validateField — email', () => {
  const rule = ValidationRules.email()

  it('accepts a well-formed address', () => {
    expect(validateField('user@example.com', rule).isValid).toBe(true)
  })

  it('rejects a malformed address', () => {
    expect(validateField('not-an-email', rule).isValid).toBe(false)
    expect(validateField('user@', rule).isValid).toBe(false)
    expect(validateField('user@example', rule).isValid).toBe(false)
  })

  it('skips validation when value is empty (non-required rule)', () => {
    expect(validateField('', rule).isValid).toBe(true)
  })
})

describe('validateField — phone', () => {
  const rule = ValidationRules.phone()

  it('accepts a 10-digit US number in various formats', () => {
    expect(validateField('1234567890', rule).isValid).toBe(true)
    expect(validateField('(123) 456-7890', rule).isValid).toBe(true)
    expect(validateField('123-456-7890', rule).isValid).toBe(true)
  })

  it('accepts an 11-digit number starting with 1 (country code)', () => {
    expect(validateField('11234567890', rule).isValid).toBe(true)
  })

  it('rejects numbers with the wrong digit count', () => {
    expect(validateField('12345', rule).isValid).toBe(false)
    expect(validateField('21234567890', rule).isValid).toBe(false)
  })
})

describe('validateFieldWithRules', () => {
  it('returns the first failing rule', () => {
    const rules = [
      ValidationRules.required('required!'),
      ValidationRules.minLength(5, 'too short!'),
    ]
    const result = validateFieldWithRules('abc', rules)
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('too short!')
  })

  it('passes when all rules pass', () => {
    const rules = [
      ValidationRules.required(),
      ValidationRules.minLength(2),
      ValidationRules.maxLength(20),
    ]
    expect(validateFieldWithRules('hello', rules).isValid).toBe(true)
  })

  it('forwards formAnswers to custom validators', () => {
    const rules = [
      ValidationRules.custom(
        (value: any, formAnswers?: any) => value === formAnswers?.expected,
        'must match expected',
      ),
    ]
    expect(validateFieldWithRules('yes', rules, { expected: 'yes' }).isValid).toBe(true)
    expect(validateFieldWithRules('no', rules, { expected: 'yes' }).isValid).toBe(false)
  })
})
