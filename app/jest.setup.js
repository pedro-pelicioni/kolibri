/* eslint-env jest */
// Mock global do AsyncStorage — segue o pattern oficial da lib.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Libs gráficas que distribuem ESM (.mjs) ou native modules: pra o smoke
// test do App, basta um stub component. Os tests da camada api/ não
// dependem destes.
const React = require('react');
const passthrough = (name) => {
  const C = (props) => React.createElement(name, props, props.children);
  C.displayName = name;
  return C;
};

jest.mock('react-native-qrcode-svg', () => ({ __esModule: true, default: passthrough('QRCode') }));

jest.mock('react-native-svg', () => {
  const tags = ['Svg', 'Circle', 'Path', 'Rect', 'G', 'Defs', 'LinearGradient', 'Stop', 'Line', 'Polygon', 'Text', 'Polyline', 'Ellipse', 'Mask', 'ClipPath', 'Pattern', 'Symbol', 'Use'];
  const map = {};
  for (const t of tags) map[t] = passthrough(t);
  return { __esModule: true, default: passthrough('Svg'), ...map };
});

jest.mock('lucide-react-native', () => {
  const handler = {
    get: (_t, name) => passthrough(`Lucide.${String(name)}`),
  };
  return new Proxy({ __esModule: true }, handler);
});
