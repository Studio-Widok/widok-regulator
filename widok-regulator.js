/**
 * @typedef {Object} options
 * main
 * @property {object} initialValues
 * @property {callback} step
 * @property {numeric} friction
 * @property {numeric} amplification
 * @property {numeric} saturation
 * @property {callback} transformEddx
 */

class Regulator {
  constructor(options) {
    this.options = {
      initialValues: {},
      friction: 1.1,
      amplification: 0.005,
      saturation: Infinity,
    };
    Object.assign(this.options, options);

    this.isAnimating = false;
    this.names = Object.getOwnPropertyNames(this.options.initialValues);
    this.x = {};
    for (let i = 0; i < this.names.length; i++) {
      this.x[this.names[i]] = {
        value: this.options.initialValues[this.names[i]],
        target: this.options.initialValues[this.names[i]],
        isAnimating: false,
        dx: 0,
        edx: 0,
        eddx: 0,
      };
    }
  }

  startAnimation() {
    if (!this.isAnimating) {
      this.animationStep();
    }
  }

  animate(target, jump) {
    const targetNames = Object.getOwnPropertyNames(target);
    let changesMade = false;
    for (let i = 0; i < targetNames.length; i++) {
      if (this.x[targetNames[i]].target !== target[targetNames[i]] || jump) {
        changesMade = true;
        this.x[targetNames[i]].target = target[targetNames[i]];
        if (jump) this.x[targetNames[i]].value = target[targetNames[i]];
        this.x[targetNames[i]].isAnimating = true;
      }
    }
    if (changesMade) {
      this.startAnimation();
    }
  }

  animationStep() {
    this.isAnimating = true;
    let nextStep = false;
    let response = {};
    for (let i = 0; i < this.names.length; i++) {
      const property = this.x[this.names[i]];
      if (property.isAnimating) {
        let diff = property.target - property.value;
        let eddx =
          this.transformEddx === undefined
            ? property.eddx
            : this.transformEddx(property.eddx, this.names[i]);
        diff += eddx;
        if (property.edx) {
          property.value += property.edx;
        } else {
          property.dx += Math.max(
            Math.min(diff, this.options.saturation),
            -this.options.saturation
          );
          property.value += property.dx * this.options.amplification;
          property.dx /= this.options.friction;
        }
        diff = property.target - property.value;
        if (
          property.edx !== 0 ||
          Math.abs(property.dx) > 0.001 ||
          Math.abs(diff) > 0.01
        ) {
          nextStep = true;
        }
      }
      response[this.names[i]] = property.value;
    }
    this.options.step(response, this);
    if (nextStep) {
      requestAnimationFrame(this.animationStep.bind(this));
    } else {
      this.isAnimating = false;
    }
  }

  eddx(target) {
    const targetNames = Object.getOwnPropertyNames(target);
    let changesMade = false;
    for (let i = 0; i < targetNames.length; i++) {
      changesMade = true;
      if (this.x[targetNames[i]].eddx !== target[targetNames[i]]) {
        this.x[targetNames[i]].eddx = target[targetNames[i]];
        this.x[targetNames[i]].isAnimating = true;
      }
    }
    if (changesMade) {
      this.startAnimation();
    }
  }

  edx(target) {
    const targetNames = Object.getOwnPropertyNames(target);
    let changesMade = false;
    for (let i = 0; i < targetNames.length; i++) {
      changesMade = true;
      if (this.x[targetNames[i]].edx !== target[targetNames[i]]) {
        this.x[targetNames[i]].edx = target[targetNames[i]];
        this.x[targetNames[i]].isAnimating = true;
      }
    }
    if (changesMade) {
      this.startAnimation();
    }
  }
}

/**
 * create new regulator
 * @param {options} options extra options
 * @returns {Object} regulator
 */

function createRegulator(options) {
  return new Regulator(options);
}

export default createRegulator;
