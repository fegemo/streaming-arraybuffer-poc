import ndarray from 'ndarray';
import { HTMLLogger as Logger } from './log';
import { convertFloatChunkToInteger } from './convertFloatDataToInteger';
import createSliceDataAvailablePromises from './createSliceDataAvailablePromises';
import Events from './events';

const logger = new Logger('#logging');

// const addOne = Symbol('addOne');
// const next = Symbol('next');

/**
 * An object that keeps the state of a n-dimensional matrix that is being
 * traversed.
 */
export default class MatrixIterator {
  constructor (dimensions = [1], Type) {
    this.dimensions = dimensions;
    this.Type = Type;
    this.bytesPerVoxel = Type.BYTES_PER_ELEMENT;
    this.strides = this.dimensions.reduce((strides, _, i, dims) => {
      const previousDimension = dims[i - 1] || 1;
      const previousStride = strides[i - 1] || 1;

      strides.push(previousDimension * previousStride);

      return strides;
    }, []);

    const numberOfVoxels = dimensions.reduce((accum, dim) => accum * dim, 1);

    this.OriginalType = Type;
    if (Type === Float32Array) {
      this.Type = Uint16Array;
    }
    this.dataBuffer = new Type(numberOfVoxels);
    this.dataMatrix = ndarray(this.dataBuffer, this.dimensions, this.strides);
    this.currentBufferSize = 0;

    Events(this);
    this.sliceDataAvailablePromises = createSliceDataAvailablePromises(this);
  }

  addChunk (chunk, metaData) {
    const remainderBytes = chunk.byteLength % this.bytesPerVoxel;
    const chunkRemainder = chunk.slice(chunk.byteLength - remainderBytes);

    logger.info(`addChunk of byteLength = ${chunk.byteLength}, remainder of ${remainderBytes}`);

    // gets only the "byte aligned" portion of the chunk and converts to the
    // proper typed array
    chunk = chunk.slice(0, chunk.byteLength - remainderBytes);
    chunk = new this.OriginalType(chunk);

    // transforms the chunk, in case it requires (endianess, float to int etc.)
    // cannot do the float to int conversion without having min/max float values
    // if (this.OriginalType === Float32Array) {
    //   chunk = convertFloatChunkToInteger(chunk, metaData);
    // }


    this.dataBuffer.set(chunk, this.currentBufferSize);
    this.currentBufferSize += chunk.length;
    logger.info(`this.currentBufferSize = ${this.currentBufferSize}`);


    // check if we can resolve some "slice download" promises
    this.emit('chunkReceived', this);

    return chunkRemainder;
  }
}
