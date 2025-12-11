/*
  Basic Number slider

  Behaviour:
  - Min, Max, Step and Default are read from field.settings.
  - The slider stores a number, an empty value results in null.
*/

(() => {
  const tagName = "field-number-slider-basic";

  const html = `
    <link rel="stylesheet" href="${import.meta.url.replace("index.js","index.css")}" />

    <div class="ns-wrapper">
      <div class="ns-row">
        <span class="ns-min"></span>

        <div class="ns-slider-container">
          <div class="ns-tooltip">
            <span class="ns-current-value"></span>
          </div>
          <input
            type="range"
            class="ns-range" />
        </div>

        <span class="ns-max"></span>
      </div>
    </div>`;

  class NumberSlider extends HTMLElement {
    connectedCallback() {
      const connector = this.connector;
      if (!connector || !connector.data) 
        return;

      const settings = connector.field?.settings || {};

      const min = toNumber(settings.Min, 0);
      const max = toNumber(settings.Max, 100);
      const sliderStep = toNumber(settings.SliderStep, 1);

      const initial =
        typeof connector.data.value === "number"
          ? connector.data.value
          : toNumber(settings.Default, min);

      const value = clamp(initial, min, max);

      this.innerHTML = html;

      // get elements
      this.rangeEl = this.querySelector(".ns-range");
      this.minEl = this.querySelector(".ns-min");
      this.maxEl = this.querySelector(".ns-max");
      this.tooltipEl = this.querySelector(".ns-tooltip");
      this.currentEl = this.querySelector(".ns-current-value");
      this.containerEl = this.querySelector(".ns-slider-container");

      if (!this.rangeEl || !this.minEl || !this.maxEl || !this.tooltipEl || !this.currentEl || !this.containerEl)
        return;

      // set range
      this.rangeEl.min = String(min);
      this.rangeEl.max = String(max);
      this.rangeEl.step = String(sliderStep);
      this.rangeEl.value = String(value);

      // Min/Max Labels
      this.minEl.textContent = String(min);
      this.maxEl.textContent = String(max);

      const setDisplay = (val) => {
        if (val == null) {
          this.currentEl.textContent = "";
          this.tooltipEl.style.left = "0px";
          return;
        }

        const number = Number(val);
        const clampedValue = clamp(number, min, max);

        this.currentEl.textContent = String(clampedValue);

        // Get the position and size of the input element
        const rangeRect = this.rangeEl.getBoundingClientRect();

        // Get the position and size of the slider container
        const containerRect = this.containerEl.getBoundingClientRect();

        // Calculate how far along the slider the value is (0 = min, 1 = max)
        const ratio = max === min ? 0 : (clampedValue - min) / (max - min);

        // The slider thumb is 16px, so radius = 8px 
        const thumbRadius = 8;

        // Calculate where the slider track begins
        const trackStart = rangeRect.left - containerRect.left + thumbRadius;

        // Calculate the usable track width
        const trackWidth = Math.max(rangeRect.width - thumbRadius * 2, 0);

        //exact pixel position where the tooltip should appear
        const x = trackStart + ratio * trackWidth;

        this.tooltipEl.style.left = `${x}px`;
      };

      const updateValue = (raw) => {
        if (raw === "" || raw == null) {
          connector.data.update(null);
          this.rangeEl.value = String(min);
          setDisplay(null);
          return;
        }

        const num = Number(raw);
        if (Number.isNaN(num)) 
          return;

        const clamped = clamp(num, min, max);

        if (connector.data.value !== clamped) 
          connector.data.update(clamped);

        this.rangeEl.value = String(clamped);
        setDisplay(clamped);
      };

      // events
      this.rangeListener = () => updateValue(this.rangeEl.value);
      this.rangeEl.addEventListener("input", this.rangeListener);

      this.resizeListener = () => {
        if (!this.rangeEl) 
          return;
        setDisplay(this.rangeEl.value);
      };
      window.addEventListener("resize", this.resizeListener);

      setDisplay(value);
    }

    disconnectedCallback() {
      if (this.rangeEl && this.rangeListener) 
        this.rangeEl.removeEventListener("input", this.rangeListener);
 
      if (this.resizeListener) 
        window.removeEventListener("resize", this.resizeListener);
      
      this.rangeEl = null;
      this.minEl = null;
      this.maxEl = null;
      this.tooltipEl = null;
      this.currentEl = null;
      this.containerEl = null;
      this.rangeListener = null;
      this.resizeListener = null;
    }
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  if (!customElements.get(tagName)) {
    customElements.define(tagName, NumberSlider);
  }
})();
