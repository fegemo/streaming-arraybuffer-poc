import * as cornerstone from 'cornerstone-core';

function createDummyImageLoader (imageId, header, imageData, width, height) {

  function getExampleImage (imageId) {

    const image = {
      imageId,
      minPixelValue: 0,
      maxPixelValue: 255,
      slope: 1.0,
      intercept: 0,
      windowCenter: 127,
      windowWidth: 256,
      getPixelData: () => imageData,
      rows: height,
      columns: width,
      height,
      width,
      color: false,
      columnPixelSpacing: 1,
      rowPixelSpacing: 1,
      sizeInBytes: width * height
    };

    return {
      promise: new Promise((resolve) => {
        resolve(image);
      }),
      cancelFn: undefined
    };
  }


  // register our imageLoader plugin with cornerstone
  cornerstone.registerImageLoader('nifti', getExampleImage);
}

export default createDummyImageLoader;
