export const DECIMAL_RM_LIGHT = Object.freeze({
  ROUND_UP: 0,
  ROUND_DOWN: 1,
  ROUND_CEIL: 2,
  ROUND_FLOOR: 3,
  ROUND_HALF_UP: 4,
  ROUND_HALF_DOWN: 5,
  ROUND_HALF_EVEN: 6,
  ROUND_HALF_CEIL: 7,
  ROUND_HALF_FLOOR: 8,
})
export const DECIMAL_RM = Object.freeze({
  ...DECIMAL_RM_LIGHT,
  EUCLID: 9,
})
export const BIG_RM = Object.freeze({
  ROUND_DOWN: 0,
  ROUND_HALF_UP: 1,
  ROUND_HALF_DOWN: 2,
  ROUND_UP: 3,
})
