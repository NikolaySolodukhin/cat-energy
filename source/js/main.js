import './polyfill';
import './popup';
import './picturefill';
import './svgxuse.min';
import ImageComparison from './compare-image';
new ImageComparison({
  classNameContainerString: 'slider__images',
  indicator: 'slider__indicator',
  animateInterval: '5',
});
