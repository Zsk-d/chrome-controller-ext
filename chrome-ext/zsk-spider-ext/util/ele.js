function describeElement(element) {
  if (!element || !(element instanceof Element)) {
    return { error: 'Invalid element' };
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  // 获取所有属性键值对
  const attributes = {};
  for (let attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }

  // 判断是否“可点击”
  const clickable = (
    typeof element.onclick === 'function' ||
    element.hasAttribute('onclick') ||
    style.cursor === 'pointer' ||
    ['A', 'BUTTON', 'INPUT'].includes(element.tagName)
  );

  // 生成唯一 CSS Selector（简化逻辑）
  function getCssSelector(el) {
    if (el.id) return `#${el.id}`;
    let path = [];
    while (el && el.nodeType === 1) {
      let selector = el.tagName.toLowerCase();
      if (el.className) {
        const classNames = el.className.trim().split(/\s+/).join('.');
        if (classNames) selector += `.${classNames}`;
      }
      const siblingIndex = Array.from(el.parentNode?.children || []).indexOf(el) + 1;
      selector += `:nth-child(${siblingIndex})`;
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  return {
    tag: element.tagName,
    id: element.id || null,
    className: element.className || null,
    width: rect.width,
    height: rect.height,
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    html: element.outerHTML,
    text: element.innerText,
    href: element.getAttribute('href') || null,
    visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    position: style.position,
    zIndex: style.zIndex,
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    overflow: style.overflow,
    pointerEvents: style.pointerEvents,
    boxSizing: style.boxSizing,
    margin: style.margin,
    padding: style.padding,
    border: style.border,
    attributes: attributes,
    childrenCount: element.children.length,
    clickable: clickable,
    cssSelector: getCssSelector(element)
  };
}
