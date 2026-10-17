/**
 * Input Validation Utilities
 * Pure validation functions returning null if valid, or an error message if invalid.
 */

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  // RFC 5322 standard regex subset
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

const isValidObjectId = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const validateRegisterInput = (data = {}) => {
  const errors = [];
  const { name, email, password } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  } else if (name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters.');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  return errors;
};

const validateLoginInput = (data = {}) => {
  const errors = [];
  const { email, password } = data;

  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  }

  return errors;
};

const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

const validateTaskInput = (data = {}, isUpdate = false) => {
  const errors = [];
  const { title, description, status, priority, dueDate } = data;

  if (!isUpdate || title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Task title is required.');
    } else if (title.trim().length > 150) {
      errors.push('Task title cannot exceed 150 characters.');
    }
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push('Description must be text.');
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('dueDate must be a valid date format.');
    }
  }

  return errors;
};

module.exports = {
  isValidEmail,
  isValidObjectId,
  validateRegisterInput,
  validateLoginInput,
  validateTaskInput,
  VALID_STATUSES,
  VALID_PRIORITIES
};
