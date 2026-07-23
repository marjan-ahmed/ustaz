const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadNumberTicker() {
  const sourcePath = path.join(__dirname, 'NumberTicker.tsx');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  let insideWorklet = false;
  const module = { exports: {} };

  const react = {
    useCallback(callback) {
      return callback;
    },
    useEffect(effect) {
      effect();
    },
    useRef(value) {
      return { current: value };
    },
    useState(initialValue) {
      let state = typeof initialValue === 'function' ? initialValue() : initialValue;
      const setState = (nextValue) => {
        state = typeof nextValue === 'function' ? nextValue(state) : nextValue;
      };
      return [state, setState];
    },
  };

  const reanimated = {
    __esModule: true,
    default: {
      createAnimatedComponent(component) {
        return `Animated(${component})`;
      },
    },
    Easing: {
      cubic: (value) => value,
      out: (easing) => easing,
    },
    runOnJS(fn) {
      return (...args) => {
        const wasInsideWorklet = insideWorklet;
        insideWorklet = false;
        try {
          return fn(...args);
        } finally {
          insideWorklet = wasInsideWorklet;
        }
      };
    },
    useAnimatedProps(worklet) {
      insideWorklet = true;
      try {
        return worklet();
      } finally {
        insideWorklet = false;
      }
    },
    useAnimatedReaction(prepare, reactToChange) {
      insideWorklet = true;
      try {
        reactToChange(prepare(), null);
      } finally {
        insideWorklet = false;
      }
    },
    useSharedValue(value) {
      return { value };
    },
    withTiming(value) {
      return value;
    },
  };

  function fakeRequire(id) {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') {
      return {
        jsx(type, props) {
          return { type, props: props ?? {} };
        },
        jsxs(type, props) {
          return { type, props: props ?? {} };
        },
      };
    }
    if (id === 'react-native') return { TextInput: 'TextInput' };
    if (id === 'react-native-reanimated') return reanimated;
    throw new Error(`Unexpected import in NumberTicker test: ${id}`);
  }

  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      require: fakeRequire,
    },
    { filename: sourcePath },
  );

  return {
    NumberTicker: module.exports.NumberTicker,
    isInsideWorklet: () => insideWorklet,
  };
}

test('NumberTicker does not call custom formatter inside a Reanimated worklet', () => {
  const runtime = loadNumberTicker();
  const formatterCalls = [];

  runtime.NumberTicker({
    value: 1248,
    formatter(value) {
      formatterCalls.push({ insideWorklet: runtime.isInsideWorklet(), value });
      return `Rs. ${Math.round(value).toLocaleString('en-PK')}`;
    },
  });

  assert.equal(
    formatterCalls.some((call) => call.insideWorklet),
    false,
    'custom formatter must run on the JS runtime, not inside Reanimated animated props',
  );
});
