import { Vector3 } from 'cornerstone-math';

class Voxel {
  constructor (coords, i, j, k, value) {
    this.coords = coords;
    this.i = i;
    this.j = j;
    this.k = k;
    this.value = value;
  }
}

const voxels = [];

function createVoxel (i, j, k, matrix, value) {
  const position = new Vector3(i, j, k);

  position.applyMatrix4(matrix);

  return new Voxel(position, i, j, k, value);
}

export function consumeImageData (chunk, header, iterator) {
  const TypedArrayConstructor = header.dataType.TypedArrayConstructor;
  let remainderBytes = null;

  if (TypedArrayConstructor.BYTES_PER_ELEMENT !== 1) {
    const bytesOverflowing = chunk.byteLength % TypedArrayConstructor.BYTES_PER_ELEMENT;

    if (bytesOverflowing > 0) {
      remainderBytes = chunk.slice(chunk.byteLength - bytesOverflowing);
      chunk = chunk.slice(0, chunk.byteLength - bytesOverflowing);
    }
  }

  chunk = new TypedArrayConstructor(chunk);
  iterator.setChunk(chunk);

  for (let c = 0; c < chunk.length; c++) {
    const { i, j, k, value } = iterator.next(chunk, header);

    voxels.push(createVoxel(i, j, k, header.matrix, value));
  }

  return remainderBytes;
}

export function getSlice (dim, header, index) {
  let width = null;
  let height = null;
  let axis = null;
  let plane = null;

  switch (dim) {
  case 'x':
    axis = dim;
    plane = (header.volumeDimensions.min[axis] + header.pixelSpacing[0] * index);
    // falls through
  case 'i':
    width = header.voxelLength[1];
    height = header.voxelLength[2];
    break;
  case 'y':
    axis = dim;
    plane = (header.volumeDimensions.min[axis] + header.pixelSpacing[1] * index);
    // falls through
  case 'j':
    width = header.voxelLength[0];
    height = header.voxelLength[2];
    break;
  case 'z':
    axis = dim;
    plane = (header.volumeDimensions.min[axis] + header.pixelSpacing[2] * index);
    // falls through
  case 'k':
    width = header.voxelLength[0];
    height = header.voxelLength[1];
    break;
  }

  let selectedVoxels = null;

  if (axis && plane) {
    selectedVoxels = voxels.filter((v) => {
      const position = v.coords[axis];

      return position >= plane - Number.EPSILON && position <= plane + Number.EPSILON;
    });
  } else {
    selectedVoxels = voxels.filter((v) => v[dim] === index);
  }

  return {
    width,
    height,
    values: selectedVoxels.map((v) => v.value)
  };
}
