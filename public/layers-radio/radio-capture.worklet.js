// AudioWorklet capture for Layers Radio: batches 128-sample render quanta into
// 1024-sample chunks and transfers them to the main thread, where they are
// re-blocked for the decoder. Outputs stay silent: the mic is never audible.
class PcRadioCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(1024);
    this.n = 0;
    this.live = true;
    this.port.onmessage = e => { if (e.data && e.data.stop) this.live = false; };
  }
  process(inputs) {
    if (!this.live) return false;
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      let i = 0;
      while (i < ch.length) {
        const k = Math.min(this.buf.length - this.n, ch.length - i);
        this.buf.set(ch.subarray(i, i + k), this.n);
        this.n += k; i += k;
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf, [this.buf.buffer]);
          this.buf = new Float32Array(1024);
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pc-radio-capture', PcRadioCapture);
