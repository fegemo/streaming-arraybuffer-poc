import request from './request.js';
import niftiReader from 'nifti-reader-js';
import { HTMLLogger as Logger } from './log'
import growBuffer from './growBuffer.js';
import pako from 'pako';

const logger = new Logger('#logging');
const formEl = document.querySelector('form');
const fileEl = formEl.querySelector('#file');
const progressEl = formEl.querySelector('#progress');


const states = Object.freeze({
  BEFORE_START: Symbol('before start'),
  HEADER_RECEIVED: Symbol('header received'),
  HEADER_PARSED: Symbol('header parsed'),
  RECEIVING_IMAGE_DATA: Symbol('receiving image data'),
  FINISHED: Symbol('finished'),
  ERROR: Symbol('error')
});


formEl.addEventListener('submit', (e) => {
  e.preventDefault();

  let state = states.BEFORE_START;
  let isCompressed = false;
  let totalBytesRead = 0;
  let totalDecompressedBytesRead = 0;
  let compressedFirstDataBuffer = null;
  let firstDataBufferUncompressedLength = 0;
  let headerDataBuffer = null;
  let imageDataBuffer = null;
  let accumulationRawBuffer = null;
  let stillReceivingHeader = true;
  let inflator = new pako.Inflate();
  let parsedHeader = null;
  let decompressedHeaderRemainderBuffer = null;

  request(fileEl.value, reportProgress, chunkReceived, done);

  function chunkReceived(chunk) {
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
          // headerBytes = pako.inflate(headerBytes);
          inflator.push(headerBytes, pako.Z_SYNC_FLUSH);
          headerBytes = inflator.result.buffer;
        }

        decompressedHeaderRemainderBuffer = headerBytes.slice(HEADER_LENGTH);
        headerBytes = headerBytes.slice(0, HEADER_LENGTH);

        // parse the header using nifti-reader-js
        parsedHeader = niftiReader.readHeader(headerBytes);
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
      //

      totalDecompressedBytesRead += chunk.byteLength;
    }
  }


  function changeState (newState) {
    state = newState;
    logger.info(`Changed state to '${newState.toString()}'`);
  }

  function chunkReceived2 (chunk) {
    let isFirstChunkWithImageData = false;

    totalBytesRead += chunk.length;

    switch (state) {
      case states.BEFORE_START:
        headerDataBuffer = growBuffer(headerDataBuffer, chunk);

        // check if the chunk has a size big enough to hold the NIfTI header
        // which can be compressed or not
        if (totalBytesRead >= niftiReader.NIFTI1.STANDARD_HEADER_SIZE) {
          isFirstChunkWithImageData = true;
          // conditionally decompress
          if (niftiReader.isCompressed(headerDataBuffer)) {
            isCompressed = true;
            inflator.push(chunk, pako.Z_SYNC_FLUSH);
            changeState(states.HEADER_RECEIVED);
            headerDataBuffer = inflator.result.buffer;

            totalDecompressedBytesRead += headerDataBuffer.byteLength;
          }

          // move the extra bytes from the header buffer to the data buffer (already decompressed)
          const imageDataBuffer = headerDataBuffer.slice(niftiReader.NIFTI1.STANDARD_HEADER_SIZE);
          headerDataBuffer = headerDataBuffer.slice(0, niftiReader.NIFTI1.STANDARD_HEADER_SIZE);


          // parse the header
          header = niftiReader.readHeader(headerDataBuffer);

          // change the state to header parsed, then to receiving image data
          changeState(states.HEADER_PARSED);
          changeState(states.RECEIVING_IMAGE_DATA);

          chunk = imageDataBuffer;
        } else {
          break;
        }

      case states.RECEIVING_IMAGE_DATA:
        // if it is compressed, decompress the chunk
        if (isCompressed && !isFirstChunkWithImageData) {
          inflator.push(chunk, pako.Z_SYNC_FLUSH);
          chunk = inflator.result//.slice(totalDecompressedBytesRead);
        }

        if (!isFirstChunkWithImageData) {
          totalDecompressedBytesRead += chunk.buffer.byteLength;
        }


        // add the chunk to the image data buffer
        imageDataBuffer = growBuffer(imageDataBuffer, chunk);

      default:

    }

  }

  function done() {
    inflator.push([], true);
    // console.log('File data buffer bytes: ', imageDataBuffer.byteLength);
    console.log('Total of bytes *compressed*: ', totalBytesRead.toLocaleString());
    console.log('Total of bytes *uncompressed*: ', totalDecompressedBytesRead.toLocaleString());
  }
});


function reportProgress (percentageConcluded) {
  const percentage = 100 * percentageConcluded;
  progressEl.innerHTML = `${percentage.toFixed(0)}%`;
}
