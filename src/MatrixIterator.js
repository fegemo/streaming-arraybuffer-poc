
const addOne = Symbol('addOne');

/**
 * An object that keeps the state of a n-dimensional matrix that is being
 * traversed.
 */
export default class MatrixIterator {
  constructor(dimensions = [1]) {
    this.dimensions = dimensions;
    this.strides = this.dimensions.reduce((strides, _, i, dims) => {
      const previousDimension = dims[i-1] || 1;
      const previousStride = strides[i-1] || 1;
      strides.push(previousDimension * previousStride);
      return strides;
    }, []);
    this.cursor = dimensions.map(() => 0);
    this.currentDimension = 0;
  }

  [addOne]() {
    this.cursor[this.currentDimension]++;

    // check if need to carry to the next dimension
    if (this.cursor[this.currentDimension] >= this.dimensions[this.currentDimension]) {
      // resets current dimension to 0
      this.cursor[this.currentDimension] = 0;
      // changes current dimension to the next one
      this.currentDimension++;
      // carries 01 to the new dimension (recursively)
      this[addOne]();

      // goes back to the previous dimension, as it now has reset
      this.currentDimension--;
    }
  }

  setChunk(chunk) {
    this.chunk = chunk;
    this.indexInChunk = 0;
  }

  next() {
    // assembles the object that contains the current value (i,j,k and value)
    const value = {
      i: this.cursor[0],
      j: this.cursor[1],
      k: this.cursor[2],
      value: this.chunk[this.indexInChunk]
    };

    this.indexInChunk++;
    // tries to sum 1 to the first dimension... if exceeds, sums 1 to the next
    // and if that exceeds, sums 1 to the third and so on
    this[addOne]();

    return value;
  }
}
