const suffix = '@students.zhikeguide.invalid';
export const studentIdPattern = '[0-9]{1,20}';
export const initialAdminPassword = '000000';
const validId = new RegExp('^' + studentIdPattern + '$');

/** @param {unknown} value */
export function studentEmail(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  return validId.test(id) ? id + suffix : null;
}

/** @param {string} email */
export function studentIdFromEmail(email) {
  const id = email.endsWith(suffix) ? email.slice(0, -suffix.length) : '';
  return validId.test(id) ? id : null;
}
