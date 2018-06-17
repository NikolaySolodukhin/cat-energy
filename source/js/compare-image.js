/**
 * Constructor
 * @param options
 */
class ImageComparison {
  constructor(options) {
    this.init(options);
    this._build();
    this._setEvents();
  }

  init(options) {
    this.container = document.querySelector(
      `.${options.classNameContainerString}`
    );
    this.startPosition = options.startPosition || 50;
    this.images = [...this.container.children];
    this._animateInterval = +options.animateInterval;
    this._comparisonSeparator = document.querySelector(`.${options.indicator}`);
    this.scaleSeparator = this._comparisonSeparator.parentNode.querySelector(
      '.slider__scale-value'
    );
    this.scaleSeparator.style.width = this.startPosition + '%';
    this._comparisonSeparator.style.left = this.startPosition + '%';
    this._items = [];
  }
  /**
   * Build HTML structure
   * @private
   */
  _build() {
    this.container.classList.add('comparison-widget');
    for (let i = 0; i < this.images.length; i++) {
      const item = document.createElement('div');
      const content = document.createElement('div');
      item.classList.add('comparison-item');
      content.classList.add('comparison-item__content');
      this.images[i].classList.add('comparison-item__image');
      content.appendChild(this.images[i]);
      item.appendChild(content);

      if (i === 0) {
        item.classList.add('comparison-item--first');
        item.style.width = this.startPosition + '%';
      }

      this._items.push(item);
      this.container.appendChild(item);
    }
  }

  /**
   * Set need DOM events
   * @private
   */
  _setEvents() {
    this.container.addEventListener('click', event =>
      this._calcPosition(event)
    );

    this.setMultiEvents(
      this._comparisonSeparator,
      ['mousedown', 'touchstart'],
      () => this._comparisonSeparator.classList.add('actived')
    );

    this.setMultiEvents(document.body, ['mouseup', 'touchend'], () =>
      this._comparisonSeparator.classList.remove('actived')
    );

    this.setMultiEvents(document.body, ['mousemove', 'touchmove'], event => {
      if (this._comparisonSeparator.classList.contains('actived')) {
        this._calcPosition(event);
        if (document['selection']) {
          document['selection'].empty();
        }
      }
    });

    this.setMultiEvents(window, ['resize', 'load'], () => this._setImageSize());

    for (let i = 0; i < this.images.length; i++) {
      this.images[i].addEventListener('dragstart', e => e.preventDefault());
    }
  }

  /**
   * Calc current position (click, touch or move)
   * @param event
   * @private
   */
  _calcPosition(event) {
    const containerCoords = this.container.getBoundingClientRect();
    const containerWidth = containerCoords.width;
    /** @namespace event.touches */
    const horizontalPositionForElement =
      (event.clientX || event.touches[0].pageX) - containerCoords.left;
    let positionInPercent =
      (horizontalPositionForElement * 100) / containerWidth;
    if (positionInPercent > 100) {
      positionInPercent = 100;
    } else if (positionInPercent < 0) {
      positionInPercent = 0;
    }
    this._controllerPosition(+positionInPercent.toFixed(2), event.type);
  }

  /**
   * Controller position
   * @param positionInPercent
   * @param eventType
   * @private
   */
  _controllerPosition(positionInPercent, eventType) {
    switch (eventType) {
      case 'click':
        this._setPositionWithAnimate(positionInPercent);
        break;
      default:
        this._updatePosition(positionInPercent);
    }
  }

  /**
   * Set position with animate
   * @param newPositionInPercent
   * @returns {boolean}
   * @private
   */
  _setPositionWithAnimate(newPositionInPercent) {
    let currentPositionInPercent = parseFloat(this._items[0].style.width);
    clearInterval(this._animateInterval);

    if (newPositionInPercent === currentPositionInPercent) {
      return false;
    } else if (currentPositionInPercent > newPositionInPercent) {
      decrementPosition.call(this);
    } else {
      incrementPosition.call(this);
    }

    // Support animate functions
    function incrementPosition() {
      const self = this;
      this._animateInterval = setInterval(function() {
        currentPositionInPercent++;
        self._updatePosition(currentPositionInPercent);
        if (currentPositionInPercent >= newPositionInPercent) {
          setFinalPositionAndClearInterval.call(self);
        }
      }, 10);
    }

    function decrementPosition() {
      const self = this;
      this._animateInterval = setInterval(() => {
        currentPositionInPercent--;
        self._updatePosition(currentPositionInPercent);
        if (currentPositionInPercent <= newPositionInPercent) {
          setFinalPositionAndClearInterval.call(self);
        }
      }, 10);
    }

    function setFinalPositionAndClearInterval() {
      this._updatePosition(newPositionInPercent);
      clearInterval(this._animateInterval);
    }
  }

  setMultiEvents(element, events, func) {
    for (let i = 0; i < events.length; i++) {
      element.addEventListener(events[i], func);
    }
  }

  /**
   * Set position item[0]
   * @param percent
   * @private
   */
  _updatePosition(percent) {
    this._items[0].style.width = percent + '%';
    this.scaleSeparator.style.width = percent + '%';
    this._comparisonSeparator.style.left = `calc(${percent}% - 17px)`;
  }

  /**
   * Set the width of image that has a position absolute
   * @private
   */
  _setImageSize() {
    this.images[0].style.width = this.container.offsetWidth + 'px';
  }
}

export default ImageComparison;
