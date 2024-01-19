export const copyToClipboard = () => {
  const ATTRIBUTE_NAME = 'tc-copy-element';

  window.addEventListener('load', () => {
    main();
  });

  function main() {
    const allTextElements = document.querySelectorAll(
      `[${ATTRIBUTE_NAME}]`
    ) as NodeListOf<HTMLElement>;

    allTextElements.forEach((item) => {
      item.onclick = async () => {
        if (item.getAttribute(ATTRIBUTE_NAME) !== 'false') {
          const text = item?.textContent;
          if (text) await window.navigator.clipboard.writeText(text);
          alert('Text copied');
        }
      };
    });
  }
};
