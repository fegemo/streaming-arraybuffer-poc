import request from './request';
import niftiReader from 'nifti-reader-js';
import { HTMLLogger as Logger } from './log';
import growBuffer from './growBuffer';
import pako from 'pako';
import { parseNiftiHeader } from './parseNiftiHeader';
import { consumeImageData, getSliceK } from './consumeImageData';
import ImageId from './ImageId';
import MatrixIterator from './MatrixIterator';
import * as cornerstone from 'cornerstone-core';
import createDummyImageLoader from './dummyImageLoader';

const logger = new Logger('#logging');
const formEl = document.querySelector('form');
const fileEl = formEl.querySelector('#file');
const progressEl = formEl.querySelector('#progress');


formEl.addEventListener('submit', (e) => {
  e.preventDefault();

  let isCompressed = false;
  let totalBytesRead = 0;
  let totalDecompressedBytesRead = 0;
  let accumulationRawBuffer = null;
  let stillReceivingHeader = true;
  const inflator = new pako.Inflate();
  let parsedHeader = null;
  let decompressedHeaderRemainderBuffer = null;
  let matrixIterator = null;


  request(fileEl.value, reportProgress, chunkReceived, done);

  function chunkReceived (chunk) {
    const HEADER_LENGTH = niftiReader.NIFTI1.STANDARD_HEADER_SIZE;

    totalBytesRead += chunk.buffer.byteLength;

    if (stillReceivingHeader) {
      accumulationRawBuffer = growBuffer(accumulationRawBuffer, chunk);

      if (accumulationRawBuffer.byteLength >= HEADER_LENGTH) {
        // we have downloaded enough bytes to parse the header
        stillReceivingHeader = false;

        isCompressed = niftiReader.isCompressed(accumulationRawBuffer);

        let headerBytes = accumulationRawBuffer;

        if (isCompressed) {
          inflator.push(headerBytes, pako.Z_SYNC_FLUSH);
          headerBytes = inflator.result.buffer;
        }

        decompressedHeaderRemainderBuffer = headerBytes.slice(HEADER_LENGTH);
        headerBytes = headerBytes.slice(0, HEADER_LENGTH);

        // parse the header using nifti-reader-js
        parsedHeader = parseNiftiHeader(headerBytes);
        console.dir(parsedHeader);
        matrixIterator = new MatrixIterator(parsedHeader.voxelLength);

        totalDecompressedBytesRead += HEADER_LENGTH;
      }
    }

    if (!stillReceivingHeader) {

      if (decompressedHeaderRemainderBuffer && decompressedHeaderRemainderBuffer.byteLength > 0) {
        chunk = decompressedHeaderRemainderBuffer;
        decompressedHeaderRemainderBuffer = null;
      } else if (isCompressed) {
        inflator.push(chunk, pako.Z_SYNC_FLUSH);
        chunk = inflator.result.buffer;
      }


      // do whatever has to be done with this new data
      consumeImageData(chunk, parsedHeader, matrixIterator);


      // just grabs the first axial slice, supposing the initial chunk was
      // big enough to hold all of its pixels
      // this is just a temporary, for an initial demo purpose
      if (!window.hasPrintedSlice0) {
        const imageIdObject = ImageId.fromURL(`nifti:${fileEl.value}`);
        const slice0 = getSliceK(parsedHeader, imageIdObject.slice.index);

        createDummyImageLoader(imageIdObject.url, parsedHeader, slice0);
        const element = document.querySelector('#cornerstone-image');

        cornerstone.enable(element);
        cornerstone.loadImage(imageIdObject.url).then((image) => {
          cornerstone.displayImage(element, image);
        });
        window.hasPrintedSlice0 = true;
      }

      totalDecompressedBytesRead += chunk.byteLength;
    }
  }

  function done () {
    inflator.push([], true);
    logger.info(`Total of bytes *compressed*: ${totalBytesRead.toLocaleString()}`);
    logger.info(`Total of bytes *decompressed*: ${totalDecompressedBytesRead.toLocaleString()}`);
  }
});


function reportProgress (percentageConcluded) {
  const percentage = 100 * percentageConcluded;

  progressEl.innerHTML = `${percentage.toFixed(0)}%`;
}
