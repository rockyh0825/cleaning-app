const React = require('react');
const { View } = require('react-native');

const Canvas = ({ children, ...props }) => React.createElement(View, props, children);
const Group = ({ children, ...props }) => React.createElement(View, props, children);
const Rect = () => null;
const Text = () => null;
const Path = () => null;
const Line = () => null;
const Circle = () => null;
const Fill = () => null;
const useFont = () => null;
const useDerivedValue = (fn) => ({ current: fn() });
const useSharedValue = (val) => ({ current: val });
const useValue = (val) => ({ current: val });
const Skia = { Font: null, Paint: { Make: () => ({}) } };

module.exports = {
  Canvas,
  Group,
  Rect,
  Text,
  Path,
  Line,
  Circle,
  Fill,
  useFont,
  useDerivedValue,
  useSharedValue,
  useValue,
  Skia,
};
