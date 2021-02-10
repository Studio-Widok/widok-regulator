import $ from 'cash-dom';
import createRegulator from './../../../widok-regulator';

const dot = $('#dot');
const reg = createRegulator({
  initialValues: {
    position: 0,
  },
  step: response => {
    dot.css({
      left: response.position + '%',
    });
  },
});

reg.animate({
  position: 50,
});
