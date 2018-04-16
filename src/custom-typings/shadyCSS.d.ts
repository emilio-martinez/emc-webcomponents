declare const ShadyCSS: {
  prepareTemplate: (
    templateElement: HTMLTemplateElement,
    elementName: string,
    elementExtension?: string
  ) => void;
  styleElement: (element: Element) => void;
  styleSubtree: (element: Element, overrideProperties: object) => void;
  styleDocument: (overrideProperties: object) => void;
  getComputedStyleValue(element: Element, propertyName: string): CSSStyleDeclaration;
  nativeCss: boolean;
  nativeShadow: boolean;
};
