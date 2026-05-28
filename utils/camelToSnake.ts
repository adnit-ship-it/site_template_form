/**
 * Converts camelCase object keys to snake_case for Customer.io
 * Example: { firstName: 'John', lastName: 'Doe' } => { first_name: 'John', last_name: 'Doe' }
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export const convertObjectKeysToSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    result[snakeKey] = value
  }
  
  return result
}
