import { Matrix4, Vector3, Plane } from 'cornerstone-math';

class Voxel {
  constructor(coords, i, j, k, value) {
    this.coords = coords;
    this.i = i;
    this.j = j;
    this.k = k;
    this.value = value;
  }
}

const voxels = [];

function createVoxel(i, j, k, matrix, value) {
  const position = new Vector3(i, j, k);
  position.applyMatrix4(matrix);

  return new Voxel(position, i, j, k, value);
}

export function consumeImageData(chunk, header, iterator) {
  const TypedArrayConstructor = header.dataType.TypedArrayConstructor;
  chunk = new TypedArrayConstructor(chunk);
  iterator.setChunk(chunk);

  for (let c = 0; c < chunk.length; c++) {
    const { i, j, k, value } = iterator.next(chunk, header);

    voxels.push(createVoxel(i, j, k, header.matrix, value));
  }
}

export function getSliceK(header, index) {
  const width = header.voxelLength[0];
  const height = header.voxelLength[1];
  const selectedVoxels = voxels.filter(v => v.k === index);

  return selectedVoxels.map(v => v.value);
}

export function getSliceJ(header, index) {
  const width = header.voxelLength[0];
  const height = header.voxelLength[2];
  const selectedVoxels = voxels.filter(v => v.j === index);

  return selectedVoxels.map(v => v.value);
}

export function getSliceI(header, index) {
  const width = header.voxelLength[1];
  const height = header.voxelLength[2];
  const selectedVoxels = voxels.filter(v => v.i === index);

  return selectedVoxels.map(v => v.value);
}

export function getSliceZ(header, index) {

}
