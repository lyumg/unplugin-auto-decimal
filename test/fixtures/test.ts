const _a = 0.1 + 0.2
// next-ad-ignore
const _s = 0.1 + 0.2

const _computation = (0.1 + 0.2) * (1 - 0.9) + 0.5 * 0.6 / (1 - 0.2) + 0.5

// block-ad-ignore
function _test() {
  const _block = 0.1 + 0.2
  const _ad = 0.1 + 0.2
}
// block-ad-ignore
{
  const _obj = 0.1 + 0.2
  const _obj_block = 0.1 + 0.2
}

class _BlockAd {
  private block: number
  constructor() {
    this.block = 0.1 + 0.2
  }

  calc() {
    this.block = this.block + 0.7 - 0.9
  }
}
// eslint-disable-next-line prefer-template
const _splicing = 0.1 + 0.2 + ''
const _arr = [0, 0.1 + 0.2, 3]
const _obj_outer = {
  transform: 0.1 + 0.2,
  // next-ad-ignore
  skip: 0.1 + 0.2,
}
