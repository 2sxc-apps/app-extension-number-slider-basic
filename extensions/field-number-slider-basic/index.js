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
      if (!connector?.data) 
        return;

      const settings = connector.field?.settings || {};
      const min = toNumber(settings.Min, 0);
      const max = toNumber(settings.Max, 100);
      const sliderStep = toNumber(settings.SliderStep, 1);

      const initial = typeof connector.data.value === "number"
        ? connector.data.value
        : toNumber(settings.Default, min);

      const value = clamp(initial, min, max);

      this.innerHTML = html;

      // Cache DOM elements used by the component
      this.rangeEl = this.querySelector('.ns-range');
      this.minEl = this.querySelector('.ns-min');
      this.maxEl = this.querySelector('.ns-max');
      this.tooltipEl = this.querySelector('.ns-tooltip');
      this.currentEl = this.querySelector('.ns-current-value');
      this.containerEl = this.querySelector('.ns-slider-container');

      // if no elements available -> exit early
      if (!(this.rangeEl || this.minEl || this.maxEl || this.tooltipEl || this.currentEl || this.containerEl))
        return;

      // set range attributes
      this.rangeEl.min = min;
      this.rangeEl.max = max;
      this.rangeEl.step = sliderStep;
      this.rangeEl.value = value;

      // ARIA + labels
      this.rangeEl.setAttribute('role', 'slider');
      this.rangeEl.setAttribute('aria-valuemin', String(min));
      this.rangeEl.setAttribute('aria-valuemax', String(max));
      this.rangeEl.setAttribute('aria-valuenow', String(value));
      this.minEl.textContent = min;
      this.maxEl.textContent = max;

      // Read visual thumb size from CSS variable so JS and CSS stay in sync
      // Fallback to 16px if the variable is not set
      const thumbSize = parseFloat(getComputedStyle(this.rangeEl).getPropertyValue('--thumb-size')) || 16;
      const thumbRadius = thumbSize / 2;

      // Compute and position tooltip based on current value
      const computePos = (val) => {
        if (val == null) {
          this.currentEl.textContent = '';
          this.tooltipEl.style.left = '0px';
          this.rangeEl.setAttribute('aria-valuenow', String(min));
          return;
        }
        // Clamp and update display text / ARIA
        const num = clamp(Number(val), min, max);
        this.currentEl.textContent = num;
        this.rangeEl.setAttribute('aria-valuenow', String(num));

        // Get bounding rectangles and compute thumb position within the container
        const rangeRect = this.rangeEl.getBoundingClientRect();
        const containerRect = this.containerEl.getBoundingClientRect();

        const trackStart = thumbRadius;
        const trackWidth = Math.max(rangeRect.width - thumbRadius * 2, 0);
        const ratio = max === min ? 0 : (num - min) / (max - min);

        // position relative to the container: start from the range left offset inside container
        const x = (rangeRect.left - containerRect.left) + trackStart + ratio * trackWidth;

        // Apply optional JS-side correction read from CSS 
        const corrRaw = getComputedStyle(this.containerEl).getPropertyValue('--tooltip-js-correction');
        const corr = Number.isFinite(parseFloat(corrRaw)) ? parseFloat(corrRaw) : 0; 
        const xCorr = x - corr;
        this.tooltipEl.style.left = `${xCorr}px`;
      };

      // Only call connector.data.update if it exists and value changed
      const safeUpdate = (n) => {
        if (typeof connector.data.update === 'function' && connector.data.value !== n) {
          connector.data.update(n);
        }
      };

      // Handle input/change events from the range element
      const onInput = () => {
        const raw = this.rangeEl.value;
        if (raw === '' || raw == null) {
          safeUpdate(null);
          this.rangeEl.value = min;
          computePos(null);
          return;
        }

        const n = clamp(Number(raw), min, max);
        safeUpdate(n);
        this.rangeEl.value = n;
        computePos(n);
      };

      // Choose which event to listen to: 'input' (live) or 'change' (on release)
      const updateOn = settings.UpdateOn === 'change' ? 'change' : 'input';
      this.onInput = onInput;
      this.rangeEl.addEventListener(updateOn, this.onInput);

      // Keep tooltip positioned on layout changes using ResizeObserver
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObs = new ResizeObserver(() => computePos(this.rangeEl.value));
        this.resizeObs.observe(this.rangeEl);
      }

      computePos(value);
    }

    disconnectedCallback() {
      if (this.rangeEl && this.onInput) {
        this.rangeEl.removeEventListener('input', this.onInput);
        this.rangeEl.removeEventListener('change', this.onInput);
      }

      if (this.resizeObs) {
        this.resizeObs.disconnect();
        this.resizeObs = null;
      }

      this.rangeEl = null;
      this.minEl = null;
      this.maxEl = null;
      this.tooltipEl = null;
      this.currentEl = null;
      this.containerEl = null;
      this.onInput = null;
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
