
export default function createSliceDataAvailablePromises (iterator) {
  const promises = {
    i: [],
    j: [],
    k: []
  };
  const dims = iterator.dimensions;

  for (let k = 0; k < dims[2]; k++) {
    promises.k[k] = new Promise((resolve) => {
      iterator.on('chunkReceived', () => {
        if (iterator.currentBufferSize >= (k + 1) * dims[0] * dims[1]) {
          resolve();
        }
      });
    });
  }

  const promiseForLastKSlice = promises.k[dims[2] - 1];

  for (let j = 0; j < dims[1]; j++) {
    promises.j[j] = promiseForLastKSlice;
  }
  for (let i = 0; i < dims[0]; i++) {
    promises.i[i] = promiseForLastKSlice;
  }

  return promises;
}
