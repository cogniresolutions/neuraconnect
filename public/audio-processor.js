class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const channel = input[0];
    
    if (channel) {
      this.port.postMessage({
        type: 'audio-data',
        audioData: channel
      });
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);