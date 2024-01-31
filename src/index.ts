import { greenhouse } from '@utils/greenhouse';

window.Webflow ||= [];
window.Webflow.push(() => {
  greenhouse();
});

// for testing purposes
// window.onload = () => {
//   greenhouse()
// }