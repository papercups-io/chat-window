import {createDomMotionComponent} from 'framer-motion';

/** IE 11 supported version of the motion component */
export const motion: any = {
  div: createDomMotionComponent('div'),
  iframe: createDomMotionComponent('iframe'),
};
