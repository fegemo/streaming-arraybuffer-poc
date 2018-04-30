import * as http from 'stream-http';
import { HTMLLogger as Logger } from './log';

const logger = new Logger('#logging');

function noop() {
}

function request(filename, progressCallback = noop, dataCallback = noop) {
  logger.info(`Starting request to '${filename}'`);
  const request = http.get(filename, (response) => {

    const contentLength = response.headers['Content-Length'] || response.headers['content-length'] || 0;
    let bytesRead = 0;

    response.on('data', (chunk) => {
      logger.info(`Downloaded a chunk of size ${chunk.length} bytes`);
      bytesRead += chunk.length;
      progressCallback(bytesRead / contentLength);
    });

    response.on('end', () => {
      logger.info('Response finished downloading.');
    });
  });


  request.on('error', (e) => {
    logger.error('Failed executing the request', e);
  });

}


export default request;
