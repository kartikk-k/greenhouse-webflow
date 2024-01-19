import { copyToClipboard } from '@utils/copyToClipboard';
import { greenhouse } from '@utils/greenhouse';

window.Webflow ||= [];
window.Webflow.push(() => {
  greenhouse();
  copyToClipboard();
});

// for testing purposes

// window.onload = () => {
//   greenhouse()
// }