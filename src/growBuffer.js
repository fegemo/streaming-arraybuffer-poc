function growBuffer (buffer, newChunk) {
  if (!buffer) {
    return newChunk.buffer;
  }

  const tempTypedArray = new Uint8Array(buffer.byteLength + newChunk.byteLength);
  tempTypedArray.set(new Uint8Array(buffer), 0);
  tempTypedArray.set(new Uint8Array(newChunk), buffer.byteLength);
  return tempTypedArray.buffer;
}

export default growBuffer;
