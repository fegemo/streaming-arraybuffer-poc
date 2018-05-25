import flattenNDarray from './flattenNDarray';

const dimensionMap = {
  x: 'i',
  i: 'i',
  y: 'j',
  j: 'j',
  z: 'k',
  k: 'k'
};

export function getSlice (dim, header, index, iterator) {
  const dataAvailablePromise = iterator.sliceDataAvailablePromises[dimensionMap[dim]][index];

  return dataAvailablePromise.then(() => {
    let columns = null;
    let rows = null;
    let slicePick = [];

    switch (dim) {
    case 'x':
      // falls through
    case 'i':
      columns = header.voxelLength[1];
      rows = header.voxelLength[2];
      slicePick = [index, null, null];
      break;
    case 'y':
      // falls through
    case 'j':
      columns = header.voxelLength[0];
      rows = header.voxelLength[2];
      slicePick = [null, index, null];
      break;
    case 'z':
      // falls through
    case 'k':
      columns = header.voxelLength[0];
      rows = header.voxelLength[1];
      slicePick = [null, null, index];
      break;
    }

    const values = iterator.dataMatrix.pick(...slicePick);

    return new Promise((resolve) => {
      resolve({
        columns,
        rows,
        values: flattenNDarray(values)
      });
    });
  });
}
