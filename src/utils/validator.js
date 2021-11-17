import { camelToString, titleCase } from './stringHelper';

const numberValidator = (rule, value, callback) => {
  try {
    if (!Number(value) && value) {
      const tmp = camelToString(rule.field);
      callback(`${titleCase(tmp)} must be number!`);
    } else {
      callback();
    }
  } catch {
    callback();
  }
};

export { numberValidator };