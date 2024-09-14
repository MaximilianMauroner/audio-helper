import {
  createEffect,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";

class StereoOscillator {
  private audioContext: AudioContext;
  private leftOsc: OscillatorNode | null;
  private rightOsc: OscillatorNode | null;
  private leftGain: GainNode;
  private rightGain: GainNode;
  private merger: ChannelMergerNode;
  private leftFreq: number;
  private rightFreq: number;

  constructor() {
    this.audioContext = new AudioContext();
    this.leftOsc = null;
    this.rightOsc = null;
    this.leftGain = this.audioContext.createGain();
    this.rightGain = this.audioContext.createGain();
    this.merger = this.audioContext.createChannelMerger(2);
    this.leftFreq = 1000;
    this.rightFreq = 1000;

    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
    this.merger.connect(this.audioContext.destination);
    this.setVolumes(0.25);
  }

  private createOscillator(frequency: number): OscillatorNode {
    const osc = this.audioContext.createOscillator();
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    return osc;
  }

  setLeft(leftFreq: number) {
    this.leftFreq = leftFreq;
    if (this.leftOsc) {
      this.leftOsc.frequency.setValueAtTime(
        leftFreq,
        this.audioContext.currentTime
      );
    }
  }

  setRight(rightFreq: number) {
    this.rightFreq = rightFreq;
    if (this.rightOsc) {
      this.rightOsc.frequency.setValueAtTime(
        rightFreq,
        this.audioContext.currentTime
      );
    }
  }

  startLeft() {
    if (this.leftOsc) {
      this.stopLeft();
    }
    this.leftOsc = this.createOscillator(this.leftFreq);
    this.leftOsc.connect(this.leftGain);
    this.leftOsc.start();
  }

  startRight() {
    if (this.rightOsc) {
      this.stopRight();
    }
    this.rightOsc = this.createOscillator(this.rightFreq);
    this.rightOsc.connect(this.rightGain);
    this.rightOsc.start();
  }

  start() {
    this.startLeft();
    this.startRight();
  }

  stopLeft() {
    if (this.leftOsc) {
      this.leftOsc.stop();
      this.leftOsc.disconnect();
      this.leftOsc = null;
    }
  }

  stopRight() {
    if (this.rightOsc) {
      this.rightOsc.stop();
      this.rightOsc.disconnect();
      this.rightOsc = null;
    }
  }

  stop() {
    this.stopLeft();
    this.stopRight();
  }

  setVolumes(vol: number) {
    const volume = Math.max(0, Math.min(1, vol));
    this.leftGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    this.rightGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }
}

const stereoOsc = new StereoOscillator();

const App: Component = () => {
  const [leftFrequency, setLeftFrequency] = createSignal(100);
  const [rightFrequency, setRightFrequency] = createSignal(100);
  const [isPlayingLeft, setIsPlayingLeft] = createSignal(false);
  const [isPlayingRight, setIsPlayingRight] = createSignal(false);
  const [volume, setVolume] = createSignal(0.25);

  function playFrequency(channel: string) {
    if (channel === "left") {
      stereoOsc.setLeft(leftFrequency());
      stereoOsc.startLeft();
      setIsPlayingLeft(true);
    } else if (channel === "right") {
      stereoOsc.setRight(rightFrequency());
      stereoOsc.startRight();
      setIsPlayingRight(true);
    } else {
      stereoOsc.setLeft(leftFrequency());
      stereoOsc.setRight(rightFrequency());
      stereoOsc.start();
      setIsPlayingLeft(true);
      setIsPlayingRight(true);
    }
  }

  createEffect(() => {
    onCleanup(() => {
      stereoOsc.stop();
    });
  });
  createEffect(() => {
    stereoOsc.setLeft(leftFrequency());
  });
  createEffect(() => {
    stereoOsc.setRight(rightFrequency());
  });

  return (
    <div class="p-4 flex flex-col gap-2">
      <h1 class="text-3xl font-semibold mx-auto text-pink-600">
        Stereo Oscillator
      </h1>
      <p class="max-w-prose mb-2 mx-auto text-gray-600">
        This is a simple stereo oscillator that plays two different frequencies
        in the left and right channels(and both). So that you can easily test
        your headphones or whatever in the browser.
      </p>
      <div class="p-2 rounded-lg border">
        <span>Volume: {Math.round(volume() * 100)}/100</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          onInput={(e) => {
            setVolume(e.target.valueAsNumber);
            stereoOsc.setVolumes(e.target.valueAsNumber);
          }}
          value={volume()}
          class="block w-full max-w-lg"
        />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 w-full gap-2 ">
        <div class="border rounded-lg w-full p-2">
          <div class="flex justify-start gap-2">
            <span>Left Frequency:</span>
            <input
              type="number"
              min={0}
              max={25000}
              value={leftFrequency()}
              onInput={(e) => setLeftFrequency(e.target.valueAsNumber)}
            />
          </div>
          <input
            type="range"
            min={0}
            max={25000}
            value={leftFrequency()}
            onInput={(e) => setLeftFrequency(e.target.valueAsNumber)}
            step={1}
            class="block w-full"
          />
          <button
            class="block rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            onClick={() => {
              if (isPlayingLeft()) {
                stereoOsc.stopLeft();
                setIsPlayingLeft(false);
              } else {
                playFrequency("left");
              }
            }}
          >
            {!isPlayingLeft() ? "Play Left" : "Pause Left"}
          </button>
        </div>
        <div class="border rounded-lg w-full p-2">
          <div class="flex justify-start gap-2">
            <span>Right Frequency:</span>
            <input
              type="number"
              min={0}
              max={25000}
              value={rightFrequency()}
              onInput={(e) => setRightFrequency(e.target.valueAsNumber)}
            />
          </div>
          <input
            type="range"
            min={0}
            max={25000}
            value={rightFrequency()}
            onInput={(e) => setRightFrequency(e.target.valueAsNumber)}
            step={1}
            class="block w-full"
          />
          <button
            class="block rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            onClick={() => {
              if (isPlayingRight()) {
                stereoOsc.stopRight();
                setIsPlayingRight(false);
              } else {
                playFrequency("right");
              }
            }}
          >
            {!isPlayingRight() ? "Play Right" : "Pause Right"}
          </button>
        </div>
      </div>
      <button
        class="block rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
        onClick={() => {
          if (isPlayingRight() && isPlayingLeft()) {
            stereoOsc.stop();
            setIsPlayingRight(false);
            setIsPlayingLeft(false);
          } else {
            playFrequency("both");
          }
        }}
      >
        {!(isPlayingRight() && isPlayingLeft()) ? "Play Both" : "Pause Both"}
      </button>
    </div>
  );
};

export default App;
