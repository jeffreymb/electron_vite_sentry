import { is } from "@electron-toolkit/utils";
import { join, dirname as dirname$1, isAbsolute, resolve } from "path";
import { app, screen, powerMonitor, autoUpdater, dialog, crashReporter, net, BrowserWindow, protocol, ipcMain, webContents, session } from "electron";
import { promises, existsSync } from "fs";
import * as urlModule from "url";
import { fileURLToPath, URL as URL$1 } from "url";
import { Readable } from "stream";
import { createGzip } from "zlib";
import { join as join$1, posix, sep } from "node:path";
import * as os from "node:os";
import { isMainThread, threadId } from "worker_threads";
import "module";
import require$$1 from "async_hooks";
import require$$7 from "events";
import { performance } from "perf_hooks";
import * as util from "node:util";
import { promisify } from "node:util";
import { readFile, readdir, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Worker } from "node:worker_threads";
import { execFile } from "node:child_process";
const icon = join(__dirname, "./chunks/icon-CKrYYyr5.png");
const objectToString$1 = Object.prototype.toString;
function isError(wat) {
  switch (objectToString$1.call(wat)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
      return true;
    default:
      return isInstanceOf(wat, Error);
  }
}
function isBuiltin(wat, className) {
  return objectToString$1.call(wat) === `[object ${className}]`;
}
function isErrorEvent$1(wat) {
  return isBuiltin(wat, "ErrorEvent");
}
function isString(wat) {
  return isBuiltin(wat, "String");
}
function isParameterizedString(wat) {
  return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
}
function isPrimitive$1(wat) {
  return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
}
function isPlainObject$1(wat) {
  return isBuiltin(wat, "Object");
}
function isEvent(wat) {
  return typeof Event !== "undefined" && isInstanceOf(wat, Event);
}
function isElement(wat) {
  return typeof Element !== "undefined" && isInstanceOf(wat, Element);
}
function isRegExp(wat) {
  return isBuiltin(wat, "RegExp");
}
function isThenable(wat) {
  return Boolean(wat && wat.then && typeof wat.then === "function");
}
function isSyntheticEvent(wat) {
  return isPlainObject$1(wat) && "nativeEvent" in wat && "preventDefault" in wat && "stopPropagation" in wat;
}
function isInstanceOf(wat, base) {
  try {
    return wat instanceof base;
  } catch (_e) {
    return false;
  }
}
function isVueViewModel(wat) {
  return !!(typeof wat === "object" && wat !== null && (wat.__isVue || wat._isVue));
}
function truncate(str, max = 0) {
  if (typeof str !== "string" || max === 0) {
    return str;
  }
  return str.length <= max ? str : `${str.slice(0, max)}...`;
}
function snipLine(line, colno) {
  let newLine = line;
  const lineLength = newLine.length;
  if (lineLength <= 150) {
    return newLine;
  }
  if (colno > lineLength) {
    colno = lineLength;
  }
  let start = Math.max(colno - 60, 0);
  if (start < 5) {
    start = 0;
  }
  let end = Math.min(start + 140, lineLength);
  if (end > lineLength - 5) {
    end = lineLength;
  }
  if (end === lineLength) {
    start = Math.max(end - 140, 0);
  }
  newLine = newLine.slice(start, end);
  if (start > 0) {
    newLine = `'{snip} ${newLine}`;
  }
  if (end < lineLength) {
    newLine += " {snip}";
  }
  return newLine;
}
function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
  if (!isString(value)) {
    return false;
  }
  if (isRegExp(pattern)) {
    return pattern.test(value);
  }
  if (isString(pattern)) {
    return requireExactStringMatch ? value === pattern : value.includes(pattern);
  }
  return false;
}
function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
  return patterns.some((pattern) => isMatchingPattern(testString, pattern, requireExactStringMatch));
}
function applyAggregateErrorsToEvent(exceptionFromErrorImplementation, parser, maxValueLimit = 250, key, limit, event, hint) {
  if (!event.exception || !event.exception.values || !hint || !isInstanceOf(hint.originalException, Error)) {
    return;
  }
  const originalException = event.exception.values.length > 0 ? event.exception.values[event.exception.values.length - 1] : void 0;
  if (originalException) {
    event.exception.values = truncateAggregateExceptions(
      aggregateExceptionsFromError(
        exceptionFromErrorImplementation,
        parser,
        limit,
        hint.originalException,
        key,
        event.exception.values,
        originalException,
        0
      ),
      maxValueLimit
    );
  }
}
function aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error, key, prevExceptions, exception, exceptionId) {
  if (prevExceptions.length >= limit + 1) {
    return prevExceptions;
  }
  let newExceptions = [...prevExceptions];
  if (isInstanceOf(error[key], Error)) {
    applyExceptionGroupFieldsForParentException(exception, exceptionId);
    const newException = exceptionFromErrorImplementation(parser, error[key]);
    const newExceptionId = newExceptions.length;
    applyExceptionGroupFieldsForChildException(newException, key, newExceptionId, exceptionId);
    newExceptions = aggregateExceptionsFromError(
      exceptionFromErrorImplementation,
      parser,
      limit,
      error[key],
      key,
      [newException, ...newExceptions],
      newException,
      newExceptionId
    );
  }
  if (Array.isArray(error.errors)) {
    error.errors.forEach((childError, i) => {
      if (isInstanceOf(childError, Error)) {
        applyExceptionGroupFieldsForParentException(exception, exceptionId);
        const newException = exceptionFromErrorImplementation(parser, childError);
        const newExceptionId = newExceptions.length;
        applyExceptionGroupFieldsForChildException(newException, `errors[${i}]`, newExceptionId, exceptionId);
        newExceptions = aggregateExceptionsFromError(
          exceptionFromErrorImplementation,
          parser,
          limit,
          childError,
          key,
          [newException, ...newExceptions],
          newException,
          newExceptionId
        );
      }
    });
  }
  return newExceptions;
}
function applyExceptionGroupFieldsForParentException(exception, exceptionId) {
  exception.mechanism = exception.mechanism || { type: "generic", handled: true };
  exception.mechanism = {
    ...exception.mechanism,
    ...exception.type === "AggregateError" && { is_exception_group: true },
    exception_id: exceptionId
  };
}
function applyExceptionGroupFieldsForChildException(exception, source, exceptionId, parentId) {
  exception.mechanism = exception.mechanism || { type: "generic", handled: true };
  exception.mechanism = {
    ...exception.mechanism,
    type: "chained",
    source,
    exception_id: exceptionId,
    parent_id: parentId
  };
}
function truncateAggregateExceptions(exceptions, maxValueLength) {
  return exceptions.map((exception) => {
    if (exception.value) {
      exception.value = truncate(exception.value, maxValueLength);
    }
    return exception;
  });
}
const SDK_VERSION$1 = "8.26.0";
const GLOBAL_OBJ = globalThis;
function getGlobalSingleton(name, creator, obj) {
  const gbl = GLOBAL_OBJ;
  const __SENTRY__ = gbl.__SENTRY__ = gbl.__SENTRY__ || {};
  const versionedCarrier = __SENTRY__[SDK_VERSION$1] = __SENTRY__[SDK_VERSION$1] || {};
  return versionedCarrier[name] || (versionedCarrier[name] = creator());
}
const WINDOW = GLOBAL_OBJ;
const DEFAULT_MAX_STRING_LENGTH = 80;
function htmlTreeAsString(elem, options = {}) {
  if (!elem) {
    return "<unknown>";
  }
  try {
    let currentElem = elem;
    const MAX_TRAVERSE_HEIGHT = 5;
    const out = [];
    let height = 0;
    let len = 0;
    const separator = " > ";
    const sepLength = separator.length;
    let nextStr;
    const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
    const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
    while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
      nextStr = _htmlElementAsString(currentElem, keyAttrs);
      if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
        break;
      }
      out.push(nextStr);
      len += nextStr.length;
      currentElem = currentElem.parentNode;
    }
    return out.reverse().join(separator);
  } catch (_oO) {
    return "<unknown>";
  }
}
function _htmlElementAsString(el, keyAttrs) {
  const elem = el;
  const out = [];
  if (!elem || !elem.tagName) {
    return "";
  }
  if (WINDOW.HTMLElement) {
    if (elem instanceof HTMLElement && elem.dataset) {
      if (elem.dataset["sentryComponent"]) {
        return elem.dataset["sentryComponent"];
      }
      if (elem.dataset["sentryElement"]) {
        return elem.dataset["sentryElement"];
      }
    }
  }
  out.push(elem.tagName.toLowerCase());
  const keyAttrPairs = keyAttrs && keyAttrs.length ? keyAttrs.filter((keyAttr) => elem.getAttribute(keyAttr)).map((keyAttr) => [keyAttr, elem.getAttribute(keyAttr)]) : null;
  if (keyAttrPairs && keyAttrPairs.length) {
    keyAttrPairs.forEach((keyAttrPair) => {
      out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
    });
  } else {
    if (elem.id) {
      out.push(`#${elem.id}`);
    }
    const className = elem.className;
    if (className && isString(className)) {
      const classes = className.split(/\s+/);
      for (const c of classes) {
        out.push(`.${c}`);
      }
    }
  }
  const allowedAttrs = ["aria-label", "type", "name", "title", "alt"];
  for (const k of allowedAttrs) {
    const attr = elem.getAttribute(k);
    if (attr) {
      out.push(`[${k}="${attr}"]`);
    }
  }
  return out.join("");
}
const DEBUG_BUILD$3 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const PREFIX = "Sentry Logger ";
const CONSOLE_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "log",
  "assert",
  "trace"
];
const originalConsoleMethods = {};
function consoleSandbox(callback) {
  if (!("console" in GLOBAL_OBJ)) {
    return callback();
  }
  const console2 = GLOBAL_OBJ.console;
  const wrappedFuncs = {};
  const wrappedLevels = Object.keys(originalConsoleMethods);
  wrappedLevels.forEach((level) => {
    const originalConsoleMethod = originalConsoleMethods[level];
    wrappedFuncs[level] = console2[level];
    console2[level] = originalConsoleMethod;
  });
  try {
    return callback();
  } finally {
    wrappedLevels.forEach((level) => {
      console2[level] = wrappedFuncs[level];
    });
  }
}
function makeLogger() {
  let enabled = false;
  const logger2 = {
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
    },
    isEnabled: () => enabled
  };
  if (DEBUG_BUILD$3) {
    CONSOLE_LEVELS.forEach((name) => {
      logger2[name] = (...args) => {
        if (enabled) {
          consoleSandbox(() => {
            GLOBAL_OBJ.console[name](`${PREFIX}[${name}]:`, ...args);
          });
        }
      };
    });
  } else {
    CONSOLE_LEVELS.forEach((name) => {
      logger2[name] = () => void 0;
    });
  }
  return logger2;
}
const logger = makeLogger();
const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
function isValidProtocol(protocol2) {
  return protocol2 === "http" || protocol2 === "https";
}
function dsnToString(dsn, withPassword = false) {
  const { host, path, pass, port, projectId, protocol: protocol2, publicKey } = dsn;
  return `${protocol2}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path ? `${path}/` : path}${projectId}`;
}
function dsnFromString(str) {
  const match = DSN_REGEX.exec(str);
  if (!match) {
    consoleSandbox(() => {
      console.error(`Invalid Sentry Dsn: ${str}`);
    });
    return void 0;
  }
  const [protocol2, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
  let path = "";
  let projectId = lastPath;
  const split = projectId.split("/");
  if (split.length > 1) {
    path = split.slice(0, -1).join("/");
    projectId = split.pop();
  }
  if (projectId) {
    const projectMatch = projectId.match(/^\d+/);
    if (projectMatch) {
      projectId = projectMatch[0];
    }
  }
  return dsnFromComponents({ host, pass, path, projectId, port, protocol: protocol2, publicKey });
}
function dsnFromComponents(components) {
  return {
    protocol: components.protocol,
    publicKey: components.publicKey || "",
    pass: components.pass || "",
    host: components.host,
    port: components.port || "",
    path: components.path || "",
    projectId: components.projectId
  };
}
function validateDsn(dsn) {
  if (!DEBUG_BUILD$3) {
    return true;
  }
  const { port, projectId, protocol: protocol2 } = dsn;
  const requiredComponents = ["protocol", "publicKey", "host", "projectId"];
  const hasMissingRequiredComponent = requiredComponents.find((component) => {
    if (!dsn[component]) {
      logger.error(`Invalid Sentry Dsn: ${component} missing`);
      return true;
    }
    return false;
  });
  if (hasMissingRequiredComponent) {
    return false;
  }
  if (!projectId.match(/^\d+$/)) {
    logger.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
    return false;
  }
  if (!isValidProtocol(protocol2)) {
    logger.error(`Invalid Sentry Dsn: Invalid protocol ${protocol2}`);
    return false;
  }
  if (port && isNaN(parseInt(port, 10))) {
    logger.error(`Invalid Sentry Dsn: Invalid port ${port}`);
    return false;
  }
  return true;
}
function makeDsn(from) {
  const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
  if (!components || !validateDsn(components)) {
    return void 0;
  }
  return components;
}
class SentryError extends Error {
  /** Display name of this error instance. */
  constructor(message, logLevel = "warn") {
    super(message);
    this.message = message;
    this.name = new.target.prototype.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    this.logLevel = logLevel;
  }
}
function fill(source, name, replacementFactory) {
  if (!(name in source)) {
    return;
  }
  const original = source[name];
  const wrapped = replacementFactory(original);
  if (typeof wrapped === "function") {
    markFunctionWrapped(wrapped, original);
  }
  source[name] = wrapped;
}
function addNonEnumerableProperty(obj, name, value) {
  try {
    Object.defineProperty(obj, name, {
      // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
      value,
      writable: true,
      configurable: true
    });
  } catch (o_O) {
    DEBUG_BUILD$3 && logger.log(`Failed to add non-enumerable property "${name}" to object`, obj);
  }
}
function markFunctionWrapped(wrapped, original) {
  try {
    const proto = original.prototype || {};
    wrapped.prototype = original.prototype = proto;
    addNonEnumerableProperty(wrapped, "__sentry_original__", original);
  } catch (o_O) {
  }
}
function getOriginalFunction(func) {
  return func.__sentry_original__;
}
function urlEncode(object) {
  return Object.keys(object).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`).join("&");
}
function convertToPlainObject(value) {
  if (isError(value)) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
      ...getOwnProperties(value)
    };
  } else if (isEvent(value)) {
    const newObj = {
      type: value.type,
      target: serializeEventTarget(value.target),
      currentTarget: serializeEventTarget(value.currentTarget),
      ...getOwnProperties(value)
    };
    if (typeof CustomEvent !== "undefined" && isInstanceOf(value, CustomEvent)) {
      newObj.detail = value.detail;
    }
    return newObj;
  } else {
    return value;
  }
}
function serializeEventTarget(target) {
  try {
    return isElement(target) ? htmlTreeAsString(target) : Object.prototype.toString.call(target);
  } catch (_oO) {
    return "<unknown>";
  }
}
function getOwnProperties(obj) {
  if (typeof obj === "object" && obj !== null) {
    const extractedProps = {};
    for (const property in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, property)) {
        extractedProps[property] = obj[property];
      }
    }
    return extractedProps;
  } else {
    return {};
  }
}
function extractExceptionKeysForMessage(exception, maxLength = 40) {
  const keys = Object.keys(convertToPlainObject(exception));
  keys.sort();
  const firstKey = keys[0];
  if (!firstKey) {
    return "[object has no keys]";
  }
  if (firstKey.length >= maxLength) {
    return truncate(firstKey, maxLength);
  }
  for (let includedKeys = keys.length; includedKeys > 0; includedKeys--) {
    const serialized = keys.slice(0, includedKeys).join(", ");
    if (serialized.length > maxLength) {
      continue;
    }
    if (includedKeys === keys.length) {
      return serialized;
    }
    return truncate(serialized, maxLength);
  }
  return "";
}
function dropUndefinedKeys(inputValue) {
  const memoizationMap = /* @__PURE__ */ new Map();
  return _dropUndefinedKeys(inputValue, memoizationMap);
}
function _dropUndefinedKeys(inputValue, memoizationMap) {
  if (isPojo(inputValue)) {
    const memoVal = memoizationMap.get(inputValue);
    if (memoVal !== void 0) {
      return memoVal;
    }
    const returnValue = {};
    memoizationMap.set(inputValue, returnValue);
    for (const key of Object.keys(inputValue)) {
      if (typeof inputValue[key] !== "undefined") {
        returnValue[key] = _dropUndefinedKeys(inputValue[key], memoizationMap);
      }
    }
    return returnValue;
  }
  if (Array.isArray(inputValue)) {
    const memoVal = memoizationMap.get(inputValue);
    if (memoVal !== void 0) {
      return memoVal;
    }
    const returnValue = [];
    memoizationMap.set(inputValue, returnValue);
    inputValue.forEach((item) => {
      returnValue.push(_dropUndefinedKeys(item, memoizationMap));
    });
    return returnValue;
  }
  return inputValue;
}
function isPojo(input) {
  if (!isPlainObject$1(input)) {
    return false;
  }
  try {
    const name = Object.getPrototypeOf(input).constructor.name;
    return !name || name === "Object";
  } catch (e) {
    return true;
  }
}
const STACKTRACE_FRAME_LIMIT = 50;
const UNKNOWN_FUNCTION = "?";
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STRIP_FRAME_REGEXP = /captureMessage|captureException/;
function createStackParser(...parsers) {
  const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  return (stack, skipFirstLines = 0, framesToPop = 0) => {
    const frames = [];
    const lines = stack.split("\n");
    for (let i = skipFirstLines; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 1024) {
        continue;
      }
      const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
      if (cleanedLine.match(/\S*Error: /)) {
        continue;
      }
      for (const parser of sortedParsers) {
        const frame = parser(cleanedLine);
        if (frame) {
          frames.push(frame);
          break;
        }
      }
      if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) {
        break;
      }
    }
    return stripSentryFramesAndReverse(frames.slice(framesToPop));
  };
}
function stackParserFromStackParserOptions(stackParser) {
  if (Array.isArray(stackParser)) {
    return createStackParser(...stackParser);
  }
  return stackParser;
}
function stripSentryFramesAndReverse(stack) {
  if (!stack.length) {
    return [];
  }
  const localStack = Array.from(stack);
  if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) {
    localStack.pop();
  }
  localStack.reverse();
  if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
    localStack.pop();
    if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
      localStack.pop();
    }
  }
  return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
    ...frame,
    filename: frame.filename || getLastStackFrame(localStack).filename,
    function: frame.function || UNKNOWN_FUNCTION
  }));
}
function getLastStackFrame(arr) {
  return arr[arr.length - 1] || {};
}
const defaultFunctionName = "<anonymous>";
function getFunctionName(fn) {
  try {
    if (!fn || typeof fn !== "function") {
      return defaultFunctionName;
    }
    return fn.name || defaultFunctionName;
  } catch (e) {
    return defaultFunctionName;
  }
}
const handlers = {};
const instrumented = {};
function addHandler(type, handler) {
  handlers[type] = handlers[type] || [];
  handlers[type].push(handler);
}
function maybeInstrument(type, instrumentFn) {
  if (!instrumented[type]) {
    instrumentFn();
    instrumented[type] = true;
  }
}
function triggerHandlers(type, data) {
  const typeHandlers = type && handlers[type];
  if (!typeHandlers) {
    return;
  }
  for (const handler of typeHandlers) {
    try {
      handler(data);
    } catch (e) {
      DEBUG_BUILD$3 && logger.error(
        `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
        e
      );
    }
  }
}
function addConsoleInstrumentationHandler(handler) {
  const type = "console";
  addHandler(type, handler);
  maybeInstrument(type, instrumentConsole);
}
function instrumentConsole() {
  if (!("console" in GLOBAL_OBJ)) {
    return;
  }
  CONSOLE_LEVELS.forEach(function(level) {
    if (!(level in GLOBAL_OBJ.console)) {
      return;
    }
    fill(GLOBAL_OBJ.console, level, function(originalConsoleMethod) {
      originalConsoleMethods[level] = originalConsoleMethod;
      return function(...args) {
        const handlerData = { args, level };
        triggerHandlers("console", handlerData);
        const log2 = originalConsoleMethods[level];
        log2 && log2.apply(GLOBAL_OBJ.console, args);
      };
    });
  });
}
const ONE_SECOND_IN_MS = 1e3;
function dateTimestampInSeconds() {
  return Date.now() / ONE_SECOND_IN_MS;
}
function createUnixTimestampInSecondsFunc() {
  const { performance: performance2 } = GLOBAL_OBJ;
  if (!performance2 || !performance2.now) {
    return dateTimestampInSeconds;
  }
  const approxStartingTimeOrigin = Date.now() - performance2.now();
  const timeOrigin = performance2.timeOrigin == void 0 ? approxStartingTimeOrigin : performance2.timeOrigin;
  return () => {
    return (timeOrigin + performance2.now()) / ONE_SECOND_IN_MS;
  };
}
const timestampInSeconds = createUnixTimestampInSecondsFunc();
(() => {
  const { performance: performance2 } = GLOBAL_OBJ;
  if (!performance2 || !performance2.now) {
    return void 0;
  }
  const threshold = 3600 * 1e3;
  const performanceNow = performance2.now();
  const dateNow = Date.now();
  const timeOriginDelta = performance2.timeOrigin ? Math.abs(performance2.timeOrigin + performanceNow - dateNow) : threshold;
  const timeOriginIsReliable = timeOriginDelta < threshold;
  const navigationStart = performance2.timing && performance2.timing.navigationStart;
  const hasNavigationStart = typeof navigationStart === "number";
  const navigationStartDelta = hasNavigationStart ? Math.abs(navigationStart + performanceNow - dateNow) : threshold;
  const navigationStartIsReliable = navigationStartDelta < threshold;
  if (timeOriginIsReliable || navigationStartIsReliable) {
    if (timeOriginDelta <= navigationStartDelta) {
      return performance2.timeOrigin;
    } else {
      return navigationStart;
    }
  }
  return dateNow;
})();
let _oldOnErrorHandler = null;
function addGlobalErrorInstrumentationHandler(handler) {
  const type = "error";
  addHandler(type, handler);
  maybeInstrument(type, instrumentError);
}
function instrumentError() {
  _oldOnErrorHandler = GLOBAL_OBJ.onerror;
  GLOBAL_OBJ.onerror = function(msg, url, line, column, error) {
    const handlerData = {
      column,
      error,
      line,
      msg,
      url
    };
    triggerHandlers("error", handlerData);
    if (_oldOnErrorHandler && !_oldOnErrorHandler.__SENTRY_LOADER__) {
      return _oldOnErrorHandler.apply(this, arguments);
    }
    return false;
  };
  GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
}
let _oldOnUnhandledRejectionHandler = null;
function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
  const type = "unhandledrejection";
  addHandler(type, handler);
  maybeInstrument(type, instrumentUnhandledRejection);
}
function instrumentUnhandledRejection() {
  _oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
  GLOBAL_OBJ.onunhandledrejection = function(e) {
    const handlerData = e;
    triggerHandlers("unhandledrejection", handlerData);
    if (_oldOnUnhandledRejectionHandler && !_oldOnUnhandledRejectionHandler.__SENTRY_LOADER__) {
      return _oldOnUnhandledRejectionHandler.apply(this, arguments);
    }
    return true;
  };
  GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
}
function memoBuilder() {
  const hasWeakSet = typeof WeakSet === "function";
  const inner = hasWeakSet ? /* @__PURE__ */ new WeakSet() : [];
  function memoize(obj) {
    if (hasWeakSet) {
      if (inner.has(obj)) {
        return true;
      }
      inner.add(obj);
      return false;
    }
    for (let i = 0; i < inner.length; i++) {
      const value = inner[i];
      if (value === obj) {
        return true;
      }
    }
    inner.push(obj);
    return false;
  }
  function unmemoize(obj) {
    if (hasWeakSet) {
      inner.delete(obj);
    } else {
      for (let i = 0; i < inner.length; i++) {
        if (inner[i] === obj) {
          inner.splice(i, 1);
          break;
        }
      }
    }
  }
  return [memoize, unmemoize];
}
function uuid4() {
  const gbl = GLOBAL_OBJ;
  const crypto = gbl.crypto || gbl.msCrypto;
  let getRandomByte = () => Math.random() * 16;
  try {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }
    if (crypto && crypto.getRandomValues) {
      getRandomByte = () => {
        const typedArray = new Uint8Array(1);
        crypto.getRandomValues(typedArray);
        return typedArray[0];
      };
    }
  } catch (_) {
  }
  return ("10000000100040008000" + 1e11).replace(
    /[018]/g,
    (c) => (
      // eslint-disable-next-line no-bitwise
      (c ^ (getRandomByte() & 15) >> c / 4).toString(16)
    )
  );
}
function getFirstException(event) {
  return event.exception && event.exception.values ? event.exception.values[0] : void 0;
}
function getEventDescription(event) {
  const { message, event_id: eventId } = event;
  if (message) {
    return message;
  }
  const firstException = getFirstException(event);
  if (firstException) {
    if (firstException.type && firstException.value) {
      return `${firstException.type}: ${firstException.value}`;
    }
    return firstException.type || firstException.value || eventId || "<unknown>";
  }
  return eventId || "<unknown>";
}
function addExceptionTypeValue(event, value, type) {
  const exception = event.exception = event.exception || {};
  const values = exception.values = exception.values || [];
  const firstException = values[0] = values[0] || {};
  if (!firstException.value) {
    firstException.value = "";
  }
  if (!firstException.type) {
    firstException.type = "Error";
  }
}
function addExceptionMechanism(event, newMechanism) {
  const firstException = getFirstException(event);
  if (!firstException) {
    return;
  }
  const defaultMechanism = { type: "generic", handled: true };
  const currentMechanism = firstException.mechanism;
  firstException.mechanism = { ...defaultMechanism, ...currentMechanism, ...newMechanism };
  if (newMechanism && "data" in newMechanism) {
    const mergedData = { ...currentMechanism && currentMechanism.data, ...newMechanism.data };
    firstException.mechanism.data = mergedData;
  }
}
const SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
function _parseInt(input) {
  return parseInt(input || "", 10);
}
function parseSemver(input) {
  const match = input.match(SEMVER_REGEXP) || [];
  const major2 = _parseInt(match[1]);
  const minor = _parseInt(match[2]);
  const patch = _parseInt(match[3]);
  return {
    buildmetadata: match[5],
    major: isNaN(major2) ? void 0 : major2,
    minor: isNaN(minor) ? void 0 : minor,
    patch: isNaN(patch) ? void 0 : patch,
    prerelease: match[4]
  };
}
function checkOrSetAlreadyCaught(exception) {
  if (exception && exception.__sentry_captured__) {
    return true;
  }
  try {
    addNonEnumerableProperty(exception, "__sentry_captured__", true);
  } catch (err) {
  }
  return false;
}
function arrayify(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}
function normalize(input, depth = 100, maxProperties = Infinity) {
  try {
    return visit("", input, depth, maxProperties);
  } catch (err) {
    return { ERROR: `**non-serializable** (${err})` };
  }
}
function normalizeToSize(object, depth = 3, maxSize = 100 * 1024) {
  const normalized = normalize(object, depth);
  if (jsonSize(normalized) > maxSize) {
    return normalizeToSize(object, depth - 1, maxSize);
  }
  return normalized;
}
function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
  const [memoize, unmemoize] = memo;
  if (value == null || // this matches null and undefined -> eqeq not eqeqeq
  ["number", "boolean", "string"].includes(typeof value) && !Number.isNaN(value)) {
    return value;
  }
  const stringified = stringifyValue(key, value);
  if (!stringified.startsWith("[object ")) {
    return stringified;
  }
  if (value["__sentry_skip_normalization__"]) {
    return value;
  }
  const remainingDepth = typeof value["__sentry_override_normalization_depth__"] === "number" ? value["__sentry_override_normalization_depth__"] : depth;
  if (remainingDepth === 0) {
    return stringified.replace("object ", "");
  }
  if (memoize(value)) {
    return "[Circular ~]";
  }
  const valueWithToJSON = value;
  if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") {
    try {
      const jsonValue = valueWithToJSON.toJSON();
      return visit("", jsonValue, remainingDepth - 1, maxProperties, memo);
    } catch (err) {
    }
  }
  const normalized = Array.isArray(value) ? [] : {};
  let numAdded = 0;
  const visitable = convertToPlainObject(value);
  for (const visitKey in visitable) {
    if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
      continue;
    }
    if (numAdded >= maxProperties) {
      normalized[visitKey] = "[MaxProperties ~]";
      break;
    }
    const visitValue = visitable[visitKey];
    normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
    numAdded++;
  }
  unmemoize(value);
  return normalized;
}
function stringifyValue(key, value) {
  try {
    if (key === "domain" && value && typeof value === "object" && value._events) {
      return "[Domain]";
    }
    if (key === "domainEmitter") {
      return "[DomainEmitter]";
    }
    if (typeof global !== "undefined" && value === global) {
      return "[Global]";
    }
    if (typeof window !== "undefined" && value === window) {
      return "[Window]";
    }
    if (typeof document !== "undefined" && value === document) {
      return "[Document]";
    }
    if (isVueViewModel(value)) {
      return "[VueViewModel]";
    }
    if (isSyntheticEvent(value)) {
      return "[SyntheticEvent]";
    }
    if (typeof value === "number" && value !== value) {
      return "[NaN]";
    }
    if (typeof value === "function") {
      return `[Function: ${getFunctionName(value)}]`;
    }
    if (typeof value === "symbol") {
      return `[${String(value)}]`;
    }
    if (typeof value === "bigint") {
      return `[BigInt: ${String(value)}]`;
    }
    const objName = getConstructorName(value);
    if (/^HTML(\w*)Element$/.test(objName)) {
      return `[HTMLElement: ${objName}]`;
    }
    return `[object ${objName}]`;
  } catch (err) {
    return `**non-serializable** (${err})`;
  }
}
function getConstructorName(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype ? prototype.constructor.name : "null prototype";
}
function utf8Length(value) {
  return ~-encodeURI(value).split(/%..|./).length;
}
function jsonSize(value) {
  return utf8Length(JSON.stringify(value));
}
function normalizeUrlToBase(url, basePath) {
  const escapedBase = basePath.replace(/\\/g, "/").replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
  let newUrl = url;
  try {
    newUrl = decodeURI(url);
  } catch (_Oo) {
  }
  return newUrl.replace(/\\/g, "/").replace(/webpack:\/?/g, "").replace(new RegExp(`(file://)?/*${escapedBase}/*`, "ig"), "app:///");
}
const splitPathRe = /^(\S+:\\|\/?)([\s\S]*?)((?:\.{1,2}|[^/\\]+?|)(\.[^./\\]*|))(?:[/\\]*)$/;
function splitPath(filename) {
  const truncated = filename.length > 1024 ? `<truncated>${filename.slice(-1024)}` : filename;
  const parts = splitPathRe.exec(truncated);
  return parts ? parts.slice(1) : [];
}
function dirname(path) {
  const result = splitPath(path);
  const root = result[0] || "";
  let dir = result[1];
  if (!root && !dir) {
    return ".";
  }
  if (dir) {
    dir = dir.slice(0, dir.length - 1);
  }
  return root + dir;
}
function basename(path, ext) {
  let f = splitPath(path)[2] || "";
  return f;
}
var States;
(function(States2) {
  const PENDING = 0;
  States2[States2["PENDING"] = PENDING] = "PENDING";
  const RESOLVED = 1;
  States2[States2["RESOLVED"] = RESOLVED] = "RESOLVED";
  const REJECTED = 2;
  States2[States2["REJECTED"] = REJECTED] = "REJECTED";
})(States || (States = {}));
function resolvedSyncPromise(value) {
  return new SyncPromise((resolve2) => {
    resolve2(value);
  });
}
function rejectedSyncPromise(reason) {
  return new SyncPromise((_, reject) => {
    reject(reason);
  });
}
class SyncPromise {
  constructor(executor) {
    SyncPromise.prototype.__init.call(this);
    SyncPromise.prototype.__init2.call(this);
    SyncPromise.prototype.__init3.call(this);
    SyncPromise.prototype.__init4.call(this);
    this._state = States.PENDING;
    this._handlers = [];
    try {
      executor(this._resolve, this._reject);
    } catch (e) {
      this._reject(e);
    }
  }
  /** JSDoc */
  then(onfulfilled, onrejected) {
    return new SyncPromise((resolve2, reject) => {
      this._handlers.push([
        false,
        (result) => {
          if (!onfulfilled) {
            resolve2(result);
          } else {
            try {
              resolve2(onfulfilled(result));
            } catch (e) {
              reject(e);
            }
          }
        },
        (reason) => {
          if (!onrejected) {
            reject(reason);
          } else {
            try {
              resolve2(onrejected(reason));
            } catch (e) {
              reject(e);
            }
          }
        }
      ]);
      this._executeHandlers();
    });
  }
  /** JSDoc */
  catch(onrejected) {
    return this.then((val) => val, onrejected);
  }
  /** JSDoc */
  finally(onfinally) {
    return new SyncPromise((resolve2, reject) => {
      let val;
      let isRejected;
      return this.then(
        (value) => {
          isRejected = false;
          val = value;
          if (onfinally) {
            onfinally();
          }
        },
        (reason) => {
          isRejected = true;
          val = reason;
          if (onfinally) {
            onfinally();
          }
        }
      ).then(() => {
        if (isRejected) {
          reject(val);
          return;
        }
        resolve2(val);
      });
    });
  }
  /** JSDoc */
  __init() {
    this._resolve = (value) => {
      this._setResult(States.RESOLVED, value);
    };
  }
  /** JSDoc */
  __init2() {
    this._reject = (reason) => {
      this._setResult(States.REJECTED, reason);
    };
  }
  /** JSDoc */
  __init3() {
    this._setResult = (state, value) => {
      if (this._state !== States.PENDING) {
        return;
      }
      if (isThenable(value)) {
        void value.then(this._resolve, this._reject);
        return;
      }
      this._state = state;
      this._value = value;
      this._executeHandlers();
    };
  }
  /** JSDoc */
  __init4() {
    this._executeHandlers = () => {
      if (this._state === States.PENDING) {
        return;
      }
      const cachedHandlers = this._handlers.slice();
      this._handlers = [];
      cachedHandlers.forEach((handler) => {
        if (handler[0]) {
          return;
        }
        if (this._state === States.RESOLVED) {
          handler[1](this._value);
        }
        if (this._state === States.REJECTED) {
          handler[2](this._value);
        }
        handler[0] = true;
      });
    };
  }
}
function makePromiseBuffer(limit) {
  const buffer = [];
  function isReady() {
    return limit === void 0 || buffer.length < limit;
  }
  function remove(task) {
    return buffer.splice(buffer.indexOf(task), 1)[0] || Promise.resolve(void 0);
  }
  function add(taskProducer) {
    if (!isReady()) {
      return rejectedSyncPromise(new SentryError("Not adding Promise because buffer limit was reached."));
    }
    const task = taskProducer();
    if (buffer.indexOf(task) === -1) {
      buffer.push(task);
    }
    void task.then(() => remove(task)).then(
      null,
      () => remove(task).then(null, () => {
      })
    );
    return task;
  }
  function drain(timeout) {
    return new SyncPromise((resolve2, reject) => {
      let counter = buffer.length;
      if (!counter) {
        return resolve2(true);
      }
      const capturedSetTimeout = setTimeout(() => {
        if (timeout && timeout > 0) {
          resolve2(false);
        }
      }, timeout);
      buffer.forEach((item) => {
        void resolvedSyncPromise(item).then(() => {
          if (!--counter) {
            clearTimeout(capturedSetTimeout);
            resolve2(true);
          }
        }, reject);
      });
    });
  }
  return {
    $: buffer,
    add,
    drain
  };
}
function parseUrl(url) {
  if (!url) {
    return {};
  }
  const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
  if (!match) {
    return {};
  }
  const query = match[6] || "";
  const fragment = match[8] || "";
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    search: query,
    hash: fragment,
    relative: match[5] + query + fragment
    // everything minus origin
  };
}
function stripUrlQueryAndFragment(urlPath) {
  return urlPath.split(/[?#]/, 1)[0];
}
function getSanitizedUrlString(url) {
  const { protocol: protocol2, host, path } = url;
  const filteredHost = host && host.replace(/^.*@/, "[filtered]:[filtered]@").replace(/(:80)$/, "").replace(/(:443)$/, "") || "";
  return `${protocol2 ? `${protocol2}://` : ""}${filteredHost}${path}`;
}
const validSeverityLevels = ["fatal", "error", "warning", "log", "info", "debug"];
function severityLevelFromString(level) {
  return level === "warn" ? "warning" : validSeverityLevels.includes(level) ? level : "log";
}
function filenameIsInApp(filename, isNative = false) {
  const isInternal = isNative || filename && // It's not internal if it's an absolute linux path
  !filename.startsWith("/") && // It's not internal if it's an absolute windows path
  !filename.match(/^[A-Z]:/) && // It's not internal if the path is starting with a dot
  !filename.startsWith(".") && // It's not internal if the frame has a protocol. In node, this is usually the case if the file got pre-processed with a bundler like webpack
  !filename.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//);
  return !isInternal && filename !== void 0 && !filename.includes("node_modules/");
}
function node(getModule) {
  const FILENAME_MATCH = /^\s*[-]{4,}$/;
  const FULL_MATCH = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/;
  return (line) => {
    const lineMatch = line.match(FULL_MATCH);
    if (lineMatch) {
      let object;
      let method;
      let functionName;
      let typeName;
      let methodName;
      if (lineMatch[1]) {
        functionName = lineMatch[1];
        let methodStart = functionName.lastIndexOf(".");
        if (functionName[methodStart - 1] === ".") {
          methodStart--;
        }
        if (methodStart > 0) {
          object = functionName.slice(0, methodStart);
          method = functionName.slice(methodStart + 1);
          const objectEnd = object.indexOf(".Module");
          if (objectEnd > 0) {
            functionName = functionName.slice(objectEnd + 1);
            object = object.slice(0, objectEnd);
          }
        }
        typeName = void 0;
      }
      if (method) {
        typeName = object;
        methodName = method;
      }
      if (method === "<anonymous>") {
        methodName = void 0;
        functionName = void 0;
      }
      if (functionName === void 0) {
        methodName = methodName || UNKNOWN_FUNCTION;
        functionName = typeName ? `${typeName}.${methodName}` : methodName;
      }
      let filename = lineMatch[2] && lineMatch[2].startsWith("file://") ? lineMatch[2].slice(7) : lineMatch[2];
      const isNative = lineMatch[5] === "native";
      if (filename && filename.match(/\/[A-Z]:/)) {
        filename = filename.slice(1);
      }
      if (!filename && lineMatch[5] && !isNative) {
        filename = lineMatch[5];
      }
      return {
        filename,
        module: getModule ? getModule(filename) : void 0,
        function: functionName,
        lineno: _parseIntOrUndefined(lineMatch[3]),
        colno: _parseIntOrUndefined(lineMatch[4]),
        in_app: filenameIsInApp(filename || "", isNative)
      };
    }
    if (line.match(FILENAME_MATCH)) {
      return {
        filename: line
      };
    }
    return void 0;
  };
}
function nodeStackLineParser(getModule) {
  return [90, node(getModule)];
}
function _parseIntOrUndefined(input) {
  return parseInt(input || "", 10) || void 0;
}
const SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
const SENTRY_BAGGAGE_KEY_PREFIX_REGEX = /^sentry-/;
const MAX_BAGGAGE_STRING_LENGTH = 8192;
function baggageHeaderToDynamicSamplingContext(baggageHeader) {
  const baggageObject = parseBaggageHeader(baggageHeader);
  if (!baggageObject) {
    return void 0;
  }
  const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
    if (key.match(SENTRY_BAGGAGE_KEY_PREFIX_REGEX)) {
      const nonPrefixedKey = key.slice(SENTRY_BAGGAGE_KEY_PREFIX.length);
      acc[nonPrefixedKey] = value;
    }
    return acc;
  }, {});
  if (Object.keys(dynamicSamplingContext).length > 0) {
    return dynamicSamplingContext;
  } else {
    return void 0;
  }
}
function dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext) {
  if (!dynamicSamplingContext) {
    return void 0;
  }
  const sentryPrefixedDSC = Object.entries(dynamicSamplingContext).reduce(
    (acc, [dscKey, dscValue]) => {
      if (dscValue) {
        acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
      }
      return acc;
    },
    {}
  );
  return objectToBaggageHeader(sentryPrefixedDSC);
}
function parseBaggageHeader(baggageHeader) {
  if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) {
    return void 0;
  }
  if (Array.isArray(baggageHeader)) {
    return baggageHeader.reduce((acc, curr) => {
      const currBaggageObject = baggageHeaderToObject(curr);
      Object.entries(currBaggageObject).forEach(([key, value]) => {
        acc[key] = value;
      });
      return acc;
    }, {});
  }
  return baggageHeaderToObject(baggageHeader);
}
function baggageHeaderToObject(baggageHeader) {
  return baggageHeader.split(",").map((baggageEntry) => baggageEntry.split("=").map((keyOrValue) => decodeURIComponent(keyOrValue.trim()))).reduce((acc, [key, value]) => {
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
function objectToBaggageHeader(object) {
  if (Object.keys(object).length === 0) {
    return void 0;
  }
  return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex) => {
    const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
    const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
    if (newBaggageHeader.length > MAX_BAGGAGE_STRING_LENGTH) {
      DEBUG_BUILD$3 && logger.warn(
        `Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`
      );
      return baggageHeader;
    } else {
      return newBaggageHeader;
    }
  }, "");
}
const TRACEPARENT_REGEXP = new RegExp(
  "^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$"
  // whitespace
);
function extractTraceparentData(traceparent) {
  if (!traceparent) {
    return void 0;
  }
  const matches = traceparent.match(TRACEPARENT_REGEXP);
  if (!matches) {
    return void 0;
  }
  let parentSampled;
  if (matches[3] === "1") {
    parentSampled = true;
  } else if (matches[3] === "0") {
    parentSampled = false;
  }
  return {
    traceId: matches[1],
    parentSampled,
    parentSpanId: matches[2]
  };
}
function propagationContextFromHeaders(sentryTrace, baggage) {
  const traceparentData = extractTraceparentData(sentryTrace);
  const dynamicSamplingContext = baggageHeaderToDynamicSamplingContext(baggage);
  const { traceId, parentSpanId, parentSampled } = traceparentData || {};
  if (!traceparentData) {
    return {
      traceId: traceId || uuid4(),
      spanId: uuid4().substring(16)
    };
  } else {
    return {
      traceId: traceId || uuid4(),
      parentSpanId: parentSpanId || uuid4().substring(16),
      spanId: uuid4().substring(16),
      sampled: parentSampled,
      dsc: dynamicSamplingContext || {}
      // If we have traceparent data but no DSC it means we are not head of trace and we must freeze it
    };
  }
}
function generateSentryTraceHeader(traceId = uuid4(), spanId = uuid4().substring(16), sampled) {
  let sampledString = "";
  if (sampled !== void 0) {
    sampledString = sampled ? "-1" : "-0";
  }
  return `${traceId}-${spanId}${sampledString}`;
}
function createEnvelope(headers, items = []) {
  return [headers, items];
}
function addItemToEnvelope(envelope, newItem) {
  const [headers, items] = envelope;
  return [headers, [...items, newItem]];
}
function forEachEnvelopeItem(envelope, callback) {
  const envelopeItems = envelope[1];
  for (const envelopeItem of envelopeItems) {
    const envelopeItemType = envelopeItem[0].type;
    const result = callback(envelopeItem, envelopeItemType);
    if (result) {
      return true;
    }
  }
  return false;
}
function envelopeContainsItemType(envelope, types) {
  return forEachEnvelopeItem(envelope, (_, type) => types.includes(type));
}
function encodeUTF8(input) {
  return GLOBAL_OBJ.__SENTRY__ && GLOBAL_OBJ.__SENTRY__.encodePolyfill ? GLOBAL_OBJ.__SENTRY__.encodePolyfill(input) : new TextEncoder().encode(input);
}
function decodeUTF8(input) {
  return GLOBAL_OBJ.__SENTRY__ && GLOBAL_OBJ.__SENTRY__.decodePolyfill ? GLOBAL_OBJ.__SENTRY__.decodePolyfill(input) : new TextDecoder().decode(input);
}
function serializeEnvelope(envelope) {
  const [envHeaders, items] = envelope;
  let parts = JSON.stringify(envHeaders);
  function append(next) {
    if (typeof parts === "string") {
      parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
    } else {
      parts.push(typeof next === "string" ? encodeUTF8(next) : next);
    }
  }
  for (const item of items) {
    const [itemHeaders, payload] = item;
    append(`
${JSON.stringify(itemHeaders)}
`);
    if (typeof payload === "string" || payload instanceof Uint8Array) {
      append(payload);
    } else {
      let stringifiedPayload;
      try {
        stringifiedPayload = JSON.stringify(payload);
      } catch (e) {
        stringifiedPayload = JSON.stringify(normalize(payload));
      }
      append(stringifiedPayload);
    }
  }
  return typeof parts === "string" ? parts : concatBuffers(parts);
}
function concatBuffers(buffers) {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }
  return merged;
}
function parseEnvelope(env2) {
  let buffer = typeof env2 === "string" ? encodeUTF8(env2) : env2;
  function readBinary(length) {
    const bin = buffer.subarray(0, length);
    buffer = buffer.subarray(length + 1);
    return bin;
  }
  function readJson() {
    let i = buffer.indexOf(10);
    if (i < 0) {
      i = buffer.length;
    }
    return JSON.parse(decodeUTF8(readBinary(i)));
  }
  const envelopeHeader = readJson();
  const items = [];
  while (buffer.length) {
    const itemHeader = readJson();
    const binaryLength = typeof itemHeader.length === "number" ? itemHeader.length : void 0;
    items.push([itemHeader, binaryLength ? readBinary(binaryLength) : readJson()]);
  }
  return [envelopeHeader, items];
}
function createSpanEnvelopeItem(spanJson) {
  const spanHeaders = {
    type: "span"
  };
  return [spanHeaders, spanJson];
}
function createAttachmentEnvelopeItem(attachment) {
  const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
  return [
    dropUndefinedKeys({
      type: "attachment",
      length: buffer.length,
      filename: attachment.filename,
      content_type: attachment.contentType,
      attachment_type: attachment.attachmentType
    }),
    buffer
  ];
}
const ITEM_TYPE_TO_DATA_CATEGORY_MAP = {
  session: "session",
  sessions: "session",
  attachment: "attachment",
  transaction: "transaction",
  event: "error",
  client_report: "internal",
  user_report: "default",
  profile: "profile",
  profile_chunk: "profile",
  replay_event: "replay",
  replay_recording: "replay",
  check_in: "monitor",
  feedback: "feedback",
  span: "span",
  statsd: "metric_bucket"
};
function envelopeItemTypeToDataCategory(type) {
  return ITEM_TYPE_TO_DATA_CATEGORY_MAP[type];
}
function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
  if (!metadataOrEvent || !metadataOrEvent.sdk) {
    return;
  }
  const { name, version: version2 } = metadataOrEvent.sdk;
  return { name, version: version2 };
}
function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
  const dynamicSamplingContext = event.sdkProcessingMetadata && event.sdkProcessingMetadata.dynamicSamplingContext;
  return {
    event_id: event.event_id,
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...sdkInfo && { sdk: sdkInfo },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) },
    ...dynamicSamplingContext && {
      trace: dropUndefinedKeys({ ...dynamicSamplingContext })
    }
  };
}
function createClientReportEnvelope(discarded_events, dsn, timestamp) {
  const clientReportItem = [
    { type: "client_report" },
    {
      timestamp: dateTimestampInSeconds(),
      discarded_events
    }
  ];
  return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
}
const DEFAULT_RETRY_AFTER = 60 * 1e3;
function parseRetryAfterHeader(header, now = Date.now()) {
  const headerDelay = parseInt(`${header}`, 10);
  if (!isNaN(headerDelay)) {
    return headerDelay * 1e3;
  }
  const headerDate = Date.parse(`${header}`);
  if (!isNaN(headerDate)) {
    return headerDate - now;
  }
  return DEFAULT_RETRY_AFTER;
}
function disabledUntil(limits, dataCategory) {
  return limits[dataCategory] || limits.all || 0;
}
function isRateLimited(limits, dataCategory, now = Date.now()) {
  return disabledUntil(limits, dataCategory) > now;
}
function updateRateLimits(limits, { statusCode, headers }, now = Date.now()) {
  const updatedRateLimits = {
    ...limits
  };
  const rateLimitHeader = headers && headers["x-sentry-rate-limits"];
  const retryAfterHeader = headers && headers["retry-after"];
  if (rateLimitHeader) {
    for (const limit of rateLimitHeader.trim().split(",")) {
      const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
      const headerDelay = parseInt(retryAfter, 10);
      const delay2 = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
      if (!categories) {
        updatedRateLimits.all = now + delay2;
      } else {
        for (const category of categories.split(";")) {
          if (category === "metric_bucket") {
            if (!namespaces || namespaces.split(";").includes("custom")) {
              updatedRateLimits[category] = now + delay2;
            }
          } else {
            updatedRateLimits[category] = now + delay2;
          }
        }
      }
    }
  } else if (retryAfterHeader) {
    updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
  } else if (statusCode === 429) {
    updatedRateLimits.all = now + 60 * 1e3;
  }
  return updatedRateLimits;
}
function parseStackFrames(stackParser, error) {
  return stackParser(error.stack || "", 1);
}
function exceptionFromError(stackParser, error) {
  const exception = {
    type: error.name || error.constructor.name,
    value: error.message
  };
  const frames = parseStackFrames(stackParser, error);
  if (frames.length) {
    exception.stacktrace = { frames };
  }
  return exception;
}
function getErrorPropertyFromObject(obj) {
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      const value = obj[prop];
      if (value instanceof Error) {
        return value;
      }
    }
  }
  return void 0;
}
function getMessageForObject(exception) {
  if ("name" in exception && typeof exception.name === "string") {
    let message = `'${exception.name}' captured as exception`;
    if ("message" in exception && typeof exception.message === "string") {
      message += ` with message '${exception.message}'`;
    }
    return message;
  } else if ("message" in exception && typeof exception.message === "string") {
    return exception.message;
  }
  const keys = extractExceptionKeysForMessage(exception);
  if (isErrorEvent$1(exception)) {
    return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
  }
  const className = getObjectClassName(exception);
  return `${className && className !== "Object" ? `'${className}'` : "Object"} captured as exception with keys: ${keys}`;
}
function getObjectClassName(obj) {
  try {
    const prototype = Object.getPrototypeOf(obj);
    return prototype ? prototype.constructor.name : void 0;
  } catch (e) {
  }
}
function getException(client, mechanism, exception, hint) {
  if (isError(exception)) {
    return [exception, void 0];
  }
  mechanism.synthetic = true;
  if (isPlainObject$1(exception)) {
    const normalizeDepth = client && client.getOptions().normalizeDepth;
    const extras = { ["__serialized__"]: normalizeToSize(exception, normalizeDepth) };
    const errorFromProp = getErrorPropertyFromObject(exception);
    if (errorFromProp) {
      return [errorFromProp, extras];
    }
    const message = getMessageForObject(exception);
    const ex2 = hint && hint.syntheticException || new Error(message);
    ex2.message = message;
    return [ex2, extras];
  }
  const ex = hint && hint.syntheticException || new Error(exception);
  ex.message = `${exception}`;
  return [ex, void 0];
}
function eventFromUnknownInput(client, stackParser, exception, hint) {
  const providedMechanism = hint && hint.data && hint.data.mechanism;
  const mechanism = providedMechanism || {
    handled: true,
    type: "generic"
  };
  const [ex, extras] = getException(client, mechanism, exception, hint);
  const event = {
    exception: {
      values: [exceptionFromError(stackParser, ex)]
    }
  };
  if (extras) {
    event.extra = extras;
  }
  addExceptionTypeValue(event);
  addExceptionMechanism(event, mechanism);
  return {
    ...event,
    event_id: hint && hint.event_id
  };
}
function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
  const event = {
    event_id: hint && hint.event_id,
    level
  };
  if (attachStacktrace && hint && hint.syntheticException) {
    const frames = parseStackFrames(stackParser, hint.syntheticException);
    if (frames.length) {
      event.exception = {
        values: [
          {
            value: message,
            stacktrace: { frames }
          }
        ]
      };
    }
  }
  if (isParameterizedString(message)) {
    const { __sentry_template_string__, __sentry_template_values__ } = message;
    event.logentry = {
      message: __sentry_template_string__,
      params: __sentry_template_values__
    };
    return event;
  }
  event.message = message;
  return event;
}
function watchdogTimer(createTimer, pollInterval, anrThreshold, callback) {
  const timer = createTimer();
  let triggered = false;
  let enabled = true;
  setInterval(() => {
    const diffMs = timer.getTimeMs();
    if (triggered === false && diffMs > pollInterval + anrThreshold) {
      triggered = true;
      if (enabled) {
        callback();
      }
    }
    if (diffMs < pollInterval + anrThreshold) {
      triggered = false;
    }
  }, 20);
  return {
    poll: () => {
      timer.reset();
    },
    enabled: (state) => {
      enabled = state;
    }
  };
}
function callFrameToStackFrame(frame, url, getModuleFromFilename) {
  const filename = url ? url.replace(/^file:\/\//, "") : void 0;
  const colno = frame.location.columnNumber ? frame.location.columnNumber + 1 : void 0;
  const lineno = frame.location.lineNumber ? frame.location.lineNumber + 1 : void 0;
  return dropUndefinedKeys({
    filename,
    module: getModuleFromFilename(filename),
    function: frame.functionName || UNKNOWN_FUNCTION,
    colno,
    lineno,
    in_app: filename ? filenameIsInApp(filename) : void 0
  });
}
class LRUMap {
  constructor(_maxSize) {
    this._maxSize = _maxSize;
    this._cache = /* @__PURE__ */ new Map();
  }
  /** Get the current size of the cache */
  get size() {
    return this._cache.size;
  }
  /** Get an entry or undefined if it was not in the cache. Re-inserts to update the recently used order */
  get(key) {
    const value = this._cache.get(key);
    if (value === void 0) {
      return void 0;
    }
    this._cache.delete(key);
    this._cache.set(key, value);
    return value;
  }
  /** Insert an entry and evict an older entry if we've reached maxSize */
  set(key, value) {
    if (this._cache.size >= this._maxSize) {
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(key, value);
  }
  /** Remove an entry and return the entry if it was in the cache */
  remove(key) {
    const value = this._cache.get(key);
    if (value) {
      this._cache.delete(key);
    }
    return value;
  }
  /** Clear all entries */
  clear() {
    this._cache.clear();
  }
  /** Get all the keys */
  keys() {
    return Array.from(this._cache.keys());
  }
  /** Get all the values */
  values() {
    const values = [];
    this._cache.forEach((value) => values.push(value));
    return values;
  }
}
function _nullishCoalesce(lhs, rhsFn) {
  return lhs != null ? lhs : rhsFn();
}
function _optionalChain(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
function generatePropagationContext() {
  return {
    traceId: uuid4(),
    spanId: uuid4().substring(16)
  };
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a2() {
      if (this instanceof a2) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
var _globalThis$1 = typeof globalThis === "object" ? globalThis : global;
var VERSION$2 = "1.9.0";
var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
function _makeCompatibilityCheck(ownVersion) {
  var acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  var rejectedVersions = /* @__PURE__ */ new Set();
  var myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return function() {
      return false;
    };
  }
  var ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v) {
    rejectedVersions.add(v);
    return false;
  }
  function _accept(v) {
    acceptedVersions.add(v);
    return true;
  }
  return function isCompatible2(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    var globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    var globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
var isCompatible = _makeCompatibilityCheck(VERSION$2);
var major = VERSION$2.split(".")[0];
var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for("opentelemetry.js.api." + major);
var _global$1 = _globalThis$1;
function registerGlobal(type, instance, diag2, allowOverride) {
  var _a2;
  if (allowOverride === void 0) {
    allowOverride = false;
  }
  var api = _global$1[GLOBAL_OPENTELEMETRY_API_KEY] = (_a2 = _global$1[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a2 !== void 0 ? _a2 : {
    version: VERSION$2
  };
  if (!allowOverride && api[type]) {
    var err = new Error("@opentelemetry/api: Attempted duplicate registration of API: " + type);
    diag2.error(err.stack || err.message);
    return false;
  }
  if (api.version !== VERSION$2) {
    var err = new Error("@opentelemetry/api: Registration of version v" + api.version + " for " + type + " does not match previously registered API v" + VERSION$2);
    diag2.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag2.debug("@opentelemetry/api: Registered a global for " + type + " v" + VERSION$2 + ".");
  return true;
}
function getGlobal(type) {
  var _a2, _b;
  var globalVersion = (_a2 = _global$1[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a2 === void 0 ? void 0 : _a2.version;
  if (!globalVersion || !isCompatible(globalVersion)) {
    return;
  }
  return (_b = _global$1[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag2) {
  diag2.debug("@opentelemetry/api: Unregistering a global for " + type + " v" + VERSION$2 + ".");
  var api = _global$1[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}
var __read$9 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$5 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var DiagComponentLogger = (
  /** @class */
  function() {
    function DiagComponentLogger2(props) {
      this._namespace = props.namespace || "DiagComponentLogger";
    }
    DiagComponentLogger2.prototype.debug = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("debug", this._namespace, args);
    };
    DiagComponentLogger2.prototype.error = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("error", this._namespace, args);
    };
    DiagComponentLogger2.prototype.info = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("info", this._namespace, args);
    };
    DiagComponentLogger2.prototype.warn = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("warn", this._namespace, args);
    };
    DiagComponentLogger2.prototype.verbose = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("verbose", this._namespace, args);
    };
    return DiagComponentLogger2;
  }()
);
function logProxy(funcName, namespace, args) {
  var logger2 = getGlobal("diag");
  if (!logger2) {
    return;
  }
  args.unshift(namespace);
  return logger2[funcName].apply(logger2, __spreadArray$5([], __read$9(args), false));
}
var DiagLogLevel;
(function(DiagLogLevel2) {
  DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
  DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
  DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
  DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
  DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
  DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
  DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));
function createLogLevelDiagLogger(maxLevel, logger2) {
  if (maxLevel < DiagLogLevel.NONE) {
    maxLevel = DiagLogLevel.NONE;
  } else if (maxLevel > DiagLogLevel.ALL) {
    maxLevel = DiagLogLevel.ALL;
  }
  logger2 = logger2 || {};
  function _filterFunc(funcName, theLevel) {
    var theFunc = logger2[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger2);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", DiagLogLevel.ERROR),
    warn: _filterFunc("warn", DiagLogLevel.WARN),
    info: _filterFunc("info", DiagLogLevel.INFO),
    debug: _filterFunc("debug", DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
  };
}
var __read$8 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$4 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME$4 = "diag";
var DiagAPI = (
  /** @class */
  function() {
    function DiagAPI2() {
      function _logProxy(funcName) {
        return function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          var logger2 = getGlobal("diag");
          if (!logger2)
            return;
          return logger2[funcName].apply(logger2, __spreadArray$4([], __read$8(args), false));
        };
      }
      var self2 = this;
      var setLogger = function(logger2, optionsOrLogLevel) {
        var _a2, _b, _c;
        if (optionsOrLogLevel === void 0) {
          optionsOrLogLevel = { logLevel: DiagLogLevel.INFO };
        }
        if (logger2 === self2) {
          var err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
          self2.error((_a2 = err.stack) !== null && _a2 !== void 0 ? _a2 : err.message);
          return false;
        }
        if (typeof optionsOrLogLevel === "number") {
          optionsOrLogLevel = {
            logLevel: optionsOrLogLevel
          };
        }
        var oldLogger = getGlobal("diag");
        var newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger2);
        if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
          var stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
          oldLogger.warn("Current logger will be overwritten from " + stack);
          newLogger.warn("Current logger will overwrite one already registered from " + stack);
        }
        return registerGlobal("diag", newLogger, self2, true);
      };
      self2.setLogger = setLogger;
      self2.disable = function() {
        unregisterGlobal(API_NAME$4, self2);
      };
      self2.createComponentLogger = function(options) {
        return new DiagComponentLogger(options);
      };
      self2.verbose = _logProxy("verbose");
      self2.debug = _logProxy("debug");
      self2.info = _logProxy("info");
      self2.warn = _logProxy("warn");
      self2.error = _logProxy("error");
    }
    DiagAPI2.instance = function() {
      if (!this._instance) {
        this._instance = new DiagAPI2();
      }
      return this._instance;
    };
    return DiagAPI2;
  }()
);
var __read$7 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __values$4 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var BaggageImpl = (
  /** @class */
  function() {
    function BaggageImpl2(entries) {
      this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
    }
    BaggageImpl2.prototype.getEntry = function(key) {
      var entry = this._entries.get(key);
      if (!entry) {
        return void 0;
      }
      return Object.assign({}, entry);
    };
    BaggageImpl2.prototype.getAllEntries = function() {
      return Array.from(this._entries.entries()).map(function(_a2) {
        var _b = __read$7(_a2, 2), k = _b[0], v = _b[1];
        return [k, v];
      });
    };
    BaggageImpl2.prototype.setEntry = function(key, entry) {
      var newBaggage = new BaggageImpl2(this._entries);
      newBaggage._entries.set(key, entry);
      return newBaggage;
    };
    BaggageImpl2.prototype.removeEntry = function(key) {
      var newBaggage = new BaggageImpl2(this._entries);
      newBaggage._entries.delete(key);
      return newBaggage;
    };
    BaggageImpl2.prototype.removeEntries = function() {
      var e_1, _a2;
      var keys = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        keys[_i] = arguments[_i];
      }
      var newBaggage = new BaggageImpl2(this._entries);
      try {
        for (var keys_1 = __values$4(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
          var key = keys_1_1.value;
          newBaggage._entries.delete(key);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (keys_1_1 && !keys_1_1.done && (_a2 = keys_1.return)) _a2.call(keys_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      return newBaggage;
    };
    BaggageImpl2.prototype.clear = function() {
      return new BaggageImpl2();
    };
    return BaggageImpl2;
  }()
);
var baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
var diag$1 = DiagAPI.instance();
function createBaggage(entries) {
  if (entries === void 0) {
    entries = {};
  }
  return new BaggageImpl(new Map(Object.entries(entries)));
}
function baggageEntryMetadataFromString(str) {
  if (typeof str !== "string") {
    diag$1.error("Cannot create baggage metadata from unknown type: " + typeof str);
    str = "";
  }
  return {
    __TYPE__: baggageEntryMetadataSymbol,
    toString: function() {
      return str;
    }
  };
}
function createContextKey(description) {
  return Symbol.for(description);
}
var BaseContext = (
  /** @class */
  /* @__PURE__ */ function() {
    function BaseContext2(parentContext) {
      var self2 = this;
      self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
      self2.getValue = function(key) {
        return self2._currentContext.get(key);
      };
      self2.setValue = function(key, value) {
        var context2 = new BaseContext2(self2._currentContext);
        context2._currentContext.set(key, value);
        return context2;
      };
      self2.deleteValue = function(key) {
        var context2 = new BaseContext2(self2._currentContext);
        context2._currentContext.delete(key);
        return context2;
      };
    }
    return BaseContext2;
  }()
);
var ROOT_CONTEXT = new BaseContext();
var consoleMap = [
  { n: "error", c: "error" },
  { n: "warn", c: "warn" },
  { n: "info", c: "info" },
  { n: "debug", c: "debug" },
  { n: "verbose", c: "trace" }
];
var DiagConsoleLogger = (
  /** @class */
  /* @__PURE__ */ function() {
    function DiagConsoleLogger2() {
      function _consoleFunc(funcName) {
        return function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          if (console) {
            var theFunc = console[funcName];
            if (typeof theFunc !== "function") {
              theFunc = console.log;
            }
            if (typeof theFunc === "function") {
              return theFunc.apply(console, args);
            }
          }
        };
      }
      for (var i = 0; i < consoleMap.length; i++) {
        this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
      }
    }
    return DiagConsoleLogger2;
  }()
);
var __extends$1 = /* @__PURE__ */ function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var NoopMeter = (
  /** @class */
  function() {
    function NoopMeter2() {
    }
    NoopMeter2.prototype.createGauge = function(_name, _options) {
      return NOOP_GAUGE_METRIC;
    };
    NoopMeter2.prototype.createHistogram = function(_name, _options) {
      return NOOP_HISTOGRAM_METRIC;
    };
    NoopMeter2.prototype.createCounter = function(_name, _options) {
      return NOOP_COUNTER_METRIC;
    };
    NoopMeter2.prototype.createUpDownCounter = function(_name, _options) {
      return NOOP_UP_DOWN_COUNTER_METRIC;
    };
    NoopMeter2.prototype.createObservableGauge = function(_name, _options) {
      return NOOP_OBSERVABLE_GAUGE_METRIC;
    };
    NoopMeter2.prototype.createObservableCounter = function(_name, _options) {
      return NOOP_OBSERVABLE_COUNTER_METRIC;
    };
    NoopMeter2.prototype.createObservableUpDownCounter = function(_name, _options) {
      return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
    };
    NoopMeter2.prototype.addBatchObservableCallback = function(_callback, _observables) {
    };
    NoopMeter2.prototype.removeBatchObservableCallback = function(_callback) {
    };
    return NoopMeter2;
  }()
);
var NoopMetric = (
  /** @class */
  /* @__PURE__ */ function() {
    function NoopMetric2() {
    }
    return NoopMetric2;
  }()
);
var NoopCounterMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopCounterMetric2, _super);
    function NoopCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopCounterMetric2.prototype.add = function(_value, _attributes) {
    };
    return NoopCounterMetric2;
  }(NoopMetric)
);
var NoopUpDownCounterMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopUpDownCounterMetric2, _super);
    function NoopUpDownCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopUpDownCounterMetric2.prototype.add = function(_value, _attributes) {
    };
    return NoopUpDownCounterMetric2;
  }(NoopMetric)
);
var NoopGaugeMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopGaugeMetric2, _super);
    function NoopGaugeMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopGaugeMetric2.prototype.record = function(_value, _attributes) {
    };
    return NoopGaugeMetric2;
  }(NoopMetric)
);
var NoopHistogramMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopHistogramMetric2, _super);
    function NoopHistogramMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopHistogramMetric2.prototype.record = function(_value, _attributes) {
    };
    return NoopHistogramMetric2;
  }(NoopMetric)
);
var NoopObservableMetric = (
  /** @class */
  function() {
    function NoopObservableMetric2() {
    }
    NoopObservableMetric2.prototype.addCallback = function(_callback) {
    };
    NoopObservableMetric2.prototype.removeCallback = function(_callback) {
    };
    return NoopObservableMetric2;
  }()
);
var NoopObservableCounterMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopObservableCounterMetric2, _super);
    function NoopObservableCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoopObservableCounterMetric2;
  }(NoopObservableMetric)
);
var NoopObservableGaugeMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopObservableGaugeMetric2, _super);
    function NoopObservableGaugeMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoopObservableGaugeMetric2;
  }(NoopObservableMetric)
);
var NoopObservableUpDownCounterMetric = (
  /** @class */
  function(_super) {
    __extends$1(NoopObservableUpDownCounterMetric2, _super);
    function NoopObservableUpDownCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoopObservableUpDownCounterMetric2;
  }(NoopObservableMetric)
);
var NOOP_METER = new NoopMeter();
var NOOP_COUNTER_METRIC = new NoopCounterMetric();
var NOOP_GAUGE_METRIC = new NoopGaugeMetric();
var NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
var NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
var NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
var NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
var NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
function createNoopMeter() {
  return NOOP_METER;
}
var ValueType;
(function(ValueType2) {
  ValueType2[ValueType2["INT"] = 0] = "INT";
  ValueType2[ValueType2["DOUBLE"] = 1] = "DOUBLE";
})(ValueType || (ValueType = {}));
var defaultTextMapGetter = {
  get: function(carrier, key) {
    if (carrier == null) {
      return void 0;
    }
    return carrier[key];
  },
  keys: function(carrier) {
    if (carrier == null) {
      return [];
    }
    return Object.keys(carrier);
  }
};
var defaultTextMapSetter = {
  set: function(carrier, key, value) {
    if (carrier == null) {
      return;
    }
    carrier[key] = value;
  }
};
var __read$6 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$3 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var NoopContextManager = (
  /** @class */
  function() {
    function NoopContextManager2() {
    }
    NoopContextManager2.prototype.active = function() {
      return ROOT_CONTEXT;
    };
    NoopContextManager2.prototype.with = function(_context, fn, thisArg) {
      var args = [];
      for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
      }
      return fn.call.apply(fn, __spreadArray$3([thisArg], __read$6(args), false));
    };
    NoopContextManager2.prototype.bind = function(_context, target) {
      return target;
    };
    NoopContextManager2.prototype.enable = function() {
      return this;
    };
    NoopContextManager2.prototype.disable = function() {
      return this;
    };
    return NoopContextManager2;
  }()
);
var __read$5 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$2 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME$3 = "context";
var NOOP_CONTEXT_MANAGER = new NoopContextManager();
var ContextAPI = (
  /** @class */
  function() {
    function ContextAPI2() {
    }
    ContextAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new ContextAPI2();
      }
      return this._instance;
    };
    ContextAPI2.prototype.setGlobalContextManager = function(contextManager) {
      return registerGlobal(API_NAME$3, contextManager, DiagAPI.instance());
    };
    ContextAPI2.prototype.active = function() {
      return this._getContextManager().active();
    };
    ContextAPI2.prototype.with = function(context2, fn, thisArg) {
      var _a2;
      var args = [];
      for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
      }
      return (_a2 = this._getContextManager()).with.apply(_a2, __spreadArray$2([context2, fn, thisArg], __read$5(args), false));
    };
    ContextAPI2.prototype.bind = function(context2, target) {
      return this._getContextManager().bind(context2, target);
    };
    ContextAPI2.prototype._getContextManager = function() {
      return getGlobal(API_NAME$3) || NOOP_CONTEXT_MANAGER;
    };
    ContextAPI2.prototype.disable = function() {
      this._getContextManager().disable();
      unregisterGlobal(API_NAME$3, DiagAPI.instance());
    };
    return ContextAPI2;
  }()
);
var TraceFlags;
(function(TraceFlags2) {
  TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
  TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));
var INVALID_SPANID = "0000000000000000";
var INVALID_TRACEID = "00000000000000000000000000000000";
var INVALID_SPAN_CONTEXT = {
  traceId: INVALID_TRACEID,
  spanId: INVALID_SPANID,
  traceFlags: TraceFlags.NONE
};
var NonRecordingSpan = (
  /** @class */
  function() {
    function NonRecordingSpan2(_spanContext) {
      if (_spanContext === void 0) {
        _spanContext = INVALID_SPAN_CONTEXT;
      }
      this._spanContext = _spanContext;
    }
    NonRecordingSpan2.prototype.spanContext = function() {
      return this._spanContext;
    };
    NonRecordingSpan2.prototype.setAttribute = function(_key, _value) {
      return this;
    };
    NonRecordingSpan2.prototype.setAttributes = function(_attributes) {
      return this;
    };
    NonRecordingSpan2.prototype.addEvent = function(_name, _attributes) {
      return this;
    };
    NonRecordingSpan2.prototype.addLink = function(_link) {
      return this;
    };
    NonRecordingSpan2.prototype.addLinks = function(_links) {
      return this;
    };
    NonRecordingSpan2.prototype.setStatus = function(_status) {
      return this;
    };
    NonRecordingSpan2.prototype.updateName = function(_name) {
      return this;
    };
    NonRecordingSpan2.prototype.end = function(_endTime) {
    };
    NonRecordingSpan2.prototype.isRecording = function() {
      return false;
    };
    NonRecordingSpan2.prototype.recordException = function(_exception, _time) {
    };
    return NonRecordingSpan2;
  }()
);
var SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
function getSpan(context2) {
  return context2.getValue(SPAN_KEY) || void 0;
}
function getActiveSpan$2() {
  return getSpan(ContextAPI.getInstance().active());
}
function setSpan(context2, span) {
  return context2.setValue(SPAN_KEY, span);
}
function deleteSpan(context2) {
  return context2.deleteValue(SPAN_KEY);
}
function setSpanContext(context2, spanContext) {
  return setSpan(context2, new NonRecordingSpan(spanContext));
}
function getSpanContext(context2) {
  var _a2;
  return (_a2 = getSpan(context2)) === null || _a2 === void 0 ? void 0 : _a2.spanContext();
}
var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
function isValidTraceId(traceId) {
  return VALID_TRACEID_REGEX.test(traceId) && traceId !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
  return VALID_SPANID_REGEX.test(spanId) && spanId !== INVALID_SPANID;
}
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan(spanContext);
}
var contextApi = ContextAPI.getInstance();
var NoopTracer = (
  /** @class */
  function() {
    function NoopTracer2() {
    }
    NoopTracer2.prototype.startSpan = function(name, options, context2) {
      if (context2 === void 0) {
        context2 = contextApi.active();
      }
      var root = Boolean(options === null || options === void 0 ? void 0 : options.root);
      if (root) {
        return new NonRecordingSpan();
      }
      var parentFromContext = context2 && getSpanContext(context2);
      if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) {
        return new NonRecordingSpan(parentFromContext);
      } else {
        return new NonRecordingSpan();
      }
    };
    NoopTracer2.prototype.startActiveSpan = function(name, arg2, arg3, arg4) {
      var opts;
      var ctx;
      var fn;
      if (arguments.length < 2) {
        return;
      } else if (arguments.length === 2) {
        fn = arg2;
      } else if (arguments.length === 3) {
        opts = arg2;
        fn = arg3;
      } else {
        opts = arg2;
        ctx = arg3;
        fn = arg4;
      }
      var parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
      var span = this.startSpan(name, opts, parentContext);
      var contextWithSpanSet = setSpan(parentContext, span);
      return contextApi.with(contextWithSpanSet, fn, void 0, span);
    };
    return NoopTracer2;
  }()
);
function isSpanContext(spanContext) {
  return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
}
var NOOP_TRACER = new NoopTracer();
var ProxyTracer = (
  /** @class */
  function() {
    function ProxyTracer2(_provider, name, version2, options) {
      this._provider = _provider;
      this.name = name;
      this.version = version2;
      this.options = options;
    }
    ProxyTracer2.prototype.startSpan = function(name, options, context2) {
      return this._getTracer().startSpan(name, options, context2);
    };
    ProxyTracer2.prototype.startActiveSpan = function(_name, _options, _context, _fn) {
      var tracer = this._getTracer();
      return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
    };
    ProxyTracer2.prototype._getTracer = function() {
      if (this._delegate) {
        return this._delegate;
      }
      var tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
      if (!tracer) {
        return NOOP_TRACER;
      }
      this._delegate = tracer;
      return this._delegate;
    };
    return ProxyTracer2;
  }()
);
var NoopTracerProvider = (
  /** @class */
  function() {
    function NoopTracerProvider2() {
    }
    NoopTracerProvider2.prototype.getTracer = function(_name, _version, _options) {
      return new NoopTracer();
    };
    return NoopTracerProvider2;
  }()
);
var NOOP_TRACER_PROVIDER = new NoopTracerProvider();
var ProxyTracerProvider = (
  /** @class */
  function() {
    function ProxyTracerProvider2() {
    }
    ProxyTracerProvider2.prototype.getTracer = function(name, version2, options) {
      var _a2;
      return (_a2 = this.getDelegateTracer(name, version2, options)) !== null && _a2 !== void 0 ? _a2 : new ProxyTracer(this, name, version2, options);
    };
    ProxyTracerProvider2.prototype.getDelegate = function() {
      var _a2;
      return (_a2 = this._delegate) !== null && _a2 !== void 0 ? _a2 : NOOP_TRACER_PROVIDER;
    };
    ProxyTracerProvider2.prototype.setDelegate = function(delegate) {
      this._delegate = delegate;
    };
    ProxyTracerProvider2.prototype.getDelegateTracer = function(name, version2, options) {
      var _a2;
      return (_a2 = this._delegate) === null || _a2 === void 0 ? void 0 : _a2.getTracer(name, version2, options);
    };
    return ProxyTracerProvider2;
  }()
);
var SamplingDecision$1;
(function(SamplingDecision2) {
  SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
  SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision$1 || (SamplingDecision$1 = {}));
var SpanKind;
(function(SpanKind2) {
  SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
  SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
  SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
  SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
  SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));
var SpanStatusCode;
(function(SpanStatusCode2) {
  SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
  SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
  SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));
var VALID_KEY_CHAR_RANGE$1 = "[_0-9a-z-*/]";
var VALID_KEY$1 = "[a-z]" + VALID_KEY_CHAR_RANGE$1 + "{0,255}";
var VALID_VENDOR_KEY$1 = "[a-z0-9]" + VALID_KEY_CHAR_RANGE$1 + "{0,240}@[a-z]" + VALID_KEY_CHAR_RANGE$1 + "{0,13}";
var VALID_KEY_REGEX$1 = new RegExp("^(?:" + VALID_KEY$1 + "|" + VALID_VENDOR_KEY$1 + ")$");
var VALID_VALUE_BASE_REGEX$1 = /^[ -~]{0,255}[!-~]$/;
var INVALID_VALUE_COMMA_EQUAL_REGEX$1 = /,|=/;
function validateKey$1(key) {
  return VALID_KEY_REGEX$1.test(key);
}
function validateValue$1(value) {
  return VALID_VALUE_BASE_REGEX$1.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX$1.test(value);
}
var MAX_TRACE_STATE_ITEMS$1 = 32;
var MAX_TRACE_STATE_LEN$1 = 512;
var LIST_MEMBERS_SEPARATOR$1 = ",";
var LIST_MEMBER_KEY_VALUE_SPLITTER$1 = "=";
var TraceStateImpl = (
  /** @class */
  function() {
    function TraceStateImpl2(rawTraceState) {
      this._internalState = /* @__PURE__ */ new Map();
      if (rawTraceState)
        this._parse(rawTraceState);
    }
    TraceStateImpl2.prototype.set = function(key, value) {
      var traceState = this._clone();
      if (traceState._internalState.has(key)) {
        traceState._internalState.delete(key);
      }
      traceState._internalState.set(key, value);
      return traceState;
    };
    TraceStateImpl2.prototype.unset = function(key) {
      var traceState = this._clone();
      traceState._internalState.delete(key);
      return traceState;
    };
    TraceStateImpl2.prototype.get = function(key) {
      return this._internalState.get(key);
    };
    TraceStateImpl2.prototype.serialize = function() {
      var _this = this;
      return this._keys().reduce(function(agg, key) {
        agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER$1 + _this.get(key));
        return agg;
      }, []).join(LIST_MEMBERS_SEPARATOR$1);
    };
    TraceStateImpl2.prototype._parse = function(rawTraceState) {
      if (rawTraceState.length > MAX_TRACE_STATE_LEN$1)
        return;
      this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR$1).reverse().reduce(function(agg, part) {
        var listMember = part.trim();
        var i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER$1);
        if (i !== -1) {
          var key = listMember.slice(0, i);
          var value = listMember.slice(i + 1, part.length);
          if (validateKey$1(key) && validateValue$1(value)) {
            agg.set(key, value);
          }
        }
        return agg;
      }, /* @__PURE__ */ new Map());
      if (this._internalState.size > MAX_TRACE_STATE_ITEMS$1) {
        this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS$1));
      }
    };
    TraceStateImpl2.prototype._keys = function() {
      return Array.from(this._internalState.keys()).reverse();
    };
    TraceStateImpl2.prototype._clone = function() {
      var traceState = new TraceStateImpl2();
      traceState._internalState = new Map(this._internalState);
      return traceState;
    };
    return TraceStateImpl2;
  }()
);
function createTraceState(rawTraceState) {
  return new TraceStateImpl(rawTraceState);
}
var context = ContextAPI.getInstance();
var diag = DiagAPI.instance();
var NoopMeterProvider = (
  /** @class */
  function() {
    function NoopMeterProvider2() {
    }
    NoopMeterProvider2.prototype.getMeter = function(_name, _version, _options) {
      return NOOP_METER;
    };
    return NoopMeterProvider2;
  }()
);
var NOOP_METER_PROVIDER = new NoopMeterProvider();
var API_NAME$2 = "metrics";
var MetricsAPI = (
  /** @class */
  function() {
    function MetricsAPI2() {
    }
    MetricsAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new MetricsAPI2();
      }
      return this._instance;
    };
    MetricsAPI2.prototype.setGlobalMeterProvider = function(provider) {
      return registerGlobal(API_NAME$2, provider, DiagAPI.instance());
    };
    MetricsAPI2.prototype.getMeterProvider = function() {
      return getGlobal(API_NAME$2) || NOOP_METER_PROVIDER;
    };
    MetricsAPI2.prototype.getMeter = function(name, version2, options) {
      return this.getMeterProvider().getMeter(name, version2, options);
    };
    MetricsAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME$2, DiagAPI.instance());
    };
    return MetricsAPI2;
  }()
);
var metrics$1 = MetricsAPI.getInstance();
var NoopTextMapPropagator = (
  /** @class */
  function() {
    function NoopTextMapPropagator2() {
    }
    NoopTextMapPropagator2.prototype.inject = function(_context, _carrier) {
    };
    NoopTextMapPropagator2.prototype.extract = function(context2, _carrier) {
      return context2;
    };
    NoopTextMapPropagator2.prototype.fields = function() {
      return [];
    };
    return NoopTextMapPropagator2;
  }()
);
var BAGGAGE_KEY = createContextKey("OpenTelemetry Baggage Key");
function getBaggage(context2) {
  return context2.getValue(BAGGAGE_KEY) || void 0;
}
function getActiveBaggage() {
  return getBaggage(ContextAPI.getInstance().active());
}
function setBaggage(context2, baggage) {
  return context2.setValue(BAGGAGE_KEY, baggage);
}
function deleteBaggage(context2) {
  return context2.deleteValue(BAGGAGE_KEY);
}
var API_NAME$1 = "propagation";
var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
var PropagationAPI = (
  /** @class */
  function() {
    function PropagationAPI2() {
      this.createBaggage = createBaggage;
      this.getBaggage = getBaggage;
      this.getActiveBaggage = getActiveBaggage;
      this.setBaggage = setBaggage;
      this.deleteBaggage = deleteBaggage;
    }
    PropagationAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new PropagationAPI2();
      }
      return this._instance;
    };
    PropagationAPI2.prototype.setGlobalPropagator = function(propagator) {
      return registerGlobal(API_NAME$1, propagator, DiagAPI.instance());
    };
    PropagationAPI2.prototype.inject = function(context2, carrier, setter) {
      if (setter === void 0) {
        setter = defaultTextMapSetter;
      }
      return this._getGlobalPropagator().inject(context2, carrier, setter);
    };
    PropagationAPI2.prototype.extract = function(context2, carrier, getter) {
      if (getter === void 0) {
        getter = defaultTextMapGetter;
      }
      return this._getGlobalPropagator().extract(context2, carrier, getter);
    };
    PropagationAPI2.prototype.fields = function() {
      return this._getGlobalPropagator().fields();
    };
    PropagationAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME$1, DiagAPI.instance());
    };
    PropagationAPI2.prototype._getGlobalPropagator = function() {
      return getGlobal(API_NAME$1) || NOOP_TEXT_MAP_PROPAGATOR;
    };
    return PropagationAPI2;
  }()
);
var propagation = PropagationAPI.getInstance();
var API_NAME = "trace";
var TraceAPI = (
  /** @class */
  function() {
    function TraceAPI2() {
      this._proxyTracerProvider = new ProxyTracerProvider();
      this.wrapSpanContext = wrapSpanContext;
      this.isSpanContextValid = isSpanContextValid;
      this.deleteSpan = deleteSpan;
      this.getSpan = getSpan;
      this.getActiveSpan = getActiveSpan$2;
      this.getSpanContext = getSpanContext;
      this.setSpan = setSpan;
      this.setSpanContext = setSpanContext;
    }
    TraceAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new TraceAPI2();
      }
      return this._instance;
    };
    TraceAPI2.prototype.setGlobalTracerProvider = function(provider) {
      var success = registerGlobal(API_NAME, this._proxyTracerProvider, DiagAPI.instance());
      if (success) {
        this._proxyTracerProvider.setDelegate(provider);
      }
      return success;
    };
    TraceAPI2.prototype.getTracerProvider = function() {
      return getGlobal(API_NAME) || this._proxyTracerProvider;
    };
    TraceAPI2.prototype.getTracer = function(name, version2) {
      return this.getTracerProvider().getTracer(name, version2);
    };
    TraceAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME, DiagAPI.instance());
      this._proxyTracerProvider = new ProxyTracerProvider();
    };
    return TraceAPI2;
  }()
);
var trace = TraceAPI.getInstance();
const index = {
  context,
  diag,
  metrics: metrics$1,
  propagation,
  trace
};
const esm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DiagConsoleLogger,
  get DiagLogLevel() {
    return DiagLogLevel;
  },
  INVALID_SPANID,
  INVALID_SPAN_CONTEXT,
  INVALID_TRACEID,
  ProxyTracer,
  ProxyTracerProvider,
  ROOT_CONTEXT,
  get SamplingDecision() {
    return SamplingDecision$1;
  },
  get SpanKind() {
    return SpanKind;
  },
  get SpanStatusCode() {
    return SpanStatusCode;
  },
  get TraceFlags() {
    return TraceFlags;
  },
  get ValueType() {
    return ValueType;
  },
  baggageEntryMetadataFromString,
  context,
  createContextKey,
  createNoopMeter,
  createTraceState,
  default: index,
  defaultTextMapGetter,
  defaultTextMapSetter,
  diag,
  isSpanContextValid,
  isValidSpanId,
  isValidTraceId,
  metrics: metrics$1,
  propagation,
  trace
}, Symbol.toStringTag, { value: "Module" }));
const require$$2 = /* @__PURE__ */ getAugmentedNamespace(esm);
var NoopLogger = (
  /** @class */
  function() {
    function NoopLogger2() {
    }
    NoopLogger2.prototype.emit = function(_logRecord) {
    };
    return NoopLogger2;
  }()
);
var NoopLoggerProvider = (
  /** @class */
  function() {
    function NoopLoggerProvider2() {
    }
    NoopLoggerProvider2.prototype.getLogger = function(_name, _version, _options) {
      return new NoopLogger();
    };
    return NoopLoggerProvider2;
  }()
);
var NOOP_LOGGER_PROVIDER = new NoopLoggerProvider();
var _globalThis = typeof globalThis === "object" ? globalThis : global;
var GLOBAL_LOGS_API_KEY = Symbol.for("io.opentelemetry.js.api.logs");
var _global = _globalThis;
function makeGetter(requiredVersion, instance, fallback) {
  return function(version2) {
    return version2 === requiredVersion ? instance : fallback;
  };
}
var API_BACKWARDS_COMPATIBILITY_VERSION = 1;
var LogsAPI = (
  /** @class */
  function() {
    function LogsAPI2() {
    }
    LogsAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new LogsAPI2();
      }
      return this._instance;
    };
    LogsAPI2.prototype.setGlobalLoggerProvider = function(provider) {
      if (_global[GLOBAL_LOGS_API_KEY]) {
        return this.getLoggerProvider();
      }
      _global[GLOBAL_LOGS_API_KEY] = makeGetter(API_BACKWARDS_COMPATIBILITY_VERSION, provider, NOOP_LOGGER_PROVIDER);
      return provider;
    };
    LogsAPI2.prototype.getLoggerProvider = function() {
      var _a2, _b;
      return (_b = (_a2 = _global[GLOBAL_LOGS_API_KEY]) === null || _a2 === void 0 ? void 0 : _a2.call(_global, API_BACKWARDS_COMPATIBILITY_VERSION)) !== null && _b !== void 0 ? _b : NOOP_LOGGER_PROVIDER;
    };
    LogsAPI2.prototype.getLogger = function(name, version2, options) {
      return this.getLoggerProvider().getLogger(name, version2, options);
    };
    LogsAPI2.prototype.disable = function() {
      delete _global[GLOBAL_LOGS_API_KEY];
    };
    return LogsAPI2;
  }()
);
var logs = LogsAPI.getInstance();
function enableInstrumentations(instrumentations, tracerProvider, meterProvider, loggerProvider) {
  for (var i = 0, j = instrumentations.length; i < j; i++) {
    var instrumentation = instrumentations[i];
    if (tracerProvider) {
      instrumentation.setTracerProvider(tracerProvider);
    }
    if (meterProvider) {
      instrumentation.setMeterProvider(meterProvider);
    }
    if (loggerProvider && instrumentation.setLoggerProvider) {
      instrumentation.setLoggerProvider(loggerProvider);
    }
    if (!instrumentation.getConfig().enabled) {
      instrumentation.enable();
    }
  }
}
function disableInstrumentations(instrumentations) {
  instrumentations.forEach(function(instrumentation) {
    return instrumentation.disable();
  });
}
function registerInstrumentations(options) {
  var _a2, _b;
  var tracerProvider = options.tracerProvider || trace.getTracerProvider();
  var meterProvider = options.meterProvider || metrics$1.getMeterProvider();
  var loggerProvider = options.loggerProvider || logs.getLoggerProvider();
  var instrumentations = (_b = (_a2 = options.instrumentations) === null || _a2 === void 0 ? void 0 : _a2.flat()) !== null && _b !== void 0 ? _b : [];
  enableInstrumentations(instrumentations, tracerProvider, meterProvider, loggerProvider);
  return function() {
    disableInstrumentations(instrumentations);
  };
}
// @__NO_SIDE_EFFECTS__
function createConstMap(values) {
  var res = {};
  var len = values.length;
  for (var lp = 0; lp < len; lp++) {
    var val = values[lp];
    if (val) {
      res[String(val).toUpperCase().replace(/[-.]/g, "_")] = val;
    }
  }
  return res;
}
var TMP_AWS_LAMBDA_INVOKED_ARN = "aws.lambda.invoked_arn";
var TMP_DB_SYSTEM = "db.system";
var TMP_DB_CONNECTION_STRING = "db.connection_string";
var TMP_DB_USER = "db.user";
var TMP_DB_JDBC_DRIVER_CLASSNAME = "db.jdbc.driver_classname";
var TMP_DB_NAME = "db.name";
var TMP_DB_STATEMENT = "db.statement";
var TMP_DB_OPERATION = "db.operation";
var TMP_DB_MSSQL_INSTANCE_NAME = "db.mssql.instance_name";
var TMP_DB_CASSANDRA_KEYSPACE = "db.cassandra.keyspace";
var TMP_DB_CASSANDRA_PAGE_SIZE = "db.cassandra.page_size";
var TMP_DB_CASSANDRA_CONSISTENCY_LEVEL = "db.cassandra.consistency_level";
var TMP_DB_CASSANDRA_TABLE = "db.cassandra.table";
var TMP_DB_CASSANDRA_IDEMPOTENCE = "db.cassandra.idempotence";
var TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = "db.cassandra.speculative_execution_count";
var TMP_DB_CASSANDRA_COORDINATOR_ID = "db.cassandra.coordinator.id";
var TMP_DB_CASSANDRA_COORDINATOR_DC = "db.cassandra.coordinator.dc";
var TMP_DB_HBASE_NAMESPACE = "db.hbase.namespace";
var TMP_DB_REDIS_DATABASE_INDEX = "db.redis.database_index";
var TMP_DB_MONGODB_COLLECTION = "db.mongodb.collection";
var TMP_DB_SQL_TABLE = "db.sql.table";
var TMP_EXCEPTION_TYPE = "exception.type";
var TMP_EXCEPTION_MESSAGE = "exception.message";
var TMP_EXCEPTION_STACKTRACE = "exception.stacktrace";
var TMP_EXCEPTION_ESCAPED = "exception.escaped";
var TMP_FAAS_TRIGGER = "faas.trigger";
var TMP_FAAS_EXECUTION = "faas.execution";
var TMP_FAAS_DOCUMENT_COLLECTION = "faas.document.collection";
var TMP_FAAS_DOCUMENT_OPERATION = "faas.document.operation";
var TMP_FAAS_DOCUMENT_TIME = "faas.document.time";
var TMP_FAAS_DOCUMENT_NAME = "faas.document.name";
var TMP_FAAS_TIME = "faas.time";
var TMP_FAAS_CRON = "faas.cron";
var TMP_FAAS_COLDSTART = "faas.coldstart";
var TMP_FAAS_INVOKED_NAME = "faas.invoked_name";
var TMP_FAAS_INVOKED_PROVIDER = "faas.invoked_provider";
var TMP_FAAS_INVOKED_REGION = "faas.invoked_region";
var TMP_NET_TRANSPORT = "net.transport";
var TMP_NET_PEER_IP = "net.peer.ip";
var TMP_NET_PEER_PORT = "net.peer.port";
var TMP_NET_PEER_NAME = "net.peer.name";
var TMP_NET_HOST_IP = "net.host.ip";
var TMP_NET_HOST_PORT = "net.host.port";
var TMP_NET_HOST_NAME = "net.host.name";
var TMP_NET_HOST_CONNECTION_TYPE = "net.host.connection.type";
var TMP_NET_HOST_CONNECTION_SUBTYPE = "net.host.connection.subtype";
var TMP_NET_HOST_CARRIER_NAME = "net.host.carrier.name";
var TMP_NET_HOST_CARRIER_MCC = "net.host.carrier.mcc";
var TMP_NET_HOST_CARRIER_MNC = "net.host.carrier.mnc";
var TMP_NET_HOST_CARRIER_ICC = "net.host.carrier.icc";
var TMP_PEER_SERVICE = "peer.service";
var TMP_ENDUSER_ID = "enduser.id";
var TMP_ENDUSER_ROLE = "enduser.role";
var TMP_ENDUSER_SCOPE = "enduser.scope";
var TMP_THREAD_ID = "thread.id";
var TMP_THREAD_NAME = "thread.name";
var TMP_CODE_FUNCTION = "code.function";
var TMP_CODE_NAMESPACE = "code.namespace";
var TMP_CODE_FILEPATH = "code.filepath";
var TMP_CODE_LINENO = "code.lineno";
var TMP_HTTP_METHOD = "http.method";
var TMP_HTTP_URL = "http.url";
var TMP_HTTP_TARGET = "http.target";
var TMP_HTTP_HOST = "http.host";
var TMP_HTTP_SCHEME = "http.scheme";
var TMP_HTTP_STATUS_CODE = "http.status_code";
var TMP_HTTP_FLAVOR = "http.flavor";
var TMP_HTTP_USER_AGENT = "http.user_agent";
var TMP_HTTP_REQUEST_CONTENT_LENGTH = "http.request_content_length";
var TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = "http.request_content_length_uncompressed";
var TMP_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
var TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = "http.response_content_length_uncompressed";
var TMP_HTTP_SERVER_NAME = "http.server_name";
var TMP_HTTP_ROUTE = "http.route";
var TMP_HTTP_CLIENT_IP = "http.client_ip";
var TMP_AWS_DYNAMODB_TABLE_NAMES = "aws.dynamodb.table_names";
var TMP_AWS_DYNAMODB_CONSUMED_CAPACITY = "aws.dynamodb.consumed_capacity";
var TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = "aws.dynamodb.item_collection_metrics";
var TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = "aws.dynamodb.provisioned_read_capacity";
var TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = "aws.dynamodb.provisioned_write_capacity";
var TMP_AWS_DYNAMODB_CONSISTENT_READ = "aws.dynamodb.consistent_read";
var TMP_AWS_DYNAMODB_PROJECTION = "aws.dynamodb.projection";
var TMP_AWS_DYNAMODB_LIMIT = "aws.dynamodb.limit";
var TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET = "aws.dynamodb.attributes_to_get";
var TMP_AWS_DYNAMODB_INDEX_NAME = "aws.dynamodb.index_name";
var TMP_AWS_DYNAMODB_SELECT = "aws.dynamodb.select";
var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = "aws.dynamodb.global_secondary_indexes";
var TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = "aws.dynamodb.local_secondary_indexes";
var TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = "aws.dynamodb.exclusive_start_table";
var TMP_AWS_DYNAMODB_TABLE_COUNT = "aws.dynamodb.table_count";
var TMP_AWS_DYNAMODB_SCAN_FORWARD = "aws.dynamodb.scan_forward";
var TMP_AWS_DYNAMODB_SEGMENT = "aws.dynamodb.segment";
var TMP_AWS_DYNAMODB_TOTAL_SEGMENTS = "aws.dynamodb.total_segments";
var TMP_AWS_DYNAMODB_COUNT = "aws.dynamodb.count";
var TMP_AWS_DYNAMODB_SCANNED_COUNT = "aws.dynamodb.scanned_count";
var TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = "aws.dynamodb.attribute_definitions";
var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = "aws.dynamodb.global_secondary_index_updates";
var TMP_MESSAGING_SYSTEM = "messaging.system";
var TMP_MESSAGING_DESTINATION = "messaging.destination";
var TMP_MESSAGING_DESTINATION_KIND = "messaging.destination_kind";
var TMP_MESSAGING_TEMP_DESTINATION = "messaging.temp_destination";
var TMP_MESSAGING_PROTOCOL = "messaging.protocol";
var TMP_MESSAGING_PROTOCOL_VERSION = "messaging.protocol_version";
var TMP_MESSAGING_URL = "messaging.url";
var TMP_MESSAGING_MESSAGE_ID = "messaging.message_id";
var TMP_MESSAGING_CONVERSATION_ID = "messaging.conversation_id";
var TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = "messaging.message_payload_size_bytes";
var TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = "messaging.message_payload_compressed_size_bytes";
var TMP_MESSAGING_OPERATION = "messaging.operation";
var TMP_MESSAGING_CONSUMER_ID = "messaging.consumer_id";
var TMP_MESSAGING_RABBITMQ_ROUTING_KEY = "messaging.rabbitmq.routing_key";
var TMP_MESSAGING_KAFKA_MESSAGE_KEY = "messaging.kafka.message_key";
var TMP_MESSAGING_KAFKA_CONSUMER_GROUP = "messaging.kafka.consumer_group";
var TMP_MESSAGING_KAFKA_CLIENT_ID = "messaging.kafka.client_id";
var TMP_MESSAGING_KAFKA_PARTITION = "messaging.kafka.partition";
var TMP_MESSAGING_KAFKA_TOMBSTONE = "messaging.kafka.tombstone";
var TMP_RPC_SYSTEM = "rpc.system";
var TMP_RPC_SERVICE = "rpc.service";
var TMP_RPC_METHOD = "rpc.method";
var TMP_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
var TMP_RPC_JSONRPC_VERSION = "rpc.jsonrpc.version";
var TMP_RPC_JSONRPC_REQUEST_ID = "rpc.jsonrpc.request_id";
var TMP_RPC_JSONRPC_ERROR_CODE = "rpc.jsonrpc.error_code";
var TMP_RPC_JSONRPC_ERROR_MESSAGE = "rpc.jsonrpc.error_message";
var TMP_MESSAGE_TYPE = "message.type";
var TMP_MESSAGE_ID = "message.id";
var TMP_MESSAGE_COMPRESSED_SIZE = "message.compressed_size";
var TMP_MESSAGE_UNCOMPRESSED_SIZE = "message.uncompressed_size";
var SEMATTRS_AWS_LAMBDA_INVOKED_ARN = TMP_AWS_LAMBDA_INVOKED_ARN;
var SEMATTRS_DB_SYSTEM = TMP_DB_SYSTEM;
var SEMATTRS_DB_CONNECTION_STRING = TMP_DB_CONNECTION_STRING;
var SEMATTRS_DB_USER = TMP_DB_USER;
var SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = TMP_DB_JDBC_DRIVER_CLASSNAME;
var SEMATTRS_DB_NAME = TMP_DB_NAME;
var SEMATTRS_DB_STATEMENT = TMP_DB_STATEMENT;
var SEMATTRS_DB_OPERATION = TMP_DB_OPERATION;
var SEMATTRS_DB_MSSQL_INSTANCE_NAME = TMP_DB_MSSQL_INSTANCE_NAME;
var SEMATTRS_DB_CASSANDRA_KEYSPACE = TMP_DB_CASSANDRA_KEYSPACE;
var SEMATTRS_DB_CASSANDRA_PAGE_SIZE = TMP_DB_CASSANDRA_PAGE_SIZE;
var SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = TMP_DB_CASSANDRA_CONSISTENCY_LEVEL;
var SEMATTRS_DB_CASSANDRA_TABLE = TMP_DB_CASSANDRA_TABLE;
var SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = TMP_DB_CASSANDRA_IDEMPOTENCE;
var SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT;
var SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = TMP_DB_CASSANDRA_COORDINATOR_ID;
var SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = TMP_DB_CASSANDRA_COORDINATOR_DC;
var SEMATTRS_DB_HBASE_NAMESPACE = TMP_DB_HBASE_NAMESPACE;
var SEMATTRS_DB_REDIS_DATABASE_INDEX = TMP_DB_REDIS_DATABASE_INDEX;
var SEMATTRS_DB_MONGODB_COLLECTION = TMP_DB_MONGODB_COLLECTION;
var SEMATTRS_DB_SQL_TABLE = TMP_DB_SQL_TABLE;
var SEMATTRS_EXCEPTION_TYPE = TMP_EXCEPTION_TYPE;
var SEMATTRS_EXCEPTION_MESSAGE = TMP_EXCEPTION_MESSAGE;
var SEMATTRS_EXCEPTION_STACKTRACE = TMP_EXCEPTION_STACKTRACE;
var SEMATTRS_EXCEPTION_ESCAPED = TMP_EXCEPTION_ESCAPED;
var SEMATTRS_FAAS_TRIGGER = TMP_FAAS_TRIGGER;
var SEMATTRS_FAAS_EXECUTION = TMP_FAAS_EXECUTION;
var SEMATTRS_FAAS_DOCUMENT_COLLECTION = TMP_FAAS_DOCUMENT_COLLECTION;
var SEMATTRS_FAAS_DOCUMENT_OPERATION = TMP_FAAS_DOCUMENT_OPERATION;
var SEMATTRS_FAAS_DOCUMENT_TIME = TMP_FAAS_DOCUMENT_TIME;
var SEMATTRS_FAAS_DOCUMENT_NAME = TMP_FAAS_DOCUMENT_NAME;
var SEMATTRS_FAAS_TIME = TMP_FAAS_TIME;
var SEMATTRS_FAAS_CRON = TMP_FAAS_CRON;
var SEMATTRS_FAAS_COLDSTART = TMP_FAAS_COLDSTART;
var SEMATTRS_FAAS_INVOKED_NAME = TMP_FAAS_INVOKED_NAME;
var SEMATTRS_FAAS_INVOKED_PROVIDER = TMP_FAAS_INVOKED_PROVIDER;
var SEMATTRS_FAAS_INVOKED_REGION = TMP_FAAS_INVOKED_REGION;
var SEMATTRS_NET_TRANSPORT = TMP_NET_TRANSPORT;
var SEMATTRS_NET_PEER_IP = TMP_NET_PEER_IP;
var SEMATTRS_NET_PEER_PORT = TMP_NET_PEER_PORT;
var SEMATTRS_NET_PEER_NAME = TMP_NET_PEER_NAME;
var SEMATTRS_NET_HOST_IP = TMP_NET_HOST_IP;
var SEMATTRS_NET_HOST_PORT = TMP_NET_HOST_PORT;
var SEMATTRS_NET_HOST_NAME = TMP_NET_HOST_NAME;
var SEMATTRS_NET_HOST_CONNECTION_TYPE = TMP_NET_HOST_CONNECTION_TYPE;
var SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = TMP_NET_HOST_CONNECTION_SUBTYPE;
var SEMATTRS_NET_HOST_CARRIER_NAME = TMP_NET_HOST_CARRIER_NAME;
var SEMATTRS_NET_HOST_CARRIER_MCC = TMP_NET_HOST_CARRIER_MCC;
var SEMATTRS_NET_HOST_CARRIER_MNC = TMP_NET_HOST_CARRIER_MNC;
var SEMATTRS_NET_HOST_CARRIER_ICC = TMP_NET_HOST_CARRIER_ICC;
var SEMATTRS_PEER_SERVICE = TMP_PEER_SERVICE;
var SEMATTRS_ENDUSER_ID = TMP_ENDUSER_ID;
var SEMATTRS_ENDUSER_ROLE = TMP_ENDUSER_ROLE;
var SEMATTRS_ENDUSER_SCOPE = TMP_ENDUSER_SCOPE;
var SEMATTRS_THREAD_ID = TMP_THREAD_ID;
var SEMATTRS_THREAD_NAME = TMP_THREAD_NAME;
var SEMATTRS_CODE_FUNCTION = TMP_CODE_FUNCTION;
var SEMATTRS_CODE_NAMESPACE = TMP_CODE_NAMESPACE;
var SEMATTRS_CODE_FILEPATH = TMP_CODE_FILEPATH;
var SEMATTRS_CODE_LINENO = TMP_CODE_LINENO;
var SEMATTRS_HTTP_METHOD = TMP_HTTP_METHOD;
var SEMATTRS_HTTP_URL = TMP_HTTP_URL;
var SEMATTRS_HTTP_TARGET = TMP_HTTP_TARGET;
var SEMATTRS_HTTP_HOST = TMP_HTTP_HOST;
var SEMATTRS_HTTP_SCHEME = TMP_HTTP_SCHEME;
var SEMATTRS_HTTP_STATUS_CODE = TMP_HTTP_STATUS_CODE;
var SEMATTRS_HTTP_FLAVOR = TMP_HTTP_FLAVOR;
var SEMATTRS_HTTP_USER_AGENT = TMP_HTTP_USER_AGENT;
var SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = TMP_HTTP_REQUEST_CONTENT_LENGTH;
var SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED;
var SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = TMP_HTTP_RESPONSE_CONTENT_LENGTH;
var SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED;
var SEMATTRS_HTTP_SERVER_NAME = TMP_HTTP_SERVER_NAME;
var SEMATTRS_HTTP_ROUTE = TMP_HTTP_ROUTE;
var SEMATTRS_HTTP_CLIENT_IP = TMP_HTTP_CLIENT_IP;
var SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = TMP_AWS_DYNAMODB_TABLE_NAMES;
var SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = TMP_AWS_DYNAMODB_CONSUMED_CAPACITY;
var SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS;
var SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY;
var SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY;
var SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = TMP_AWS_DYNAMODB_CONSISTENT_READ;
var SEMATTRS_AWS_DYNAMODB_PROJECTION = TMP_AWS_DYNAMODB_PROJECTION;
var SEMATTRS_AWS_DYNAMODB_LIMIT = TMP_AWS_DYNAMODB_LIMIT;
var SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET;
var SEMATTRS_AWS_DYNAMODB_INDEX_NAME = TMP_AWS_DYNAMODB_INDEX_NAME;
var SEMATTRS_AWS_DYNAMODB_SELECT = TMP_AWS_DYNAMODB_SELECT;
var SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES;
var SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES;
var SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE;
var SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = TMP_AWS_DYNAMODB_TABLE_COUNT;
var SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = TMP_AWS_DYNAMODB_SCAN_FORWARD;
var SEMATTRS_AWS_DYNAMODB_SEGMENT = TMP_AWS_DYNAMODB_SEGMENT;
var SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = TMP_AWS_DYNAMODB_TOTAL_SEGMENTS;
var SEMATTRS_AWS_DYNAMODB_COUNT = TMP_AWS_DYNAMODB_COUNT;
var SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = TMP_AWS_DYNAMODB_SCANNED_COUNT;
var SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS;
var SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES;
var SEMATTRS_MESSAGING_SYSTEM = TMP_MESSAGING_SYSTEM;
var SEMATTRS_MESSAGING_DESTINATION = TMP_MESSAGING_DESTINATION;
var SEMATTRS_MESSAGING_DESTINATION_KIND = TMP_MESSAGING_DESTINATION_KIND;
var SEMATTRS_MESSAGING_TEMP_DESTINATION = TMP_MESSAGING_TEMP_DESTINATION;
var SEMATTRS_MESSAGING_PROTOCOL = TMP_MESSAGING_PROTOCOL;
var SEMATTRS_MESSAGING_PROTOCOL_VERSION = TMP_MESSAGING_PROTOCOL_VERSION;
var SEMATTRS_MESSAGING_URL = TMP_MESSAGING_URL;
var SEMATTRS_MESSAGING_MESSAGE_ID = TMP_MESSAGING_MESSAGE_ID;
var SEMATTRS_MESSAGING_CONVERSATION_ID = TMP_MESSAGING_CONVERSATION_ID;
var SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES;
var SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES;
var SEMATTRS_MESSAGING_OPERATION = TMP_MESSAGING_OPERATION;
var SEMATTRS_MESSAGING_CONSUMER_ID = TMP_MESSAGING_CONSUMER_ID;
var SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = TMP_MESSAGING_RABBITMQ_ROUTING_KEY;
var SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = TMP_MESSAGING_KAFKA_MESSAGE_KEY;
var SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = TMP_MESSAGING_KAFKA_CONSUMER_GROUP;
var SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = TMP_MESSAGING_KAFKA_CLIENT_ID;
var SEMATTRS_MESSAGING_KAFKA_PARTITION = TMP_MESSAGING_KAFKA_PARTITION;
var SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = TMP_MESSAGING_KAFKA_TOMBSTONE;
var SEMATTRS_RPC_SYSTEM = TMP_RPC_SYSTEM;
var SEMATTRS_RPC_SERVICE = TMP_RPC_SERVICE;
var SEMATTRS_RPC_METHOD = TMP_RPC_METHOD;
var SEMATTRS_RPC_GRPC_STATUS_CODE = TMP_RPC_GRPC_STATUS_CODE;
var SEMATTRS_RPC_JSONRPC_VERSION = TMP_RPC_JSONRPC_VERSION;
var SEMATTRS_RPC_JSONRPC_REQUEST_ID = TMP_RPC_JSONRPC_REQUEST_ID;
var SEMATTRS_RPC_JSONRPC_ERROR_CODE = TMP_RPC_JSONRPC_ERROR_CODE;
var SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = TMP_RPC_JSONRPC_ERROR_MESSAGE;
var SEMATTRS_MESSAGE_TYPE = TMP_MESSAGE_TYPE;
var SEMATTRS_MESSAGE_ID = TMP_MESSAGE_ID;
var SEMATTRS_MESSAGE_COMPRESSED_SIZE = TMP_MESSAGE_COMPRESSED_SIZE;
var SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = TMP_MESSAGE_UNCOMPRESSED_SIZE;
var SemanticAttributes = /* @__PURE__ */ createConstMap([
  TMP_AWS_LAMBDA_INVOKED_ARN,
  TMP_DB_SYSTEM,
  TMP_DB_CONNECTION_STRING,
  TMP_DB_USER,
  TMP_DB_JDBC_DRIVER_CLASSNAME,
  TMP_DB_NAME,
  TMP_DB_STATEMENT,
  TMP_DB_OPERATION,
  TMP_DB_MSSQL_INSTANCE_NAME,
  TMP_DB_CASSANDRA_KEYSPACE,
  TMP_DB_CASSANDRA_PAGE_SIZE,
  TMP_DB_CASSANDRA_CONSISTENCY_LEVEL,
  TMP_DB_CASSANDRA_TABLE,
  TMP_DB_CASSANDRA_IDEMPOTENCE,
  TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT,
  TMP_DB_CASSANDRA_COORDINATOR_ID,
  TMP_DB_CASSANDRA_COORDINATOR_DC,
  TMP_DB_HBASE_NAMESPACE,
  TMP_DB_REDIS_DATABASE_INDEX,
  TMP_DB_MONGODB_COLLECTION,
  TMP_DB_SQL_TABLE,
  TMP_EXCEPTION_TYPE,
  TMP_EXCEPTION_MESSAGE,
  TMP_EXCEPTION_STACKTRACE,
  TMP_EXCEPTION_ESCAPED,
  TMP_FAAS_TRIGGER,
  TMP_FAAS_EXECUTION,
  TMP_FAAS_DOCUMENT_COLLECTION,
  TMP_FAAS_DOCUMENT_OPERATION,
  TMP_FAAS_DOCUMENT_TIME,
  TMP_FAAS_DOCUMENT_NAME,
  TMP_FAAS_TIME,
  TMP_FAAS_CRON,
  TMP_FAAS_COLDSTART,
  TMP_FAAS_INVOKED_NAME,
  TMP_FAAS_INVOKED_PROVIDER,
  TMP_FAAS_INVOKED_REGION,
  TMP_NET_TRANSPORT,
  TMP_NET_PEER_IP,
  TMP_NET_PEER_PORT,
  TMP_NET_PEER_NAME,
  TMP_NET_HOST_IP,
  TMP_NET_HOST_PORT,
  TMP_NET_HOST_NAME,
  TMP_NET_HOST_CONNECTION_TYPE,
  TMP_NET_HOST_CONNECTION_SUBTYPE,
  TMP_NET_HOST_CARRIER_NAME,
  TMP_NET_HOST_CARRIER_MCC,
  TMP_NET_HOST_CARRIER_MNC,
  TMP_NET_HOST_CARRIER_ICC,
  TMP_PEER_SERVICE,
  TMP_ENDUSER_ID,
  TMP_ENDUSER_ROLE,
  TMP_ENDUSER_SCOPE,
  TMP_THREAD_ID,
  TMP_THREAD_NAME,
  TMP_CODE_FUNCTION,
  TMP_CODE_NAMESPACE,
  TMP_CODE_FILEPATH,
  TMP_CODE_LINENO,
  TMP_HTTP_METHOD,
  TMP_HTTP_URL,
  TMP_HTTP_TARGET,
  TMP_HTTP_HOST,
  TMP_HTTP_SCHEME,
  TMP_HTTP_STATUS_CODE,
  TMP_HTTP_FLAVOR,
  TMP_HTTP_USER_AGENT,
  TMP_HTTP_REQUEST_CONTENT_LENGTH,
  TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED,
  TMP_HTTP_RESPONSE_CONTENT_LENGTH,
  TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED,
  TMP_HTTP_SERVER_NAME,
  TMP_HTTP_ROUTE,
  TMP_HTTP_CLIENT_IP,
  TMP_AWS_DYNAMODB_TABLE_NAMES,
  TMP_AWS_DYNAMODB_CONSUMED_CAPACITY,
  TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS,
  TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY,
  TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY,
  TMP_AWS_DYNAMODB_CONSISTENT_READ,
  TMP_AWS_DYNAMODB_PROJECTION,
  TMP_AWS_DYNAMODB_LIMIT,
  TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET,
  TMP_AWS_DYNAMODB_INDEX_NAME,
  TMP_AWS_DYNAMODB_SELECT,
  TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES,
  TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES,
  TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE,
  TMP_AWS_DYNAMODB_TABLE_COUNT,
  TMP_AWS_DYNAMODB_SCAN_FORWARD,
  TMP_AWS_DYNAMODB_SEGMENT,
  TMP_AWS_DYNAMODB_TOTAL_SEGMENTS,
  TMP_AWS_DYNAMODB_COUNT,
  TMP_AWS_DYNAMODB_SCANNED_COUNT,
  TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS,
  TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES,
  TMP_MESSAGING_SYSTEM,
  TMP_MESSAGING_DESTINATION,
  TMP_MESSAGING_DESTINATION_KIND,
  TMP_MESSAGING_TEMP_DESTINATION,
  TMP_MESSAGING_PROTOCOL,
  TMP_MESSAGING_PROTOCOL_VERSION,
  TMP_MESSAGING_URL,
  TMP_MESSAGING_MESSAGE_ID,
  TMP_MESSAGING_CONVERSATION_ID,
  TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES,
  TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES,
  TMP_MESSAGING_OPERATION,
  TMP_MESSAGING_CONSUMER_ID,
  TMP_MESSAGING_RABBITMQ_ROUTING_KEY,
  TMP_MESSAGING_KAFKA_MESSAGE_KEY,
  TMP_MESSAGING_KAFKA_CONSUMER_GROUP,
  TMP_MESSAGING_KAFKA_CLIENT_ID,
  TMP_MESSAGING_KAFKA_PARTITION,
  TMP_MESSAGING_KAFKA_TOMBSTONE,
  TMP_RPC_SYSTEM,
  TMP_RPC_SERVICE,
  TMP_RPC_METHOD,
  TMP_RPC_GRPC_STATUS_CODE,
  TMP_RPC_JSONRPC_VERSION,
  TMP_RPC_JSONRPC_REQUEST_ID,
  TMP_RPC_JSONRPC_ERROR_CODE,
  TMP_RPC_JSONRPC_ERROR_MESSAGE,
  TMP_MESSAGE_TYPE,
  TMP_MESSAGE_ID,
  TMP_MESSAGE_COMPRESSED_SIZE,
  TMP_MESSAGE_UNCOMPRESSED_SIZE
]);
var TMP_DBSYSTEMVALUES_OTHER_SQL = "other_sql";
var TMP_DBSYSTEMVALUES_MSSQL = "mssql";
var TMP_DBSYSTEMVALUES_MYSQL = "mysql";
var TMP_DBSYSTEMVALUES_ORACLE = "oracle";
var TMP_DBSYSTEMVALUES_DB2 = "db2";
var TMP_DBSYSTEMVALUES_POSTGRESQL = "postgresql";
var TMP_DBSYSTEMVALUES_REDSHIFT = "redshift";
var TMP_DBSYSTEMVALUES_HIVE = "hive";
var TMP_DBSYSTEMVALUES_CLOUDSCAPE = "cloudscape";
var TMP_DBSYSTEMVALUES_HSQLDB = "hsqldb";
var TMP_DBSYSTEMVALUES_PROGRESS = "progress";
var TMP_DBSYSTEMVALUES_MAXDB = "maxdb";
var TMP_DBSYSTEMVALUES_HANADB = "hanadb";
var TMP_DBSYSTEMVALUES_INGRES = "ingres";
var TMP_DBSYSTEMVALUES_FIRSTSQL = "firstsql";
var TMP_DBSYSTEMVALUES_EDB = "edb";
var TMP_DBSYSTEMVALUES_CACHE = "cache";
var TMP_DBSYSTEMVALUES_ADABAS = "adabas";
var TMP_DBSYSTEMVALUES_FIREBIRD = "firebird";
var TMP_DBSYSTEMVALUES_DERBY = "derby";
var TMP_DBSYSTEMVALUES_FILEMAKER = "filemaker";
var TMP_DBSYSTEMVALUES_INFORMIX = "informix";
var TMP_DBSYSTEMVALUES_INSTANTDB = "instantdb";
var TMP_DBSYSTEMVALUES_INTERBASE = "interbase";
var TMP_DBSYSTEMVALUES_MARIADB = "mariadb";
var TMP_DBSYSTEMVALUES_NETEZZA = "netezza";
var TMP_DBSYSTEMVALUES_PERVASIVE = "pervasive";
var TMP_DBSYSTEMVALUES_POINTBASE = "pointbase";
var TMP_DBSYSTEMVALUES_SQLITE = "sqlite";
var TMP_DBSYSTEMVALUES_SYBASE = "sybase";
var TMP_DBSYSTEMVALUES_TERADATA = "teradata";
var TMP_DBSYSTEMVALUES_VERTICA = "vertica";
var TMP_DBSYSTEMVALUES_H2 = "h2";
var TMP_DBSYSTEMVALUES_COLDFUSION = "coldfusion";
var TMP_DBSYSTEMVALUES_CASSANDRA = "cassandra";
var TMP_DBSYSTEMVALUES_HBASE = "hbase";
var TMP_DBSYSTEMVALUES_MONGODB = "mongodb";
var TMP_DBSYSTEMVALUES_REDIS = "redis";
var TMP_DBSYSTEMVALUES_COUCHBASE = "couchbase";
var TMP_DBSYSTEMVALUES_COUCHDB = "couchdb";
var TMP_DBSYSTEMVALUES_COSMOSDB = "cosmosdb";
var TMP_DBSYSTEMVALUES_DYNAMODB = "dynamodb";
var TMP_DBSYSTEMVALUES_NEO4J = "neo4j";
var TMP_DBSYSTEMVALUES_GEODE = "geode";
var TMP_DBSYSTEMVALUES_ELASTICSEARCH = "elasticsearch";
var TMP_DBSYSTEMVALUES_MEMCACHED = "memcached";
var TMP_DBSYSTEMVALUES_COCKROACHDB = "cockroachdb";
var DBSYSTEMVALUES_OTHER_SQL = TMP_DBSYSTEMVALUES_OTHER_SQL;
var DBSYSTEMVALUES_MSSQL = TMP_DBSYSTEMVALUES_MSSQL;
var DBSYSTEMVALUES_MYSQL = TMP_DBSYSTEMVALUES_MYSQL;
var DBSYSTEMVALUES_ORACLE = TMP_DBSYSTEMVALUES_ORACLE;
var DBSYSTEMVALUES_DB2 = TMP_DBSYSTEMVALUES_DB2;
var DBSYSTEMVALUES_POSTGRESQL = TMP_DBSYSTEMVALUES_POSTGRESQL;
var DBSYSTEMVALUES_REDSHIFT = TMP_DBSYSTEMVALUES_REDSHIFT;
var DBSYSTEMVALUES_HIVE = TMP_DBSYSTEMVALUES_HIVE;
var DBSYSTEMVALUES_CLOUDSCAPE = TMP_DBSYSTEMVALUES_CLOUDSCAPE;
var DBSYSTEMVALUES_HSQLDB = TMP_DBSYSTEMVALUES_HSQLDB;
var DBSYSTEMVALUES_PROGRESS = TMP_DBSYSTEMVALUES_PROGRESS;
var DBSYSTEMVALUES_MAXDB = TMP_DBSYSTEMVALUES_MAXDB;
var DBSYSTEMVALUES_HANADB = TMP_DBSYSTEMVALUES_HANADB;
var DBSYSTEMVALUES_INGRES = TMP_DBSYSTEMVALUES_INGRES;
var DBSYSTEMVALUES_FIRSTSQL = TMP_DBSYSTEMVALUES_FIRSTSQL;
var DBSYSTEMVALUES_EDB = TMP_DBSYSTEMVALUES_EDB;
var DBSYSTEMVALUES_CACHE = TMP_DBSYSTEMVALUES_CACHE;
var DBSYSTEMVALUES_ADABAS = TMP_DBSYSTEMVALUES_ADABAS;
var DBSYSTEMVALUES_FIREBIRD = TMP_DBSYSTEMVALUES_FIREBIRD;
var DBSYSTEMVALUES_DERBY = TMP_DBSYSTEMVALUES_DERBY;
var DBSYSTEMVALUES_FILEMAKER = TMP_DBSYSTEMVALUES_FILEMAKER;
var DBSYSTEMVALUES_INFORMIX = TMP_DBSYSTEMVALUES_INFORMIX;
var DBSYSTEMVALUES_INSTANTDB = TMP_DBSYSTEMVALUES_INSTANTDB;
var DBSYSTEMVALUES_INTERBASE = TMP_DBSYSTEMVALUES_INTERBASE;
var DBSYSTEMVALUES_MARIADB = TMP_DBSYSTEMVALUES_MARIADB;
var DBSYSTEMVALUES_NETEZZA = TMP_DBSYSTEMVALUES_NETEZZA;
var DBSYSTEMVALUES_PERVASIVE = TMP_DBSYSTEMVALUES_PERVASIVE;
var DBSYSTEMVALUES_POINTBASE = TMP_DBSYSTEMVALUES_POINTBASE;
var DBSYSTEMVALUES_SQLITE = TMP_DBSYSTEMVALUES_SQLITE;
var DBSYSTEMVALUES_SYBASE = TMP_DBSYSTEMVALUES_SYBASE;
var DBSYSTEMVALUES_TERADATA = TMP_DBSYSTEMVALUES_TERADATA;
var DBSYSTEMVALUES_VERTICA = TMP_DBSYSTEMVALUES_VERTICA;
var DBSYSTEMVALUES_H2 = TMP_DBSYSTEMVALUES_H2;
var DBSYSTEMVALUES_COLDFUSION = TMP_DBSYSTEMVALUES_COLDFUSION;
var DBSYSTEMVALUES_CASSANDRA = TMP_DBSYSTEMVALUES_CASSANDRA;
var DBSYSTEMVALUES_HBASE = TMP_DBSYSTEMVALUES_HBASE;
var DBSYSTEMVALUES_MONGODB = TMP_DBSYSTEMVALUES_MONGODB;
var DBSYSTEMVALUES_REDIS = TMP_DBSYSTEMVALUES_REDIS;
var DBSYSTEMVALUES_COUCHBASE = TMP_DBSYSTEMVALUES_COUCHBASE;
var DBSYSTEMVALUES_COUCHDB = TMP_DBSYSTEMVALUES_COUCHDB;
var DBSYSTEMVALUES_COSMOSDB = TMP_DBSYSTEMVALUES_COSMOSDB;
var DBSYSTEMVALUES_DYNAMODB = TMP_DBSYSTEMVALUES_DYNAMODB;
var DBSYSTEMVALUES_NEO4J = TMP_DBSYSTEMVALUES_NEO4J;
var DBSYSTEMVALUES_GEODE = TMP_DBSYSTEMVALUES_GEODE;
var DBSYSTEMVALUES_ELASTICSEARCH = TMP_DBSYSTEMVALUES_ELASTICSEARCH;
var DBSYSTEMVALUES_MEMCACHED = TMP_DBSYSTEMVALUES_MEMCACHED;
var DBSYSTEMVALUES_COCKROACHDB = TMP_DBSYSTEMVALUES_COCKROACHDB;
var DbSystemValues = /* @__PURE__ */ createConstMap([
  TMP_DBSYSTEMVALUES_OTHER_SQL,
  TMP_DBSYSTEMVALUES_MSSQL,
  TMP_DBSYSTEMVALUES_MYSQL,
  TMP_DBSYSTEMVALUES_ORACLE,
  TMP_DBSYSTEMVALUES_DB2,
  TMP_DBSYSTEMVALUES_POSTGRESQL,
  TMP_DBSYSTEMVALUES_REDSHIFT,
  TMP_DBSYSTEMVALUES_HIVE,
  TMP_DBSYSTEMVALUES_CLOUDSCAPE,
  TMP_DBSYSTEMVALUES_HSQLDB,
  TMP_DBSYSTEMVALUES_PROGRESS,
  TMP_DBSYSTEMVALUES_MAXDB,
  TMP_DBSYSTEMVALUES_HANADB,
  TMP_DBSYSTEMVALUES_INGRES,
  TMP_DBSYSTEMVALUES_FIRSTSQL,
  TMP_DBSYSTEMVALUES_EDB,
  TMP_DBSYSTEMVALUES_CACHE,
  TMP_DBSYSTEMVALUES_ADABAS,
  TMP_DBSYSTEMVALUES_FIREBIRD,
  TMP_DBSYSTEMVALUES_DERBY,
  TMP_DBSYSTEMVALUES_FILEMAKER,
  TMP_DBSYSTEMVALUES_INFORMIX,
  TMP_DBSYSTEMVALUES_INSTANTDB,
  TMP_DBSYSTEMVALUES_INTERBASE,
  TMP_DBSYSTEMVALUES_MARIADB,
  TMP_DBSYSTEMVALUES_NETEZZA,
  TMP_DBSYSTEMVALUES_PERVASIVE,
  TMP_DBSYSTEMVALUES_POINTBASE,
  TMP_DBSYSTEMVALUES_SQLITE,
  TMP_DBSYSTEMVALUES_SYBASE,
  TMP_DBSYSTEMVALUES_TERADATA,
  TMP_DBSYSTEMVALUES_VERTICA,
  TMP_DBSYSTEMVALUES_H2,
  TMP_DBSYSTEMVALUES_COLDFUSION,
  TMP_DBSYSTEMVALUES_CASSANDRA,
  TMP_DBSYSTEMVALUES_HBASE,
  TMP_DBSYSTEMVALUES_MONGODB,
  TMP_DBSYSTEMVALUES_REDIS,
  TMP_DBSYSTEMVALUES_COUCHBASE,
  TMP_DBSYSTEMVALUES_COUCHDB,
  TMP_DBSYSTEMVALUES_COSMOSDB,
  TMP_DBSYSTEMVALUES_DYNAMODB,
  TMP_DBSYSTEMVALUES_NEO4J,
  TMP_DBSYSTEMVALUES_GEODE,
  TMP_DBSYSTEMVALUES_ELASTICSEARCH,
  TMP_DBSYSTEMVALUES_MEMCACHED,
  TMP_DBSYSTEMVALUES_COCKROACHDB
]);
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL = "all";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = "each_quorum";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = "quorum";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = "local_quorum";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE = "one";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO = "two";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE = "three";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = "local_one";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY = "any";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = "serial";
var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = "local_serial";
var DBCASSANDRACONSISTENCYLEVELVALUES_ALL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL;
var DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM;
var DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM;
var DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM;
var DBCASSANDRACONSISTENCYLEVELVALUES_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE;
var DBCASSANDRACONSISTENCYLEVELVALUES_TWO = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO;
var DBCASSANDRACONSISTENCYLEVELVALUES_THREE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE;
var DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE;
var DBCASSANDRACONSISTENCYLEVELVALUES_ANY = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY;
var DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL;
var DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL;
var DbCassandraConsistencyLevelValues = /* @__PURE__ */ createConstMap([
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL,
  TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL
]);
var TMP_FAASTRIGGERVALUES_DATASOURCE = "datasource";
var TMP_FAASTRIGGERVALUES_HTTP = "http";
var TMP_FAASTRIGGERVALUES_PUBSUB = "pubsub";
var TMP_FAASTRIGGERVALUES_TIMER = "timer";
var TMP_FAASTRIGGERVALUES_OTHER = "other";
var FAASTRIGGERVALUES_DATASOURCE = TMP_FAASTRIGGERVALUES_DATASOURCE;
var FAASTRIGGERVALUES_HTTP = TMP_FAASTRIGGERVALUES_HTTP;
var FAASTRIGGERVALUES_PUBSUB = TMP_FAASTRIGGERVALUES_PUBSUB;
var FAASTRIGGERVALUES_TIMER = TMP_FAASTRIGGERVALUES_TIMER;
var FAASTRIGGERVALUES_OTHER = TMP_FAASTRIGGERVALUES_OTHER;
var FaasTriggerValues = /* @__PURE__ */ createConstMap([
  TMP_FAASTRIGGERVALUES_DATASOURCE,
  TMP_FAASTRIGGERVALUES_HTTP,
  TMP_FAASTRIGGERVALUES_PUBSUB,
  TMP_FAASTRIGGERVALUES_TIMER,
  TMP_FAASTRIGGERVALUES_OTHER
]);
var TMP_FAASDOCUMENTOPERATIONVALUES_INSERT = "insert";
var TMP_FAASDOCUMENTOPERATIONVALUES_EDIT = "edit";
var TMP_FAASDOCUMENTOPERATIONVALUES_DELETE = "delete";
var FAASDOCUMENTOPERATIONVALUES_INSERT = TMP_FAASDOCUMENTOPERATIONVALUES_INSERT;
var FAASDOCUMENTOPERATIONVALUES_EDIT = TMP_FAASDOCUMENTOPERATIONVALUES_EDIT;
var FAASDOCUMENTOPERATIONVALUES_DELETE = TMP_FAASDOCUMENTOPERATIONVALUES_DELETE;
var FaasDocumentOperationValues = /* @__PURE__ */ createConstMap([
  TMP_FAASDOCUMENTOPERATIONVALUES_INSERT,
  TMP_FAASDOCUMENTOPERATIONVALUES_EDIT,
  TMP_FAASDOCUMENTOPERATIONVALUES_DELETE
]);
var TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
var TMP_FAASINVOKEDPROVIDERVALUES_AWS = "aws";
var TMP_FAASINVOKEDPROVIDERVALUES_AZURE = "azure";
var TMP_FAASINVOKEDPROVIDERVALUES_GCP = "gcp";
var FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD;
var FAASINVOKEDPROVIDERVALUES_AWS = TMP_FAASINVOKEDPROVIDERVALUES_AWS;
var FAASINVOKEDPROVIDERVALUES_AZURE = TMP_FAASINVOKEDPROVIDERVALUES_AZURE;
var FAASINVOKEDPROVIDERVALUES_GCP = TMP_FAASINVOKEDPROVIDERVALUES_GCP;
var FaasInvokedProviderValues = /* @__PURE__ */ createConstMap([
  TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD,
  TMP_FAASINVOKEDPROVIDERVALUES_AWS,
  TMP_FAASINVOKEDPROVIDERVALUES_AZURE,
  TMP_FAASINVOKEDPROVIDERVALUES_GCP
]);
var TMP_NETTRANSPORTVALUES_IP_TCP = "ip_tcp";
var TMP_NETTRANSPORTVALUES_IP_UDP = "ip_udp";
var TMP_NETTRANSPORTVALUES_IP = "ip";
var TMP_NETTRANSPORTVALUES_UNIX = "unix";
var TMP_NETTRANSPORTVALUES_PIPE = "pipe";
var TMP_NETTRANSPORTVALUES_INPROC = "inproc";
var TMP_NETTRANSPORTVALUES_OTHER = "other";
var NETTRANSPORTVALUES_IP_TCP = TMP_NETTRANSPORTVALUES_IP_TCP;
var NETTRANSPORTVALUES_IP_UDP = TMP_NETTRANSPORTVALUES_IP_UDP;
var NETTRANSPORTVALUES_IP = TMP_NETTRANSPORTVALUES_IP;
var NETTRANSPORTVALUES_UNIX = TMP_NETTRANSPORTVALUES_UNIX;
var NETTRANSPORTVALUES_PIPE = TMP_NETTRANSPORTVALUES_PIPE;
var NETTRANSPORTVALUES_INPROC = TMP_NETTRANSPORTVALUES_INPROC;
var NETTRANSPORTVALUES_OTHER = TMP_NETTRANSPORTVALUES_OTHER;
var NetTransportValues = /* @__PURE__ */ createConstMap([
  TMP_NETTRANSPORTVALUES_IP_TCP,
  TMP_NETTRANSPORTVALUES_IP_UDP,
  TMP_NETTRANSPORTVALUES_IP,
  TMP_NETTRANSPORTVALUES_UNIX,
  TMP_NETTRANSPORTVALUES_PIPE,
  TMP_NETTRANSPORTVALUES_INPROC,
  TMP_NETTRANSPORTVALUES_OTHER
]);
var TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI = "wifi";
var TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED = "wired";
var TMP_NETHOSTCONNECTIONTYPEVALUES_CELL = "cell";
var TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = "unavailable";
var TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = "unknown";
var NETHOSTCONNECTIONTYPEVALUES_WIFI = TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI;
var NETHOSTCONNECTIONTYPEVALUES_WIRED = TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED;
var NETHOSTCONNECTIONTYPEVALUES_CELL = TMP_NETHOSTCONNECTIONTYPEVALUES_CELL;
var NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE;
var NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN;
var NetHostConnectionTypeValues = /* @__PURE__ */ createConstMap([
  TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI,
  TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED,
  TMP_NETHOSTCONNECTIONTYPEVALUES_CELL,
  TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE,
  TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN
]);
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = "gprs";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = "edge";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = "umts";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = "cdma";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = "evdo_0";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = "evdo_a";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = "cdma2000_1xrtt";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = "hsdpa";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = "hsupa";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = "hspa";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = "iden";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = "evdo_b";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE = "lte";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = "ehrpd";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = "hspap";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM = "gsm";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = "td_scdma";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = "iwlan";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR = "nr";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = "nrnsa";
var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = "lte_ca";
var NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS;
var NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE;
var NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS;
var NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA;
var NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0;
var NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A;
var NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT;
var NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA;
var NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA;
var NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA;
var NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN;
var NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B;
var NETHOSTCONNECTIONSUBTYPEVALUES_LTE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE;
var NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD;
var NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP;
var NETHOSTCONNECTIONSUBTYPEVALUES_GSM = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM;
var NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA;
var NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN;
var NETHOSTCONNECTIONSUBTYPEVALUES_NR = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR;
var NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA;
var NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA;
var NetHostConnectionSubtypeValues = /* @__PURE__ */ createConstMap([
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA,
  TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA
]);
var TMP_HTTPFLAVORVALUES_HTTP_1_0 = "1.0";
var TMP_HTTPFLAVORVALUES_HTTP_1_1 = "1.1";
var TMP_HTTPFLAVORVALUES_HTTP_2_0 = "2.0";
var TMP_HTTPFLAVORVALUES_SPDY = "SPDY";
var TMP_HTTPFLAVORVALUES_QUIC = "QUIC";
var HTTPFLAVORVALUES_HTTP_1_0 = TMP_HTTPFLAVORVALUES_HTTP_1_0;
var HTTPFLAVORVALUES_HTTP_1_1 = TMP_HTTPFLAVORVALUES_HTTP_1_1;
var HTTPFLAVORVALUES_HTTP_2_0 = TMP_HTTPFLAVORVALUES_HTTP_2_0;
var HTTPFLAVORVALUES_SPDY = TMP_HTTPFLAVORVALUES_SPDY;
var HTTPFLAVORVALUES_QUIC = TMP_HTTPFLAVORVALUES_QUIC;
var HttpFlavorValues = {
  HTTP_1_0: TMP_HTTPFLAVORVALUES_HTTP_1_0,
  HTTP_1_1: TMP_HTTPFLAVORVALUES_HTTP_1_1,
  HTTP_2_0: TMP_HTTPFLAVORVALUES_HTTP_2_0,
  SPDY: TMP_HTTPFLAVORVALUES_SPDY,
  QUIC: TMP_HTTPFLAVORVALUES_QUIC
};
var TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE = "queue";
var TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC = "topic";
var MESSAGINGDESTINATIONKINDVALUES_QUEUE = TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE;
var MESSAGINGDESTINATIONKINDVALUES_TOPIC = TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC;
var MessagingDestinationKindValues = /* @__PURE__ */ createConstMap([
  TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE,
  TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC
]);
var TMP_MESSAGINGOPERATIONVALUES_RECEIVE = "receive";
var TMP_MESSAGINGOPERATIONVALUES_PROCESS = "process";
var MESSAGINGOPERATIONVALUES_RECEIVE = TMP_MESSAGINGOPERATIONVALUES_RECEIVE;
var MESSAGINGOPERATIONVALUES_PROCESS = TMP_MESSAGINGOPERATIONVALUES_PROCESS;
var MessagingOperationValues = /* @__PURE__ */ createConstMap([
  TMP_MESSAGINGOPERATIONVALUES_RECEIVE,
  TMP_MESSAGINGOPERATIONVALUES_PROCESS
]);
var TMP_RPCGRPCSTATUSCODEVALUES_OK = 0;
var TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED = 1;
var TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN = 2;
var TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = 3;
var TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = 4;
var TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND = 5;
var TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = 6;
var TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = 7;
var TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = 8;
var TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = 9;
var TMP_RPCGRPCSTATUSCODEVALUES_ABORTED = 10;
var TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = 11;
var TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = 12;
var TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL = 13;
var TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = 14;
var TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS = 15;
var TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = 16;
var RPCGRPCSTATUSCODEVALUES_OK = TMP_RPCGRPCSTATUSCODEVALUES_OK;
var RPCGRPCSTATUSCODEVALUES_CANCELLED = TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED;
var RPCGRPCSTATUSCODEVALUES_UNKNOWN = TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN;
var RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT;
var RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED;
var RPCGRPCSTATUSCODEVALUES_NOT_FOUND = TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND;
var RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS;
var RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED;
var RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED;
var RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION;
var RPCGRPCSTATUSCODEVALUES_ABORTED = TMP_RPCGRPCSTATUSCODEVALUES_ABORTED;
var RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE;
var RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED;
var RPCGRPCSTATUSCODEVALUES_INTERNAL = TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL;
var RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE;
var RPCGRPCSTATUSCODEVALUES_DATA_LOSS = TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS;
var RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED;
var RpcGrpcStatusCodeValues = {
  OK: TMP_RPCGRPCSTATUSCODEVALUES_OK,
  CANCELLED: TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED,
  UNKNOWN: TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN,
  INVALID_ARGUMENT: TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT,
  DEADLINE_EXCEEDED: TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED,
  NOT_FOUND: TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND,
  ALREADY_EXISTS: TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS,
  PERMISSION_DENIED: TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED,
  RESOURCE_EXHAUSTED: TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED,
  FAILED_PRECONDITION: TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION,
  ABORTED: TMP_RPCGRPCSTATUSCODEVALUES_ABORTED,
  OUT_OF_RANGE: TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE,
  UNIMPLEMENTED: TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED,
  INTERNAL: TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL,
  UNAVAILABLE: TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE,
  DATA_LOSS: TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS,
  UNAUTHENTICATED: TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED
};
var TMP_MESSAGETYPEVALUES_SENT = "SENT";
var TMP_MESSAGETYPEVALUES_RECEIVED = "RECEIVED";
var MESSAGETYPEVALUES_SENT = TMP_MESSAGETYPEVALUES_SENT;
var MESSAGETYPEVALUES_RECEIVED = TMP_MESSAGETYPEVALUES_RECEIVED;
var MessageTypeValues = /* @__PURE__ */ createConstMap([
  TMP_MESSAGETYPEVALUES_SENT,
  TMP_MESSAGETYPEVALUES_RECEIVED
]);
var TMP_CLOUD_PROVIDER = "cloud.provider";
var TMP_CLOUD_ACCOUNT_ID = "cloud.account.id";
var TMP_CLOUD_REGION = "cloud.region";
var TMP_CLOUD_AVAILABILITY_ZONE = "cloud.availability_zone";
var TMP_CLOUD_PLATFORM = "cloud.platform";
var TMP_AWS_ECS_CONTAINER_ARN = "aws.ecs.container.arn";
var TMP_AWS_ECS_CLUSTER_ARN = "aws.ecs.cluster.arn";
var TMP_AWS_ECS_LAUNCHTYPE = "aws.ecs.launchtype";
var TMP_AWS_ECS_TASK_ARN = "aws.ecs.task.arn";
var TMP_AWS_ECS_TASK_FAMILY = "aws.ecs.task.family";
var TMP_AWS_ECS_TASK_REVISION = "aws.ecs.task.revision";
var TMP_AWS_EKS_CLUSTER_ARN = "aws.eks.cluster.arn";
var TMP_AWS_LOG_GROUP_NAMES = "aws.log.group.names";
var TMP_AWS_LOG_GROUP_ARNS = "aws.log.group.arns";
var TMP_AWS_LOG_STREAM_NAMES = "aws.log.stream.names";
var TMP_AWS_LOG_STREAM_ARNS = "aws.log.stream.arns";
var TMP_CONTAINER_NAME = "container.name";
var TMP_CONTAINER_ID = "container.id";
var TMP_CONTAINER_RUNTIME = "container.runtime";
var TMP_CONTAINER_IMAGE_NAME = "container.image.name";
var TMP_CONTAINER_IMAGE_TAG = "container.image.tag";
var TMP_DEPLOYMENT_ENVIRONMENT = "deployment.environment";
var TMP_DEVICE_ID = "device.id";
var TMP_DEVICE_MODEL_IDENTIFIER = "device.model.identifier";
var TMP_DEVICE_MODEL_NAME = "device.model.name";
var TMP_FAAS_NAME = "faas.name";
var TMP_FAAS_ID = "faas.id";
var TMP_FAAS_VERSION = "faas.version";
var TMP_FAAS_INSTANCE = "faas.instance";
var TMP_FAAS_MAX_MEMORY = "faas.max_memory";
var TMP_HOST_ID = "host.id";
var TMP_HOST_NAME = "host.name";
var TMP_HOST_TYPE = "host.type";
var TMP_HOST_ARCH = "host.arch";
var TMP_HOST_IMAGE_NAME = "host.image.name";
var TMP_HOST_IMAGE_ID = "host.image.id";
var TMP_HOST_IMAGE_VERSION = "host.image.version";
var TMP_K8S_CLUSTER_NAME = "k8s.cluster.name";
var TMP_K8S_NODE_NAME = "k8s.node.name";
var TMP_K8S_NODE_UID = "k8s.node.uid";
var TMP_K8S_NAMESPACE_NAME = "k8s.namespace.name";
var TMP_K8S_POD_UID = "k8s.pod.uid";
var TMP_K8S_POD_NAME = "k8s.pod.name";
var TMP_K8S_CONTAINER_NAME = "k8s.container.name";
var TMP_K8S_REPLICASET_UID = "k8s.replicaset.uid";
var TMP_K8S_REPLICASET_NAME = "k8s.replicaset.name";
var TMP_K8S_DEPLOYMENT_UID = "k8s.deployment.uid";
var TMP_K8S_DEPLOYMENT_NAME = "k8s.deployment.name";
var TMP_K8S_STATEFULSET_UID = "k8s.statefulset.uid";
var TMP_K8S_STATEFULSET_NAME = "k8s.statefulset.name";
var TMP_K8S_DAEMONSET_UID = "k8s.daemonset.uid";
var TMP_K8S_DAEMONSET_NAME = "k8s.daemonset.name";
var TMP_K8S_JOB_UID = "k8s.job.uid";
var TMP_K8S_JOB_NAME = "k8s.job.name";
var TMP_K8S_CRONJOB_UID = "k8s.cronjob.uid";
var TMP_K8S_CRONJOB_NAME = "k8s.cronjob.name";
var TMP_OS_TYPE = "os.type";
var TMP_OS_DESCRIPTION = "os.description";
var TMP_OS_NAME = "os.name";
var TMP_OS_VERSION = "os.version";
var TMP_PROCESS_PID = "process.pid";
var TMP_PROCESS_EXECUTABLE_NAME = "process.executable.name";
var TMP_PROCESS_EXECUTABLE_PATH = "process.executable.path";
var TMP_PROCESS_COMMAND = "process.command";
var TMP_PROCESS_COMMAND_LINE = "process.command_line";
var TMP_PROCESS_COMMAND_ARGS = "process.command_args";
var TMP_PROCESS_OWNER = "process.owner";
var TMP_PROCESS_RUNTIME_NAME = "process.runtime.name";
var TMP_PROCESS_RUNTIME_VERSION = "process.runtime.version";
var TMP_PROCESS_RUNTIME_DESCRIPTION = "process.runtime.description";
var TMP_SERVICE_NAME = "service.name";
var TMP_SERVICE_NAMESPACE = "service.namespace";
var TMP_SERVICE_INSTANCE_ID = "service.instance.id";
var TMP_SERVICE_VERSION = "service.version";
var TMP_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
var TMP_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
var TMP_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
var TMP_TELEMETRY_AUTO_VERSION = "telemetry.auto.version";
var TMP_WEBENGINE_NAME = "webengine.name";
var TMP_WEBENGINE_VERSION = "webengine.version";
var TMP_WEBENGINE_DESCRIPTION = "webengine.description";
var SEMRESATTRS_CLOUD_PROVIDER = TMP_CLOUD_PROVIDER;
var SEMRESATTRS_CLOUD_ACCOUNT_ID = TMP_CLOUD_ACCOUNT_ID;
var SEMRESATTRS_CLOUD_REGION = TMP_CLOUD_REGION;
var SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = TMP_CLOUD_AVAILABILITY_ZONE;
var SEMRESATTRS_CLOUD_PLATFORM = TMP_CLOUD_PLATFORM;
var SEMRESATTRS_AWS_ECS_CONTAINER_ARN = TMP_AWS_ECS_CONTAINER_ARN;
var SEMRESATTRS_AWS_ECS_CLUSTER_ARN = TMP_AWS_ECS_CLUSTER_ARN;
var SEMRESATTRS_AWS_ECS_LAUNCHTYPE = TMP_AWS_ECS_LAUNCHTYPE;
var SEMRESATTRS_AWS_ECS_TASK_ARN = TMP_AWS_ECS_TASK_ARN;
var SEMRESATTRS_AWS_ECS_TASK_FAMILY = TMP_AWS_ECS_TASK_FAMILY;
var SEMRESATTRS_AWS_ECS_TASK_REVISION = TMP_AWS_ECS_TASK_REVISION;
var SEMRESATTRS_AWS_EKS_CLUSTER_ARN = TMP_AWS_EKS_CLUSTER_ARN;
var SEMRESATTRS_AWS_LOG_GROUP_NAMES = TMP_AWS_LOG_GROUP_NAMES;
var SEMRESATTRS_AWS_LOG_GROUP_ARNS = TMP_AWS_LOG_GROUP_ARNS;
var SEMRESATTRS_AWS_LOG_STREAM_NAMES = TMP_AWS_LOG_STREAM_NAMES;
var SEMRESATTRS_AWS_LOG_STREAM_ARNS = TMP_AWS_LOG_STREAM_ARNS;
var SEMRESATTRS_CONTAINER_NAME = TMP_CONTAINER_NAME;
var SEMRESATTRS_CONTAINER_ID = TMP_CONTAINER_ID;
var SEMRESATTRS_CONTAINER_RUNTIME = TMP_CONTAINER_RUNTIME;
var SEMRESATTRS_CONTAINER_IMAGE_NAME = TMP_CONTAINER_IMAGE_NAME;
var SEMRESATTRS_CONTAINER_IMAGE_TAG = TMP_CONTAINER_IMAGE_TAG;
var SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = TMP_DEPLOYMENT_ENVIRONMENT;
var SEMRESATTRS_DEVICE_ID = TMP_DEVICE_ID;
var SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = TMP_DEVICE_MODEL_IDENTIFIER;
var SEMRESATTRS_DEVICE_MODEL_NAME = TMP_DEVICE_MODEL_NAME;
var SEMRESATTRS_FAAS_NAME = TMP_FAAS_NAME;
var SEMRESATTRS_FAAS_ID = TMP_FAAS_ID;
var SEMRESATTRS_FAAS_VERSION = TMP_FAAS_VERSION;
var SEMRESATTRS_FAAS_INSTANCE = TMP_FAAS_INSTANCE;
var SEMRESATTRS_FAAS_MAX_MEMORY = TMP_FAAS_MAX_MEMORY;
var SEMRESATTRS_HOST_ID = TMP_HOST_ID;
var SEMRESATTRS_HOST_NAME = TMP_HOST_NAME;
var SEMRESATTRS_HOST_TYPE = TMP_HOST_TYPE;
var SEMRESATTRS_HOST_ARCH = TMP_HOST_ARCH;
var SEMRESATTRS_HOST_IMAGE_NAME = TMP_HOST_IMAGE_NAME;
var SEMRESATTRS_HOST_IMAGE_ID = TMP_HOST_IMAGE_ID;
var SEMRESATTRS_HOST_IMAGE_VERSION = TMP_HOST_IMAGE_VERSION;
var SEMRESATTRS_K8S_CLUSTER_NAME = TMP_K8S_CLUSTER_NAME;
var SEMRESATTRS_K8S_NODE_NAME = TMP_K8S_NODE_NAME;
var SEMRESATTRS_K8S_NODE_UID = TMP_K8S_NODE_UID;
var SEMRESATTRS_K8S_NAMESPACE_NAME = TMP_K8S_NAMESPACE_NAME;
var SEMRESATTRS_K8S_POD_UID = TMP_K8S_POD_UID;
var SEMRESATTRS_K8S_POD_NAME = TMP_K8S_POD_NAME;
var SEMRESATTRS_K8S_CONTAINER_NAME = TMP_K8S_CONTAINER_NAME;
var SEMRESATTRS_K8S_REPLICASET_UID = TMP_K8S_REPLICASET_UID;
var SEMRESATTRS_K8S_REPLICASET_NAME = TMP_K8S_REPLICASET_NAME;
var SEMRESATTRS_K8S_DEPLOYMENT_UID = TMP_K8S_DEPLOYMENT_UID;
var SEMRESATTRS_K8S_DEPLOYMENT_NAME = TMP_K8S_DEPLOYMENT_NAME;
var SEMRESATTRS_K8S_STATEFULSET_UID = TMP_K8S_STATEFULSET_UID;
var SEMRESATTRS_K8S_STATEFULSET_NAME = TMP_K8S_STATEFULSET_NAME;
var SEMRESATTRS_K8S_DAEMONSET_UID = TMP_K8S_DAEMONSET_UID;
var SEMRESATTRS_K8S_DAEMONSET_NAME = TMP_K8S_DAEMONSET_NAME;
var SEMRESATTRS_K8S_JOB_UID = TMP_K8S_JOB_UID;
var SEMRESATTRS_K8S_JOB_NAME = TMP_K8S_JOB_NAME;
var SEMRESATTRS_K8S_CRONJOB_UID = TMP_K8S_CRONJOB_UID;
var SEMRESATTRS_K8S_CRONJOB_NAME = TMP_K8S_CRONJOB_NAME;
var SEMRESATTRS_OS_TYPE = TMP_OS_TYPE;
var SEMRESATTRS_OS_DESCRIPTION = TMP_OS_DESCRIPTION;
var SEMRESATTRS_OS_NAME = TMP_OS_NAME;
var SEMRESATTRS_OS_VERSION = TMP_OS_VERSION;
var SEMRESATTRS_PROCESS_PID = TMP_PROCESS_PID;
var SEMRESATTRS_PROCESS_EXECUTABLE_NAME = TMP_PROCESS_EXECUTABLE_NAME;
var SEMRESATTRS_PROCESS_EXECUTABLE_PATH = TMP_PROCESS_EXECUTABLE_PATH;
var SEMRESATTRS_PROCESS_COMMAND = TMP_PROCESS_COMMAND;
var SEMRESATTRS_PROCESS_COMMAND_LINE = TMP_PROCESS_COMMAND_LINE;
var SEMRESATTRS_PROCESS_COMMAND_ARGS = TMP_PROCESS_COMMAND_ARGS;
var SEMRESATTRS_PROCESS_OWNER = TMP_PROCESS_OWNER;
var SEMRESATTRS_PROCESS_RUNTIME_NAME = TMP_PROCESS_RUNTIME_NAME;
var SEMRESATTRS_PROCESS_RUNTIME_VERSION = TMP_PROCESS_RUNTIME_VERSION;
var SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = TMP_PROCESS_RUNTIME_DESCRIPTION;
var SEMRESATTRS_SERVICE_NAME = TMP_SERVICE_NAME;
var SEMRESATTRS_SERVICE_NAMESPACE = TMP_SERVICE_NAMESPACE;
var SEMRESATTRS_SERVICE_INSTANCE_ID = TMP_SERVICE_INSTANCE_ID;
var SEMRESATTRS_SERVICE_VERSION = TMP_SERVICE_VERSION;
var SEMRESATTRS_TELEMETRY_SDK_NAME = TMP_TELEMETRY_SDK_NAME;
var SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = TMP_TELEMETRY_SDK_LANGUAGE;
var SEMRESATTRS_TELEMETRY_SDK_VERSION = TMP_TELEMETRY_SDK_VERSION;
var SEMRESATTRS_TELEMETRY_AUTO_VERSION = TMP_TELEMETRY_AUTO_VERSION;
var SEMRESATTRS_WEBENGINE_NAME = TMP_WEBENGINE_NAME;
var SEMRESATTRS_WEBENGINE_VERSION = TMP_WEBENGINE_VERSION;
var SEMRESATTRS_WEBENGINE_DESCRIPTION = TMP_WEBENGINE_DESCRIPTION;
var SemanticResourceAttributes = /* @__PURE__ */ createConstMap([
  TMP_CLOUD_PROVIDER,
  TMP_CLOUD_ACCOUNT_ID,
  TMP_CLOUD_REGION,
  TMP_CLOUD_AVAILABILITY_ZONE,
  TMP_CLOUD_PLATFORM,
  TMP_AWS_ECS_CONTAINER_ARN,
  TMP_AWS_ECS_CLUSTER_ARN,
  TMP_AWS_ECS_LAUNCHTYPE,
  TMP_AWS_ECS_TASK_ARN,
  TMP_AWS_ECS_TASK_FAMILY,
  TMP_AWS_ECS_TASK_REVISION,
  TMP_AWS_EKS_CLUSTER_ARN,
  TMP_AWS_LOG_GROUP_NAMES,
  TMP_AWS_LOG_GROUP_ARNS,
  TMP_AWS_LOG_STREAM_NAMES,
  TMP_AWS_LOG_STREAM_ARNS,
  TMP_CONTAINER_NAME,
  TMP_CONTAINER_ID,
  TMP_CONTAINER_RUNTIME,
  TMP_CONTAINER_IMAGE_NAME,
  TMP_CONTAINER_IMAGE_TAG,
  TMP_DEPLOYMENT_ENVIRONMENT,
  TMP_DEVICE_ID,
  TMP_DEVICE_MODEL_IDENTIFIER,
  TMP_DEVICE_MODEL_NAME,
  TMP_FAAS_NAME,
  TMP_FAAS_ID,
  TMP_FAAS_VERSION,
  TMP_FAAS_INSTANCE,
  TMP_FAAS_MAX_MEMORY,
  TMP_HOST_ID,
  TMP_HOST_NAME,
  TMP_HOST_TYPE,
  TMP_HOST_ARCH,
  TMP_HOST_IMAGE_NAME,
  TMP_HOST_IMAGE_ID,
  TMP_HOST_IMAGE_VERSION,
  TMP_K8S_CLUSTER_NAME,
  TMP_K8S_NODE_NAME,
  TMP_K8S_NODE_UID,
  TMP_K8S_NAMESPACE_NAME,
  TMP_K8S_POD_UID,
  TMP_K8S_POD_NAME,
  TMP_K8S_CONTAINER_NAME,
  TMP_K8S_REPLICASET_UID,
  TMP_K8S_REPLICASET_NAME,
  TMP_K8S_DEPLOYMENT_UID,
  TMP_K8S_DEPLOYMENT_NAME,
  TMP_K8S_STATEFULSET_UID,
  TMP_K8S_STATEFULSET_NAME,
  TMP_K8S_DAEMONSET_UID,
  TMP_K8S_DAEMONSET_NAME,
  TMP_K8S_JOB_UID,
  TMP_K8S_JOB_NAME,
  TMP_K8S_CRONJOB_UID,
  TMP_K8S_CRONJOB_NAME,
  TMP_OS_TYPE,
  TMP_OS_DESCRIPTION,
  TMP_OS_NAME,
  TMP_OS_VERSION,
  TMP_PROCESS_PID,
  TMP_PROCESS_EXECUTABLE_NAME,
  TMP_PROCESS_EXECUTABLE_PATH,
  TMP_PROCESS_COMMAND,
  TMP_PROCESS_COMMAND_LINE,
  TMP_PROCESS_COMMAND_ARGS,
  TMP_PROCESS_OWNER,
  TMP_PROCESS_RUNTIME_NAME,
  TMP_PROCESS_RUNTIME_VERSION,
  TMP_PROCESS_RUNTIME_DESCRIPTION,
  TMP_SERVICE_NAME,
  TMP_SERVICE_NAMESPACE,
  TMP_SERVICE_INSTANCE_ID,
  TMP_SERVICE_VERSION,
  TMP_TELEMETRY_SDK_NAME,
  TMP_TELEMETRY_SDK_LANGUAGE,
  TMP_TELEMETRY_SDK_VERSION,
  TMP_TELEMETRY_AUTO_VERSION,
  TMP_WEBENGINE_NAME,
  TMP_WEBENGINE_VERSION,
  TMP_WEBENGINE_DESCRIPTION
]);
var TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
var TMP_CLOUDPROVIDERVALUES_AWS = "aws";
var TMP_CLOUDPROVIDERVALUES_AZURE = "azure";
var TMP_CLOUDPROVIDERVALUES_GCP = "gcp";
var CLOUDPROVIDERVALUES_ALIBABA_CLOUD = TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD;
var CLOUDPROVIDERVALUES_AWS = TMP_CLOUDPROVIDERVALUES_AWS;
var CLOUDPROVIDERVALUES_AZURE = TMP_CLOUDPROVIDERVALUES_AZURE;
var CLOUDPROVIDERVALUES_GCP = TMP_CLOUDPROVIDERVALUES_GCP;
var CloudProviderValues = /* @__PURE__ */ createConstMap([
  TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD,
  TMP_CLOUDPROVIDERVALUES_AWS,
  TMP_CLOUDPROVIDERVALUES_AZURE,
  TMP_CLOUDPROVIDERVALUES_GCP
]);
var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = "alibaba_cloud_ecs";
var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = "alibaba_cloud_fc";
var TMP_CLOUDPLATFORMVALUES_AWS_EC2 = "aws_ec2";
var TMP_CLOUDPLATFORMVALUES_AWS_ECS = "aws_ecs";
var TMP_CLOUDPLATFORMVALUES_AWS_EKS = "aws_eks";
var TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA = "aws_lambda";
var TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = "aws_elastic_beanstalk";
var TMP_CLOUDPLATFORMVALUES_AZURE_VM = "azure_vm";
var TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = "azure_container_instances";
var TMP_CLOUDPLATFORMVALUES_AZURE_AKS = "azure_aks";
var TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = "azure_functions";
var TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = "azure_app_service";
var TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = "gcp_compute_engine";
var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = "gcp_cloud_run";
var TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = "gcp_kubernetes_engine";
var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = "gcp_cloud_functions";
var TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE = "gcp_app_engine";
var CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS;
var CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC;
var CLOUDPLATFORMVALUES_AWS_EC2 = TMP_CLOUDPLATFORMVALUES_AWS_EC2;
var CLOUDPLATFORMVALUES_AWS_ECS = TMP_CLOUDPLATFORMVALUES_AWS_ECS;
var CLOUDPLATFORMVALUES_AWS_EKS = TMP_CLOUDPLATFORMVALUES_AWS_EKS;
var CLOUDPLATFORMVALUES_AWS_LAMBDA = TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA;
var CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK;
var CLOUDPLATFORMVALUES_AZURE_VM = TMP_CLOUDPLATFORMVALUES_AZURE_VM;
var CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES;
var CLOUDPLATFORMVALUES_AZURE_AKS = TMP_CLOUDPLATFORMVALUES_AZURE_AKS;
var CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS;
var CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE;
var CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE;
var CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN;
var CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE;
var CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS;
var CLOUDPLATFORMVALUES_GCP_APP_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE;
var CloudPlatformValues = /* @__PURE__ */ createConstMap([
  TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS,
  TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC,
  TMP_CLOUDPLATFORMVALUES_AWS_EC2,
  TMP_CLOUDPLATFORMVALUES_AWS_ECS,
  TMP_CLOUDPLATFORMVALUES_AWS_EKS,
  TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA,
  TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
  TMP_CLOUDPLATFORMVALUES_AZURE_VM,
  TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES,
  TMP_CLOUDPLATFORMVALUES_AZURE_AKS,
  TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
  TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE,
  TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE,
  TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN,
  TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE,
  TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS,
  TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE
]);
var TMP_AWSECSLAUNCHTYPEVALUES_EC2 = "ec2";
var TMP_AWSECSLAUNCHTYPEVALUES_FARGATE = "fargate";
var AWSECSLAUNCHTYPEVALUES_EC2 = TMP_AWSECSLAUNCHTYPEVALUES_EC2;
var AWSECSLAUNCHTYPEVALUES_FARGATE = TMP_AWSECSLAUNCHTYPEVALUES_FARGATE;
var AwsEcsLaunchtypeValues = /* @__PURE__ */ createConstMap([
  TMP_AWSECSLAUNCHTYPEVALUES_EC2,
  TMP_AWSECSLAUNCHTYPEVALUES_FARGATE
]);
var TMP_HOSTARCHVALUES_AMD64 = "amd64";
var TMP_HOSTARCHVALUES_ARM32 = "arm32";
var TMP_HOSTARCHVALUES_ARM64 = "arm64";
var TMP_HOSTARCHVALUES_IA64 = "ia64";
var TMP_HOSTARCHVALUES_PPC32 = "ppc32";
var TMP_HOSTARCHVALUES_PPC64 = "ppc64";
var TMP_HOSTARCHVALUES_X86 = "x86";
var HOSTARCHVALUES_AMD64 = TMP_HOSTARCHVALUES_AMD64;
var HOSTARCHVALUES_ARM32 = TMP_HOSTARCHVALUES_ARM32;
var HOSTARCHVALUES_ARM64 = TMP_HOSTARCHVALUES_ARM64;
var HOSTARCHVALUES_IA64 = TMP_HOSTARCHVALUES_IA64;
var HOSTARCHVALUES_PPC32 = TMP_HOSTARCHVALUES_PPC32;
var HOSTARCHVALUES_PPC64 = TMP_HOSTARCHVALUES_PPC64;
var HOSTARCHVALUES_X86 = TMP_HOSTARCHVALUES_X86;
var HostArchValues = /* @__PURE__ */ createConstMap([
  TMP_HOSTARCHVALUES_AMD64,
  TMP_HOSTARCHVALUES_ARM32,
  TMP_HOSTARCHVALUES_ARM64,
  TMP_HOSTARCHVALUES_IA64,
  TMP_HOSTARCHVALUES_PPC32,
  TMP_HOSTARCHVALUES_PPC64,
  TMP_HOSTARCHVALUES_X86
]);
var TMP_OSTYPEVALUES_WINDOWS = "windows";
var TMP_OSTYPEVALUES_LINUX = "linux";
var TMP_OSTYPEVALUES_DARWIN = "darwin";
var TMP_OSTYPEVALUES_FREEBSD = "freebsd";
var TMP_OSTYPEVALUES_NETBSD = "netbsd";
var TMP_OSTYPEVALUES_OPENBSD = "openbsd";
var TMP_OSTYPEVALUES_DRAGONFLYBSD = "dragonflybsd";
var TMP_OSTYPEVALUES_HPUX = "hpux";
var TMP_OSTYPEVALUES_AIX = "aix";
var TMP_OSTYPEVALUES_SOLARIS = "solaris";
var TMP_OSTYPEVALUES_Z_OS = "z_os";
var OSTYPEVALUES_WINDOWS = TMP_OSTYPEVALUES_WINDOWS;
var OSTYPEVALUES_LINUX = TMP_OSTYPEVALUES_LINUX;
var OSTYPEVALUES_DARWIN = TMP_OSTYPEVALUES_DARWIN;
var OSTYPEVALUES_FREEBSD = TMP_OSTYPEVALUES_FREEBSD;
var OSTYPEVALUES_NETBSD = TMP_OSTYPEVALUES_NETBSD;
var OSTYPEVALUES_OPENBSD = TMP_OSTYPEVALUES_OPENBSD;
var OSTYPEVALUES_DRAGONFLYBSD = TMP_OSTYPEVALUES_DRAGONFLYBSD;
var OSTYPEVALUES_HPUX = TMP_OSTYPEVALUES_HPUX;
var OSTYPEVALUES_AIX = TMP_OSTYPEVALUES_AIX;
var OSTYPEVALUES_SOLARIS = TMP_OSTYPEVALUES_SOLARIS;
var OSTYPEVALUES_Z_OS = TMP_OSTYPEVALUES_Z_OS;
var OsTypeValues = /* @__PURE__ */ createConstMap([
  TMP_OSTYPEVALUES_WINDOWS,
  TMP_OSTYPEVALUES_LINUX,
  TMP_OSTYPEVALUES_DARWIN,
  TMP_OSTYPEVALUES_FREEBSD,
  TMP_OSTYPEVALUES_NETBSD,
  TMP_OSTYPEVALUES_OPENBSD,
  TMP_OSTYPEVALUES_DRAGONFLYBSD,
  TMP_OSTYPEVALUES_HPUX,
  TMP_OSTYPEVALUES_AIX,
  TMP_OSTYPEVALUES_SOLARIS,
  TMP_OSTYPEVALUES_Z_OS
]);
var TMP_TELEMETRYSDKLANGUAGEVALUES_CPP = "cpp";
var TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET = "dotnet";
var TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG = "erlang";
var TMP_TELEMETRYSDKLANGUAGEVALUES_GO = "go";
var TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA = "java";
var TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS = "nodejs";
var TMP_TELEMETRYSDKLANGUAGEVALUES_PHP = "php";
var TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON = "python";
var TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY = "ruby";
var TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS = "webjs";
var TELEMETRYSDKLANGUAGEVALUES_CPP = TMP_TELEMETRYSDKLANGUAGEVALUES_CPP;
var TELEMETRYSDKLANGUAGEVALUES_DOTNET = TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET;
var TELEMETRYSDKLANGUAGEVALUES_ERLANG = TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG;
var TELEMETRYSDKLANGUAGEVALUES_GO = TMP_TELEMETRYSDKLANGUAGEVALUES_GO;
var TELEMETRYSDKLANGUAGEVALUES_JAVA = TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA;
var TELEMETRYSDKLANGUAGEVALUES_NODEJS = TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS;
var TELEMETRYSDKLANGUAGEVALUES_PHP = TMP_TELEMETRYSDKLANGUAGEVALUES_PHP;
var TELEMETRYSDKLANGUAGEVALUES_PYTHON = TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON;
var TELEMETRYSDKLANGUAGEVALUES_RUBY = TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY;
var TELEMETRYSDKLANGUAGEVALUES_WEBJS = TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS;
var TelemetrySdkLanguageValues = /* @__PURE__ */ createConstMap([
  TMP_TELEMETRYSDKLANGUAGEVALUES_CPP,
  TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET,
  TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG,
  TMP_TELEMETRYSDKLANGUAGEVALUES_GO,
  TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA,
  TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS,
  TMP_TELEMETRYSDKLANGUAGEVALUES_PHP,
  TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON,
  TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY,
  TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS
]);
const DEBUG_BUILD$2 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
function getMainCarrier() {
  getSentryCarrier(GLOBAL_OBJ);
  return GLOBAL_OBJ;
}
function getSentryCarrier(carrier) {
  const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
  __SENTRY__.version = __SENTRY__.version || SDK_VERSION$1;
  return __SENTRY__[SDK_VERSION$1] = __SENTRY__[SDK_VERSION$1] || {};
}
function makeSession(context2) {
  const startingTime = timestampInSeconds();
  const session2 = {
    sid: uuid4(),
    init: true,
    timestamp: startingTime,
    started: startingTime,
    duration: 0,
    status: "ok",
    errors: 0,
    ignoreDuration: false,
    toJSON: () => sessionToJSON(session2)
  };
  if (context2) {
    updateSession(session2, context2);
  }
  return session2;
}
function updateSession(session2, context2 = {}) {
  if (context2.user) {
    if (!session2.ipAddress && context2.user.ip_address) {
      session2.ipAddress = context2.user.ip_address;
    }
    if (!session2.did && !context2.did) {
      session2.did = context2.user.id || context2.user.email || context2.user.username;
    }
  }
  session2.timestamp = context2.timestamp || timestampInSeconds();
  if (context2.abnormal_mechanism) {
    session2.abnormal_mechanism = context2.abnormal_mechanism;
  }
  if (context2.ignoreDuration) {
    session2.ignoreDuration = context2.ignoreDuration;
  }
  if (context2.sid) {
    session2.sid = context2.sid.length === 32 ? context2.sid : uuid4();
  }
  if (context2.init !== void 0) {
    session2.init = context2.init;
  }
  if (!session2.did && context2.did) {
    session2.did = `${context2.did}`;
  }
  if (typeof context2.started === "number") {
    session2.started = context2.started;
  }
  if (session2.ignoreDuration) {
    session2.duration = void 0;
  } else if (typeof context2.duration === "number") {
    session2.duration = context2.duration;
  } else {
    const duration = session2.timestamp - session2.started;
    session2.duration = duration >= 0 ? duration : 0;
  }
  if (context2.release) {
    session2.release = context2.release;
  }
  if (context2.environment) {
    session2.environment = context2.environment;
  }
  if (!session2.ipAddress && context2.ipAddress) {
    session2.ipAddress = context2.ipAddress;
  }
  if (!session2.userAgent && context2.userAgent) {
    session2.userAgent = context2.userAgent;
  }
  if (typeof context2.errors === "number") {
    session2.errors = context2.errors;
  }
  if (context2.status) {
    session2.status = context2.status;
  }
}
function closeSession(session2, status) {
  let context2 = {};
  if (session2.status === "ok") {
    context2 = { status: "exited" };
  }
  updateSession(session2, context2);
}
function sessionToJSON(session2) {
  return dropUndefinedKeys({
    sid: `${session2.sid}`,
    init: session2.init,
    // Make sure that sec is converted to ms for date constructor
    started: new Date(session2.started * 1e3).toISOString(),
    timestamp: new Date(session2.timestamp * 1e3).toISOString(),
    status: session2.status,
    errors: session2.errors,
    did: typeof session2.did === "number" || typeof session2.did === "string" ? `${session2.did}` : void 0,
    duration: session2.duration,
    abnormal_mechanism: session2.abnormal_mechanism,
    attrs: {
      release: session2.release,
      environment: session2.environment,
      ip_address: session2.ipAddress,
      user_agent: session2.userAgent
    }
  });
}
const SCOPE_SPAN_FIELD = "_sentrySpan";
function _setSpanForScope(scope, span) {
  if (span) {
    addNonEnumerableProperty(scope, SCOPE_SPAN_FIELD, span);
  } else {
    delete scope[SCOPE_SPAN_FIELD];
  }
}
function _getSpanForScope(scope) {
  return scope[SCOPE_SPAN_FIELD];
}
const DEFAULT_MAX_BREADCRUMBS = 100;
class ScopeClass {
  /** Flag if notifying is happening. */
  /** Callback for client to receive scope changes. */
  /** Callback list that will be called during event processing. */
  /** Array of breadcrumbs. */
  /** User */
  /** Tags */
  /** Extra */
  /** Contexts */
  /** Attachments */
  /** Propagation Context for distributed tracing */
  /**
   * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
   * sent to Sentry
   */
  /** Fingerprint */
  /** Severity */
  /**
   * Transaction Name
   *
   * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
   * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
   */
  /** Session */
  /** Request Mode Session Status */
  /** The client on this scope */
  /** Contains the last event id of a captured event.  */
  // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
  constructor() {
    this._notifyingListeners = false;
    this._scopeListeners = [];
    this._eventProcessors = [];
    this._breadcrumbs = [];
    this._attachments = [];
    this._user = {};
    this._tags = {};
    this._extra = {};
    this._contexts = {};
    this._sdkProcessingMetadata = {};
    this._propagationContext = generatePropagationContext();
  }
  /**
   * @inheritDoc
   */
  clone() {
    const newScope = new ScopeClass();
    newScope._breadcrumbs = [...this._breadcrumbs];
    newScope._tags = { ...this._tags };
    newScope._extra = { ...this._extra };
    newScope._contexts = { ...this._contexts };
    newScope._user = this._user;
    newScope._level = this._level;
    newScope._session = this._session;
    newScope._transactionName = this._transactionName;
    newScope._fingerprint = this._fingerprint;
    newScope._eventProcessors = [...this._eventProcessors];
    newScope._requestSession = this._requestSession;
    newScope._attachments = [...this._attachments];
    newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
    newScope._propagationContext = { ...this._propagationContext };
    newScope._client = this._client;
    newScope._lastEventId = this._lastEventId;
    _setSpanForScope(newScope, _getSpanForScope(this));
    return newScope;
  }
  /**
   * @inheritDoc
   */
  setClient(client) {
    this._client = client;
  }
  /**
   * @inheritDoc
   */
  setLastEventId(lastEventId) {
    this._lastEventId = lastEventId;
  }
  /**
   * @inheritDoc
   */
  getClient() {
    return this._client;
  }
  /**
   * @inheritDoc
   */
  lastEventId() {
    return this._lastEventId;
  }
  /**
   * @inheritDoc
   */
  addScopeListener(callback) {
    this._scopeListeners.push(callback);
  }
  /**
   * @inheritDoc
   */
  addEventProcessor(callback) {
    this._eventProcessors.push(callback);
    return this;
  }
  /**
   * @inheritDoc
   */
  setUser(user) {
    this._user = user || {
      email: void 0,
      id: void 0,
      ip_address: void 0,
      username: void 0
    };
    if (this._session) {
      updateSession(this._session, { user });
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  getUser() {
    return this._user;
  }
  /**
   * @inheritDoc
   */
  getRequestSession() {
    return this._requestSession;
  }
  /**
   * @inheritDoc
   */
  setRequestSession(requestSession) {
    this._requestSession = requestSession;
    return this;
  }
  /**
   * @inheritDoc
   */
  setTags(tags) {
    this._tags = {
      ...this._tags,
      ...tags
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setTag(key, value) {
    this._tags = { ...this._tags, [key]: value };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setExtras(extras) {
    this._extra = {
      ...this._extra,
      ...extras
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setExtra(key, extra) {
    this._extra = { ...this._extra, [key]: extra };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setFingerprint(fingerprint) {
    this._fingerprint = fingerprint;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setLevel(level) {
    this._level = level;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setTransactionName(name) {
    this._transactionName = name;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setContext(key, context2) {
    if (context2 === null) {
      delete this._contexts[key];
    } else {
      this._contexts[key] = context2;
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  setSession(session2) {
    if (!session2) {
      delete this._session;
    } else {
      this._session = session2;
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  getSession() {
    return this._session;
  }
  /**
   * @inheritDoc
   */
  update(captureContext) {
    if (!captureContext) {
      return this;
    }
    const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
    const [scopeInstance, requestSession] = scopeToMerge instanceof Scope ? [scopeToMerge.getScopeData(), scopeToMerge.getRequestSession()] : isPlainObject$1(scopeToMerge) ? [captureContext, captureContext.requestSession] : [];
    const { tags, extra, user, contexts, level, fingerprint = [], propagationContext } = scopeInstance || {};
    this._tags = { ...this._tags, ...tags };
    this._extra = { ...this._extra, ...extra };
    this._contexts = { ...this._contexts, ...contexts };
    if (user && Object.keys(user).length) {
      this._user = user;
    }
    if (level) {
      this._level = level;
    }
    if (fingerprint.length) {
      this._fingerprint = fingerprint;
    }
    if (propagationContext) {
      this._propagationContext = propagationContext;
    }
    if (requestSession) {
      this._requestSession = requestSession;
    }
    return this;
  }
  /**
   * @inheritDoc
   */
  clear() {
    this._breadcrumbs = [];
    this._tags = {};
    this._extra = {};
    this._user = {};
    this._contexts = {};
    this._level = void 0;
    this._transactionName = void 0;
    this._fingerprint = void 0;
    this._requestSession = void 0;
    this._session = void 0;
    _setSpanForScope(this, void 0);
    this._attachments = [];
    this._propagationContext = generatePropagationContext();
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  addBreadcrumb(breadcrumb, maxBreadcrumbs) {
    const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
    if (maxCrumbs <= 0) {
      return this;
    }
    const mergedBreadcrumb = {
      timestamp: dateTimestampInSeconds(),
      ...breadcrumb
    };
    const breadcrumbs = this._breadcrumbs;
    breadcrumbs.push(mergedBreadcrumb);
    this._breadcrumbs = breadcrumbs.length > maxCrumbs ? breadcrumbs.slice(-maxCrumbs) : breadcrumbs;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  getLastBreadcrumb() {
    return this._breadcrumbs[this._breadcrumbs.length - 1];
  }
  /**
   * @inheritDoc
   */
  clearBreadcrumbs() {
    this._breadcrumbs = [];
    this._notifyScopeListeners();
    return this;
  }
  /**
   * @inheritDoc
   */
  addAttachment(attachment) {
    this._attachments.push(attachment);
    return this;
  }
  /**
   * @inheritDoc
   */
  clearAttachments() {
    this._attachments = [];
    return this;
  }
  /** @inheritDoc */
  getScopeData() {
    return {
      breadcrumbs: this._breadcrumbs,
      attachments: this._attachments,
      contexts: this._contexts,
      tags: this._tags,
      extra: this._extra,
      user: this._user,
      level: this._level,
      fingerprint: this._fingerprint || [],
      eventProcessors: this._eventProcessors,
      propagationContext: this._propagationContext,
      sdkProcessingMetadata: this._sdkProcessingMetadata,
      transactionName: this._transactionName,
      span: _getSpanForScope(this)
    };
  }
  /**
   * @inheritDoc
   */
  setSDKProcessingMetadata(newData) {
    this._sdkProcessingMetadata = { ...this._sdkProcessingMetadata, ...newData };
    return this;
  }
  /**
   * @inheritDoc
   */
  setPropagationContext(context2) {
    this._propagationContext = context2;
    return this;
  }
  /**
   * @inheritDoc
   */
  getPropagationContext() {
    return this._propagationContext;
  }
  /**
   * @inheritDoc
   */
  captureException(exception, hint) {
    const eventId = hint && hint.event_id ? hint.event_id : uuid4();
    if (!this._client) {
      logger.warn("No client configured on scope - will not capture exception!");
      return eventId;
    }
    const syntheticException = new Error("Sentry syntheticException");
    this._client.captureException(
      exception,
      {
        originalException: exception,
        syntheticException,
        ...hint,
        event_id: eventId
      },
      this
    );
    return eventId;
  }
  /**
   * @inheritDoc
   */
  captureMessage(message, level, hint) {
    const eventId = hint && hint.event_id ? hint.event_id : uuid4();
    if (!this._client) {
      logger.warn("No client configured on scope - will not capture message!");
      return eventId;
    }
    const syntheticException = new Error(message);
    this._client.captureMessage(
      message,
      level,
      {
        originalException: message,
        syntheticException,
        ...hint,
        event_id: eventId
      },
      this
    );
    return eventId;
  }
  /**
   * @inheritDoc
   */
  captureEvent(event, hint) {
    const eventId = hint && hint.event_id ? hint.event_id : uuid4();
    if (!this._client) {
      logger.warn("No client configured on scope - will not capture event!");
      return eventId;
    }
    this._client.captureEvent(event, { ...hint, event_id: eventId }, this);
    return eventId;
  }
  /**
   * This will be called on every set call.
   */
  _notifyScopeListeners() {
    if (!this._notifyingListeners) {
      this._notifyingListeners = true;
      this._scopeListeners.forEach((callback) => {
        callback(this);
      });
      this._notifyingListeners = false;
    }
  }
}
const Scope = ScopeClass;
function getDefaultCurrentScope() {
  return getGlobalSingleton("defaultCurrentScope", () => new Scope());
}
function getDefaultIsolationScope() {
  return getGlobalSingleton("defaultIsolationScope", () => new Scope());
}
class AsyncContextStack {
  constructor(scope, isolationScope) {
    let assignedScope;
    if (!scope) {
      assignedScope = new Scope();
    } else {
      assignedScope = scope;
    }
    let assignedIsolationScope;
    if (!isolationScope) {
      assignedIsolationScope = new Scope();
    } else {
      assignedIsolationScope = isolationScope;
    }
    this._stack = [{ scope: assignedScope }];
    this._isolationScope = assignedIsolationScope;
  }
  /**
   * Fork a scope for the stack.
   */
  withScope(callback) {
    const scope = this._pushScope();
    let maybePromiseResult;
    try {
      maybePromiseResult = callback(scope);
    } catch (e) {
      this._popScope();
      throw e;
    }
    if (isThenable(maybePromiseResult)) {
      return maybePromiseResult.then(
        (res) => {
          this._popScope();
          return res;
        },
        (e) => {
          this._popScope();
          throw e;
        }
      );
    }
    this._popScope();
    return maybePromiseResult;
  }
  /**
   * Get the client of the stack.
   */
  getClient() {
    return this.getStackTop().client;
  }
  /**
   * Returns the scope of the top stack.
   */
  getScope() {
    return this.getStackTop().scope;
  }
  /**
   * Get the isolation scope for the stack.
   */
  getIsolationScope() {
    return this._isolationScope;
  }
  /**
   * Returns the topmost scope layer in the order domain > local > process.
   */
  getStackTop() {
    return this._stack[this._stack.length - 1];
  }
  /**
   * Push a scope to the stack.
   */
  _pushScope() {
    const scope = this.getScope().clone();
    this._stack.push({
      client: this.getClient(),
      scope
    });
    return scope;
  }
  /**
   * Pop a scope from the stack.
   */
  _popScope() {
    if (this._stack.length <= 1) return false;
    return !!this._stack.pop();
  }
}
function getAsyncContextStack() {
  const registry = getMainCarrier();
  const sentry = getSentryCarrier(registry);
  return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
}
function withScope$1(callback) {
  return getAsyncContextStack().withScope(callback);
}
function withSetScope(scope, callback) {
  const stack = getAsyncContextStack();
  return stack.withScope(() => {
    stack.getStackTop().scope = scope;
    return callback(scope);
  });
}
function withIsolationScope(callback) {
  return getAsyncContextStack().withScope(() => {
    return callback(getAsyncContextStack().getIsolationScope());
  });
}
function getStackAsyncContextStrategy() {
  return {
    withIsolationScope,
    withScope: withScope$1,
    withSetScope,
    withSetIsolationScope: (_isolationScope, callback) => {
      return withIsolationScope(callback);
    },
    getCurrentScope: () => getAsyncContextStack().getScope(),
    getIsolationScope: () => getAsyncContextStack().getIsolationScope()
  };
}
function setAsyncContextStrategy(strategy) {
  const registry = getMainCarrier();
  const sentry = getSentryCarrier(registry);
  sentry.acs = strategy;
}
function getAsyncContextStrategy(carrier) {
  const sentry = getSentryCarrier(carrier);
  if (sentry.acs) {
    return sentry.acs;
  }
  return getStackAsyncContextStrategy();
}
function getCurrentScope() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  return acs.getCurrentScope();
}
function getIsolationScope() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  return acs.getIsolationScope();
}
function getGlobalScope() {
  return getGlobalSingleton("globalScope", () => new Scope());
}
function withScope(...rest) {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  if (rest.length === 2) {
    const [scope, callback] = rest;
    if (!scope) {
      return acs.withScope(callback);
    }
    return acs.withSetScope(scope, callback);
  }
  return acs.withScope(rest[0]);
}
function getClient() {
  return getCurrentScope().getClient();
}
const METRICS_SPAN_FIELD = "_sentryMetrics";
function getMetricSummaryJsonForSpan(span) {
  const storage = span[METRICS_SPAN_FIELD];
  if (!storage) {
    return void 0;
  }
  const output = {};
  for (const [, [exportKey, summary]] of storage) {
    const arr = output[exportKey] || (output[exportKey] = []);
    arr.push(dropUndefinedKeys(summary));
  }
  return output;
}
function updateMetricSummaryOnSpan(span, metricType, sanitizedName, value, unit, tags, bucketKey) {
  const existingStorage = span[METRICS_SPAN_FIELD];
  const storage = existingStorage || (span[METRICS_SPAN_FIELD] = /* @__PURE__ */ new Map());
  const exportKey = `${metricType}:${sanitizedName}@${unit}`;
  const bucketItem = storage.get(bucketKey);
  if (bucketItem) {
    const [, summary] = bucketItem;
    storage.set(bucketKey, [
      exportKey,
      {
        min: Math.min(summary.min, value),
        max: Math.max(summary.max, value),
        count: summary.count += 1,
        sum: summary.sum += value,
        tags: summary.tags
      }
    ]);
  } else {
    storage.set(bucketKey, [
      exportKey,
      {
        min: value,
        max: value,
        count: 1,
        sum: value,
        tags
      }
    ]);
  }
}
const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source";
const SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
const SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
const SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = "sentry.measurement_unit";
const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = "sentry.measurement_value";
const SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";
const SPAN_STATUS_UNSET = 0;
const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;
function getSpanStatusFromHttpCode(httpStatus) {
  if (httpStatus < 400 && httpStatus >= 100) {
    return { code: SPAN_STATUS_OK };
  }
  if (httpStatus >= 400 && httpStatus < 500) {
    switch (httpStatus) {
      case 401:
        return { code: SPAN_STATUS_ERROR, message: "unauthenticated" };
      case 403:
        return { code: SPAN_STATUS_ERROR, message: "permission_denied" };
      case 404:
        return { code: SPAN_STATUS_ERROR, message: "not_found" };
      case 409:
        return { code: SPAN_STATUS_ERROR, message: "already_exists" };
      case 413:
        return { code: SPAN_STATUS_ERROR, message: "failed_precondition" };
      case 429:
        return { code: SPAN_STATUS_ERROR, message: "resource_exhausted" };
      case 499:
        return { code: SPAN_STATUS_ERROR, message: "cancelled" };
      default:
        return { code: SPAN_STATUS_ERROR, message: "invalid_argument" };
    }
  }
  if (httpStatus >= 500 && httpStatus < 600) {
    switch (httpStatus) {
      case 501:
        return { code: SPAN_STATUS_ERROR, message: "unimplemented" };
      case 503:
        return { code: SPAN_STATUS_ERROR, message: "unavailable" };
      case 504:
        return { code: SPAN_STATUS_ERROR, message: "deadline_exceeded" };
      default:
        return { code: SPAN_STATUS_ERROR, message: "internal_error" };
    }
  }
  return { code: SPAN_STATUS_ERROR, message: "unknown_error" };
}
function setHttpStatus(span, httpStatus) {
  span.setAttribute("http.response.status_code", httpStatus);
  const spanStatus = getSpanStatusFromHttpCode(httpStatus);
  if (spanStatus.message !== "unknown_error") {
    span.setStatus(spanStatus);
  }
}
const TRACE_FLAG_NONE = 0;
const TRACE_FLAG_SAMPLED = 1;
function spanToTransactionTraceContext(span) {
  const { spanId: span_id, traceId: trace_id } = span.spanContext();
  const { data, op, parent_span_id, status, origin } = spanToJSON(span);
  return dropUndefinedKeys({
    parent_span_id,
    span_id,
    trace_id,
    data,
    op,
    status,
    origin
  });
}
function spanToTraceContext(span) {
  const { spanId: span_id, traceId: trace_id } = span.spanContext();
  const { parent_span_id } = spanToJSON(span);
  return dropUndefinedKeys({ parent_span_id, span_id, trace_id });
}
function spanToTraceHeader(span) {
  const { traceId, spanId } = span.spanContext();
  const sampled = spanIsSampled(span);
  return generateSentryTraceHeader(traceId, spanId, sampled);
}
function spanTimeInputToSeconds(input) {
  if (typeof input === "number") {
    return ensureTimestampInSeconds(input);
  }
  if (Array.isArray(input)) {
    return input[0] + input[1] / 1e9;
  }
  if (input instanceof Date) {
    return ensureTimestampInSeconds(input.getTime());
  }
  return timestampInSeconds();
}
function ensureTimestampInSeconds(timestamp) {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp / 1e3 : timestamp;
}
function spanToJSON(span) {
  if (spanIsSentrySpan(span)) {
    return span.getSpanJSON();
  }
  try {
    const { spanId: span_id, traceId: trace_id } = span.spanContext();
    if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
      const { attributes, startTime, name, endTime, parentSpanId, status } = span;
      return dropUndefinedKeys({
        span_id,
        trace_id,
        data: attributes,
        description: name,
        parent_span_id: parentSpanId,
        start_timestamp: spanTimeInputToSeconds(startTime),
        // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
        timestamp: spanTimeInputToSeconds(endTime) || void 0,
        status: getStatusMessage(status),
        op: attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
        origin: attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
        _metrics_summary: getMetricSummaryJsonForSpan(span)
      });
    }
    return {
      span_id,
      trace_id
    };
  } catch (e) {
    return {};
  }
}
function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
  const castSpan = span;
  return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}
function spanIsSentrySpan(span) {
  return typeof span.getSpanJSON === "function";
}
function spanIsSampled(span) {
  const { traceFlags } = span.spanContext();
  return traceFlags === TRACE_FLAG_SAMPLED;
}
function getStatusMessage(status) {
  if (!status || status.code === SPAN_STATUS_UNSET) {
    return void 0;
  }
  if (status.code === SPAN_STATUS_OK) {
    return "ok";
  }
  return status.message || "unknown_error";
}
const CHILD_SPANS_FIELD = "_sentryChildSpans";
const ROOT_SPAN_FIELD = "_sentryRootSpan";
function addChildSpanToSpan(span, childSpan) {
  const rootSpan = span[ROOT_SPAN_FIELD] || span;
  addNonEnumerableProperty(childSpan, ROOT_SPAN_FIELD, rootSpan);
  if (span[CHILD_SPANS_FIELD]) {
    span[CHILD_SPANS_FIELD].add(childSpan);
  } else {
    addNonEnumerableProperty(span, CHILD_SPANS_FIELD, /* @__PURE__ */ new Set([childSpan]));
  }
}
function getSpanDescendants(span) {
  const resultSet = /* @__PURE__ */ new Set();
  function addSpanChildren(span2) {
    if (resultSet.has(span2)) {
      return;
    } else if (spanIsSampled(span2)) {
      resultSet.add(span2);
      const childSpans = span2[CHILD_SPANS_FIELD] ? Array.from(span2[CHILD_SPANS_FIELD]) : [];
      for (const childSpan of childSpans) {
        addSpanChildren(childSpan);
      }
    }
  }
  addSpanChildren(span);
  return Array.from(resultSet);
}
function getRootSpan(span) {
  return span[ROOT_SPAN_FIELD] || span;
}
function getActiveSpan$1() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  if (acs.getActiveSpan) {
    return acs.getActiveSpan();
  }
  return _getSpanForScope(getCurrentScope());
}
function updateMetricSummaryOnActiveSpan(metricType, sanitizedName, value, unit, tags, bucketKey) {
  const span = getActiveSpan$1();
  if (span) {
    updateMetricSummaryOnSpan(span, metricType, sanitizedName, value, unit, tags, bucketKey);
  }
}
let errorsInstrumented = false;
function registerSpanErrorInstrumentation() {
  if (errorsInstrumented) {
    return;
  }
  errorsInstrumented = true;
  addGlobalErrorInstrumentationHandler(errorCallback);
  addGlobalUnhandledRejectionInstrumentationHandler(errorCallback);
}
function errorCallback() {
  const activeSpan = getActiveSpan$1();
  const rootSpan = activeSpan && getRootSpan(activeSpan);
  if (rootSpan) {
    const message = "internal_error";
    DEBUG_BUILD$2 && logger.log(`[Tracing] Root span: ${message} -> Global error occured`);
    rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message });
  }
}
errorCallback.tag = "sentry_tracingErrorCallback";
const SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
const ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
function setCapturedScopesOnSpan(span, scope, isolationScope) {
  if (span) {
    addNonEnumerableProperty(span, ISOLATION_SCOPE_ON_START_SPAN_FIELD, isolationScope);
    addNonEnumerableProperty(span, SCOPE_ON_START_SPAN_FIELD, scope);
  }
}
function getCapturedScopesOnSpan(span) {
  return {
    scope: span[SCOPE_ON_START_SPAN_FIELD],
    isolationScope: span[ISOLATION_SCOPE_ON_START_SPAN_FIELD]
  };
}
function hasTracingEnabled(maybeOptions) {
  if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) {
    return false;
  }
  const client = getClient();
  const options = maybeOptions || client && client.getOptions();
  return !!options && (options.enableTracing || "tracesSampleRate" in options || "tracesSampler" in options);
}
class SentryNonRecordingSpan {
  constructor(spanContext = {}) {
    this._traceId = spanContext.traceId || uuid4();
    this._spanId = spanContext.spanId || uuid4().substring(16);
  }
  /** @inheritdoc */
  spanContext() {
    return {
      spanId: this._spanId,
      traceId: this._traceId,
      traceFlags: TRACE_FLAG_NONE
    };
  }
  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  end(_timestamp) {
  }
  /** @inheritdoc */
  setAttribute(_key, _value) {
    return this;
  }
  /** @inheritdoc */
  setAttributes(_values) {
    return this;
  }
  /** @inheritdoc */
  setStatus(_status) {
    return this;
  }
  /** @inheritdoc */
  updateName(_name) {
    return this;
  }
  /** @inheritdoc */
  isRecording() {
    return false;
  }
  /** @inheritdoc */
  addEvent(_name, _attributesOrStartTime, _startTime) {
    return this;
  }
  /**
   * This should generally not be used,
   * but we need it for being comliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  addLink(_link) {
    return this;
  }
  /**
   * This should generally not be used,
   * but we need it for being comliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  addLinks(_links) {
    return this;
  }
  /**
   * This should generally not be used,
   * but we need it for being comliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  recordException(_exception, _time) {
  }
}
function handleCallbackErrors(fn, onError, onFinally = () => {
}) {
  let maybePromiseResult;
  try {
    maybePromiseResult = fn();
  } catch (e) {
    onError(e);
    onFinally();
    throw e;
  }
  return maybeHandlePromiseRejection(maybePromiseResult, onError, onFinally);
}
function maybeHandlePromiseRejection(value, onError, onFinally) {
  if (isThenable(value)) {
    return value.then(
      (res) => {
        onFinally();
        return res;
      },
      (e) => {
        onError(e);
        onFinally();
        throw e;
      }
    );
  }
  onFinally();
  return value;
}
const DEFAULT_ENVIRONMENT$1 = "production";
const FROZEN_DSC_FIELD = "_frozenDsc";
function freezeDscOnSpan(span, dsc) {
  const spanWithMaybeDsc = span;
  addNonEnumerableProperty(spanWithMaybeDsc, FROZEN_DSC_FIELD, dsc);
}
function getDynamicSamplingContextFromClient(trace_id, client) {
  const options = client.getOptions();
  const { publicKey: public_key } = client.getDsn() || {};
  const dsc = dropUndefinedKeys({
    environment: options.environment || DEFAULT_ENVIRONMENT$1,
    release: options.release,
    public_key,
    trace_id
  });
  client.emit("createDsc", dsc);
  return dsc;
}
function getDynamicSamplingContextFromSpan(span) {
  const client = getClient();
  if (!client) {
    return {};
  }
  const dsc = getDynamicSamplingContextFromClient(spanToJSON(span).trace_id || "", client);
  const rootSpan = getRootSpan(span);
  const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
  if (frozenDsc) {
    return frozenDsc;
  }
  const traceState = rootSpan.spanContext().traceState;
  const traceStateDsc = traceState && traceState.get("sentry.dsc");
  const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
  if (dscOnTraceState) {
    return dscOnTraceState;
  }
  const jsonSpan = spanToJSON(rootSpan);
  const attributes = jsonSpan.data || {};
  const maybeSampleRate = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
  if (maybeSampleRate != null) {
    dsc.sample_rate = `${maybeSampleRate}`;
  }
  const source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
  const name = jsonSpan.description;
  if (source !== "url" && name) {
    dsc.transaction = name;
  }
  dsc.sampled = String(spanIsSampled(rootSpan));
  client.emit("createDsc", dsc, rootSpan);
  return dsc;
}
function logSpanStart(span) {
  if (!DEBUG_BUILD$2) return;
  const { description = "< unknown name >", op = "< unknown op >", parent_span_id: parentSpanId } = spanToJSON(span);
  const { spanId } = span.spanContext();
  const sampled = spanIsSampled(span);
  const rootSpan = getRootSpan(span);
  const isRootSpan = rootSpan === span;
  const header = `[Tracing] Starting ${sampled ? "sampled" : "unsampled"} ${isRootSpan ? "root " : ""}span`;
  const infoParts = [`op: ${op}`, `name: ${description}`, `ID: ${spanId}`];
  if (parentSpanId) {
    infoParts.push(`parent ID: ${parentSpanId}`);
  }
  if (!isRootSpan) {
    const { op: op2, description: description2 } = spanToJSON(rootSpan);
    infoParts.push(`root ID: ${rootSpan.spanContext().spanId}`);
    if (op2) {
      infoParts.push(`root op: ${op2}`);
    }
    if (description2) {
      infoParts.push(`root description: ${description2}`);
    }
  }
  logger.log(`${header}
  ${infoParts.join("\n  ")}`);
}
function logSpanEnd(span) {
  if (!DEBUG_BUILD$2) return;
  const { description = "< unknown name >", op = "< unknown op >" } = spanToJSON(span);
  const { spanId } = span.spanContext();
  const rootSpan = getRootSpan(span);
  const isRootSpan = rootSpan === span;
  const msg = `[Tracing] Finishing "${op}" ${isRootSpan ? "root " : ""}span "${description}" with ID ${spanId}`;
  logger.log(msg);
}
function parseSampleRate(sampleRate) {
  if (typeof sampleRate === "boolean") {
    return Number(sampleRate);
  }
  const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
  if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) {
    DEBUG_BUILD$2 && logger.warn(
      `[Tracing] Given sample rate is invalid. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
        sampleRate
      )} of type ${JSON.stringify(typeof sampleRate)}.`
    );
    return void 0;
  }
  return rate;
}
function sampleSpan(options, samplingContext) {
  if (!hasTracingEnabled(options)) {
    return [false];
  }
  let sampleRate;
  if (typeof options.tracesSampler === "function") {
    sampleRate = options.tracesSampler(samplingContext);
  } else if (samplingContext.parentSampled !== void 0) {
    sampleRate = samplingContext.parentSampled;
  } else if (typeof options.tracesSampleRate !== "undefined") {
    sampleRate = options.tracesSampleRate;
  } else {
    sampleRate = 1;
  }
  const parsedSampleRate = parseSampleRate(sampleRate);
  if (parsedSampleRate === void 0) {
    DEBUG_BUILD$2 && logger.warn("[Tracing] Discarding transaction because of invalid sample rate.");
    return [false];
  }
  if (!parsedSampleRate) {
    DEBUG_BUILD$2 && logger.log(
      `[Tracing] Discarding transaction because ${typeof options.tracesSampler === "function" ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`
    );
    return [false, parsedSampleRate];
  }
  const shouldSample = Math.random() < parsedSampleRate;
  if (!shouldSample) {
    DEBUG_BUILD$2 && logger.log(
      `[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(
        sampleRate
      )})`
    );
    return [false, parsedSampleRate];
  }
  return [true, parsedSampleRate];
}
function enhanceEventWithSdkInfo(event, sdkInfo) {
  if (!sdkInfo) {
    return event;
  }
  event.sdk = event.sdk || {};
  event.sdk.name = event.sdk.name || sdkInfo.name;
  event.sdk.version = event.sdk.version || sdkInfo.version;
  event.sdk.integrations = [...event.sdk.integrations || [], ...sdkInfo.integrations || []];
  event.sdk.packages = [...event.sdk.packages || [], ...sdkInfo.packages || []];
  return event;
}
function createSessionEnvelope(session2, dsn, metadata, tunnel) {
  const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
  const envelopeHeaders = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...sdkInfo && { sdk: sdkInfo },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
  };
  const envelopeItem = "aggregates" in session2 ? [{ type: "sessions" }, session2] : [{ type: "session" }, session2.toJSON()];
  return createEnvelope(envelopeHeaders, [envelopeItem]);
}
function createEventEnvelope(event, dsn, metadata, tunnel) {
  const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
  const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
  enhanceEventWithSdkInfo(event, metadata && metadata.sdk);
  const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
  delete event.sdkProcessingMetadata;
  const eventItem = [{ type: eventType }, event];
  return createEnvelope(envelopeHeaders, [eventItem]);
}
function createSpanEnvelope(spans, client) {
  function dscHasRequiredProps(dsc2) {
    return !!dsc2.trace_id && !!dsc2.public_key;
  }
  const dsc = getDynamicSamplingContextFromSpan(spans[0]);
  const dsn = client && client.getDsn();
  const tunnel = client && client.getOptions().tunnel;
  const headers = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...dscHasRequiredProps(dsc) && { trace: dsc },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
  };
  const beforeSendSpan = client && client.getOptions().beforeSendSpan;
  const convertToSpanJSON = beforeSendSpan ? (span) => beforeSendSpan(spanToJSON(span)) : (span) => spanToJSON(span);
  const items = [];
  for (const span of spans) {
    const spanJson = convertToSpanJSON(span);
    if (spanJson) {
      items.push(createSpanEnvelopeItem(spanJson));
    }
  }
  return createEnvelope(headers, items);
}
function timedEventsToMeasurements(events) {
  if (!events || events.length === 0) {
    return void 0;
  }
  const measurements = {};
  events.forEach((event) => {
    const attributes = event.attributes || {};
    const unit = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT];
    const value = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE];
    if (typeof unit === "string" && typeof value === "number") {
      measurements[event.name] = { value, unit };
    }
  });
  return measurements;
}
const MAX_SPAN_COUNT$1 = 1e3;
class SentrySpan {
  /** Epoch timestamp in seconds when the span started. */
  /** Epoch timestamp in seconds when the span ended. */
  /** Internal keeper of the status */
  /** The timed events added to this span. */
  /** if true, treat span as a standalone span (not part of a transaction) */
  /**
   * You should never call the constructor manually, always use `Sentry.startSpan()`
   * or other span methods.
   * @internal
   * @hideconstructor
   * @hidden
   */
  constructor(spanContext = {}) {
    this._traceId = spanContext.traceId || uuid4();
    this._spanId = spanContext.spanId || uuid4().substring(16);
    this._startTime = spanContext.startTimestamp || timestampInSeconds();
    this._attributes = {};
    this.setAttributes({
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "manual",
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: spanContext.op,
      ...spanContext.attributes
    });
    this._name = spanContext.name;
    if (spanContext.parentSpanId) {
      this._parentSpanId = spanContext.parentSpanId;
    }
    if ("sampled" in spanContext) {
      this._sampled = spanContext.sampled;
    }
    if (spanContext.endTimestamp) {
      this._endTime = spanContext.endTimestamp;
    }
    this._events = [];
    this._isStandaloneSpan = spanContext.isStandalone;
    if (this._endTime) {
      this._onSpanEnded();
    }
  }
  /**
   * This should generally not be used,
   * but it is needed for being compliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  addLink(_link) {
    return this;
  }
  /**
   * This should generally not be used,
   * but it is needed for being compliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  addLinks(_links) {
    return this;
  }
  /**
   * This should generally not be used,
   * but it is needed for being compliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  recordException(_exception, _time) {
  }
  /** @inheritdoc */
  spanContext() {
    const { _spanId: spanId, _traceId: traceId, _sampled: sampled } = this;
    return {
      spanId,
      traceId,
      traceFlags: sampled ? TRACE_FLAG_SAMPLED : TRACE_FLAG_NONE
    };
  }
  /** @inheritdoc */
  setAttribute(key, value) {
    if (value === void 0) {
      delete this._attributes[key];
    } else {
      this._attributes[key] = value;
    }
    return this;
  }
  /** @inheritdoc */
  setAttributes(attributes) {
    Object.keys(attributes).forEach((key) => this.setAttribute(key, attributes[key]));
    return this;
  }
  /**
   * This should generally not be used,
   * but we need it for browser tracing where we want to adjust the start time afterwards.
   * USE THIS WITH CAUTION!
   *
   * @hidden
   * @internal
   */
  updateStartTime(timeInput) {
    this._startTime = spanTimeInputToSeconds(timeInput);
  }
  /**
   * @inheritDoc
   */
  setStatus(value) {
    this._status = value;
    return this;
  }
  /**
   * @inheritDoc
   */
  updateName(name) {
    this._name = name;
    return this;
  }
  /** @inheritdoc */
  end(endTimestamp) {
    if (this._endTime) {
      return;
    }
    this._endTime = spanTimeInputToSeconds(endTimestamp);
    logSpanEnd(this);
    this._onSpanEnded();
  }
  /**
   * Get JSON representation of this span.
   *
   * @hidden
   * @internal This method is purely for internal purposes and should not be used outside
   * of SDK code. If you need to get a JSON representation of a span,
   * use `spanToJSON(span)` instead.
   */
  getSpanJSON() {
    return dropUndefinedKeys({
      data: this._attributes,
      description: this._name,
      op: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
      parent_span_id: this._parentSpanId,
      span_id: this._spanId,
      start_timestamp: this._startTime,
      status: getStatusMessage(this._status),
      timestamp: this._endTime,
      trace_id: this._traceId,
      origin: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
      _metrics_summary: getMetricSummaryJsonForSpan(this),
      profile_id: this._attributes[SEMANTIC_ATTRIBUTE_PROFILE_ID],
      exclusive_time: this._attributes[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
      measurements: timedEventsToMeasurements(this._events),
      is_segment: this._isStandaloneSpan && getRootSpan(this) === this || void 0,
      segment_id: this._isStandaloneSpan ? getRootSpan(this).spanContext().spanId : void 0
    });
  }
  /** @inheritdoc */
  isRecording() {
    return !this._endTime && !!this._sampled;
  }
  /**
   * @inheritdoc
   */
  addEvent(name, attributesOrStartTime, startTime) {
    DEBUG_BUILD$2 && logger.log("[Tracing] Adding an event to span:", name);
    const time = isSpanTimeInput(attributesOrStartTime) ? attributesOrStartTime : startTime || timestampInSeconds();
    const attributes = isSpanTimeInput(attributesOrStartTime) ? {} : attributesOrStartTime || {};
    const event = {
      name,
      time: spanTimeInputToSeconds(time),
      attributes
    };
    this._events.push(event);
    return this;
  }
  /**
   * This method should generally not be used,
   * but for now we need a way to publicly check if the `_isStandaloneSpan` flag is set.
   * USE THIS WITH CAUTION!
   * @internal
   * @hidden
   * @experimental
   */
  isStandaloneSpan() {
    return !!this._isStandaloneSpan;
  }
  /** Emit `spanEnd` when the span is ended. */
  _onSpanEnded() {
    const client = getClient();
    if (client) {
      client.emit("spanEnd", this);
    }
    const isSegmentSpan = this._isStandaloneSpan || this === getRootSpan(this);
    if (!isSegmentSpan) {
      return;
    }
    if (this._isStandaloneSpan) {
      if (this._sampled) {
        sendSpanEnvelope(createSpanEnvelope([this], client));
      } else {
        DEBUG_BUILD$2 && logger.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled.");
        if (client) {
          client.recordDroppedEvent("sample_rate", "span");
        }
      }
      return;
    }
    const transactionEvent = this._convertSpanToTransaction();
    if (transactionEvent) {
      const scope = getCapturedScopesOnSpan(this).scope || getCurrentScope();
      scope.captureEvent(transactionEvent);
    }
  }
  /**
   * Finish the transaction & prepare the event to send to Sentry.
   */
  _convertSpanToTransaction() {
    if (!isFullFinishedSpan(spanToJSON(this))) {
      return void 0;
    }
    if (!this._name) {
      DEBUG_BUILD$2 && logger.warn("Transaction has no name, falling back to `<unlabeled transaction>`.");
      this._name = "<unlabeled transaction>";
    }
    const { scope: capturedSpanScope, isolationScope: capturedSpanIsolationScope } = getCapturedScopesOnSpan(this);
    const scope = capturedSpanScope || getCurrentScope();
    const client = scope.getClient() || getClient();
    if (this._sampled !== true) {
      DEBUG_BUILD$2 && logger.log("[Tracing] Discarding transaction because its trace was not chosen to be sampled.");
      if (client) {
        client.recordDroppedEvent("sample_rate", "transaction");
      }
      return void 0;
    }
    const finishedSpans = getSpanDescendants(this).filter((span) => span !== this && !isStandaloneSpan(span));
    const spans = finishedSpans.map((span) => spanToJSON(span)).filter(isFullFinishedSpan);
    const source = this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    const transaction = {
      contexts: {
        trace: spanToTransactionTraceContext(this)
      },
      spans: (
        // spans.sort() mutates the array, but `spans` is already a copy so we can safely do this here
        // we do not use spans anymore after this point
        spans.length > MAX_SPAN_COUNT$1 ? spans.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT$1) : spans
      ),
      start_timestamp: this._startTime,
      timestamp: this._endTime,
      transaction: this._name,
      type: "transaction",
      sdkProcessingMetadata: {
        capturedSpanScope,
        capturedSpanIsolationScope,
        ...dropUndefinedKeys({
          dynamicSamplingContext: getDynamicSamplingContextFromSpan(this)
        })
      },
      _metrics_summary: getMetricSummaryJsonForSpan(this),
      ...source && {
        transaction_info: {
          source
        }
      }
    };
    const measurements = timedEventsToMeasurements(this._events);
    const hasMeasurements = measurements && Object.keys(measurements).length;
    if (hasMeasurements) {
      DEBUG_BUILD$2 && logger.log(
        "[Measurements] Adding measurements to transaction event",
        JSON.stringify(measurements, void 0, 2)
      );
      transaction.measurements = measurements;
    }
    return transaction;
  }
}
function isSpanTimeInput(value) {
  return value && typeof value === "number" || value instanceof Date || Array.isArray(value);
}
function isFullFinishedSpan(input) {
  return !!input.start_timestamp && !!input.timestamp && !!input.span_id && !!input.trace_id;
}
function isStandaloneSpan(span) {
  return span instanceof SentrySpan && span.isStandaloneSpan();
}
function sendSpanEnvelope(envelope) {
  const client = getClient();
  if (!client) {
    return;
  }
  const spanItems = envelope[1];
  if (!spanItems || spanItems.length === 0) {
    client.recordDroppedEvent("before_send", "span");
    return;
  }
  const transport = client.getTransport();
  if (transport) {
    transport.send(envelope).then(null, (reason) => {
      DEBUG_BUILD$2 && logger.error("Error while sending span:", reason);
    });
  }
}
const SUPPRESS_TRACING_KEY$1 = "__SENTRY_SUPPRESS_TRACING__";
function startSpanManual$1(options, callback) {
  const acs = getAcs();
  if (acs.startSpanManual) {
    return acs.startSpanManual(options, callback);
  }
  const spanArguments = parseSentrySpanArguments(options);
  const { forceTransaction, parentSpan: customParentSpan } = options;
  return withScope(options.scope, () => {
    const wrapper = getActiveSpanWrapper$1(customParentSpan);
    return wrapper(() => {
      const scope = getCurrentScope();
      const parentSpan = getParentSpan(scope);
      const shouldSkipSpan = options.onlyIfParent && !parentSpan;
      const activeSpan = shouldSkipSpan ? new SentryNonRecordingSpan() : createChildOrRootSpan({
        parentSpan,
        spanArguments,
        forceTransaction,
        scope
      });
      _setSpanForScope(scope, activeSpan);
      function finishAndSetSpan() {
        activeSpan.end();
      }
      return handleCallbackErrors(
        () => callback(activeSpan, finishAndSetSpan),
        () => {
          const { status } = spanToJSON(activeSpan);
          if (activeSpan.isRecording() && (!status || status === "ok")) {
            activeSpan.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
          }
        }
      );
    });
  });
}
function startInactiveSpan$1(options) {
  const acs = getAcs();
  if (acs.startInactiveSpan) {
    return acs.startInactiveSpan(options);
  }
  const spanArguments = parseSentrySpanArguments(options);
  const { forceTransaction, parentSpan: customParentSpan } = options;
  const wrapper = options.scope ? (callback) => withScope(options.scope, callback) : customParentSpan !== void 0 ? (callback) => withActiveSpan$1(customParentSpan, callback) : (callback) => callback();
  return wrapper(() => {
    const scope = getCurrentScope();
    const parentSpan = getParentSpan(scope);
    const shouldSkipSpan = options.onlyIfParent && !parentSpan;
    if (shouldSkipSpan) {
      return new SentryNonRecordingSpan();
    }
    return createChildOrRootSpan({
      parentSpan,
      spanArguments,
      forceTransaction,
      scope
    });
  });
}
function withActiveSpan$1(span, callback) {
  const acs = getAcs();
  if (acs.withActiveSpan) {
    return acs.withActiveSpan(span, callback);
  }
  return withScope((scope) => {
    _setSpanForScope(scope, span || void 0);
    return callback(scope);
  });
}
function createChildOrRootSpan({
  parentSpan,
  spanArguments,
  forceTransaction,
  scope
}) {
  if (!hasTracingEnabled()) {
    return new SentryNonRecordingSpan();
  }
  const isolationScope = getIsolationScope();
  let span;
  if (parentSpan && !forceTransaction) {
    span = _startChildSpan(parentSpan, scope, spanArguments);
    addChildSpanToSpan(parentSpan, span);
  } else if (parentSpan) {
    const dsc = getDynamicSamplingContextFromSpan(parentSpan);
    const { traceId, spanId: parentSpanId } = parentSpan.spanContext();
    const parentSampled = spanIsSampled(parentSpan);
    span = _startRootSpan(
      {
        traceId,
        parentSpanId,
        ...spanArguments
      },
      scope,
      parentSampled
    );
    freezeDscOnSpan(span, dsc);
  } else {
    const {
      traceId,
      dsc,
      parentSpanId,
      sampled: parentSampled
    } = {
      ...isolationScope.getPropagationContext(),
      ...scope.getPropagationContext()
    };
    span = _startRootSpan(
      {
        traceId,
        parentSpanId,
        ...spanArguments
      },
      scope,
      parentSampled
    );
    if (dsc) {
      freezeDscOnSpan(span, dsc);
    }
  }
  logSpanStart(span);
  setCapturedScopesOnSpan(span, scope, isolationScope);
  return span;
}
function parseSentrySpanArguments(options) {
  const exp = options.experimental || {};
  const initialCtx = {
    isStandalone: exp.standalone,
    ...options
  };
  if (options.startTime) {
    const ctx = { ...initialCtx };
    ctx.startTimestamp = spanTimeInputToSeconds(options.startTime);
    delete ctx.startTime;
    return ctx;
  }
  return initialCtx;
}
function getAcs() {
  const carrier = getMainCarrier();
  return getAsyncContextStrategy(carrier);
}
function _startRootSpan(spanArguments, scope, parentSampled) {
  const client = getClient();
  const options = client && client.getOptions() || {};
  const { name = "", attributes } = spanArguments;
  const [sampled, sampleRate] = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY$1] ? [false] : sampleSpan(options, {
    name,
    parentSampled,
    attributes,
    transactionContext: {
      name,
      parentSampled
    }
  });
  const rootSpan = new SentrySpan({
    ...spanArguments,
    attributes: {
      [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "custom",
      ...spanArguments.attributes
    },
    sampled
  });
  if (sampleRate !== void 0) {
    rootSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE, sampleRate);
  }
  if (client) {
    client.emit("spanStart", rootSpan);
  }
  return rootSpan;
}
function _startChildSpan(parentSpan, scope, spanArguments) {
  const { spanId, traceId } = parentSpan.spanContext();
  const sampled = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY$1] ? false : spanIsSampled(parentSpan);
  const childSpan = sampled ? new SentrySpan({
    ...spanArguments,
    parentSpanId: spanId,
    traceId,
    sampled
  }) : new SentryNonRecordingSpan({ traceId });
  addChildSpanToSpan(parentSpan, childSpan);
  const client = getClient();
  if (client) {
    client.emit("spanStart", childSpan);
    if (spanArguments.endTimestamp) {
      client.emit("spanEnd", childSpan);
    }
  }
  return childSpan;
}
function getParentSpan(scope) {
  const span = _getSpanForScope(scope);
  if (!span) {
    return void 0;
  }
  const client = getClient();
  const options = client ? client.getOptions() : {};
  if (options.parentSpanIsAlwaysRootSpan) {
    return getRootSpan(span);
  }
  return span;
}
function getActiveSpanWrapper$1(parentSpan) {
  return parentSpan !== void 0 ? (callback) => {
    return withActiveSpan$1(parentSpan, callback);
  } : (callback) => callback();
}
function notifyEventProcessors(processors, event, hint, index2 = 0) {
  return new SyncPromise((resolve2, reject) => {
    const processor = processors[index2];
    if (event === null || typeof processor !== "function") {
      resolve2(event);
    } else {
      const result = processor({ ...event }, hint);
      DEBUG_BUILD$2 && processor.id && result === null && logger.log(`Event processor "${processor.id}" dropped event`);
      if (isThenable(result)) {
        void result.then((final) => notifyEventProcessors(processors, final, hint, index2 + 1).then(resolve2)).then(null, reject);
      } else {
        void notifyEventProcessors(processors, result, hint, index2 + 1).then(resolve2).then(null, reject);
      }
    }
  });
}
function applyScopeDataToEvent(event, data) {
  const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
  applyDataToEvent(event, data);
  if (span) {
    applySpanToEvent(event, span);
  }
  applyFingerprintToEvent(event, fingerprint);
  applyBreadcrumbsToEvent(event, breadcrumbs);
  applySdkMetadataToEvent(event, sdkProcessingMetadata);
}
function mergeScopeData(data, mergeData) {
  const {
    extra,
    tags,
    user,
    contexts,
    level,
    sdkProcessingMetadata,
    breadcrumbs,
    fingerprint,
    eventProcessors,
    attachments,
    propagationContext,
    transactionName,
    span
  } = mergeData;
  mergeAndOverwriteScopeData(data, "extra", extra);
  mergeAndOverwriteScopeData(data, "tags", tags);
  mergeAndOverwriteScopeData(data, "user", user);
  mergeAndOverwriteScopeData(data, "contexts", contexts);
  mergeAndOverwriteScopeData(data, "sdkProcessingMetadata", sdkProcessingMetadata);
  if (level) {
    data.level = level;
  }
  if (transactionName) {
    data.transactionName = transactionName;
  }
  if (span) {
    data.span = span;
  }
  if (breadcrumbs.length) {
    data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
  }
  if (fingerprint.length) {
    data.fingerprint = [...data.fingerprint, ...fingerprint];
  }
  if (eventProcessors.length) {
    data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
  }
  if (attachments.length) {
    data.attachments = [...data.attachments, ...attachments];
  }
  data.propagationContext = { ...data.propagationContext, ...propagationContext };
}
function mergeAndOverwriteScopeData(data, prop, mergeVal) {
  if (mergeVal && Object.keys(mergeVal).length) {
    data[prop] = { ...data[prop] };
    for (const key in mergeVal) {
      if (Object.prototype.hasOwnProperty.call(mergeVal, key)) {
        data[prop][key] = mergeVal[key];
      }
    }
  }
}
function applyDataToEvent(event, data) {
  const { extra, tags, user, contexts, level, transactionName } = data;
  const cleanedExtra = dropUndefinedKeys(extra);
  if (cleanedExtra && Object.keys(cleanedExtra).length) {
    event.extra = { ...cleanedExtra, ...event.extra };
  }
  const cleanedTags = dropUndefinedKeys(tags);
  if (cleanedTags && Object.keys(cleanedTags).length) {
    event.tags = { ...cleanedTags, ...event.tags };
  }
  const cleanedUser = dropUndefinedKeys(user);
  if (cleanedUser && Object.keys(cleanedUser).length) {
    event.user = { ...cleanedUser, ...event.user };
  }
  const cleanedContexts = dropUndefinedKeys(contexts);
  if (cleanedContexts && Object.keys(cleanedContexts).length) {
    event.contexts = { ...cleanedContexts, ...event.contexts };
  }
  if (level) {
    event.level = level;
  }
  if (transactionName && event.type !== "transaction") {
    event.transaction = transactionName;
  }
}
function applyBreadcrumbsToEvent(event, breadcrumbs) {
  const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
  event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
}
function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
  event.sdkProcessingMetadata = {
    ...event.sdkProcessingMetadata,
    ...sdkProcessingMetadata
  };
}
function applySpanToEvent(event, span) {
  event.contexts = {
    trace: spanToTraceContext(span),
    ...event.contexts
  };
  event.sdkProcessingMetadata = {
    dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
    ...event.sdkProcessingMetadata
  };
  const rootSpan = getRootSpan(span);
  const transactionName = spanToJSON(rootSpan).description;
  if (transactionName && !event.transaction && event.type === "transaction") {
    event.transaction = transactionName;
  }
}
function applyFingerprintToEvent(event, fingerprint) {
  event.fingerprint = event.fingerprint ? arrayify(event.fingerprint) : [];
  if (fingerprint) {
    event.fingerprint = event.fingerprint.concat(fingerprint);
  }
  if (event.fingerprint && !event.fingerprint.length) {
    delete event.fingerprint;
  }
}
function prepareEvent(options, event, hint, scope, client, isolationScope) {
  const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
  const prepared = {
    ...event,
    event_id: event.event_id || hint.event_id || uuid4(),
    timestamp: event.timestamp || dateTimestampInSeconds()
  };
  const integrations = hint.integrations || options.integrations.map((i) => i.name);
  applyClientOptions(prepared, options);
  applyIntegrationsMetadata(prepared, integrations);
  if (client) {
    client.emit("applyFrameMetadata", event);
  }
  if (event.type === void 0) {
    applyDebugIds(prepared, options.stackParser);
  }
  const finalScope = getFinalScope(scope, hint.captureContext);
  if (hint.mechanism) {
    addExceptionMechanism(prepared, hint.mechanism);
  }
  const clientEventProcessors = client ? client.getEventProcessors() : [];
  const data = getGlobalScope().getScopeData();
  if (isolationScope) {
    const isolationData = isolationScope.getScopeData();
    mergeScopeData(data, isolationData);
  }
  if (finalScope) {
    const finalScopeData = finalScope.getScopeData();
    mergeScopeData(data, finalScopeData);
  }
  const attachments = [...hint.attachments || [], ...data.attachments];
  if (attachments.length) {
    hint.attachments = attachments;
  }
  applyScopeDataToEvent(prepared, data);
  const eventProcessors = [
    ...clientEventProcessors,
    // Run scope event processors _after_ all other processors
    ...data.eventProcessors
  ];
  const result = notifyEventProcessors(eventProcessors, prepared, hint);
  return result.then((evt) => {
    if (evt) {
      applyDebugMeta(evt);
    }
    if (typeof normalizeDepth === "number" && normalizeDepth > 0) {
      return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
    }
    return evt;
  });
}
function applyClientOptions(event, options) {
  const { environment, release, dist, maxValueLength = 250 } = options;
  if (!("environment" in event)) {
    event.environment = "environment" in options ? environment : DEFAULT_ENVIRONMENT$1;
  }
  if (event.release === void 0 && release !== void 0) {
    event.release = release;
  }
  if (event.dist === void 0 && dist !== void 0) {
    event.dist = dist;
  }
  if (event.message) {
    event.message = truncate(event.message, maxValueLength);
  }
  const exception = event.exception && event.exception.values && event.exception.values[0];
  if (exception && exception.value) {
    exception.value = truncate(exception.value, maxValueLength);
  }
  const request = event.request;
  if (request && request.url) {
    request.url = truncate(request.url, maxValueLength);
  }
}
const debugIdStackParserCache = /* @__PURE__ */ new WeakMap();
function applyDebugIds(event, stackParser) {
  const debugIdMap = GLOBAL_OBJ._sentryDebugIds;
  if (!debugIdMap) {
    return;
  }
  let debugIdStackFramesCache;
  const cachedDebugIdStackFrameCache = debugIdStackParserCache.get(stackParser);
  if (cachedDebugIdStackFrameCache) {
    debugIdStackFramesCache = cachedDebugIdStackFrameCache;
  } else {
    debugIdStackFramesCache = /* @__PURE__ */ new Map();
    debugIdStackParserCache.set(stackParser, debugIdStackFramesCache);
  }
  const filenameDebugIdMap = Object.entries(debugIdMap).reduce(
    (acc, [debugIdStackTrace, debugIdValue]) => {
      let parsedStack;
      const cachedParsedStack = debugIdStackFramesCache.get(debugIdStackTrace);
      if (cachedParsedStack) {
        parsedStack = cachedParsedStack;
      } else {
        parsedStack = stackParser(debugIdStackTrace);
        debugIdStackFramesCache.set(debugIdStackTrace, parsedStack);
      }
      for (let i = parsedStack.length - 1; i >= 0; i--) {
        const stackFrame = parsedStack[i];
        if (stackFrame.filename) {
          acc[stackFrame.filename] = debugIdValue;
          break;
        }
      }
      return acc;
    },
    {}
  );
  try {
    event.exception.values.forEach((exception) => {
      exception.stacktrace.frames.forEach((frame) => {
        if (frame.filename) {
          frame.debug_id = filenameDebugIdMap[frame.filename];
        }
      });
    });
  } catch (e) {
  }
}
function applyDebugMeta(event) {
  const filenameDebugIdMap = {};
  try {
    event.exception.values.forEach((exception) => {
      exception.stacktrace.frames.forEach((frame) => {
        if (frame.debug_id) {
          if (frame.abs_path) {
            filenameDebugIdMap[frame.abs_path] = frame.debug_id;
          } else if (frame.filename) {
            filenameDebugIdMap[frame.filename] = frame.debug_id;
          }
          delete frame.debug_id;
        }
      });
    });
  } catch (e) {
  }
  if (Object.keys(filenameDebugIdMap).length === 0) {
    return;
  }
  event.debug_meta = event.debug_meta || {};
  event.debug_meta.images = event.debug_meta.images || [];
  const images = event.debug_meta.images;
  Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
    images.push({
      type: "sourcemap",
      code_file: filename,
      debug_id
    });
  });
}
function applyIntegrationsMetadata(event, integrationNames) {
  if (integrationNames.length > 0) {
    event.sdk = event.sdk || {};
    event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
  }
}
function normalizeEvent(event, depth, maxBreadth) {
  if (!event) {
    return null;
  }
  const normalized = {
    ...event,
    ...event.breadcrumbs && {
      breadcrumbs: event.breadcrumbs.map((b) => ({
        ...b,
        ...b.data && {
          data: normalize(b.data, depth, maxBreadth)
        }
      }))
    },
    ...event.user && {
      user: normalize(event.user, depth, maxBreadth)
    },
    ...event.contexts && {
      contexts: normalize(event.contexts, depth, maxBreadth)
    },
    ...event.extra && {
      extra: normalize(event.extra, depth, maxBreadth)
    }
  };
  if (event.contexts && event.contexts.trace && normalized.contexts) {
    normalized.contexts.trace = event.contexts.trace;
    if (event.contexts.trace.data) {
      normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
    }
  }
  if (event.spans) {
    normalized.spans = event.spans.map((span) => {
      return {
        ...span,
        ...span.data && {
          data: normalize(span.data, depth, maxBreadth)
        }
      };
    });
  }
  return normalized;
}
function getFinalScope(scope, captureContext) {
  if (!captureContext) {
    return scope;
  }
  const finalScope = scope ? scope.clone() : new Scope();
  finalScope.update(captureContext);
  return finalScope;
}
function parseEventHintOrCaptureContext(hint) {
  if (!hint) {
    return void 0;
  }
  if (hintIsScopeOrFunction(hint)) {
    return { captureContext: hint };
  }
  if (hintIsScopeContext(hint)) {
    return {
      captureContext: hint
    };
  }
  return hint;
}
function hintIsScopeOrFunction(hint) {
  return hint instanceof Scope || typeof hint === "function";
}
const captureContextKeys = [
  "user",
  "level",
  "extra",
  "contexts",
  "tags",
  "fingerprint",
  "requestSession",
  "propagationContext"
];
function hintIsScopeContext(hint) {
  return Object.keys(hint).some((key) => captureContextKeys.includes(key));
}
function captureException(exception, hint) {
  return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
}
function captureMessage(message, captureContext) {
  const level = typeof captureContext === "string" ? captureContext : void 0;
  const context2 = typeof captureContext !== "string" ? { captureContext } : void 0;
  return getCurrentScope().captureMessage(message, level, context2);
}
function captureEvent(event, hint) {
  return getCurrentScope().captureEvent(event, hint);
}
async function flush(timeout) {
  const client = getClient();
  if (client) {
    return client.flush(timeout);
  }
  DEBUG_BUILD$2 && logger.warn("Cannot flush events. No client defined.");
  return Promise.resolve(false);
}
function startSession$1(context2) {
  const client = getClient();
  const isolationScope = getIsolationScope();
  const currentScope = getCurrentScope();
  const { release, environment = DEFAULT_ENVIRONMENT$1 } = client && client.getOptions() || {};
  const { userAgent } = GLOBAL_OBJ.navigator || {};
  const session2 = makeSession({
    release,
    environment,
    user: currentScope.getUser() || isolationScope.getUser(),
    ...userAgent && { userAgent },
    ...context2
  });
  const currentSession = isolationScope.getSession();
  if (currentSession && currentSession.status === "ok") {
    updateSession(currentSession, { status: "exited" });
  }
  endSession$1();
  isolationScope.setSession(session2);
  currentScope.setSession(session2);
  return session2;
}
function endSession$1() {
  const isolationScope = getIsolationScope();
  const currentScope = getCurrentScope();
  const session2 = currentScope.getSession() || isolationScope.getSession();
  if (session2) {
    closeSession(session2);
  }
  _sendSessionUpdate();
  isolationScope.setSession();
  currentScope.setSession();
}
function _sendSessionUpdate() {
  const isolationScope = getIsolationScope();
  const currentScope = getCurrentScope();
  const client = getClient();
  const session2 = currentScope.getSession() || isolationScope.getSession();
  if (session2 && client) {
    client.captureSession(session2);
  }
}
function captureSession(end = false) {
  if (end) {
    endSession$1();
    return;
  }
  _sendSessionUpdate();
}
class SessionFlusher {
  // Cast to any so that it can use Node.js timeout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(client, attrs) {
    this._client = client;
    this.flushTimeout = 60;
    this._pendingAggregates = /* @__PURE__ */ new Map();
    this._isEnabled = true;
    this._intervalId = setInterval(() => this.flush(), this.flushTimeout * 1e3);
    if (this._intervalId.unref) {
      this._intervalId.unref();
    }
    this._sessionAttrs = attrs;
  }
  /** Checks if `pendingAggregates` has entries, and if it does flushes them by calling `sendSession` */
  flush() {
    const sessionAggregates = this.getSessionAggregates();
    if (sessionAggregates.aggregates.length === 0) {
      return;
    }
    this._pendingAggregates = /* @__PURE__ */ new Map();
    this._client.sendSession(sessionAggregates);
  }
  /** Massages the entries in `pendingAggregates` and returns aggregated sessions */
  getSessionAggregates() {
    const aggregates = Array.from(this._pendingAggregates.values());
    const sessionAggregates = {
      attrs: this._sessionAttrs,
      aggregates
    };
    return dropUndefinedKeys(sessionAggregates);
  }
  /** JSDoc */
  close() {
    clearInterval(this._intervalId);
    this._isEnabled = false;
    this.flush();
  }
  /**
   * Wrapper function for _incrementSessionStatusCount that checks if the instance of SessionFlusher is enabled then
   * fetches the session status of the request from `Scope.getRequestSession().status` on the scope and passes them to
   * `_incrementSessionStatusCount` along with the start date
   */
  incrementSessionStatusCount() {
    if (!this._isEnabled) {
      return;
    }
    const isolationScope = getIsolationScope();
    const requestSession = isolationScope.getRequestSession();
    if (requestSession && requestSession.status) {
      this._incrementSessionStatusCount(requestSession.status, /* @__PURE__ */ new Date());
      isolationScope.setRequestSession(void 0);
    }
  }
  /**
   * Increments status bucket in pendingAggregates buffer (internal state) corresponding to status of
   * the session received
   */
  _incrementSessionStatusCount(status, date) {
    const sessionStartedTrunc = new Date(date).setSeconds(0, 0);
    let aggregationCounts = this._pendingAggregates.get(sessionStartedTrunc);
    if (!aggregationCounts) {
      aggregationCounts = { started: new Date(sessionStartedTrunc).toISOString() };
      this._pendingAggregates.set(sessionStartedTrunc, aggregationCounts);
    }
    switch (status) {
      case "errored":
        aggregationCounts.errored = (aggregationCounts.errored || 0) + 1;
        return aggregationCounts.errored;
      case "ok":
        aggregationCounts.exited = (aggregationCounts.exited || 0) + 1;
        return aggregationCounts.exited;
      default:
        aggregationCounts.crashed = (aggregationCounts.crashed || 0) + 1;
        return aggregationCounts.crashed;
    }
  }
}
const SENTRY_API_VERSION = "7";
function getBaseApiEndpoint(dsn) {
  const protocol2 = dsn.protocol ? `${dsn.protocol}:` : "";
  const port = dsn.port ? `:${dsn.port}` : "";
  return `${protocol2}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
}
function _getIngestEndpoint(dsn) {
  return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
}
function _encodedAuth(dsn, sdkInfo) {
  return urlEncode({
    // We send only the minimum set of required information. See
    // https://github.com/getsentry/sentry-javascript/issues/2572.
    sentry_key: dsn.publicKey,
    sentry_version: SENTRY_API_VERSION,
    ...sdkInfo && { sentry_client: `${sdkInfo.name}/${sdkInfo.version}` }
  });
}
function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
  return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
}
const installedIntegrations = [];
function filterDuplicates(integrations) {
  const integrationsByName = {};
  integrations.forEach((currentInstance) => {
    const { name } = currentInstance;
    const existingInstance = integrationsByName[name];
    if (existingInstance && !existingInstance.isDefaultInstance && currentInstance.isDefaultInstance) {
      return;
    }
    integrationsByName[name] = currentInstance;
  });
  return Object.values(integrationsByName);
}
function getIntegrationsToSetup(options) {
  const defaultIntegrations = options.defaultIntegrations || [];
  const userIntegrations = options.integrations;
  defaultIntegrations.forEach((integration) => {
    integration.isDefaultInstance = true;
  });
  let integrations;
  if (Array.isArray(userIntegrations)) {
    integrations = [...defaultIntegrations, ...userIntegrations];
  } else if (typeof userIntegrations === "function") {
    integrations = arrayify(userIntegrations(defaultIntegrations));
  } else {
    integrations = defaultIntegrations;
  }
  const finalIntegrations = filterDuplicates(integrations);
  const debugIndex = finalIntegrations.findIndex((integration) => integration.name === "Debug");
  if (debugIndex > -1) {
    const [debugInstance] = finalIntegrations.splice(debugIndex, 1);
    finalIntegrations.push(debugInstance);
  }
  return finalIntegrations;
}
function setupIntegrations(client, integrations) {
  const integrationIndex = {};
  integrations.forEach((integration) => {
    if (integration) {
      setupIntegration(client, integration, integrationIndex);
    }
  });
  return integrationIndex;
}
function afterSetupIntegrations(client, integrations) {
  for (const integration of integrations) {
    if (integration && integration.afterAllSetup) {
      integration.afterAllSetup(client);
    }
  }
}
function setupIntegration(client, integration, integrationIndex) {
  if (integrationIndex[integration.name]) {
    DEBUG_BUILD$2 && logger.log(`Integration skipped because it was already installed: ${integration.name}`);
    return;
  }
  integrationIndex[integration.name] = integration;
  if (installedIntegrations.indexOf(integration.name) === -1 && typeof integration.setupOnce === "function") {
    integration.setupOnce();
    installedIntegrations.push(integration.name);
  }
  if (integration.setup && typeof integration.setup === "function") {
    integration.setup(client);
  }
  if (typeof integration.preprocessEvent === "function") {
    const callback = integration.preprocessEvent.bind(integration);
    client.on("preprocessEvent", (event, hint) => callback(event, hint, client));
  }
  if (typeof integration.processEvent === "function") {
    const callback = integration.processEvent.bind(integration);
    const processor = Object.assign((event, hint) => callback(event, hint, client), {
      id: integration.name
    });
    client.addEventProcessor(processor);
  }
  DEBUG_BUILD$2 && logger.log(`Integration installed: ${integration.name}`);
}
function defineIntegration(fn) {
  return fn;
}
const ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
class BaseClient {
  /** Options passed to the SDK. */
  /** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
  /** Array of set up integrations. */
  /** Number of calls being processed */
  /** Holds flushable  */
  // eslint-disable-next-line @typescript-eslint/ban-types
  /**
   * Initializes this client instance.
   *
   * @param options Options for the client.
   */
  constructor(options) {
    this._options = options;
    this._integrations = {};
    this._numProcessing = 0;
    this._outcomes = {};
    this._hooks = {};
    this._eventProcessors = [];
    if (options.dsn) {
      this._dsn = makeDsn(options.dsn);
    } else {
      DEBUG_BUILD$2 && logger.warn("No DSN provided, client will not send events.");
    }
    if (this._dsn) {
      const url = getEnvelopeEndpointWithUrlEncodedAuth(
        this._dsn,
        options.tunnel,
        options._metadata ? options._metadata.sdk : void 0
      );
      this._transport = options.transport({
        tunnel: this._options.tunnel,
        recordDroppedEvent: this.recordDroppedEvent.bind(this),
        ...options.transportOptions,
        url
      });
    }
  }
  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  captureException(exception, hint, scope) {
    const eventId = uuid4();
    if (checkOrSetAlreadyCaught(exception)) {
      DEBUG_BUILD$2 && logger.log(ALREADY_SEEN_ERROR);
      return eventId;
    }
    const hintWithEventId = {
      event_id: eventId,
      ...hint
    };
    this._process(
      this.eventFromException(exception, hintWithEventId).then(
        (event) => this._captureEvent(event, hintWithEventId, scope)
      )
    );
    return hintWithEventId.event_id;
  }
  /**
   * @inheritDoc
   */
  captureMessage(message, level, hint, currentScope) {
    const hintWithEventId = {
      event_id: uuid4(),
      ...hint
    };
    const eventMessage = isParameterizedString(message) ? message : String(message);
    const promisedEvent = isPrimitive$1(message) ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
    this._process(promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)));
    return hintWithEventId.event_id;
  }
  /**
   * @inheritDoc
   */
  captureEvent(event, hint, currentScope) {
    const eventId = uuid4();
    if (hint && hint.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
      DEBUG_BUILD$2 && logger.log(ALREADY_SEEN_ERROR);
      return eventId;
    }
    const hintWithEventId = {
      event_id: eventId,
      ...hint
    };
    const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
    const capturedSpanScope = sdkProcessingMetadata.capturedSpanScope;
    this._process(this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope));
    return hintWithEventId.event_id;
  }
  /**
   * @inheritDoc
   */
  captureSession(session2) {
    if (!(typeof session2.release === "string")) {
      DEBUG_BUILD$2 && logger.warn("Discarded session because of missing or non-string release");
    } else {
      this.sendSession(session2);
      updateSession(session2, { init: false });
    }
  }
  /**
   * @inheritDoc
   */
  getDsn() {
    return this._dsn;
  }
  /**
   * @inheritDoc
   */
  getOptions() {
    return this._options;
  }
  /**
   * @see SdkMetadata in @sentry/types
   *
   * @return The metadata of the SDK
   */
  getSdkMetadata() {
    return this._options._metadata;
  }
  /**
   * @inheritDoc
   */
  getTransport() {
    return this._transport;
  }
  /**
   * @inheritDoc
   */
  flush(timeout) {
    const transport = this._transport;
    if (transport) {
      this.emit("flush");
      return this._isClientDoneProcessing(timeout).then((clientFinished) => {
        return transport.flush(timeout).then((transportFlushed) => clientFinished && transportFlushed);
      });
    } else {
      return resolvedSyncPromise(true);
    }
  }
  /**
   * @inheritDoc
   */
  close(timeout) {
    return this.flush(timeout).then((result) => {
      this.getOptions().enabled = false;
      this.emit("close");
      return result;
    });
  }
  /** Get all installed event processors. */
  getEventProcessors() {
    return this._eventProcessors;
  }
  /** @inheritDoc */
  addEventProcessor(eventProcessor) {
    this._eventProcessors.push(eventProcessor);
  }
  /** @inheritdoc */
  init() {
    if (this._isEnabled() || // Force integrations to be setup even if no DSN was set when we have
    // Spotlight enabled. This is particularly important for browser as we
    // don't support the `spotlight` option there and rely on the users
    // adding the `spotlightBrowserIntegration()` to their integrations which
    // wouldn't get initialized with the check below when there's no DSN set.
    this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) {
      this._setupIntegrations();
    }
  }
  /**
   * Gets an installed integration by its name.
   *
   * @returns The installed integration or `undefined` if no integration with that `name` was installed.
   */
  getIntegrationByName(integrationName) {
    return this._integrations[integrationName];
  }
  /**
   * @inheritDoc
   */
  addIntegration(integration) {
    const isAlreadyInstalled = this._integrations[integration.name];
    setupIntegration(this, integration, this._integrations);
    if (!isAlreadyInstalled) {
      afterSetupIntegrations(this, [integration]);
    }
  }
  /**
   * @inheritDoc
   */
  sendEvent(event, hint = {}) {
    this.emit("beforeSendEvent", event, hint);
    let env2 = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
    for (const attachment of hint.attachments || []) {
      env2 = addItemToEnvelope(env2, createAttachmentEnvelopeItem(attachment));
    }
    const promise = this.sendEnvelope(env2);
    if (promise) {
      promise.then((sendResponse) => this.emit("afterSendEvent", event, sendResponse), null);
    }
  }
  /**
   * @inheritDoc
   */
  sendSession(session2) {
    const env2 = createSessionEnvelope(session2, this._dsn, this._options._metadata, this._options.tunnel);
    this.sendEnvelope(env2);
  }
  /**
   * @inheritDoc
   */
  recordDroppedEvent(reason, category, eventOrCount) {
    if (this._options.sendClientReports) {
      const count = typeof eventOrCount === "number" ? eventOrCount : 1;
      const key = `${reason}:${category}`;
      DEBUG_BUILD$2 && logger.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
      this._outcomes[key] = (this._outcomes[key] || 0) + count;
    }
  }
  // Keep on() & emit() signatures in sync with types' client.ts interface
  /* eslint-disable @typescript-eslint/unified-signatures */
  /** @inheritdoc */
  /** @inheritdoc */
  on(hook, callback) {
    const hooks = this._hooks[hook] = this._hooks[hook] || [];
    hooks.push(callback);
    return () => {
      const cbIndex = hooks.indexOf(callback);
      if (cbIndex > -1) {
        hooks.splice(cbIndex, 1);
      }
    };
  }
  /** @inheritdoc */
  /** @inheritdoc */
  emit(hook, ...rest) {
    const callbacks = this._hooks[hook];
    if (callbacks) {
      callbacks.forEach((callback) => callback(...rest));
    }
  }
  /**
   * @inheritdoc
   */
  sendEnvelope(envelope) {
    this.emit("beforeEnvelope", envelope);
    if (this._isEnabled() && this._transport) {
      return this._transport.send(envelope).then(null, (reason) => {
        DEBUG_BUILD$2 && logger.error("Error while sending event:", reason);
        return reason;
      });
    }
    DEBUG_BUILD$2 && logger.error("Transport disabled");
    return resolvedSyncPromise({});
  }
  /* eslint-enable @typescript-eslint/unified-signatures */
  /** Setup integrations for this client. */
  _setupIntegrations() {
    const { integrations } = this._options;
    this._integrations = setupIntegrations(this, integrations);
    afterSetupIntegrations(this, integrations);
  }
  /** Updates existing session based on the provided event */
  _updateSessionFromEvent(session2, event) {
    let crashed = false;
    let errored = false;
    const exceptions = event.exception && event.exception.values;
    if (exceptions) {
      errored = true;
      for (const ex of exceptions) {
        const mechanism = ex.mechanism;
        if (mechanism && mechanism.handled === false) {
          crashed = true;
          break;
        }
      }
    }
    const sessionNonTerminal = session2.status === "ok";
    const shouldUpdateAndSend = sessionNonTerminal && session2.errors === 0 || sessionNonTerminal && crashed;
    if (shouldUpdateAndSend) {
      updateSession(session2, {
        ...crashed && { status: "crashed" },
        errors: session2.errors || Number(errored || crashed)
      });
      this.captureSession(session2);
    }
  }
  /**
   * Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
   * "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
   *
   * @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
   * passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
   * `true`.
   * @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
   * `false` otherwise
   */
  _isClientDoneProcessing(timeout) {
    return new SyncPromise((resolve2) => {
      let ticked = 0;
      const tick = 1;
      const interval = setInterval(() => {
        if (this._numProcessing == 0) {
          clearInterval(interval);
          resolve2(true);
        } else {
          ticked += tick;
          if (timeout && ticked >= timeout) {
            clearInterval(interval);
            resolve2(false);
          }
        }
      }, tick);
    });
  }
  /** Determines whether this SDK is enabled and a transport is present. */
  _isEnabled() {
    return this.getOptions().enabled !== false && this._transport !== void 0;
  }
  /**
   * Adds common information to events.
   *
   * The information includes release and environment from `options`,
   * breadcrumbs and context (extra, tags and user) from the scope.
   *
   * Information that is already present in the event is never overwritten. For
   * nested objects, such as the context, keys are merged.
   *
   * @param event The original event.
   * @param hint May contain additional information about the original exception.
   * @param currentScope A scope containing event metadata.
   * @returns A new event with more information.
   */
  _prepareEvent(event, hint, currentScope, isolationScope = getIsolationScope()) {
    const options = this.getOptions();
    const integrations = Object.keys(this._integrations);
    if (!hint.integrations && integrations.length > 0) {
      hint.integrations = integrations;
    }
    this.emit("preprocessEvent", event, hint);
    if (!event.type) {
      isolationScope.setLastEventId(event.event_id || hint.event_id);
    }
    return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
      if (evt === null) {
        return evt;
      }
      const propagationContext = {
        ...isolationScope.getPropagationContext(),
        ...currentScope ? currentScope.getPropagationContext() : void 0
      };
      const trace2 = evt.contexts && evt.contexts.trace;
      if (!trace2 && propagationContext) {
        const { traceId: trace_id, spanId, parentSpanId, dsc } = propagationContext;
        evt.contexts = {
          trace: dropUndefinedKeys({
            trace_id,
            span_id: spanId,
            parent_span_id: parentSpanId
          }),
          ...evt.contexts
        };
        const dynamicSamplingContext = dsc ? dsc : getDynamicSamplingContextFromClient(trace_id, this);
        evt.sdkProcessingMetadata = {
          dynamicSamplingContext,
          ...evt.sdkProcessingMetadata
        };
      }
      return evt;
    });
  }
  /**
   * Processes the event and logs an error in case of rejection
   * @param event
   * @param hint
   * @param scope
   */
  _captureEvent(event, hint = {}, scope) {
    return this._processEvent(event, hint, scope).then(
      (finalEvent) => {
        return finalEvent.event_id;
      },
      (reason) => {
        if (DEBUG_BUILD$2) {
          const sentryError = reason;
          if (sentryError.logLevel === "log") {
            logger.log(sentryError.message);
          } else {
            logger.warn(sentryError);
          }
        }
        return void 0;
      }
    );
  }
  /**
   * Processes an event (either error or message) and sends it to Sentry.
   *
   * This also adds breadcrumbs and context information to the event. However,
   * platform specific meta data (such as the User's IP address) must be added
   * by the SDK implementor.
   *
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   * @param currentScope A scope containing event metadata.
   * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
   */
  _processEvent(event, hint, currentScope) {
    const options = this.getOptions();
    const { sampleRate } = options;
    const isTransaction = isTransactionEvent(event);
    const isError2 = isErrorEvent(event);
    const eventType = event.type || "error";
    const beforeSendLabel = `before send for type \`${eventType}\``;
    const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
    if (isError2 && typeof parsedSampleRate === "number" && Math.random() > parsedSampleRate) {
      this.recordDroppedEvent("sample_rate", "error", event);
      return rejectedSyncPromise(
        new SentryError(
          `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`,
          "log"
        )
      );
    }
    const dataCategory = eventType === "replay_event" ? "replay" : eventType;
    const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
    const capturedSpanIsolationScope = sdkProcessingMetadata.capturedSpanIsolationScope;
    return this._prepareEvent(event, hint, currentScope, capturedSpanIsolationScope).then((prepared) => {
      if (prepared === null) {
        this.recordDroppedEvent("event_processor", dataCategory, event);
        throw new SentryError("An event processor returned `null`, will not send event.", "log");
      }
      const isInternalException = hint.data && hint.data.__sentry__ === true;
      if (isInternalException) {
        return prepared;
      }
      const result = processBeforeSend(this, options, prepared, hint);
      return _validateBeforeSendResult(result, beforeSendLabel);
    }).then((processedEvent) => {
      if (processedEvent === null) {
        this.recordDroppedEvent("before_send", dataCategory, event);
        if (isTransaction) {
          const spans = event.spans || [];
          const spanCount = 1 + spans.length;
          this.recordDroppedEvent("before_send", "span", spanCount);
        }
        throw new SentryError(`${beforeSendLabel} returned \`null\`, will not send event.`, "log");
      }
      const session2 = currentScope && currentScope.getSession();
      if (!isTransaction && session2) {
        this._updateSessionFromEvent(session2, processedEvent);
      }
      if (isTransaction) {
        const spanCountBefore = processedEvent.sdkProcessingMetadata && processedEvent.sdkProcessingMetadata.spanCountBeforeProcessing || 0;
        const spanCountAfter = processedEvent.spans ? processedEvent.spans.length : 0;
        const droppedSpanCount = spanCountBefore - spanCountAfter;
        if (droppedSpanCount > 0) {
          this.recordDroppedEvent("before_send", "span", droppedSpanCount);
        }
      }
      const transactionInfo = processedEvent.transaction_info;
      if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
        const source = "custom";
        processedEvent.transaction_info = {
          ...transactionInfo,
          source
        };
      }
      this.sendEvent(processedEvent, hint);
      return processedEvent;
    }).then(null, (reason) => {
      if (reason instanceof SentryError) {
        throw reason;
      }
      this.captureException(reason, {
        data: {
          __sentry__: true
        },
        originalException: reason
      });
      throw new SentryError(
        `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${reason}`
      );
    });
  }
  /**
   * Occupies the client with processing and event
   */
  _process(promise) {
    this._numProcessing++;
    void promise.then(
      (value) => {
        this._numProcessing--;
        return value;
      },
      (reason) => {
        this._numProcessing--;
        return reason;
      }
    );
  }
  /**
   * Clears outcomes on this client and returns them.
   */
  _clearOutcomes() {
    const outcomes = this._outcomes;
    this._outcomes = {};
    return Object.entries(outcomes).map(([key, quantity]) => {
      const [reason, category] = key.split(":");
      return {
        reason,
        category,
        quantity
      };
    });
  }
  /**
   * Sends client reports as an envelope.
   */
  _flushOutcomes() {
    DEBUG_BUILD$2 && logger.log("Flushing outcomes...");
    const outcomes = this._clearOutcomes();
    if (outcomes.length === 0) {
      DEBUG_BUILD$2 && logger.log("No outcomes to send");
      return;
    }
    if (!this._dsn) {
      DEBUG_BUILD$2 && logger.log("No dsn provided, will not send outcomes");
      return;
    }
    DEBUG_BUILD$2 && logger.log("Sending outcomes:", outcomes);
    const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
    this.sendEnvelope(envelope);
  }
  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}
function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
  const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
  if (isThenable(beforeSendResult)) {
    return beforeSendResult.then(
      (event) => {
        if (!isPlainObject$1(event) && event !== null) {
          throw new SentryError(invalidValueError);
        }
        return event;
      },
      (e) => {
        throw new SentryError(`${beforeSendLabel} rejected with ${e}`);
      }
    );
  } else if (!isPlainObject$1(beforeSendResult) && beforeSendResult !== null) {
    throw new SentryError(invalidValueError);
  }
  return beforeSendResult;
}
function processBeforeSend(client, options, event, hint) {
  const { beforeSend, beforeSendTransaction, beforeSendSpan } = options;
  if (isErrorEvent(event) && beforeSend) {
    return beforeSend(event, hint);
  }
  if (isTransactionEvent(event)) {
    if (event.spans && beforeSendSpan) {
      const processedSpans = [];
      for (const span of event.spans) {
        const processedSpan = beforeSendSpan(span);
        if (processedSpan) {
          processedSpans.push(processedSpan);
        } else {
          client.recordDroppedEvent("before_send", "span");
        }
      }
      event.spans = processedSpans;
    }
    if (beforeSendTransaction) {
      if (event.spans) {
        const spanCountBefore = event.spans.length;
        event.sdkProcessingMetadata = {
          ...event.sdkProcessingMetadata,
          spanCountBeforeProcessing: spanCountBefore
        };
      }
      return beforeSendTransaction(event, hint);
    }
  }
  return event;
}
function isErrorEvent(event) {
  return event.type === void 0;
}
function isTransactionEvent(event) {
  return event.type === "transaction";
}
function createCheckInEnvelope(checkIn, dynamicSamplingContext, metadata, tunnel, dsn) {
  const headers = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (metadata && metadata.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }
  if (dynamicSamplingContext) {
    headers.trace = dropUndefinedKeys(dynamicSamplingContext);
  }
  const item = createCheckInEnvelopeItem(checkIn);
  return createEnvelope(headers, [item]);
}
function createCheckInEnvelopeItem(checkIn) {
  const checkInHeaders = {
    type: "check_in"
  };
  return [checkInHeaders, checkIn];
}
class ServerRuntimeClient extends BaseClient {
  /**
   * Creates a new Edge SDK instance.
   * @param options Configuration options for this SDK.
   */
  constructor(options) {
    registerSpanErrorInstrumentation();
    super(options);
  }
  /**
   * @inheritDoc
   */
  eventFromException(exception, hint) {
    return resolvedSyncPromise(eventFromUnknownInput(this, this._options.stackParser, exception, hint));
  }
  /**
   * @inheritDoc
   */
  eventFromMessage(message, level = "info", hint) {
    return resolvedSyncPromise(
      eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace)
    );
  }
  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  captureException(exception, hint, scope) {
    if (this._options.autoSessionTracking && this._sessionFlusher) {
      const requestSession = getIsolationScope().getRequestSession();
      if (requestSession && requestSession.status === "ok") {
        requestSession.status = "errored";
      }
    }
    return super.captureException(exception, hint, scope);
  }
  /**
   * @inheritDoc
   */
  captureEvent(event, hint, scope) {
    if (this._options.autoSessionTracking && this._sessionFlusher) {
      const eventType = event.type || "exception";
      const isException = eventType === "exception" && event.exception && event.exception.values && event.exception.values.length > 0;
      if (isException) {
        const requestSession = getIsolationScope().getRequestSession();
        if (requestSession && requestSession.status === "ok") {
          requestSession.status = "errored";
        }
      }
    }
    return super.captureEvent(event, hint, scope);
  }
  /**
   *
   * @inheritdoc
   */
  close(timeout) {
    if (this._sessionFlusher) {
      this._sessionFlusher.close();
    }
    return super.close(timeout);
  }
  /** Method that initialises an instance of SessionFlusher on Client */
  initSessionFlusher() {
    const { release, environment } = this._options;
    if (!release) {
      DEBUG_BUILD$2 && logger.warn("Cannot initialise an instance of SessionFlusher if no release is provided!");
    } else {
      this._sessionFlusher = new SessionFlusher(this, {
        release,
        environment
      });
    }
  }
  /**
   * Create a cron monitor check in and send it to Sentry.
   *
   * @param checkIn An object that describes a check in.
   * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
   * to create a monitor automatically when sending a check in.
   */
  captureCheckIn(checkIn, monitorConfig, scope) {
    const id = "checkInId" in checkIn && checkIn.checkInId ? checkIn.checkInId : uuid4();
    if (!this._isEnabled()) {
      DEBUG_BUILD$2 && logger.warn("SDK not enabled, will not capture checkin.");
      return id;
    }
    const options = this.getOptions();
    const { release, environment, tunnel } = options;
    const serializedCheckIn = {
      check_in_id: id,
      monitor_slug: checkIn.monitorSlug,
      status: checkIn.status,
      release,
      environment
    };
    if ("duration" in checkIn) {
      serializedCheckIn.duration = checkIn.duration;
    }
    if (monitorConfig) {
      serializedCheckIn.monitor_config = {
        schedule: monitorConfig.schedule,
        checkin_margin: monitorConfig.checkinMargin,
        max_runtime: monitorConfig.maxRuntime,
        timezone: monitorConfig.timezone,
        failure_issue_threshold: monitorConfig.failureIssueThreshold,
        recovery_threshold: monitorConfig.recoveryThreshold
      };
    }
    const [dynamicSamplingContext, traceContext] = this._getTraceInfoFromScope(scope);
    if (traceContext) {
      serializedCheckIn.contexts = {
        trace: traceContext
      };
    }
    const envelope = createCheckInEnvelope(
      serializedCheckIn,
      dynamicSamplingContext,
      this.getSdkMetadata(),
      tunnel,
      this.getDsn()
    );
    DEBUG_BUILD$2 && logger.info("Sending checkin:", checkIn.monitorSlug, checkIn.status);
    this.sendEnvelope(envelope);
    return id;
  }
  /**
   * Method responsible for capturing/ending a request session by calling `incrementSessionStatusCount` to increment
   * appropriate session aggregates bucket
   */
  _captureRequestSession() {
    if (!this._sessionFlusher) {
      DEBUG_BUILD$2 && logger.warn("Discarded request mode session because autoSessionTracking option was disabled");
    } else {
      this._sessionFlusher.incrementSessionStatusCount();
    }
  }
  /**
   * @inheritDoc
   */
  _prepareEvent(event, hint, scope, isolationScope) {
    if (this._options.platform) {
      event.platform = event.platform || this._options.platform;
    }
    if (this._options.runtime) {
      event.contexts = {
        ...event.contexts,
        runtime: (event.contexts || {}).runtime || this._options.runtime
      };
    }
    if (this._options.serverName) {
      event.server_name = event.server_name || this._options.serverName;
    }
    return super._prepareEvent(event, hint, scope, isolationScope);
  }
  /** Extract trace information from scope */
  _getTraceInfoFromScope(scope) {
    if (!scope) {
      return [void 0, void 0];
    }
    const span = _getSpanForScope(scope);
    if (span) {
      const rootSpan = getRootSpan(span);
      const samplingContext = getDynamicSamplingContextFromSpan(rootSpan);
      return [samplingContext, spanToTraceContext(rootSpan)];
    }
    const { traceId, spanId, parentSpanId, dsc } = scope.getPropagationContext();
    const traceContext = {
      trace_id: traceId,
      span_id: spanId,
      parent_span_id: parentSpanId
    };
    if (dsc) {
      return [dsc, traceContext];
    }
    return [getDynamicSamplingContextFromClient(traceId, this), traceContext];
  }
}
const DEFAULT_TRANSPORT_BUFFER_SIZE = 64;
function createTransport(options, makeRequest, buffer = makePromiseBuffer(
  options.bufferSize || DEFAULT_TRANSPORT_BUFFER_SIZE
)) {
  let rateLimits = {};
  const flush2 = (timeout) => buffer.drain(timeout);
  function send(envelope) {
    const filteredEnvelopeItems = [];
    forEachEnvelopeItem(envelope, (item, type) => {
      const dataCategory = envelopeItemTypeToDataCategory(type);
      if (isRateLimited(rateLimits, dataCategory)) {
        const event = getEventForEnvelopeItem(item, type);
        options.recordDroppedEvent("ratelimit_backoff", dataCategory, event);
      } else {
        filteredEnvelopeItems.push(item);
      }
    });
    if (filteredEnvelopeItems.length === 0) {
      return resolvedSyncPromise({});
    }
    const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
    const recordEnvelopeLoss = (reason) => {
      forEachEnvelopeItem(filteredEnvelope, (item, type) => {
        const event = getEventForEnvelopeItem(item, type);
        options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type), event);
      });
    };
    const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
      (response) => {
        if (response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) {
          DEBUG_BUILD$2 && logger.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
        }
        rateLimits = updateRateLimits(rateLimits, response);
        return response;
      },
      (error) => {
        recordEnvelopeLoss("network_error");
        throw error;
      }
    );
    return buffer.add(requestTask).then(
      (result) => result,
      (error) => {
        if (error instanceof SentryError) {
          DEBUG_BUILD$2 && logger.error("Skipped sending event because buffer is full.");
          recordEnvelopeLoss("queue_overflow");
          return resolvedSyncPromise({});
        } else {
          throw error;
        }
      }
    );
  }
  return {
    send,
    flush: flush2
  };
}
function getEventForEnvelopeItem(item, type) {
  if (type !== "event" && type !== "transaction") {
    return void 0;
  }
  return Array.isArray(item) ? item[1] : void 0;
}
const MIN_DELAY = 100;
const START_DELAY = 5e3;
const MAX_DELAY = 36e5;
function makeOfflineTransport(createTransport2) {
  function log2(...args) {
    DEBUG_BUILD$2 && logger.info("[Offline]:", ...args);
  }
  return (options) => {
    const transport = createTransport2(options);
    if (!options.createStore) {
      throw new Error("No `createStore` function was provided");
    }
    const store = options.createStore(options);
    let retryDelay = START_DELAY;
    let flushTimer;
    function shouldQueue(env2, error, retryDelay2) {
      if (envelopeContainsItemType(env2, ["client_report"])) {
        return false;
      }
      if (options.shouldStore) {
        return options.shouldStore(env2, error, retryDelay2);
      }
      return true;
    }
    function flushIn(delay2) {
      if (flushTimer) {
        clearTimeout(flushTimer);
      }
      flushTimer = setTimeout(async () => {
        flushTimer = void 0;
        const found = await store.shift();
        if (found) {
          log2("Attempting to send previously queued event");
          found[0].sent_at = (/* @__PURE__ */ new Date()).toISOString();
          void send(found, true).catch((e) => {
            log2("Failed to retry sending", e);
          });
        }
      }, delay2);
      if (typeof flushTimer !== "number" && flushTimer.unref) {
        flushTimer.unref();
      }
    }
    function flushWithBackOff() {
      if (flushTimer) {
        return;
      }
      flushIn(retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
    }
    async function send(envelope, isRetry = false) {
      if (!isRetry && envelopeContainsItemType(envelope, ["replay_event", "replay_recording"])) {
        await store.push(envelope);
        flushIn(MIN_DELAY);
        return {};
      }
      try {
        const result = await transport.send(envelope);
        let delay2 = MIN_DELAY;
        if (result) {
          if (result.headers && result.headers["retry-after"]) {
            delay2 = parseRetryAfterHeader(result.headers["retry-after"]);
          } else if (result.headers && result.headers["x-sentry-rate-limits"]) {
            delay2 = 6e4;
          } else if ((result.statusCode || 0) >= 400) {
            return result;
          }
        }
        flushIn(delay2);
        retryDelay = START_DELAY;
        return result;
      } catch (e) {
        if (await shouldQueue(envelope, e, retryDelay)) {
          if (isRetry) {
            await store.unshift(envelope);
          } else {
            await store.push(envelope);
          }
          flushWithBackOff();
          log2("Error sending. Event queued.", e);
          return {};
        } else {
          throw e;
        }
      }
    }
    if (options.flushAtStartup) {
      flushWithBackOff();
    }
    return {
      send,
      flush: (t) => transport.flush(t)
    };
  };
}
function applySdkMetadata(options, name, names = [name], source = "npm") {
  const metadata = options._metadata || {};
  if (!metadata.sdk) {
    metadata.sdk = {
      name: `sentry.javascript.${name}`,
      packages: names.map((name2) => ({
        name: `${source}:@sentry/${name2}`,
        version: SDK_VERSION$1
      })),
      version: SDK_VERSION$1
    };
  }
  options._metadata = metadata;
}
const DEFAULT_BREADCRUMBS = 100;
function addBreadcrumb(breadcrumb, hint) {
  const client = getClient();
  const isolationScope = getIsolationScope();
  if (!client) return;
  const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client.getOptions();
  if (maxBreadcrumbs <= 0) return;
  const timestamp = dateTimestampInSeconds();
  const mergedBreadcrumb = { timestamp, ...breadcrumb };
  const finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
  if (finalBreadcrumb === null) return;
  if (client.emit) {
    client.emit("beforeAddBreadcrumb", finalBreadcrumb, hint);
  }
  isolationScope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
}
let originalFunctionToString;
const INTEGRATION_NAME$7 = "FunctionToString";
const SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
const _functionToStringIntegration = () => {
  return {
    name: INTEGRATION_NAME$7,
    setupOnce() {
      originalFunctionToString = Function.prototype.toString;
      try {
        Function.prototype.toString = function(...args) {
          const originalFunction = getOriginalFunction(this);
          const context2 = SETUP_CLIENTS.has(getClient()) && originalFunction !== void 0 ? originalFunction : this;
          return originalFunctionToString.apply(context2, args);
        };
      } catch (e) {
      }
    },
    setup(client) {
      SETUP_CLIENTS.set(client, true);
    }
  };
};
const functionToStringIntegration = defineIntegration(_functionToStringIntegration);
const DEFAULT_IGNORE_ERRORS = [
  /^Script error\.?$/,
  /^Javascript error: Script error\.? on line 0$/,
  /^ResizeObserver loop completed with undelivered notifications.$/,
  // The browser logs this when a ResizeObserver handler takes a bit longer. Usually this is not an actual issue though. It indicates slowness.
  /^Cannot redefine property: googletag$/,
  // This is thrown when google tag manager is used in combination with an ad blocker
  "undefined is not an object (evaluating 'a.L')",
  // Random error that happens but not actionable or noticeable to end-users.
  `can't redefine non-configurable property "solana"`,
  // Probably a browser extension or custom browser (Brave) throwing this error
  "vv().getRestrictions is not a function. (In 'vv().getRestrictions(1,a)', 'vv().getRestrictions' is undefined)",
  // Error thrown by GTM, seemingly not affecting end-users
  "Can't find variable: _AutofillCallbackHandler"
  // Unactionable error in instagram webview https://developers.facebook.com/community/threads/320013549791141/
];
const INTEGRATION_NAME$6 = "InboundFilters";
const _inboundFiltersIntegration = (options = {}) => {
  return {
    name: INTEGRATION_NAME$6,
    processEvent(event, _hint, client) {
      const clientOptions = client.getOptions();
      const mergedOptions = _mergeOptions(options, clientOptions);
      return _shouldDropEvent(event, mergedOptions) ? null : event;
    }
  };
};
const inboundFiltersIntegration = defineIntegration(_inboundFiltersIntegration);
function _mergeOptions(internalOptions = {}, clientOptions = {}) {
  return {
    allowUrls: [...internalOptions.allowUrls || [], ...clientOptions.allowUrls || []],
    denyUrls: [...internalOptions.denyUrls || [], ...clientOptions.denyUrls || []],
    ignoreErrors: [
      ...internalOptions.ignoreErrors || [],
      ...clientOptions.ignoreErrors || [],
      ...internalOptions.disableErrorDefaults ? [] : DEFAULT_IGNORE_ERRORS
    ],
    ignoreTransactions: [...internalOptions.ignoreTransactions || [], ...clientOptions.ignoreTransactions || []],
    ignoreInternal: internalOptions.ignoreInternal !== void 0 ? internalOptions.ignoreInternal : true
  };
}
function _shouldDropEvent(event, options) {
  if (options.ignoreInternal && _isSentryError(event)) {
    DEBUG_BUILD$2 && logger.warn(`Event dropped due to being internal Sentry Error.
Event: ${getEventDescription(event)}`);
    return true;
  }
  if (_isIgnoredError(event, options.ignoreErrors)) {
    DEBUG_BUILD$2 && logger.warn(
      `Event dropped due to being matched by \`ignoreErrors\` option.
Event: ${getEventDescription(event)}`
    );
    return true;
  }
  if (_isUselessError(event)) {
    DEBUG_BUILD$2 && logger.warn(
      `Event dropped due to not having an error message, error type or stacktrace.
Event: ${getEventDescription(
        event
      )}`
    );
    return true;
  }
  if (_isIgnoredTransaction(event, options.ignoreTransactions)) {
    DEBUG_BUILD$2 && logger.warn(
      `Event dropped due to being matched by \`ignoreTransactions\` option.
Event: ${getEventDescription(event)}`
    );
    return true;
  }
  if (_isDeniedUrl(event, options.denyUrls)) {
    DEBUG_BUILD$2 && logger.warn(
      `Event dropped due to being matched by \`denyUrls\` option.
Event: ${getEventDescription(
        event
      )}.
Url: ${_getEventFilterUrl(event)}`
    );
    return true;
  }
  if (!_isAllowedUrl(event, options.allowUrls)) {
    DEBUG_BUILD$2 && logger.warn(
      `Event dropped due to not being matched by \`allowUrls\` option.
Event: ${getEventDescription(
        event
      )}.
Url: ${_getEventFilterUrl(event)}`
    );
    return true;
  }
  return false;
}
function _isIgnoredError(event, ignoreErrors) {
  if (event.type || !ignoreErrors || !ignoreErrors.length) {
    return false;
  }
  return _getPossibleEventMessages(event).some((message) => stringMatchesSomePattern(message, ignoreErrors));
}
function _isIgnoredTransaction(event, ignoreTransactions) {
  if (event.type !== "transaction" || !ignoreTransactions || !ignoreTransactions.length) {
    return false;
  }
  const name = event.transaction;
  return name ? stringMatchesSomePattern(name, ignoreTransactions) : false;
}
function _isDeniedUrl(event, denyUrls) {
  if (!denyUrls || !denyUrls.length) {
    return false;
  }
  const url = _getEventFilterUrl(event);
  return !url ? false : stringMatchesSomePattern(url, denyUrls);
}
function _isAllowedUrl(event, allowUrls) {
  if (!allowUrls || !allowUrls.length) {
    return true;
  }
  const url = _getEventFilterUrl(event);
  return !url ? true : stringMatchesSomePattern(url, allowUrls);
}
function _getPossibleEventMessages(event) {
  const possibleMessages = [];
  if (event.message) {
    possibleMessages.push(event.message);
  }
  let lastException;
  try {
    lastException = event.exception.values[event.exception.values.length - 1];
  } catch (e) {
  }
  if (lastException) {
    if (lastException.value) {
      possibleMessages.push(lastException.value);
      if (lastException.type) {
        possibleMessages.push(`${lastException.type}: ${lastException.value}`);
      }
    }
  }
  return possibleMessages;
}
function _isSentryError(event) {
  try {
    return event.exception.values[0].type === "SentryError";
  } catch (e) {
  }
  return false;
}
function _getLastValidUrl(frames = []) {
  for (let i = frames.length - 1; i >= 0; i--) {
    const frame = frames[i];
    if (frame && frame.filename !== "<anonymous>" && frame.filename !== "[native code]") {
      return frame.filename || null;
    }
  }
  return null;
}
function _getEventFilterUrl(event) {
  try {
    let frames;
    try {
      frames = event.exception.values[0].stacktrace.frames;
    } catch (e) {
    }
    return frames ? _getLastValidUrl(frames) : null;
  } catch (oO) {
    DEBUG_BUILD$2 && logger.error(`Cannot extract url for event ${getEventDescription(event)}`);
    return null;
  }
}
function _isUselessError(event) {
  if (event.type) {
    return false;
  }
  if (!event.exception || !event.exception.values || event.exception.values.length === 0) {
    return false;
  }
  return (
    // No top-level message
    !event.message && // There are no exception values that have a stacktrace, a non-generic-Error type or value
    !event.exception.values.some((value) => value.stacktrace || value.type && value.type !== "Error" || value.value)
  );
}
const DEFAULT_KEY = "cause";
const DEFAULT_LIMIT = 5;
const INTEGRATION_NAME$5 = "LinkedErrors";
const _linkedErrorsIntegration = (options = {}) => {
  const limit = options.limit || DEFAULT_LIMIT;
  const key = options.key || DEFAULT_KEY;
  return {
    name: INTEGRATION_NAME$5,
    preprocessEvent(event, hint, client) {
      const options2 = client.getOptions();
      applyAggregateErrorsToEvent(
        exceptionFromError,
        options2.stackParser,
        options2.maxValueLength,
        key,
        limit,
        event,
        hint
      );
    }
  };
};
const linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);
const COUNTER_METRIC_TYPE = "c";
const GAUGE_METRIC_TYPE = "g";
const SET_METRIC_TYPE = "s";
const DISTRIBUTION_METRIC_TYPE = "d";
const DEFAULT_FLUSH_INTERVAL = 1e4;
const MAX_WEIGHT = 1e4;
function getMetricsAggregatorForClient$1(client, Aggregator) {
  const globalMetricsAggregators = getGlobalSingleton(
    "globalMetricsAggregators",
    () => /* @__PURE__ */ new WeakMap()
  );
  const aggregator = globalMetricsAggregators.get(client);
  if (aggregator) {
    return aggregator;
  }
  const newAggregator = new Aggregator(client);
  client.on("flush", () => newAggregator.flush());
  client.on("close", () => newAggregator.close());
  globalMetricsAggregators.set(client, newAggregator);
  return newAggregator;
}
function addToMetricsAggregator(Aggregator, metricType, name, value, data = {}) {
  const client = data.client || getClient();
  if (!client) {
    return;
  }
  const span = getActiveSpan$1();
  const rootSpan = span ? getRootSpan(span) : void 0;
  const transactionName = rootSpan && spanToJSON(rootSpan).description;
  const { unit, tags, timestamp } = data;
  const { release, environment } = client.getOptions();
  const metricTags = {};
  if (release) {
    metricTags.release = release;
  }
  if (environment) {
    metricTags.environment = environment;
  }
  if (transactionName) {
    metricTags.transaction = transactionName;
  }
  DEBUG_BUILD$2 && logger.log(`Adding value of ${value} to ${metricType} metric ${name}`);
  const aggregator = getMetricsAggregatorForClient$1(client, Aggregator);
  aggregator.add(metricType, name, value, unit, { ...metricTags, ...tags }, timestamp);
}
function increment$1(aggregator, name, value = 1, data) {
  addToMetricsAggregator(aggregator, COUNTER_METRIC_TYPE, name, ensureNumber(value), data);
}
function distribution$1(aggregator, name, value, data) {
  addToMetricsAggregator(aggregator, DISTRIBUTION_METRIC_TYPE, name, ensureNumber(value), data);
}
function timing$1(aggregator, name, value, unit = "second", data) {
  if (typeof value === "function") {
    const startTime = timestampInSeconds();
    return startSpanManual$1(
      {
        op: "metrics.timing",
        name,
        startTime,
        onlyIfParent: true
      },
      (span) => {
        return handleCallbackErrors(
          () => value(),
          () => {
          },
          () => {
            const endTime = timestampInSeconds();
            const timeDiff = endTime - startTime;
            distribution$1(aggregator, name, timeDiff, { ...data, unit: "second" });
            span.end(endTime);
          }
        );
      }
    );
  }
  distribution$1(aggregator, name, value, { ...data, unit });
}
function set$1(aggregator, name, value, data) {
  addToMetricsAggregator(aggregator, SET_METRIC_TYPE, name, value, data);
}
function gauge$1(aggregator, name, value, data) {
  addToMetricsAggregator(aggregator, GAUGE_METRIC_TYPE, name, ensureNumber(value), data);
}
const metrics = {
  increment: increment$1,
  distribution: distribution$1,
  set: set$1,
  gauge: gauge$1,
  timing: timing$1,
  /**
   * @ignore This is for internal use only.
   */
  getMetricsAggregatorForClient: getMetricsAggregatorForClient$1
};
function ensureNumber(number) {
  return typeof number === "string" ? parseInt(number) : number;
}
function getBucketKey(metricType, name, unit, tags) {
  const stringifiedTags = Object.entries(dropUndefinedKeys(tags)).sort((a, b) => a[0].localeCompare(b[0]));
  return `${metricType}${name}${unit}${stringifiedTags}`;
}
function simpleHash(s) {
  let rv = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    rv = (rv << 5) - rv + c;
    rv &= rv;
  }
  return rv >>> 0;
}
function serializeMetricBuckets(metricBucketItems) {
  let out = "";
  for (const item of metricBucketItems) {
    const tagEntries = Object.entries(item.tags);
    const maybeTags = tagEntries.length > 0 ? `|#${tagEntries.map(([key, value]) => `${key}:${value}`).join(",")}` : "";
    out += `${item.name}@${item.unit}:${item.metric}|${item.metricType}${maybeTags}|T${item.timestamp}
`;
  }
  return out;
}
function sanitizeUnit(unit) {
  return unit.replace(/[^\w]+/gi, "_");
}
function sanitizeMetricKey(key) {
  return key.replace(/[^\w\-.]+/gi, "_");
}
function sanitizeTagKey(key) {
  return key.replace(/[^\w\-./]+/gi, "");
}
const tagValueReplacements = [
  ["\n", "\\n"],
  ["\r", "\\r"],
  ["	", "\\t"],
  ["\\", "\\\\"],
  ["|", "\\u{7c}"],
  [",", "\\u{2c}"]
];
function getCharOrReplacement(input) {
  for (const [search, replacement] of tagValueReplacements) {
    if (input === search) {
      return replacement;
    }
  }
  return input;
}
function sanitizeTagValue(value) {
  return [...value].reduce((acc, char) => acc + getCharOrReplacement(char), "");
}
function sanitizeTags(unsanitizedTags) {
  const tags = {};
  for (const key in unsanitizedTags) {
    if (Object.prototype.hasOwnProperty.call(unsanitizedTags, key)) {
      const sanitizedKey = sanitizeTagKey(key);
      tags[sanitizedKey] = sanitizeTagValue(String(unsanitizedTags[key]));
    }
  }
  return tags;
}
function captureAggregateMetrics(client, metricBucketItems) {
  logger.log(`Flushing aggregated metrics, number of metrics: ${metricBucketItems.length}`);
  const dsn = client.getDsn();
  const metadata = client.getSdkMetadata();
  const tunnel = client.getOptions().tunnel;
  const metricsEnvelope = createMetricEnvelope(metricBucketItems, dsn, metadata, tunnel);
  client.sendEnvelope(metricsEnvelope);
}
function createMetricEnvelope(metricBucketItems, dsn, metadata, tunnel) {
  const headers = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (metadata && metadata.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && dsn) {
    headers.dsn = dsnToString(dsn);
  }
  const item = createMetricEnvelopeItem(metricBucketItems);
  return createEnvelope(headers, [item]);
}
function createMetricEnvelopeItem(metricBucketItems) {
  const payload = serializeMetricBuckets(metricBucketItems);
  const metricHeaders = {
    type: "statsd",
    length: payload.length
  };
  return [metricHeaders, payload];
}
class CounterMetric {
  constructor(_value) {
    this._value = _value;
  }
  /** @inheritDoc */
  get weight() {
    return 1;
  }
  /** @inheritdoc */
  add(value) {
    this._value += value;
  }
  /** @inheritdoc */
  toString() {
    return `${this._value}`;
  }
}
class GaugeMetric {
  constructor(value) {
    this._last = value;
    this._min = value;
    this._max = value;
    this._sum = value;
    this._count = 1;
  }
  /** @inheritDoc */
  get weight() {
    return 5;
  }
  /** @inheritdoc */
  add(value) {
    this._last = value;
    if (value < this._min) {
      this._min = value;
    }
    if (value > this._max) {
      this._max = value;
    }
    this._sum += value;
    this._count++;
  }
  /** @inheritdoc */
  toString() {
    return `${this._last}:${this._min}:${this._max}:${this._sum}:${this._count}`;
  }
}
class DistributionMetric {
  constructor(first) {
    this._value = [first];
  }
  /** @inheritDoc */
  get weight() {
    return this._value.length;
  }
  /** @inheritdoc */
  add(value) {
    this._value.push(value);
  }
  /** @inheritdoc */
  toString() {
    return this._value.join(":");
  }
}
class SetMetric {
  constructor(first) {
    this.first = first;
    this._value = /* @__PURE__ */ new Set([first]);
  }
  /** @inheritDoc */
  get weight() {
    return this._value.size;
  }
  /** @inheritdoc */
  add(value) {
    this._value.add(value);
  }
  /** @inheritdoc */
  toString() {
    return Array.from(this._value).map((val) => typeof val === "string" ? simpleHash(val) : val).join(":");
  }
}
const METRIC_MAP = {
  [COUNTER_METRIC_TYPE]: CounterMetric,
  [GAUGE_METRIC_TYPE]: GaugeMetric,
  [DISTRIBUTION_METRIC_TYPE]: DistributionMetric,
  [SET_METRIC_TYPE]: SetMetric
};
class MetricsAggregator {
  // TODO(@anonrig): Use FinalizationRegistry to have a proper way of flushing the buckets
  // when the aggregator is garbage collected.
  // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
  // Different metrics have different weights. We use this to limit the number of metrics
  // that we store in memory.
  // Cast to any so that it can use Node.js timeout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // SDKs are required to shift the flush interval by random() * rollup_in_seconds.
  // That shift is determined once per startup to create jittering.
  // An SDK is required to perform force flushing ahead of scheduled time if the memory
  // pressure is too high. There is no rule for this other than that SDKs should be tracking
  // abstract aggregation complexity (eg: a counter only carries a single float, whereas a
  // distribution is a float per emission).
  //
  // Force flush is used on either shutdown, flush() or when we exceed the max weight.
  constructor(_client) {
    this._client = _client;
    this._buckets = /* @__PURE__ */ new Map();
    this._bucketsTotalWeight = 0;
    this._interval = setInterval(() => this._flush(), DEFAULT_FLUSH_INTERVAL);
    if (this._interval.unref) {
      this._interval.unref();
    }
    this._flushShift = Math.floor(Math.random() * DEFAULT_FLUSH_INTERVAL / 1e3);
    this._forceFlush = false;
  }
  /**
   * @inheritDoc
   */
  add(metricType, unsanitizedName, value, unsanitizedUnit = "none", unsanitizedTags = {}, maybeFloatTimestamp = timestampInSeconds()) {
    const timestamp = Math.floor(maybeFloatTimestamp);
    const name = sanitizeMetricKey(unsanitizedName);
    const tags = sanitizeTags(unsanitizedTags);
    const unit = sanitizeUnit(unsanitizedUnit);
    const bucketKey = getBucketKey(metricType, name, unit, tags);
    let bucketItem = this._buckets.get(bucketKey);
    const previousWeight = bucketItem && metricType === SET_METRIC_TYPE ? bucketItem.metric.weight : 0;
    if (bucketItem) {
      bucketItem.metric.add(value);
      if (bucketItem.timestamp < timestamp) {
        bucketItem.timestamp = timestamp;
      }
    } else {
      bucketItem = {
        // @ts-expect-error we don't need to narrow down the type of value here, saves bundle size.
        metric: new METRIC_MAP[metricType](value),
        timestamp,
        metricType,
        name,
        unit,
        tags
      };
      this._buckets.set(bucketKey, bucketItem);
    }
    const val = typeof value === "string" ? bucketItem.metric.weight - previousWeight : value;
    updateMetricSummaryOnActiveSpan(metricType, name, val, unit, unsanitizedTags, bucketKey);
    this._bucketsTotalWeight += bucketItem.metric.weight;
    if (this._bucketsTotalWeight >= MAX_WEIGHT) {
      this.flush();
    }
  }
  /**
   * Flushes the current metrics to the transport via the transport.
   */
  flush() {
    this._forceFlush = true;
    this._flush();
  }
  /**
   * Shuts down metrics aggregator and clears all metrics.
   */
  close() {
    this._forceFlush = true;
    clearInterval(this._interval);
    this._flush();
  }
  /**
   * Flushes the buckets according to the internal state of the aggregator.
   * If it is a force flush, which happens on shutdown, it will flush all buckets.
   * Otherwise, it will only flush buckets that are older than the flush interval,
   * and according to the flush shift.
   *
   * This function mutates `_forceFlush` and `_bucketsTotalWeight` properties.
   */
  _flush() {
    if (this._forceFlush) {
      this._forceFlush = false;
      this._bucketsTotalWeight = 0;
      this._captureMetrics(this._buckets);
      this._buckets.clear();
      return;
    }
    const cutoffSeconds = Math.floor(timestampInSeconds()) - DEFAULT_FLUSH_INTERVAL / 1e3 - this._flushShift;
    const flushedBuckets = /* @__PURE__ */ new Map();
    for (const [key, bucket] of this._buckets) {
      if (bucket.timestamp <= cutoffSeconds) {
        flushedBuckets.set(key, bucket);
        this._bucketsTotalWeight -= bucket.metric.weight;
      }
    }
    for (const [key] of flushedBuckets) {
      this._buckets.delete(key);
    }
    this._captureMetrics(flushedBuckets);
  }
  /**
   * Only captures a subset of the buckets passed to this function.
   * @param flushedBuckets
   */
  _captureMetrics(flushedBuckets) {
    if (flushedBuckets.size > 0) {
      const buckets = Array.from(flushedBuckets).map(([, bucketItem]) => bucketItem);
      captureAggregateMetrics(this._client, buckets);
    }
  }
}
function increment(name, value = 1, data) {
  metrics.increment(MetricsAggregator, name, value, data);
}
function distribution(name, value, data) {
  metrics.distribution(MetricsAggregator, name, value, data);
}
function set(name, value, data) {
  metrics.set(MetricsAggregator, name, value, data);
}
function gauge(name, value, data) {
  metrics.gauge(MetricsAggregator, name, value, data);
}
function timing(name, value, unit = "second", data) {
  return metrics.timing(MetricsAggregator, name, value, unit, data);
}
function getMetricsAggregatorForClient(client) {
  return metrics.getMetricsAggregatorForClient(client, MetricsAggregator);
}
const metricsDefault = {
  increment,
  distribution,
  set,
  gauge,
  timing,
  /**
   * @ignore This is for internal use only.
   */
  getMetricsAggregatorForClient
};
var SUPPRESS_TRACING_KEY = createContextKey("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function suppressTracing$1(context2) {
  return context2.setValue(SUPPRESS_TRACING_KEY, true);
}
function isTracingSuppressed(context2) {
  return context2.getValue(SUPPRESS_TRACING_KEY) === true;
}
var BAGGAGE_KEY_PAIR_SEPARATOR = "=";
var BAGGAGE_PROPERTIES_SEPARATOR = ";";
var BAGGAGE_ITEMS_SEPARATOR = ",";
var BAGGAGE_HEADER = "baggage";
var BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
var BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
var BAGGAGE_MAX_TOTAL_LENGTH = 8192;
var __read$4 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
function serializeKeyPairs(keyPairs) {
  return keyPairs.reduce(function(hValue, current) {
    var value = "" + hValue + (hValue !== "" ? BAGGAGE_ITEMS_SEPARATOR : "") + current;
    return value.length > BAGGAGE_MAX_TOTAL_LENGTH ? hValue : value;
  }, "");
}
function getKeyPairs(baggage) {
  return baggage.getAllEntries().map(function(_a2) {
    var _b = __read$4(_a2, 2), key = _b[0], value = _b[1];
    var entry = encodeURIComponent(key) + "=" + encodeURIComponent(value.value);
    if (value.metadata !== void 0) {
      entry += BAGGAGE_PROPERTIES_SEPARATOR + value.metadata.toString();
    }
    return entry;
  });
}
function parsePairKeyValue(entry) {
  var valueProps = entry.split(BAGGAGE_PROPERTIES_SEPARATOR);
  if (valueProps.length <= 0)
    return;
  var keyPairPart = valueProps.shift();
  if (!keyPairPart)
    return;
  var separatorIndex = keyPairPart.indexOf(BAGGAGE_KEY_PAIR_SEPARATOR);
  if (separatorIndex <= 0)
    return;
  var key = decodeURIComponent(keyPairPart.substring(0, separatorIndex).trim());
  var value = decodeURIComponent(keyPairPart.substring(separatorIndex + 1).trim());
  var metadata;
  if (valueProps.length > 0) {
    metadata = baggageEntryMetadataFromString(valueProps.join(BAGGAGE_PROPERTIES_SEPARATOR));
  }
  return { key, value, metadata };
}
var W3CBaggagePropagator = (
  /** @class */
  function() {
    function W3CBaggagePropagator2() {
    }
    W3CBaggagePropagator2.prototype.inject = function(context2, carrier, setter) {
      var baggage = propagation.getBaggage(context2);
      if (!baggage || isTracingSuppressed(context2))
        return;
      var keyPairs = getKeyPairs(baggage).filter(function(pair) {
        return pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
      }).slice(0, BAGGAGE_MAX_NAME_VALUE_PAIRS);
      var headerValue = serializeKeyPairs(keyPairs);
      if (headerValue.length > 0) {
        setter.set(carrier, BAGGAGE_HEADER, headerValue);
      }
    };
    W3CBaggagePropagator2.prototype.extract = function(context2, carrier, getter) {
      var headerValue = getter.get(carrier, BAGGAGE_HEADER);
      var baggageString = Array.isArray(headerValue) ? headerValue.join(BAGGAGE_ITEMS_SEPARATOR) : headerValue;
      if (!baggageString)
        return context2;
      var baggage = {};
      if (baggageString.length === 0) {
        return context2;
      }
      var pairs = baggageString.split(BAGGAGE_ITEMS_SEPARATOR);
      pairs.forEach(function(entry) {
        var keyPair = parsePairKeyValue(entry);
        if (keyPair) {
          var baggageEntry = { value: keyPair.value };
          if (keyPair.metadata) {
            baggageEntry.metadata = keyPair.metadata;
          }
          baggage[keyPair.key] = baggageEntry;
        }
      });
      if (Object.entries(baggage).length === 0) {
        return context2;
      }
      return propagation.setBaggage(context2, propagation.createBaggage(baggage));
    };
    W3CBaggagePropagator2.prototype.fields = function() {
      return [BAGGAGE_HEADER];
    };
    return W3CBaggagePropagator2;
  }()
);
var __values$3 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read$3 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
function sanitizeAttributes(attributes) {
  var e_1, _a2;
  var out = {};
  if (typeof attributes !== "object" || attributes == null) {
    return out;
  }
  try {
    for (var _b = __values$3(Object.entries(attributes)), _c = _b.next(); !_c.done; _c = _b.next()) {
      var _d = __read$3(_c.value, 2), key = _d[0], val = _d[1];
      if (!isAttributeKey(key)) {
        diag.warn("Invalid attribute key: " + key);
        continue;
      }
      if (!isAttributeValue(val)) {
        diag.warn("Invalid attribute value set for key: " + key);
        continue;
      }
      if (Array.isArray(val)) {
        out[key] = val.slice();
      } else {
        out[key] = val;
      }
    }
  } catch (e_1_1) {
    e_1 = { error: e_1_1 };
  } finally {
    try {
      if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
    } finally {
      if (e_1) throw e_1.error;
    }
  }
  return out;
}
function isAttributeKey(key) {
  return typeof key === "string" && key.length > 0;
}
function isAttributeValue(val) {
  if (val == null) {
    return true;
  }
  if (Array.isArray(val)) {
    return isHomogeneousAttributeValueArray(val);
  }
  return isValidPrimitiveAttributeValue(val);
}
function isHomogeneousAttributeValueArray(arr) {
  var e_2, _a2;
  var type;
  try {
    for (var arr_1 = __values$3(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
      var element = arr_1_1.value;
      if (element == null)
        continue;
      if (!type) {
        if (isValidPrimitiveAttributeValue(element)) {
          type = typeof element;
          continue;
        }
        return false;
      }
      if (typeof element === type) {
        continue;
      }
      return false;
    }
  } catch (e_2_1) {
    e_2 = { error: e_2_1 };
  } finally {
    try {
      if (arr_1_1 && !arr_1_1.done && (_a2 = arr_1.return)) _a2.call(arr_1);
    } finally {
      if (e_2) throw e_2.error;
    }
  }
  return true;
}
function isValidPrimitiveAttributeValue(val) {
  switch (typeof val) {
    case "number":
    case "boolean":
    case "string":
      return true;
  }
  return false;
}
function loggingErrorHandler() {
  return function(ex) {
    diag.error(stringifyException(ex));
  };
}
function stringifyException(ex) {
  if (typeof ex === "string") {
    return ex;
  } else {
    return JSON.stringify(flattenException(ex));
  }
}
function flattenException(ex) {
  var result = {};
  var current = ex;
  while (current !== null) {
    Object.getOwnPropertyNames(current).forEach(function(propertyName) {
      if (result[propertyName])
        return;
      var value = current[propertyName];
      if (value) {
        result[propertyName] = String(value);
      }
    });
    current = Object.getPrototypeOf(current);
  }
  return result;
}
var delegateHandler = loggingErrorHandler();
function globalErrorHandler(ex) {
  try {
    delegateHandler(ex);
  } catch (_a2) {
  }
}
var TracesSamplerValues;
(function(TracesSamplerValues2) {
  TracesSamplerValues2["AlwaysOff"] = "always_off";
  TracesSamplerValues2["AlwaysOn"] = "always_on";
  TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
  TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
  TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
  TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
})(TracesSamplerValues || (TracesSamplerValues = {}));
var DEFAULT_LIST_SEPARATOR = ",";
var ENVIRONMENT_BOOLEAN_KEYS = ["OTEL_SDK_DISABLED"];
function isEnvVarABoolean(key) {
  return ENVIRONMENT_BOOLEAN_KEYS.indexOf(key) > -1;
}
var ENVIRONMENT_NUMBERS_KEYS = [
  "OTEL_BSP_EXPORT_TIMEOUT",
  "OTEL_BSP_MAX_EXPORT_BATCH_SIZE",
  "OTEL_BSP_MAX_QUEUE_SIZE",
  "OTEL_BSP_SCHEDULE_DELAY",
  "OTEL_BLRP_EXPORT_TIMEOUT",
  "OTEL_BLRP_MAX_EXPORT_BATCH_SIZE",
  "OTEL_BLRP_MAX_QUEUE_SIZE",
  "OTEL_BLRP_SCHEDULE_DELAY",
  "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
  "OTEL_ATTRIBUTE_COUNT_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT",
  "OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT",
  "OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT",
  "OTEL_SPAN_EVENT_COUNT_LIMIT",
  "OTEL_SPAN_LINK_COUNT_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT",
  "OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT",
  "OTEL_EXPORTER_OTLP_TIMEOUT",
  "OTEL_EXPORTER_OTLP_TRACES_TIMEOUT",
  "OTEL_EXPORTER_OTLP_METRICS_TIMEOUT",
  "OTEL_EXPORTER_OTLP_LOGS_TIMEOUT",
  "OTEL_EXPORTER_JAEGER_AGENT_PORT"
];
function isEnvVarANumber(key) {
  return ENVIRONMENT_NUMBERS_KEYS.indexOf(key) > -1;
}
var ENVIRONMENT_LISTS_KEYS = [
  "OTEL_NO_PATCH_MODULES",
  "OTEL_PROPAGATORS"
];
function isEnvVarAList(key) {
  return ENVIRONMENT_LISTS_KEYS.indexOf(key) > -1;
}
var DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
var DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128;
var DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT = 128;
var DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT = 128;
var DEFAULT_ENVIRONMENT = {
  OTEL_SDK_DISABLED: false,
  CONTAINER_NAME: "",
  ECS_CONTAINER_METADATA_URI_V4: "",
  ECS_CONTAINER_METADATA_URI: "",
  HOSTNAME: "",
  KUBERNETES_SERVICE_HOST: "",
  NAMESPACE: "",
  OTEL_BSP_EXPORT_TIMEOUT: 3e4,
  OTEL_BSP_MAX_EXPORT_BATCH_SIZE: 512,
  OTEL_BSP_MAX_QUEUE_SIZE: 2048,
  OTEL_BSP_SCHEDULE_DELAY: 5e3,
  OTEL_BLRP_EXPORT_TIMEOUT: 3e4,
  OTEL_BLRP_MAX_EXPORT_BATCH_SIZE: 512,
  OTEL_BLRP_MAX_QUEUE_SIZE: 2048,
  OTEL_BLRP_SCHEDULE_DELAY: 5e3,
  OTEL_EXPORTER_JAEGER_AGENT_HOST: "",
  OTEL_EXPORTER_JAEGER_AGENT_PORT: 6832,
  OTEL_EXPORTER_JAEGER_ENDPOINT: "",
  OTEL_EXPORTER_JAEGER_PASSWORD: "",
  OTEL_EXPORTER_JAEGER_USER: "",
  OTEL_EXPORTER_OTLP_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: "",
  OTEL_EXPORTER_OTLP_HEADERS: "",
  OTEL_EXPORTER_OTLP_TRACES_HEADERS: "",
  OTEL_EXPORTER_OTLP_METRICS_HEADERS: "",
  OTEL_EXPORTER_OTLP_LOGS_HEADERS: "",
  OTEL_EXPORTER_OTLP_TIMEOUT: 1e4,
  OTEL_EXPORTER_OTLP_TRACES_TIMEOUT: 1e4,
  OTEL_EXPORTER_OTLP_METRICS_TIMEOUT: 1e4,
  OTEL_EXPORTER_OTLP_LOGS_TIMEOUT: 1e4,
  OTEL_EXPORTER_ZIPKIN_ENDPOINT: "http://localhost:9411/api/v2/spans",
  OTEL_LOG_LEVEL: DiagLogLevel.INFO,
  OTEL_NO_PATCH_MODULES: [],
  OTEL_PROPAGATORS: ["tracecontext", "baggage"],
  OTEL_RESOURCE_ATTRIBUTES: "",
  OTEL_SERVICE_NAME: "",
  OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT: DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  OTEL_ATTRIBUTE_COUNT_LIMIT: DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT: DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT: DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT: DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT: DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  OTEL_SPAN_EVENT_COUNT_LIMIT: 128,
  OTEL_SPAN_LINK_COUNT_LIMIT: 128,
  OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT: DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT,
  OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT: DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT,
  OTEL_TRACES_EXPORTER: "",
  OTEL_TRACES_SAMPLER: TracesSamplerValues.ParentBasedAlwaysOn,
  OTEL_TRACES_SAMPLER_ARG: "",
  OTEL_LOGS_EXPORTER: "",
  OTEL_EXPORTER_OTLP_INSECURE: "",
  OTEL_EXPORTER_OTLP_TRACES_INSECURE: "",
  OTEL_EXPORTER_OTLP_METRICS_INSECURE: "",
  OTEL_EXPORTER_OTLP_LOGS_INSECURE: "",
  OTEL_EXPORTER_OTLP_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_TRACES_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_METRICS_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_LOGS_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_TRACES_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_METRICS_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_LOGS_COMPRESSION: "",
  OTEL_EXPORTER_OTLP_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_TRACES_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_LOGS_CLIENT_KEY: "",
  OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_TRACES_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_METRICS_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_LOGS_CLIENT_CERTIFICATE: "",
  OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_LOGS_PROTOCOL: "http/protobuf",
  OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: "cumulative"
};
function parseBoolean(key, environment, values) {
  if (typeof values[key] === "undefined") {
    return;
  }
  var value = String(values[key]);
  environment[key] = value.toLowerCase() === "true";
}
function parseNumber(name, environment, values, min, max) {
  if (min === void 0) {
    min = -Infinity;
  }
  if (max === void 0) {
    max = Infinity;
  }
  if (typeof values[name] !== "undefined") {
    var value = Number(values[name]);
    if (!isNaN(value)) {
      if (value < min) {
        environment[name] = min;
      } else if (value > max) {
        environment[name] = max;
      } else {
        environment[name] = value;
      }
    }
  }
}
function parseStringList(name, output, input, separator) {
  if (separator === void 0) {
    separator = DEFAULT_LIST_SEPARATOR;
  }
  var givenValue = input[name];
  if (typeof givenValue === "string") {
    output[name] = givenValue.split(separator).map(function(v) {
      return v.trim();
    });
  }
}
var logLevelMap = {
  ALL: DiagLogLevel.ALL,
  VERBOSE: DiagLogLevel.VERBOSE,
  DEBUG: DiagLogLevel.DEBUG,
  INFO: DiagLogLevel.INFO,
  WARN: DiagLogLevel.WARN,
  ERROR: DiagLogLevel.ERROR,
  NONE: DiagLogLevel.NONE
};
function setLogLevelFromEnv(key, environment, values) {
  var value = values[key];
  if (typeof value === "string") {
    var theLevel = logLevelMap[value.toUpperCase()];
    if (theLevel != null) {
      environment[key] = theLevel;
    }
  }
}
function parseEnvironment(values) {
  var environment = {};
  for (var env2 in DEFAULT_ENVIRONMENT) {
    var key = env2;
    switch (key) {
      case "OTEL_LOG_LEVEL":
        setLogLevelFromEnv(key, environment, values);
        break;
      default:
        if (isEnvVarABoolean(key)) {
          parseBoolean(key, environment, values);
        } else if (isEnvVarANumber(key)) {
          parseNumber(key, environment, values);
        } else if (isEnvVarAList(key)) {
          parseStringList(key, environment, values);
        } else {
          var value = values[key];
          if (typeof value !== "undefined" && value !== null) {
            environment[key] = String(value);
          }
        }
    }
  }
  return environment;
}
function getEnv() {
  var processEnv = parseEnvironment(process.env);
  return Object.assign({}, DEFAULT_ENVIRONMENT, processEnv);
}
function getEnvWithoutDefaults() {
  return parseEnvironment(process.env);
}
var otperformance = performance;
var VERSION$1 = "1.26.0";
var _a;
var SDK_INFO = (_a = {}, _a[SEMRESATTRS_TELEMETRY_SDK_NAME] = "opentelemetry", _a[SEMRESATTRS_PROCESS_RUNTIME_NAME] = "node", _a[SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = TELEMETRYSDKLANGUAGEVALUES_NODEJS, _a[SEMRESATTRS_TELEMETRY_SDK_VERSION] = VERSION$1, _a);
function unrefTimer(timer) {
  timer.unref();
}
var NANOSECOND_DIGITS = 9;
var NANOSECOND_DIGITS_IN_MILLIS = 6;
var MILLISECONDS_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS);
var SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
function millisToHrTime(epochMillis) {
  var epochSeconds = epochMillis / 1e3;
  var seconds = Math.trunc(epochSeconds);
  var nanos = Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS);
  return [seconds, nanos];
}
function getTimeOrigin() {
  var timeOrigin = otperformance.timeOrigin;
  if (typeof timeOrigin !== "number") {
    var perf = otperformance;
    timeOrigin = perf.timing && perf.timing.fetchStart;
  }
  return timeOrigin;
}
function hrTime(performanceNow) {
  var timeOrigin = millisToHrTime(getTimeOrigin());
  var now = millisToHrTime(typeof performanceNow === "number" ? performanceNow : otperformance.now());
  return addHrTimes(timeOrigin, now);
}
function hrTimeDuration(startTime, endTime) {
  var seconds = endTime[0] - startTime[0];
  var nanos = endTime[1] - startTime[1];
  if (nanos < 0) {
    seconds -= 1;
    nanos += SECOND_TO_NANOSECONDS;
  }
  return [seconds, nanos];
}
function isTimeInputHrTime(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
function isTimeInput(value) {
  return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
}
function addHrTimes(time1, time2) {
  var out = [time1[0] + time2[0], time1[1] + time2[1]];
  if (out[1] >= SECOND_TO_NANOSECONDS) {
    out[1] -= SECOND_TO_NANOSECONDS;
    out[0] += 1;
  }
  return out;
}
var ExportResultCode;
(function(ExportResultCode2) {
  ExportResultCode2[ExportResultCode2["SUCCESS"] = 0] = "SUCCESS";
  ExportResultCode2[ExportResultCode2["FAILED"] = 1] = "FAILED";
})(ExportResultCode || (ExportResultCode = {}));
var __values$2 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var CompositePropagator = (
  /** @class */
  function() {
    function CompositePropagator2(config) {
      if (config === void 0) {
        config = {};
      }
      var _a2;
      this._propagators = (_a2 = config.propagators) !== null && _a2 !== void 0 ? _a2 : [];
      this._fields = Array.from(new Set(this._propagators.map(function(p) {
        return typeof p.fields === "function" ? p.fields() : [];
      }).reduce(function(x, y) {
        return x.concat(y);
      }, [])));
    }
    CompositePropagator2.prototype.inject = function(context2, carrier, setter) {
      var e_1, _a2;
      try {
        for (var _b = __values$2(this._propagators), _c = _b.next(); !_c.done; _c = _b.next()) {
          var propagator = _c.value;
          try {
            propagator.inject(context2, carrier, setter);
          } catch (err) {
            diag.warn("Failed to inject with " + propagator.constructor.name + ". Err: " + err.message);
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    };
    CompositePropagator2.prototype.extract = function(context2, carrier, getter) {
      return this._propagators.reduce(function(ctx, propagator) {
        try {
          return propagator.extract(ctx, carrier, getter);
        } catch (err) {
          diag.warn("Failed to inject with " + propagator.constructor.name + ". Err: " + err.message);
        }
        return ctx;
      }, context2);
    };
    CompositePropagator2.prototype.fields = function() {
      return this._fields.slice();
    };
    return CompositePropagator2;
  }()
);
var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
var VALID_KEY = "[a-z]" + VALID_KEY_CHAR_RANGE + "{0,255}";
var VALID_VENDOR_KEY = "[a-z0-9]" + VALID_KEY_CHAR_RANGE + "{0,240}@[a-z]" + VALID_KEY_CHAR_RANGE + "{0,13}";
var VALID_KEY_REGEX = new RegExp("^(?:" + VALID_KEY + "|" + VALID_VENDOR_KEY + ")$");
var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
function validateKey(key) {
  return VALID_KEY_REGEX.test(key);
}
function validateValue(value) {
  return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}
var MAX_TRACE_STATE_ITEMS = 32;
var MAX_TRACE_STATE_LEN = 512;
var LIST_MEMBERS_SEPARATOR = ",";
var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
var TraceState = (
  /** @class */
  function() {
    function TraceState2(rawTraceState) {
      this._internalState = /* @__PURE__ */ new Map();
      if (rawTraceState)
        this._parse(rawTraceState);
    }
    TraceState2.prototype.set = function(key, value) {
      var traceState = this._clone();
      if (traceState._internalState.has(key)) {
        traceState._internalState.delete(key);
      }
      traceState._internalState.set(key, value);
      return traceState;
    };
    TraceState2.prototype.unset = function(key) {
      var traceState = this._clone();
      traceState._internalState.delete(key);
      return traceState;
    };
    TraceState2.prototype.get = function(key) {
      return this._internalState.get(key);
    };
    TraceState2.prototype.serialize = function() {
      var _this = this;
      return this._keys().reduce(function(agg, key) {
        agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + _this.get(key));
        return agg;
      }, []).join(LIST_MEMBERS_SEPARATOR);
    };
    TraceState2.prototype._parse = function(rawTraceState) {
      if (rawTraceState.length > MAX_TRACE_STATE_LEN)
        return;
      this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce(function(agg, part) {
        var listMember = part.trim();
        var i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
        if (i !== -1) {
          var key = listMember.slice(0, i);
          var value = listMember.slice(i + 1, part.length);
          if (validateKey(key) && validateValue(value)) {
            agg.set(key, value);
          }
        }
        return agg;
      }, /* @__PURE__ */ new Map());
      if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
        this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
      }
    };
    TraceState2.prototype._keys = function() {
      return Array.from(this._internalState.keys()).reverse();
    };
    TraceState2.prototype._clone = function() {
      var traceState = new TraceState2();
      traceState._internalState = new Map(this._internalState);
      return traceState;
    };
    return TraceState2;
  }()
);
var TRACE_PARENT_HEADER = "traceparent";
var TRACE_STATE_HEADER = "tracestate";
var VERSION = "00";
var VERSION_PART = "(?!ff)[\\da-f]{2}";
var TRACE_ID_PART = "(?![0]{32})[\\da-f]{32}";
var PARENT_ID_PART = "(?![0]{16})[\\da-f]{16}";
var FLAGS_PART = "[\\da-f]{2}";
var TRACE_PARENT_REGEX = new RegExp("^\\s?(" + VERSION_PART + ")-(" + TRACE_ID_PART + ")-(" + PARENT_ID_PART + ")-(" + FLAGS_PART + ")(-.*)?\\s?$");
function parseTraceParent(traceParent) {
  var match = TRACE_PARENT_REGEX.exec(traceParent);
  if (!match)
    return null;
  if (match[1] === "00" && match[5])
    return null;
  return {
    traceId: match[2],
    spanId: match[3],
    traceFlags: parseInt(match[4], 16)
  };
}
var W3CTraceContextPropagator = (
  /** @class */
  function() {
    function W3CTraceContextPropagator2() {
    }
    W3CTraceContextPropagator2.prototype.inject = function(context2, carrier, setter) {
      var spanContext = trace.getSpanContext(context2);
      if (!spanContext || isTracingSuppressed(context2) || !isSpanContextValid(spanContext))
        return;
      var traceParent = VERSION + "-" + spanContext.traceId + "-" + spanContext.spanId + "-0" + Number(spanContext.traceFlags || TraceFlags.NONE).toString(16);
      setter.set(carrier, TRACE_PARENT_HEADER, traceParent);
      if (spanContext.traceState) {
        setter.set(carrier, TRACE_STATE_HEADER, spanContext.traceState.serialize());
      }
    };
    W3CTraceContextPropagator2.prototype.extract = function(context2, carrier, getter) {
      var traceParentHeader = getter.get(carrier, TRACE_PARENT_HEADER);
      if (!traceParentHeader)
        return context2;
      var traceParent = Array.isArray(traceParentHeader) ? traceParentHeader[0] : traceParentHeader;
      if (typeof traceParent !== "string")
        return context2;
      var spanContext = parseTraceParent(traceParent);
      if (!spanContext)
        return context2;
      spanContext.isRemote = true;
      var traceStateHeader = getter.get(carrier, TRACE_STATE_HEADER);
      if (traceStateHeader) {
        var state = Array.isArray(traceStateHeader) ? traceStateHeader.join(",") : traceStateHeader;
        spanContext.traceState = new TraceState(typeof state === "string" ? state : void 0);
      }
      return trace.setSpanContext(context2, spanContext);
    };
    W3CTraceContextPropagator2.prototype.fields = function() {
      return [TRACE_PARENT_HEADER, TRACE_STATE_HEADER];
    };
    return W3CTraceContextPropagator2;
  }()
);
var objectTag = "[object Object]";
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
var objectCtorString = funcToString.call(Object);
var getPrototype = overArg(Object.getPrototypeOf, Object);
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
var nativeObjectToString = objectProto.toString;
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  var unmasked = false;
  try {
    value[symToStringTag] = void 0;
    unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
function objectToString(value) {
  return nativeObjectToString.call(value);
}
var MAX_LEVEL = 20;
function merge() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var result = args.shift();
  var objects = /* @__PURE__ */ new WeakMap();
  while (args.length > 0) {
    result = mergeTwoObjects(result, args.shift(), 0, objects);
  }
  return result;
}
function takeValue(value) {
  if (isArray(value)) {
    return value.slice();
  }
  return value;
}
function mergeTwoObjects(one, two, level, objects) {
  if (level === void 0) {
    level = 0;
  }
  var result;
  if (level > MAX_LEVEL) {
    return void 0;
  }
  level++;
  if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) {
    result = takeValue(two);
  } else if (isArray(one)) {
    result = one.slice();
    if (isArray(two)) {
      for (var i = 0, j = two.length; i < j; i++) {
        result.push(takeValue(two[i]));
      }
    } else if (isObject(two)) {
      var keys = Object.keys(two);
      for (var i = 0, j = keys.length; i < j; i++) {
        var key = keys[i];
        result[key] = takeValue(two[key]);
      }
    }
  } else if (isObject(one)) {
    if (isObject(two)) {
      if (!shouldMerge(one, two)) {
        return two;
      }
      result = Object.assign({}, one);
      var keys = Object.keys(two);
      for (var i = 0, j = keys.length; i < j; i++) {
        var key = keys[i];
        var twoValue = two[key];
        if (isPrimitive(twoValue)) {
          if (typeof twoValue === "undefined") {
            delete result[key];
          } else {
            result[key] = twoValue;
          }
        } else {
          var obj1 = result[key];
          var obj2 = twoValue;
          if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) {
            delete result[key];
          } else {
            if (isObject(obj1) && isObject(obj2)) {
              var arr1 = objects.get(obj1) || [];
              var arr2 = objects.get(obj2) || [];
              arr1.push({ obj: one, key });
              arr2.push({ obj: two, key });
              objects.set(obj1, arr1);
              objects.set(obj2, arr2);
            }
            result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
          }
        }
      }
    } else {
      result = two;
    }
  }
  return result;
}
function wasObjectReferenced(obj, key, objects) {
  var arr = objects.get(obj[key]) || [];
  for (var i = 0, j = arr.length; i < j; i++) {
    var info = arr[i];
    if (info.key === key && info.obj === obj) {
      return true;
    }
  }
  return false;
}
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
}
function shouldMerge(one, two) {
  if (!isPlainObject(one) || !isPlainObject(two)) {
    return false;
  }
  return true;
}
var Deferred = (
  /** @class */
  function() {
    function Deferred2() {
      var _this = this;
      this._promise = new Promise(function(resolve2, reject) {
        _this._resolve = resolve2;
        _this._reject = reject;
      });
    }
    Object.defineProperty(Deferred2.prototype, "promise", {
      get: function() {
        return this._promise;
      },
      enumerable: false,
      configurable: true
    });
    Deferred2.prototype.resolve = function(val) {
      this._resolve(val);
    };
    Deferred2.prototype.reject = function(err) {
      this._reject(err);
    };
    return Deferred2;
  }()
);
var __read$2 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$1 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var BindOnceFuture = (
  /** @class */
  function() {
    function BindOnceFuture2(_callback, _that) {
      this._callback = _callback;
      this._that = _that;
      this._isCalled = false;
      this._deferred = new Deferred();
    }
    Object.defineProperty(BindOnceFuture2.prototype, "isCalled", {
      get: function() {
        return this._isCalled;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(BindOnceFuture2.prototype, "promise", {
      get: function() {
        return this._deferred.promise;
      },
      enumerable: false,
      configurable: true
    });
    BindOnceFuture2.prototype.call = function() {
      var _a2;
      var _this = this;
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      if (!this._isCalled) {
        this._isCalled = true;
        try {
          Promise.resolve((_a2 = this._callback).call.apply(_a2, __spreadArray$1([this._that], __read$2(args), false))).then(function(val) {
            return _this._deferred.resolve(val);
          }, function(err) {
            return _this._deferred.reject(err);
          });
        } catch (err) {
          this._deferred.reject(err);
        }
      }
      return this._deferred.promise;
    };
    return BindOnceFuture2;
  }()
);
var ExceptionEventName = "exception";
var __values$1 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read$1 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var Span = (
  /** @class */
  function() {
    function Span2(parentTracer, context2, spanName, spanContext, kind, parentSpanId, links, startTime, _deprecatedClock, attributes) {
      if (links === void 0) {
        links = [];
      }
      this.attributes = {};
      this.links = [];
      this.events = [];
      this._droppedAttributesCount = 0;
      this._droppedEventsCount = 0;
      this._droppedLinksCount = 0;
      this.status = {
        code: SpanStatusCode.UNSET
      };
      this.endTime = [0, 0];
      this._ended = false;
      this._duration = [-1, -1];
      this.name = spanName;
      this._spanContext = spanContext;
      this.parentSpanId = parentSpanId;
      this.kind = kind;
      this.links = links;
      var now = Date.now();
      this._performanceStartTime = otperformance.now();
      this._performanceOffset = now - (this._performanceStartTime + getTimeOrigin());
      this._startTimeProvided = startTime != null;
      this.startTime = this._getTime(startTime !== null && startTime !== void 0 ? startTime : now);
      this.resource = parentTracer.resource;
      this.instrumentationLibrary = parentTracer.instrumentationLibrary;
      this._spanLimits = parentTracer.getSpanLimits();
      this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit || 0;
      if (attributes != null) {
        this.setAttributes(attributes);
      }
      this._spanProcessor = parentTracer.getActiveSpanProcessor();
      this._spanProcessor.onStart(this, context2);
    }
    Span2.prototype.spanContext = function() {
      return this._spanContext;
    };
    Span2.prototype.setAttribute = function(key, value) {
      if (value == null || this._isSpanEnded())
        return this;
      if (key.length === 0) {
        diag.warn("Invalid attribute key: " + key);
        return this;
      }
      if (!isAttributeValue(value)) {
        diag.warn("Invalid attribute value set for key: " + key);
        return this;
      }
      if (Object.keys(this.attributes).length >= this._spanLimits.attributeCountLimit && !Object.prototype.hasOwnProperty.call(this.attributes, key)) {
        this._droppedAttributesCount++;
        return this;
      }
      this.attributes[key] = this._truncateToSize(value);
      return this;
    };
    Span2.prototype.setAttributes = function(attributes) {
      var e_1, _a2;
      try {
        for (var _b = __values$1(Object.entries(attributes)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var _d = __read$1(_c.value, 2), k = _d[0], v = _d[1];
          this.setAttribute(k, v);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      return this;
    };
    Span2.prototype.addEvent = function(name, attributesOrStartTime, timeStamp) {
      if (this._isSpanEnded())
        return this;
      if (this._spanLimits.eventCountLimit === 0) {
        diag.warn("No events allowed.");
        this._droppedEventsCount++;
        return this;
      }
      if (this.events.length >= this._spanLimits.eventCountLimit) {
        if (this._droppedEventsCount === 0) {
          diag.debug("Dropping extra events.");
        }
        this.events.shift();
        this._droppedEventsCount++;
      }
      if (isTimeInput(attributesOrStartTime)) {
        if (!isTimeInput(timeStamp)) {
          timeStamp = attributesOrStartTime;
        }
        attributesOrStartTime = void 0;
      }
      var attributes = sanitizeAttributes(attributesOrStartTime);
      this.events.push({
        name,
        attributes,
        time: this._getTime(timeStamp),
        droppedAttributesCount: 0
      });
      return this;
    };
    Span2.prototype.addLink = function(link) {
      this.links.push(link);
      return this;
    };
    Span2.prototype.addLinks = function(links) {
      var _a2;
      (_a2 = this.links).push.apply(_a2, __spreadArray([], __read$1(links), false));
      return this;
    };
    Span2.prototype.setStatus = function(status) {
      if (this._isSpanEnded())
        return this;
      this.status = status;
      return this;
    };
    Span2.prototype.updateName = function(name) {
      if (this._isSpanEnded())
        return this;
      this.name = name;
      return this;
    };
    Span2.prototype.end = function(endTime) {
      if (this._isSpanEnded()) {
        diag.error(this.name + " " + this._spanContext.traceId + "-" + this._spanContext.spanId + " - You can only call end() on a span once.");
        return;
      }
      this._ended = true;
      this.endTime = this._getTime(endTime);
      this._duration = hrTimeDuration(this.startTime, this.endTime);
      if (this._duration[0] < 0) {
        diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
        this.endTime = this.startTime.slice();
        this._duration = [0, 0];
      }
      if (this._droppedEventsCount > 0) {
        diag.warn("Dropped " + this._droppedEventsCount + " events because eventCountLimit reached");
      }
      this._spanProcessor.onEnd(this);
    };
    Span2.prototype._getTime = function(inp) {
      if (typeof inp === "number" && inp < otperformance.now()) {
        return hrTime(inp + this._performanceOffset);
      }
      if (typeof inp === "number") {
        return millisToHrTime(inp);
      }
      if (inp instanceof Date) {
        return millisToHrTime(inp.getTime());
      }
      if (isTimeInputHrTime(inp)) {
        return inp;
      }
      if (this._startTimeProvided) {
        return millisToHrTime(Date.now());
      }
      var msDuration = otperformance.now() - this._performanceStartTime;
      return addHrTimes(this.startTime, millisToHrTime(msDuration));
    };
    Span2.prototype.isRecording = function() {
      return this._ended === false;
    };
    Span2.prototype.recordException = function(exception, time) {
      var attributes = {};
      if (typeof exception === "string") {
        attributes[SEMATTRS_EXCEPTION_MESSAGE] = exception;
      } else if (exception) {
        if (exception.code) {
          attributes[SEMATTRS_EXCEPTION_TYPE] = exception.code.toString();
        } else if (exception.name) {
          attributes[SEMATTRS_EXCEPTION_TYPE] = exception.name;
        }
        if (exception.message) {
          attributes[SEMATTRS_EXCEPTION_MESSAGE] = exception.message;
        }
        if (exception.stack) {
          attributes[SEMATTRS_EXCEPTION_STACKTRACE] = exception.stack;
        }
      }
      if (attributes[SEMATTRS_EXCEPTION_TYPE] || attributes[SEMATTRS_EXCEPTION_MESSAGE]) {
        this.addEvent(ExceptionEventName, attributes, time);
      } else {
        diag.warn("Failed to record an exception " + exception);
      }
    };
    Object.defineProperty(Span2.prototype, "duration", {
      get: function() {
        return this._duration;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "ended", {
      get: function() {
        return this._ended;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "droppedAttributesCount", {
      get: function() {
        return this._droppedAttributesCount;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "droppedEventsCount", {
      get: function() {
        return this._droppedEventsCount;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Span2.prototype, "droppedLinksCount", {
      get: function() {
        return this._droppedLinksCount;
      },
      enumerable: false,
      configurable: true
    });
    Span2.prototype._isSpanEnded = function() {
      if (this._ended) {
        diag.warn("Can not execute the operation on ended Span {traceId: " + this._spanContext.traceId + ", spanId: " + this._spanContext.spanId + "}");
      }
      return this._ended;
    };
    Span2.prototype._truncateToLimitUtil = function(value, limit) {
      if (value.length <= limit) {
        return value;
      }
      return value.substr(0, limit);
    };
    Span2.prototype._truncateToSize = function(value) {
      var _this = this;
      var limit = this._attributeValueLengthLimit;
      if (limit <= 0) {
        diag.warn("Attribute value limit must be positive, got " + limit);
        return value;
      }
      if (typeof value === "string") {
        return this._truncateToLimitUtil(value, limit);
      }
      if (Array.isArray(value)) {
        return value.map(function(val) {
          return typeof val === "string" ? _this._truncateToLimitUtil(val, limit) : val;
        });
      }
      return value;
    };
    return Span2;
  }()
);
var SamplingDecision;
(function(SamplingDecision2) {
  SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
  SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));
var AlwaysOffSampler = (
  /** @class */
  function() {
    function AlwaysOffSampler2() {
    }
    AlwaysOffSampler2.prototype.shouldSample = function() {
      return {
        decision: SamplingDecision.NOT_RECORD
      };
    };
    AlwaysOffSampler2.prototype.toString = function() {
      return "AlwaysOffSampler";
    };
    return AlwaysOffSampler2;
  }()
);
var AlwaysOnSampler = (
  /** @class */
  function() {
    function AlwaysOnSampler2() {
    }
    AlwaysOnSampler2.prototype.shouldSample = function() {
      return {
        decision: SamplingDecision.RECORD_AND_SAMPLED
      };
    };
    AlwaysOnSampler2.prototype.toString = function() {
      return "AlwaysOnSampler";
    };
    return AlwaysOnSampler2;
  }()
);
var ParentBasedSampler = (
  /** @class */
  function() {
    function ParentBasedSampler2(config) {
      var _a2, _b, _c, _d;
      this._root = config.root;
      if (!this._root) {
        globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
        this._root = new AlwaysOnSampler();
      }
      this._remoteParentSampled = (_a2 = config.remoteParentSampled) !== null && _a2 !== void 0 ? _a2 : new AlwaysOnSampler();
      this._remoteParentNotSampled = (_b = config.remoteParentNotSampled) !== null && _b !== void 0 ? _b : new AlwaysOffSampler();
      this._localParentSampled = (_c = config.localParentSampled) !== null && _c !== void 0 ? _c : new AlwaysOnSampler();
      this._localParentNotSampled = (_d = config.localParentNotSampled) !== null && _d !== void 0 ? _d : new AlwaysOffSampler();
    }
    ParentBasedSampler2.prototype.shouldSample = function(context2, traceId, spanName, spanKind, attributes, links) {
      var parentContext = trace.getSpanContext(context2);
      if (!parentContext || !isSpanContextValid(parentContext)) {
        return this._root.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
      }
      if (parentContext.isRemote) {
        if (parentContext.traceFlags & TraceFlags.SAMPLED) {
          return this._remoteParentSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
        }
        return this._remoteParentNotSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
      }
      if (parentContext.traceFlags & TraceFlags.SAMPLED) {
        return this._localParentSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
      }
      return this._localParentNotSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
    };
    ParentBasedSampler2.prototype.toString = function() {
      return "ParentBased{root=" + this._root.toString() + ", remoteParentSampled=" + this._remoteParentSampled.toString() + ", remoteParentNotSampled=" + this._remoteParentNotSampled.toString() + ", localParentSampled=" + this._localParentSampled.toString() + ", localParentNotSampled=" + this._localParentNotSampled.toString() + "}";
    };
    return ParentBasedSampler2;
  }()
);
var TraceIdRatioBasedSampler = (
  /** @class */
  function() {
    function TraceIdRatioBasedSampler2(_ratio) {
      if (_ratio === void 0) {
        _ratio = 0;
      }
      this._ratio = _ratio;
      this._ratio = this._normalize(_ratio);
      this._upperBound = Math.floor(this._ratio * 4294967295);
    }
    TraceIdRatioBasedSampler2.prototype.shouldSample = function(context2, traceId) {
      return {
        decision: isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD
      };
    };
    TraceIdRatioBasedSampler2.prototype.toString = function() {
      return "TraceIdRatioBased{" + this._ratio + "}";
    };
    TraceIdRatioBasedSampler2.prototype._normalize = function(ratio) {
      if (typeof ratio !== "number" || isNaN(ratio))
        return 0;
      return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
    };
    TraceIdRatioBasedSampler2.prototype._accumulate = function(traceId) {
      var accumulation = 0;
      for (var i = 0; i < traceId.length / 8; i++) {
        var pos = i * 8;
        var part = parseInt(traceId.slice(pos, pos + 8), 16);
        accumulation = (accumulation ^ part) >>> 0;
      }
      return accumulation;
    };
    return TraceIdRatioBasedSampler2;
  }()
);
var env = getEnv();
var FALLBACK_OTEL_TRACES_SAMPLER = TracesSamplerValues.AlwaysOn;
var DEFAULT_RATIO = 1;
function loadDefaultConfig() {
  var _env = getEnv();
  return {
    sampler: buildSamplerFromEnv(env),
    forceFlushTimeoutMillis: 3e4,
    generalLimits: {
      attributeValueLengthLimit: _env.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: _env.OTEL_ATTRIBUTE_COUNT_LIMIT
    },
    spanLimits: {
      attributeValueLengthLimit: _env.OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: _env.OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT,
      linkCountLimit: _env.OTEL_SPAN_LINK_COUNT_LIMIT,
      eventCountLimit: _env.OTEL_SPAN_EVENT_COUNT_LIMIT,
      attributePerEventCountLimit: _env.OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT,
      attributePerLinkCountLimit: _env.OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT
    }
  };
}
function buildSamplerFromEnv(environment) {
  if (environment === void 0) {
    environment = getEnv();
  }
  switch (environment.OTEL_TRACES_SAMPLER) {
    case TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler();
    case TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler();
    case TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
    case TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler()
      });
    case TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv(environment));
    case TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv(environment))
      });
    default:
      diag.error('OTEL_TRACES_SAMPLER value "' + environment.OTEL_TRACES_SAMPLER + " invalid, defaulting to " + FALLBACK_OTEL_TRACES_SAMPLER + '".');
      return new AlwaysOnSampler();
  }
}
function getSamplerProbabilityFromEnv(environment) {
  if (environment.OTEL_TRACES_SAMPLER_ARG === void 0 || environment.OTEL_TRACES_SAMPLER_ARG === "") {
    diag.error("OTEL_TRACES_SAMPLER_ARG is blank, defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  var probability = Number(environment.OTEL_TRACES_SAMPLER_ARG);
  if (isNaN(probability)) {
    diag.error("OTEL_TRACES_SAMPLER_ARG=" + environment.OTEL_TRACES_SAMPLER_ARG + " was given, but it is invalid, defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    diag.error("OTEL_TRACES_SAMPLER_ARG=" + environment.OTEL_TRACES_SAMPLER_ARG + " was given, but it is out of range ([0..1]), defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  return probability;
}
function mergeConfig(userConfig) {
  var perInstanceDefaults = {
    sampler: buildSamplerFromEnv()
  };
  var DEFAULT_CONFIG = loadDefaultConfig();
  var target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
  target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
  target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
  return target;
}
function reconfigureLimits(userConfig) {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
  var spanLimits = Object.assign({}, userConfig.spanLimits);
  var parsedEnvConfig = getEnvWithoutDefaults();
  spanLimits.attributeCountLimit = (_f = (_e = (_d = (_b = (_a2 = userConfig.spanLimits) === null || _a2 === void 0 ? void 0 : _a2.attributeCountLimit) !== null && _b !== void 0 ? _b : (_c = userConfig.generalLimits) === null || _c === void 0 ? void 0 : _c.attributeCountLimit) !== null && _d !== void 0 ? _d : parsedEnvConfig.OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT) !== null && _e !== void 0 ? _e : parsedEnvConfig.OTEL_ATTRIBUTE_COUNT_LIMIT) !== null && _f !== void 0 ? _f : DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = (_m = (_l = (_k = (_h = (_g = userConfig.spanLimits) === null || _g === void 0 ? void 0 : _g.attributeValueLengthLimit) !== null && _h !== void 0 ? _h : (_j = userConfig.generalLimits) === null || _j === void 0 ? void 0 : _j.attributeValueLengthLimit) !== null && _k !== void 0 ? _k : parsedEnvConfig.OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT) !== null && _l !== void 0 ? _l : parsedEnvConfig.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT) !== null && _m !== void 0 ? _m : DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}
var BatchSpanProcessorBase = (
  /** @class */
  function() {
    function BatchSpanProcessorBase2(_exporter, config) {
      this._exporter = _exporter;
      this._isExporting = false;
      this._finishedSpans = [];
      this._droppedSpansCount = 0;
      var env2 = getEnv();
      this._maxExportBatchSize = typeof (config === null || config === void 0 ? void 0 : config.maxExportBatchSize) === "number" ? config.maxExportBatchSize : env2.OTEL_BSP_MAX_EXPORT_BATCH_SIZE;
      this._maxQueueSize = typeof (config === null || config === void 0 ? void 0 : config.maxQueueSize) === "number" ? config.maxQueueSize : env2.OTEL_BSP_MAX_QUEUE_SIZE;
      this._scheduledDelayMillis = typeof (config === null || config === void 0 ? void 0 : config.scheduledDelayMillis) === "number" ? config.scheduledDelayMillis : env2.OTEL_BSP_SCHEDULE_DELAY;
      this._exportTimeoutMillis = typeof (config === null || config === void 0 ? void 0 : config.exportTimeoutMillis) === "number" ? config.exportTimeoutMillis : env2.OTEL_BSP_EXPORT_TIMEOUT;
      this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
      if (this._maxExportBatchSize > this._maxQueueSize) {
        diag.warn("BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
        this._maxExportBatchSize = this._maxQueueSize;
      }
    }
    BatchSpanProcessorBase2.prototype.forceFlush = function() {
      if (this._shutdownOnce.isCalled) {
        return this._shutdownOnce.promise;
      }
      return this._flushAll();
    };
    BatchSpanProcessorBase2.prototype.onStart = function(_span, _parentContext) {
    };
    BatchSpanProcessorBase2.prototype.onEnd = function(span) {
      if (this._shutdownOnce.isCalled) {
        return;
      }
      if ((span.spanContext().traceFlags & TraceFlags.SAMPLED) === 0) {
        return;
      }
      this._addToBuffer(span);
    };
    BatchSpanProcessorBase2.prototype.shutdown = function() {
      return this._shutdownOnce.call();
    };
    BatchSpanProcessorBase2.prototype._shutdown = function() {
      var _this = this;
      return Promise.resolve().then(function() {
        return _this.onShutdown();
      }).then(function() {
        return _this._flushAll();
      }).then(function() {
        return _this._exporter.shutdown();
      });
    };
    BatchSpanProcessorBase2.prototype._addToBuffer = function(span) {
      if (this._finishedSpans.length >= this._maxQueueSize) {
        if (this._droppedSpansCount === 0) {
          diag.debug("maxQueueSize reached, dropping spans");
        }
        this._droppedSpansCount++;
        return;
      }
      if (this._droppedSpansCount > 0) {
        diag.warn("Dropped " + this._droppedSpansCount + " spans because maxQueueSize reached");
        this._droppedSpansCount = 0;
      }
      this._finishedSpans.push(span);
      this._maybeStartTimer();
    };
    BatchSpanProcessorBase2.prototype._flushAll = function() {
      var _this = this;
      return new Promise(function(resolve2, reject) {
        var promises2 = [];
        var count = Math.ceil(_this._finishedSpans.length / _this._maxExportBatchSize);
        for (var i = 0, j = count; i < j; i++) {
          promises2.push(_this._flushOneBatch());
        }
        Promise.all(promises2).then(function() {
          resolve2();
        }).catch(reject);
      });
    };
    BatchSpanProcessorBase2.prototype._flushOneBatch = function() {
      var _this = this;
      this._clearTimer();
      if (this._finishedSpans.length === 0) {
        return Promise.resolve();
      }
      return new Promise(function(resolve2, reject) {
        var timer = setTimeout(function() {
          reject(new Error("Timeout"));
        }, _this._exportTimeoutMillis);
        context.with(suppressTracing$1(context.active()), function() {
          var spans;
          if (_this._finishedSpans.length <= _this._maxExportBatchSize) {
            spans = _this._finishedSpans;
            _this._finishedSpans = [];
          } else {
            spans = _this._finishedSpans.splice(0, _this._maxExportBatchSize);
          }
          var doExport = function() {
            return _this._exporter.export(spans, function(result) {
              var _a2;
              clearTimeout(timer);
              if (result.code === ExportResultCode.SUCCESS) {
                resolve2();
              } else {
                reject((_a2 = result.error) !== null && _a2 !== void 0 ? _a2 : new Error("BatchSpanProcessor: span export failed"));
              }
            });
          };
          var pendingResources = null;
          for (var i = 0, len = spans.length; i < len; i++) {
            var span = spans[i];
            if (span.resource.asyncAttributesPending && span.resource.waitForAsyncAttributes) {
              pendingResources !== null && pendingResources !== void 0 ? pendingResources : pendingResources = [];
              pendingResources.push(span.resource.waitForAsyncAttributes());
            }
          }
          if (pendingResources === null) {
            doExport();
          } else {
            Promise.all(pendingResources).then(doExport, function(err) {
              globalErrorHandler(err);
              reject(err);
            });
          }
        });
      });
    };
    BatchSpanProcessorBase2.prototype._maybeStartTimer = function() {
      var _this = this;
      if (this._isExporting)
        return;
      var flush2 = function() {
        _this._isExporting = true;
        _this._flushOneBatch().finally(function() {
          _this._isExporting = false;
          if (_this._finishedSpans.length > 0) {
            _this._clearTimer();
            _this._maybeStartTimer();
          }
        }).catch(function(e) {
          _this._isExporting = false;
          globalErrorHandler(e);
        });
      };
      if (this._finishedSpans.length >= this._maxExportBatchSize) {
        return flush2();
      }
      if (this._timer !== void 0)
        return;
      this._timer = setTimeout(function() {
        return flush2();
      }, this._scheduledDelayMillis);
      unrefTimer(this._timer);
    };
    BatchSpanProcessorBase2.prototype._clearTimer = function() {
      if (this._timer !== void 0) {
        clearTimeout(this._timer);
        this._timer = void 0;
      }
    };
    return BatchSpanProcessorBase2;
  }()
);
var __extends = /* @__PURE__ */ function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var BatchSpanProcessor = (
  /** @class */
  function(_super) {
    __extends(BatchSpanProcessor2, _super);
    function BatchSpanProcessor2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    BatchSpanProcessor2.prototype.onShutdown = function() {
    };
    return BatchSpanProcessor2;
  }(BatchSpanProcessorBase)
);
var SPAN_ID_BYTES = 8;
var TRACE_ID_BYTES = 16;
var RandomIdGenerator = (
  /** @class */
  /* @__PURE__ */ function() {
    function RandomIdGenerator2() {
      this.generateTraceId = getIdGenerator(TRACE_ID_BYTES);
      this.generateSpanId = getIdGenerator(SPAN_ID_BYTES);
    }
    return RandomIdGenerator2;
  }()
);
var SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
function getIdGenerator(bytes) {
  return function generateId() {
    for (var i = 0; i < bytes / 4; i++) {
      SHARED_BUFFER.writeUInt32BE(Math.random() * Math.pow(2, 32) >>> 0, i * 4);
    }
    for (var i = 0; i < bytes; i++) {
      if (SHARED_BUFFER[i] > 0) {
        break;
      } else if (i === bytes - 1) {
        SHARED_BUFFER[bytes - 1] = 1;
      }
    }
    return SHARED_BUFFER.toString("hex", 0, bytes);
  };
}
var Tracer = (
  /** @class */
  function() {
    function Tracer2(instrumentationLibrary, config, _tracerProvider) {
      this._tracerProvider = _tracerProvider;
      var localConfig = mergeConfig(config);
      this._sampler = localConfig.sampler;
      this._generalLimits = localConfig.generalLimits;
      this._spanLimits = localConfig.spanLimits;
      this._idGenerator = config.idGenerator || new RandomIdGenerator();
      this.resource = _tracerProvider.resource;
      this.instrumentationLibrary = instrumentationLibrary;
    }
    Tracer2.prototype.startSpan = function(name, options, context$1) {
      var _a2, _b, _c;
      if (options === void 0) {
        options = {};
      }
      if (context$1 === void 0) {
        context$1 = context.active();
      }
      if (options.root) {
        context$1 = trace.deleteSpan(context$1);
      }
      var parentSpan = trace.getSpan(context$1);
      if (isTracingSuppressed(context$1)) {
        diag.debug("Instrumentation suppressed, returning Noop Span");
        var nonRecordingSpan = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
        return nonRecordingSpan;
      }
      var parentSpanContext = parentSpan === null || parentSpan === void 0 ? void 0 : parentSpan.spanContext();
      var spanId = this._idGenerator.generateSpanId();
      var traceId;
      var traceState;
      var parentSpanId;
      if (!parentSpanContext || !trace.isSpanContextValid(parentSpanContext)) {
        traceId = this._idGenerator.generateTraceId();
      } else {
        traceId = parentSpanContext.traceId;
        traceState = parentSpanContext.traceState;
        parentSpanId = parentSpanContext.spanId;
      }
      var spanKind = (_a2 = options.kind) !== null && _a2 !== void 0 ? _a2 : SpanKind.INTERNAL;
      var links = ((_b = options.links) !== null && _b !== void 0 ? _b : []).map(function(link) {
        return {
          context: link.context,
          attributes: sanitizeAttributes(link.attributes)
        };
      });
      var attributes = sanitizeAttributes(options.attributes);
      var samplingResult = this._sampler.shouldSample(context$1, traceId, name, spanKind, attributes, links);
      traceState = (_c = samplingResult.traceState) !== null && _c !== void 0 ? _c : traceState;
      var traceFlags = samplingResult.decision === SamplingDecision$1.RECORD_AND_SAMPLED ? TraceFlags.SAMPLED : TraceFlags.NONE;
      var spanContext = { traceId, spanId, traceFlags, traceState };
      if (samplingResult.decision === SamplingDecision$1.NOT_RECORD) {
        diag.debug("Recording is off, propagating context in a non-recording span");
        var nonRecordingSpan = trace.wrapSpanContext(spanContext);
        return nonRecordingSpan;
      }
      var initAttributes = sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
      var span = new Span(this, context$1, name, spanContext, spanKind, parentSpanId, links, options.startTime, void 0, initAttributes);
      return span;
    };
    Tracer2.prototype.startActiveSpan = function(name, arg2, arg3, arg4) {
      var opts;
      var ctx;
      var fn;
      if (arguments.length < 2) {
        return;
      } else if (arguments.length === 2) {
        fn = arg2;
      } else if (arguments.length === 3) {
        opts = arg2;
        fn = arg3;
      } else {
        opts = arg2;
        ctx = arg3;
        fn = arg4;
      }
      var parentContext = ctx !== null && ctx !== void 0 ? ctx : context.active();
      var span = this.startSpan(name, opts, parentContext);
      var contextWithSpanSet = trace.setSpan(parentContext, span);
      return context.with(contextWithSpanSet, fn, void 0, span);
    };
    Tracer2.prototype.getGeneralLimits = function() {
      return this._generalLimits;
    };
    Tracer2.prototype.getSpanLimits = function() {
      return this._spanLimits;
    };
    Tracer2.prototype.getActiveSpanProcessor = function() {
      return this._tracerProvider.getActiveSpanProcessor();
    };
    return Tracer2;
  }()
);
function defaultServiceName() {
  return "unknown_service:" + process.argv0;
}
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var Resource = (
  /** @class */
  function() {
    function Resource2(attributes, asyncAttributesPromise) {
      var _this = this;
      var _a2;
      this._attributes = attributes;
      this.asyncAttributesPending = asyncAttributesPromise != null;
      this._syncAttributes = (_a2 = this._attributes) !== null && _a2 !== void 0 ? _a2 : {};
      this._asyncAttributesPromise = asyncAttributesPromise === null || asyncAttributesPromise === void 0 ? void 0 : asyncAttributesPromise.then(function(asyncAttributes) {
        _this._attributes = Object.assign({}, _this._attributes, asyncAttributes);
        _this.asyncAttributesPending = false;
        return asyncAttributes;
      }, function(err) {
        diag.debug("a resource's async attributes promise rejected: %s", err);
        _this.asyncAttributesPending = false;
        return {};
      });
    }
    Resource2.empty = function() {
      return Resource2.EMPTY;
    };
    Resource2.default = function() {
      var _a2;
      return new Resource2((_a2 = {}, _a2[SEMRESATTRS_SERVICE_NAME] = defaultServiceName(), _a2[SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = SDK_INFO[SEMRESATTRS_TELEMETRY_SDK_LANGUAGE], _a2[SEMRESATTRS_TELEMETRY_SDK_NAME] = SDK_INFO[SEMRESATTRS_TELEMETRY_SDK_NAME], _a2[SEMRESATTRS_TELEMETRY_SDK_VERSION] = SDK_INFO[SEMRESATTRS_TELEMETRY_SDK_VERSION], _a2));
    };
    Object.defineProperty(Resource2.prototype, "attributes", {
      get: function() {
        var _a2;
        if (this.asyncAttributesPending) {
          diag.error("Accessing resource attributes before async attributes settled");
        }
        return (_a2 = this._attributes) !== null && _a2 !== void 0 ? _a2 : {};
      },
      enumerable: false,
      configurable: true
    });
    Resource2.prototype.waitForAsyncAttributes = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a2) {
          switch (_a2.label) {
            case 0:
              if (!this.asyncAttributesPending) return [3, 2];
              return [4, this._asyncAttributesPromise];
            case 1:
              _a2.sent();
              _a2.label = 2;
            case 2:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    Resource2.prototype.merge = function(other) {
      var _this = this;
      var _a2;
      if (!other)
        return this;
      var mergedSyncAttributes = __assign(__assign({}, this._syncAttributes), (_a2 = other._syncAttributes) !== null && _a2 !== void 0 ? _a2 : other.attributes);
      if (!this._asyncAttributesPromise && !other._asyncAttributesPromise) {
        return new Resource2(mergedSyncAttributes);
      }
      var mergedAttributesPromise = Promise.all([
        this._asyncAttributesPromise,
        other._asyncAttributesPromise
      ]).then(function(_a3) {
        var _b;
        var _c = __read(_a3, 2), thisAsyncAttributes = _c[0], otherAsyncAttributes = _c[1];
        return __assign(__assign(__assign(__assign({}, _this._syncAttributes), thisAsyncAttributes), (_b = other._syncAttributes) !== null && _b !== void 0 ? _b : other.attributes), otherAsyncAttributes);
      });
      return new Resource2(mergedSyncAttributes, mergedAttributesPromise);
    };
    Resource2.EMPTY = new Resource2({});
    return Resource2;
  }()
);
var __values = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var MultiSpanProcessor = (
  /** @class */
  function() {
    function MultiSpanProcessor2(_spanProcessors) {
      this._spanProcessors = _spanProcessors;
    }
    MultiSpanProcessor2.prototype.forceFlush = function() {
      var e_1, _a2;
      var promises2 = [];
      try {
        for (var _b = __values(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          promises2.push(spanProcessor.forceFlush());
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      return new Promise(function(resolve2) {
        Promise.all(promises2).then(function() {
          resolve2();
        }).catch(function(error) {
          globalErrorHandler(error || new Error("MultiSpanProcessor: forceFlush failed"));
          resolve2();
        });
      });
    };
    MultiSpanProcessor2.prototype.onStart = function(span, context2) {
      var e_2, _a2;
      try {
        for (var _b = __values(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          spanProcessor.onStart(span, context2);
        }
      } catch (e_2_1) {
        e_2 = { error: e_2_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
        } finally {
          if (e_2) throw e_2.error;
        }
      }
    };
    MultiSpanProcessor2.prototype.onEnd = function(span) {
      var e_3, _a2;
      try {
        for (var _b = __values(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          spanProcessor.onEnd(span);
        }
      } catch (e_3_1) {
        e_3 = { error: e_3_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
        } finally {
          if (e_3) throw e_3.error;
        }
      }
    };
    MultiSpanProcessor2.prototype.shutdown = function() {
      var e_4, _a2;
      var promises2 = [];
      try {
        for (var _b = __values(this._spanProcessors), _c = _b.next(); !_c.done; _c = _b.next()) {
          var spanProcessor = _c.value;
          promises2.push(spanProcessor.shutdown());
        }
      } catch (e_4_1) {
        e_4 = { error: e_4_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
        } finally {
          if (e_4) throw e_4.error;
        }
      }
      return new Promise(function(resolve2, reject) {
        Promise.all(promises2).then(function() {
          resolve2();
        }, reject);
      });
    };
    return MultiSpanProcessor2;
  }()
);
var NoopSpanProcessor = (
  /** @class */
  function() {
    function NoopSpanProcessor2() {
    }
    NoopSpanProcessor2.prototype.onStart = function(_span, _context) {
    };
    NoopSpanProcessor2.prototype.onEnd = function(_span) {
    };
    NoopSpanProcessor2.prototype.shutdown = function() {
      return Promise.resolve();
    };
    NoopSpanProcessor2.prototype.forceFlush = function() {
      return Promise.resolve();
    };
    return NoopSpanProcessor2;
  }()
);
var ForceFlushState;
(function(ForceFlushState2) {
  ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
  ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
  ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
  ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
var BasicTracerProvider = (
  /** @class */
  function() {
    function BasicTracerProvider2(config) {
      if (config === void 0) {
        config = {};
      }
      var _a2;
      this._registeredSpanProcessors = [];
      this._tracers = /* @__PURE__ */ new Map();
      var mergedConfig = merge({}, loadDefaultConfig(), reconfigureLimits(config));
      this.resource = (_a2 = mergedConfig.resource) !== null && _a2 !== void 0 ? _a2 : Resource.empty();
      this.resource = Resource.default().merge(this.resource);
      this._config = Object.assign({}, mergedConfig, {
        resource: this.resource
      });
      var defaultExporter = this._buildExporterFromEnv();
      if (defaultExporter !== void 0) {
        var batchProcessor = new BatchSpanProcessor(defaultExporter);
        this.activeSpanProcessor = batchProcessor;
      } else {
        this.activeSpanProcessor = new NoopSpanProcessor();
      }
    }
    BasicTracerProvider2.prototype.getTracer = function(name, version2, options) {
      var key = name + "@" + (version2 || "") + ":" + ((options === null || options === void 0 ? void 0 : options.schemaUrl) || "");
      if (!this._tracers.has(key)) {
        this._tracers.set(key, new Tracer({ name, version: version2, schemaUrl: options === null || options === void 0 ? void 0 : options.schemaUrl }, this._config, this));
      }
      return this._tracers.get(key);
    };
    BasicTracerProvider2.prototype.addSpanProcessor = function(spanProcessor) {
      if (this._registeredSpanProcessors.length === 0) {
        this.activeSpanProcessor.shutdown().catch(function(err) {
          return diag.error("Error while trying to shutdown current span processor", err);
        });
      }
      this._registeredSpanProcessors.push(spanProcessor);
      this.activeSpanProcessor = new MultiSpanProcessor(this._registeredSpanProcessors);
    };
    BasicTracerProvider2.prototype.getActiveSpanProcessor = function() {
      return this.activeSpanProcessor;
    };
    BasicTracerProvider2.prototype.register = function(config) {
      if (config === void 0) {
        config = {};
      }
      trace.setGlobalTracerProvider(this);
      if (config.propagator === void 0) {
        config.propagator = this._buildPropagatorFromEnv();
      }
      if (config.contextManager) {
        context.setGlobalContextManager(config.contextManager);
      }
      if (config.propagator) {
        propagation.setGlobalPropagator(config.propagator);
      }
    };
    BasicTracerProvider2.prototype.forceFlush = function() {
      var timeout = this._config.forceFlushTimeoutMillis;
      var promises2 = this._registeredSpanProcessors.map(function(spanProcessor) {
        return new Promise(function(resolve2) {
          var state;
          var timeoutInterval = setTimeout(function() {
            resolve2(new Error("Span processor did not completed within timeout period of " + timeout + " ms"));
            state = ForceFlushState.timeout;
          }, timeout);
          spanProcessor.forceFlush().then(function() {
            clearTimeout(timeoutInterval);
            if (state !== ForceFlushState.timeout) {
              state = ForceFlushState.resolved;
              resolve2(state);
            }
          }).catch(function(error) {
            clearTimeout(timeoutInterval);
            state = ForceFlushState.error;
            resolve2(error);
          });
        });
      });
      return new Promise(function(resolve2, reject) {
        Promise.all(promises2).then(function(results) {
          var errors = results.filter(function(result) {
            return result !== ForceFlushState.resolved;
          });
          if (errors.length > 0) {
            reject(errors);
          } else {
            resolve2();
          }
        }).catch(function(error) {
          return reject([error]);
        });
      });
    };
    BasicTracerProvider2.prototype.shutdown = function() {
      return this.activeSpanProcessor.shutdown();
    };
    BasicTracerProvider2.prototype._getPropagator = function(name) {
      var _a2;
      return (_a2 = this.constructor._registeredPropagators.get(name)) === null || _a2 === void 0 ? void 0 : _a2();
    };
    BasicTracerProvider2.prototype._getSpanExporter = function(name) {
      var _a2;
      return (_a2 = this.constructor._registeredExporters.get(name)) === null || _a2 === void 0 ? void 0 : _a2();
    };
    BasicTracerProvider2.prototype._buildPropagatorFromEnv = function() {
      var _this = this;
      var uniquePropagatorNames = Array.from(new Set(getEnv().OTEL_PROPAGATORS));
      var propagators = uniquePropagatorNames.map(function(name) {
        var propagator = _this._getPropagator(name);
        if (!propagator) {
          diag.warn('Propagator "' + name + '" requested through environment variable is unavailable.');
        }
        return propagator;
      });
      var validPropagators = propagators.reduce(function(list, item) {
        if (item) {
          list.push(item);
        }
        return list;
      }, []);
      if (validPropagators.length === 0) {
        return;
      } else if (uniquePropagatorNames.length === 1) {
        return validPropagators[0];
      } else {
        return new CompositePropagator({
          propagators: validPropagators
        });
      }
    };
    BasicTracerProvider2.prototype._buildExporterFromEnv = function() {
      var exporterName = getEnv().OTEL_TRACES_EXPORTER;
      if (exporterName === "none" || exporterName === "")
        return;
      var exporter = this._getSpanExporter(exporterName);
      if (!exporter) {
        diag.error('Exporter "' + exporterName + '" requested through environment variable is unavailable.');
      }
      return exporter;
    };
    BasicTracerProvider2._registeredPropagators = /* @__PURE__ */ new Map([
      ["tracecontext", function() {
        return new W3CTraceContextPropagator();
      }],
      ["baggage", function() {
        return new W3CBaggagePropagator();
      }]
    ]);
    BasicTracerProvider2._registeredExporters = /* @__PURE__ */ new Map();
    return BasicTracerProvider2;
  }()
);
const SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE = "sentry.parentIsRemote";
const SEMANTIC_ATTRIBUTE_SENTRY_GRAPHQL_OPERATION = "sentry.graphql.operation";
function spanHasAttributes(span) {
  const castSpan = span;
  return !!castSpan.attributes && typeof castSpan.attributes === "object";
}
function spanHasKind(span) {
  const castSpan = span;
  return typeof castSpan.kind === "number";
}
function spanHasStatus(span) {
  const castSpan = span;
  return !!castSpan.status;
}
function spanHasName(span) {
  const castSpan = span;
  return !!castSpan.name;
}
function getRequestSpanData(span) {
  if (!spanHasAttributes(span)) {
    return {};
  }
  const data = {
    url: span.attributes[SEMATTRS_HTTP_URL],
    "http.method": span.attributes[SEMATTRS_HTTP_METHOD]
  };
  if (!data["http.method"] && data.url) {
    data["http.method"] = "GET";
  }
  try {
    const urlStr = span.attributes[SEMATTRS_HTTP_URL];
    if (typeof urlStr === "string") {
      const url = parseUrl(urlStr);
      data.url = getSanitizedUrlString(url);
      if (url.search) {
        data["http.query"] = url.search;
      }
      if (url.hash) {
        data["http.fragment"] = url.hash;
      }
    }
  } catch (e) {
  }
  return data;
}
function getSpanKind(span) {
  if (spanHasKind(span)) {
    return span.kind;
  }
  return SpanKind.INTERNAL;
}
const SENTRY_TRACE_HEADER = "sentry-trace";
const SENTRY_BAGGAGE_HEADER = "baggage";
const SENTRY_TRACE_STATE_DSC = "sentry.dsc";
const SENTRY_TRACE_STATE_PARENT_SPAN_ID = "sentry.parent_span_id";
const SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING = "sentry.sampled_not_recording";
const SENTRY_TRACE_STATE_URL = "sentry.url";
const SENTRY_SCOPES_CONTEXT_KEY = createContextKey("sentry_scopes");
const SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY = createContextKey("sentry_fork_isolation_scope");
const SENTRY_FORK_SET_SCOPE_CONTEXT_KEY = createContextKey("sentry_fork_set_scope");
const SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY = createContextKey("sentry_fork_set_isolation_scope");
const SCOPE_CONTEXT_FIELD = "_scopeContext";
function getScopesFromContext(context2) {
  return context2.getValue(SENTRY_SCOPES_CONTEXT_KEY);
}
function setScopesOnContext(context2, scopes) {
  return context2.setValue(SENTRY_SCOPES_CONTEXT_KEY, scopes);
}
function setContextOnScope(scope, context2) {
  addNonEnumerableProperty(scope, SCOPE_CONTEXT_FIELD, context2);
}
function getContextFromScope(scope) {
  return scope[SCOPE_CONTEXT_FIELD];
}
function inferSpanData(name, attributes, kind) {
  if (attributes["sentry.skip_span_data_inference"]) {
    return {
      op: void 0,
      description: name,
      source: "custom",
      data: {
        // Suggest to callers of `parseSpanDescription` to wipe the hint because it is unnecessary data in the end.
        "sentry.skip_span_data_inference": void 0
      }
    };
  }
  const httpMethod = attributes["http.request.method"] || attributes[SEMATTRS_HTTP_METHOD];
  if (httpMethod) {
    return descriptionForHttpMethod({ attributes, name, kind }, httpMethod);
  }
  const dbSystem = attributes[SEMATTRS_DB_SYSTEM];
  const opIsCache = typeof attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP] === "string" && attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP].startsWith("cache.");
  if (dbSystem && !opIsCache) {
    return descriptionForDbSystem({ attributes, name });
  }
  const rpcService = attributes[SEMATTRS_RPC_SERVICE];
  if (rpcService) {
    return {
      op: "rpc",
      description: name,
      source: "route"
    };
  }
  const messagingSystem = attributes[SEMATTRS_MESSAGING_SYSTEM];
  if (messagingSystem) {
    return {
      op: "message",
      description: name,
      source: "route"
    };
  }
  const faasTrigger = attributes[SEMATTRS_FAAS_TRIGGER];
  if (faasTrigger) {
    return { op: faasTrigger.toString(), description: name, source: "route" };
  }
  return { op: void 0, description: name, source: "custom" };
}
function parseSpanDescription(span) {
  const attributes = spanHasAttributes(span) ? span.attributes : {};
  const name = spanHasName(span) ? span.name : "<unknown>";
  const kind = getSpanKind(span);
  return inferSpanData(name, attributes, kind);
}
function descriptionForDbSystem({ attributes, name }) {
  const statement = attributes[SEMATTRS_DB_STATEMENT];
  const description = statement ? statement.toString() : name;
  return { op: "db", description, source: "task" };
}
function descriptionForHttpMethod({ name, kind, attributes }, httpMethod) {
  const opParts = ["http"];
  switch (kind) {
    case SpanKind.CLIENT:
      opParts.push("client");
      break;
    case SpanKind.SERVER:
      opParts.push("server");
      break;
  }
  const { urlPath, url, query, fragment, hasRoute } = getSanitizedUrl(attributes, kind);
  if (!urlPath) {
    return { op: opParts.join("."), description: name, source: "custom" };
  }
  const graphqlOperationsAttribute = attributes[SEMANTIC_ATTRIBUTE_SENTRY_GRAPHQL_OPERATION];
  const baseDescription = `${httpMethod} ${urlPath}`;
  const description = graphqlOperationsAttribute ? `${baseDescription} (${getGraphqlOperationNamesFromAttribute(graphqlOperationsAttribute)})` : baseDescription;
  const source = hasRoute || urlPath === "/" ? "route" : "url";
  const data = {};
  if (url) {
    data.url = url;
  }
  if (query) {
    data["http.query"] = query;
  }
  if (fragment) {
    data["http.fragment"] = fragment;
  }
  const isClientOrServerKind = kind === SpanKind.CLIENT || kind === SpanKind.SERVER;
  const origin = attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN] || "manual";
  const isManualSpan = !`${origin}`.startsWith("auto");
  const useInferredDescription = isClientOrServerKind || !isManualSpan;
  return {
    op: opParts.join("."),
    description: useInferredDescription ? description : name,
    source: useInferredDescription ? source : "custom",
    data
  };
}
function getGraphqlOperationNamesFromAttribute(attr) {
  if (Array.isArray(attr)) {
    const sorted = attr.slice().sort();
    if (sorted.length <= 5) {
      return sorted.join(", ");
    } else {
      return `${sorted.slice(0, 5).join(", ")}, +${sorted.length - 5}`;
    }
  }
  return `${attr}`;
}
function getSanitizedUrl(attributes, kind) {
  const httpTarget = attributes[SEMATTRS_HTTP_TARGET];
  const httpUrl = attributes[SEMATTRS_HTTP_URL];
  const httpRoute = attributes[SEMATTRS_HTTP_ROUTE];
  const parsedUrl = typeof httpUrl === "string" ? parseUrl(httpUrl) : void 0;
  const url = parsedUrl ? getSanitizedUrlString(parsedUrl) : void 0;
  const query = parsedUrl && parsedUrl.search ? parsedUrl.search : void 0;
  const fragment = parsedUrl && parsedUrl.hash ? parsedUrl.hash : void 0;
  if (typeof httpRoute === "string") {
    return { urlPath: httpRoute, url, query, fragment, hasRoute: true };
  }
  if (kind === SpanKind.SERVER && typeof httpTarget === "string") {
    return { urlPath: stripUrlQueryAndFragment(httpTarget), url, query, fragment, hasRoute: false };
  }
  if (parsedUrl) {
    return { urlPath: url, url, query, fragment, hasRoute: false };
  }
  if (typeof httpTarget === "string") {
    return { urlPath: stripUrlQueryAndFragment(httpTarget), url, query, fragment, hasRoute: false };
  }
  return { urlPath: void 0, url, query, fragment, hasRoute: false };
}
function makeTraceState({
  parentSpanId,
  dsc,
  sampled
}) {
  const dscString = dsc ? dynamicSamplingContextToSentryBaggageHeader(dsc) : void 0;
  const traceStateBase = new TraceState().set(SENTRY_TRACE_STATE_PARENT_SPAN_ID, parentSpanId || "");
  const traceStateWithDsc = dscString ? traceStateBase.set(SENTRY_TRACE_STATE_DSC, dscString) : traceStateBase;
  return sampled === false ? traceStateWithDsc.set(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING, "1") : traceStateWithDsc;
}
function generateSpanContextForPropagationContext(propagationContext) {
  const traceState = makeTraceState({
    parentSpanId: propagationContext.parentSpanId,
    dsc: propagationContext.dsc,
    sampled: propagationContext.sampled
  });
  const spanContext = {
    traceId: propagationContext.traceId,
    spanId: propagationContext.parentSpanId || "",
    isRemote: true,
    traceFlags: propagationContext.sampled ? TraceFlags.SAMPLED : TraceFlags.NONE,
    traceState
  };
  return spanContext;
}
function getActiveSpan() {
  return trace.getActiveSpan();
}
const DEBUG_BUILD$1 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
function _optionalChain$7(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
function getSamplingDecision(spanContext) {
  const { traceFlags, traceState } = spanContext;
  const sampledNotRecording = traceState ? traceState.get(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING) === "1" : false;
  if (traceFlags === TraceFlags.SAMPLED) {
    return true;
  }
  if (sampledNotRecording) {
    return false;
  }
  const dscString = traceState ? traceState.get(SENTRY_TRACE_STATE_DSC) : void 0;
  const dsc = dscString ? baggageHeaderToDynamicSamplingContext(dscString) : void 0;
  if (_optionalChain$7([dsc, "optionalAccess", (_) => _.sampled]) === "true") {
    return true;
  }
  if (_optionalChain$7([dsc, "optionalAccess", (_2) => _2.sampled]) === "false") {
    return false;
  }
  return void 0;
}
const setupElements = /* @__PURE__ */ new Set();
function setIsSetup(element) {
  setupElements.add(element);
}
function _optionalChain$6(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
function getPropagationContextFromSpan(span) {
  const spanContext = span.spanContext();
  const { traceId, spanId, traceState } = spanContext;
  const dscString = traceState ? traceState.get(SENTRY_TRACE_STATE_DSC) : void 0;
  const traceStateDsc = dscString ? baggageHeaderToDynamicSamplingContext(dscString) : void 0;
  const parentSpanId = traceState ? traceState.get(SENTRY_TRACE_STATE_PARENT_SPAN_ID) || void 0 : void 0;
  const sampled = getSamplingDecision(spanContext);
  const dsc = traceStateDsc || getDynamicSamplingContextFromSpan(getRootSpan(span));
  return {
    traceId,
    spanId,
    sampled,
    parentSpanId,
    dsc
  };
}
class SentryPropagator extends W3CBaggagePropagator {
  /** A map of URLs that have already been checked for if they match tracePropagationTargets. */
  constructor() {
    super();
    setIsSetup("SentryPropagator");
    this._urlMatchesTargetsMap = new LRUMap(100);
  }
  /**
   * @inheritDoc
   */
  inject(context2, carrier, setter) {
    if (isTracingSuppressed(context2)) {
      DEBUG_BUILD$1 && logger.log("[Tracing] Not injecting trace data for url because tracing is suppressed.");
      return;
    }
    const activeSpan = trace.getSpan(context2);
    const url = activeSpan && getCurrentURL(activeSpan);
    const tracePropagationTargets = _optionalChain$6([getClient, "call", (_) => _(), "optionalAccess", (_2) => _2.getOptions, "call", (_3) => _3(), "optionalAccess", (_4) => _4.tracePropagationTargets]);
    if (typeof url === "string" && tracePropagationTargets && !this._shouldInjectTraceData(tracePropagationTargets, url)) {
      DEBUG_BUILD$1 && logger.log(
        "[Tracing] Not injecting trace data for url because it does not match tracePropagationTargets:",
        url
      );
      return;
    }
    const existingBaggageHeader = getExistingBaggage(carrier);
    let baggage = propagation.getBaggage(context2) || propagation.createBaggage({});
    const { dynamicSamplingContext, traceId, spanId, sampled } = getInjectionData(context2);
    if (existingBaggageHeader) {
      const baggageEntries = parseBaggageHeader(existingBaggageHeader);
      if (baggageEntries) {
        Object.entries(baggageEntries).forEach(([key, value]) => {
          baggage = baggage.setEntry(key, { value });
        });
      }
    }
    if (dynamicSamplingContext) {
      baggage = Object.entries(dynamicSamplingContext).reduce((b, [dscKey, dscValue]) => {
        if (dscValue) {
          return b.setEntry(`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`, { value: dscValue });
        }
        return b;
      }, baggage);
    }
    if (traceId && traceId !== INVALID_TRACEID) {
      setter.set(carrier, SENTRY_TRACE_HEADER, generateSentryTraceHeader(traceId, spanId, sampled));
    }
    super.inject(propagation.setBaggage(context2, baggage), carrier, setter);
  }
  /**
   * @inheritDoc
   */
  extract(context2, carrier, getter) {
    const maybeSentryTraceHeader = getter.get(carrier, SENTRY_TRACE_HEADER);
    const baggage = getter.get(carrier, SENTRY_BAGGAGE_HEADER);
    const sentryTrace = maybeSentryTraceHeader ? Array.isArray(maybeSentryTraceHeader) ? maybeSentryTraceHeader[0] : maybeSentryTraceHeader : void 0;
    const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
    const ctxWithSpanContext = getContextWithRemoteActiveSpan(context2, { sentryTrace, baggage });
    const scopes = getScopesFromContext(ctxWithSpanContext);
    const newScopes = {
      scope: scopes ? scopes.scope.clone() : getCurrentScope().clone(),
      isolationScope: scopes ? scopes.isolationScope : getIsolationScope()
    };
    newScopes.scope.setPropagationContext(propagationContext);
    return setScopesOnContext(ctxWithSpanContext, newScopes);
  }
  /**
   * @inheritDoc
   */
  fields() {
    return [SENTRY_TRACE_HEADER, SENTRY_BAGGAGE_HEADER];
  }
  /** If we want to inject trace data for a given URL. */
  _shouldInjectTraceData(tracePropagationTargets, url) {
    if (tracePropagationTargets === void 0) {
      return true;
    }
    const cachedDecision = this._urlMatchesTargetsMap.get(url);
    if (cachedDecision !== void 0) {
      return cachedDecision;
    }
    const decision = stringMatchesSomePattern(url, tracePropagationTargets);
    this._urlMatchesTargetsMap.set(url, decision);
    return decision;
  }
}
function getInjectionData(context2) {
  const span = hasTracingEnabled() ? trace.getSpan(context2) : void 0;
  const spanIsRemote = _optionalChain$6([span, "optionalAccess", (_5) => _5.spanContext, "call", (_6) => _6(), "access", (_7) => _7.isRemote]);
  if (span && !spanIsRemote) {
    const spanContext = span.spanContext();
    const propagationContext2 = getPropagationContextFromSpan(span);
    const dynamicSamplingContext2 = getDynamicSamplingContext(propagationContext2, spanContext.traceId);
    return {
      dynamicSamplingContext: dynamicSamplingContext2,
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      sampled: getSamplingDecision(spanContext)
    };
  }
  const scope = _optionalChain$6([getScopesFromContext, "call", (_8) => _8(context2), "optionalAccess", (_9) => _9.scope]) || getCurrentScope();
  const propagationContext = scope.getPropagationContext();
  const dynamicSamplingContext = getDynamicSamplingContext(propagationContext, propagationContext.traceId);
  return {
    dynamicSamplingContext,
    traceId: propagationContext.traceId,
    spanId: propagationContext.spanId,
    sampled: propagationContext.sampled
  };
}
function getDynamicSamplingContext(propagationContext, traceId) {
  if (_optionalChain$6([propagationContext, "optionalAccess", (_10) => _10.dsc])) {
    return propagationContext.dsc;
  }
  const client = getClient();
  if (client) {
    return getDynamicSamplingContextFromClient(traceId || propagationContext.traceId, client);
  }
  return void 0;
}
function getContextWithRemoteActiveSpan(ctx, { sentryTrace, baggage }) {
  const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
  const spanContext = generateSpanContextForPropagationContext(propagationContext);
  return trace.setSpanContext(ctx, spanContext);
}
function getExistingBaggage(carrier) {
  try {
    const baggage = carrier[SENTRY_BAGGAGE_HEADER];
    return Array.isArray(baggage) ? baggage.join(",") : baggage;
  } catch (e) {
    return void 0;
  }
}
function getCurrentURL(span) {
  const urlAttribute = _optionalChain$6([spanToJSON, "call", (_11) => _11(span), "access", (_12) => _12.data, "optionalAccess", (_13) => _13[SEMATTRS_HTTP_URL]]);
  if (urlAttribute) {
    return urlAttribute;
  }
  const urlTraceState = _optionalChain$6([span, "access", (_14) => _14.spanContext, "call", (_15) => _15(), "access", (_16) => _16.traceState, "optionalAccess", (_17) => _17.get, "call", (_18) => _18(SENTRY_TRACE_STATE_URL)]);
  if (urlTraceState) {
    return urlTraceState;
  }
  return void 0;
}
function _optionalChain$5(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
function startSpan(options, callback) {
  const tracer = getTracer();
  const { name, parentSpan: customParentSpan } = options;
  const wrapper = getActiveSpanWrapper(customParentSpan);
  return wrapper(() => {
    const activeCtx = getContext(options.scope, options.forceTransaction);
    const shouldSkipSpan = options.onlyIfParent && !trace.getSpan(activeCtx);
    const ctx = shouldSkipSpan ? suppressTracing$1(activeCtx) : activeCtx;
    const spanOptions = getSpanOptions(options);
    return tracer.startActiveSpan(name, spanOptions, ctx, (span) => {
      return handleCallbackErrors(
        () => callback(span),
        () => {
          if (spanToJSON(span).status === void 0) {
            span.setStatus({ code: SpanStatusCode.ERROR });
          }
        },
        () => span.end()
      );
    });
  });
}
function startSpanManual(options, callback) {
  const tracer = getTracer();
  const { name, parentSpan: customParentSpan } = options;
  const wrapper = getActiveSpanWrapper(customParentSpan);
  return wrapper(() => {
    const activeCtx = getContext(options.scope, options.forceTransaction);
    const shouldSkipSpan = options.onlyIfParent && !trace.getSpan(activeCtx);
    const ctx = shouldSkipSpan ? suppressTracing$1(activeCtx) : activeCtx;
    const spanOptions = getSpanOptions(options);
    return tracer.startActiveSpan(name, spanOptions, ctx, (span) => {
      return handleCallbackErrors(
        () => callback(span, () => span.end()),
        () => {
          if (spanToJSON(span).status === void 0) {
            span.setStatus({ code: SpanStatusCode.ERROR });
          }
        }
      );
    });
  });
}
function startInactiveSpan(options) {
  const tracer = getTracer();
  const { name, parentSpan: customParentSpan } = options;
  const wrapper = getActiveSpanWrapper(customParentSpan);
  return wrapper(() => {
    const activeCtx = getContext(options.scope, options.forceTransaction);
    const shouldSkipSpan = options.onlyIfParent && !trace.getSpan(activeCtx);
    const ctx = shouldSkipSpan ? suppressTracing$1(activeCtx) : activeCtx;
    const spanOptions = getSpanOptions(options);
    const span = tracer.startSpan(name, spanOptions, ctx);
    return span;
  });
}
function withActiveSpan(span, callback) {
  const newContextWithActiveSpan = span ? trace.setSpan(context.active(), span) : trace.deleteSpan(context.active());
  return context.with(newContextWithActiveSpan, () => callback(getCurrentScope()));
}
function getTracer() {
  const client = getClient();
  return client && client.tracer || trace.getTracer("@sentry/opentelemetry", SDK_VERSION$1);
}
function getSpanOptions(options) {
  const { startTime, attributes, kind, op } = options;
  const fixedStartTime = typeof startTime === "number" ? ensureTimestampInMilliseconds(startTime) : startTime;
  return {
    attributes: op ? {
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
      ...attributes
    } : attributes,
    kind,
    startTime: fixedStartTime
  };
}
function ensureTimestampInMilliseconds(timestamp) {
  const isMs = timestamp < 9999999999;
  return isMs ? timestamp * 1e3 : timestamp;
}
function getContext(scope, forceTransaction) {
  const ctx = getContextForScope(scope);
  const actualScope = _optionalChain$5([getScopesFromContext, "call", (_) => _(ctx), "optionalAccess", (_2) => _2.scope]);
  const parentSpan = trace.getSpan(ctx);
  if (!parentSpan) {
    const client = getClient();
    if (actualScope && client) {
      const propagationContext = actualScope.getPropagationContext();
      const traceState2 = makeTraceState({
        parentSpanId: propagationContext.parentSpanId,
        // Not defined yet, we want to pick this up on-demand only
        dsc: void 0,
        sampled: propagationContext.sampled
      });
      const spanOptions2 = {
        traceId: propagationContext.traceId,
        spanId: propagationContext.parentSpanId || propagationContext.spanId,
        isRemote: true,
        traceFlags: propagationContext.sampled ? TraceFlags.SAMPLED : TraceFlags.NONE,
        traceState: traceState2
      };
      return trace.setSpanContext(ctx, spanOptions2);
    }
    return ctx;
  }
  if (!forceTransaction) {
    return ctx;
  }
  const ctxWithoutSpan = trace.deleteSpan(ctx);
  const { spanId, traceId } = parentSpan.spanContext();
  const sampled = getSamplingDecision(parentSpan.spanContext());
  const rootSpan = getRootSpan(parentSpan);
  const dsc = getDynamicSamplingContextFromSpan(rootSpan);
  const traceState = makeTraceState({
    dsc,
    parentSpanId: spanId !== INVALID_SPANID ? spanId : void 0,
    sampled
  });
  const spanOptions = {
    traceId,
    spanId,
    isRemote: true,
    traceFlags: sampled ? TraceFlags.SAMPLED : TraceFlags.NONE,
    traceState
  };
  const ctxWithSpanContext = trace.setSpanContext(ctxWithoutSpan, spanOptions);
  return ctxWithSpanContext;
}
function getContextForScope(scope) {
  if (scope) {
    const ctx = getContextFromScope(scope);
    if (ctx) {
      return ctx;
    }
  }
  return context.active();
}
function getActiveSpanWrapper(parentSpan) {
  return parentSpan !== void 0 ? (callback) => {
    return withActiveSpan(parentSpan, callback);
  } : (callback) => callback();
}
function suppressTracing(callback) {
  const ctx = suppressTracing$1(context.active());
  return context.with(ctx, callback);
}
function getTraceData() {
  const headersObject = {};
  propagation.inject(context.active(), headersObject);
  if (!headersObject["sentry-trace"]) {
    return {};
  }
  return dropUndefinedKeys({
    "sentry-trace": headersObject["sentry-trace"],
    baggage: headersObject.baggage
  });
}
function setOpenTelemetryContextAsyncContextStrategy() {
  function getScopes() {
    const ctx = context.active();
    const scopes = getScopesFromContext(ctx);
    if (scopes) {
      return scopes;
    }
    return {
      scope: getDefaultCurrentScope(),
      isolationScope: getDefaultIsolationScope()
    };
  }
  function withScope2(callback) {
    const ctx = context.active();
    return context.with(ctx, () => {
      return callback(getCurrentScope2());
    });
  }
  function withSetScope2(scope, callback) {
    const ctx = context.active();
    return context.with(ctx.setValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY, scope), () => {
      return callback(scope);
    });
  }
  function withIsolationScope2(callback) {
    const ctx = context.active();
    return context.with(ctx.setValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY, true), () => {
      return callback(getIsolationScope2());
    });
  }
  function withSetIsolationScope(isolationScope, callback) {
    const ctx = context.active();
    return context.with(ctx.setValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY, isolationScope), () => {
      return callback(getIsolationScope2());
    });
  }
  function getCurrentScope2() {
    return getScopes().scope;
  }
  function getIsolationScope2() {
    return getScopes().isolationScope;
  }
  setAsyncContextStrategy({
    withScope: withScope2,
    withSetScope: withSetScope2,
    withSetIsolationScope,
    withIsolationScope: withIsolationScope2,
    getCurrentScope: getCurrentScope2,
    getIsolationScope: getIsolationScope2,
    startSpan,
    startSpanManual,
    startInactiveSpan,
    getActiveSpan,
    suppressTracing,
    getTraceData,
    // The types here don't fully align, because our own `Span` type is narrower
    // than the OTEL one - but this is OK for here, as we now we'll only have OTEL spans passed around
    withActiveSpan
  });
}
function _optionalChain$3(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
function wrapContextManagerClass(ContextManagerClass) {
  class SentryContextManager2 extends ContextManagerClass {
    constructor(...args) {
      super(...args);
      setIsSetup("SentryContextManager");
    }
    /**
     * Overwrite with() of the original AsyncLocalStorageContextManager
     * to ensure we also create new scopes per context.
     */
    with(context2, fn, thisArg, ...args) {
      const currentScopes = getScopesFromContext(context2);
      const currentScope = _optionalChain$3([currentScopes, "optionalAccess", (_) => _.scope]) || getCurrentScope();
      const currentIsolationScope = _optionalChain$3([currentScopes, "optionalAccess", (_2) => _2.isolationScope]) || getIsolationScope();
      const shouldForkIsolationScope = context2.getValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY) === true;
      const scope = context2.getValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY);
      const isolationScope = context2.getValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY);
      const newCurrentScope = scope || currentScope.clone();
      const newIsolationScope = isolationScope || (shouldForkIsolationScope ? currentIsolationScope.clone() : currentIsolationScope);
      const scopes = { scope: newCurrentScope, isolationScope: newIsolationScope };
      const ctx1 = setScopesOnContext(context2, scopes);
      const ctx2 = ctx1.deleteValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY).deleteValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY).deleteValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY);
      setContextOnScope(newCurrentScope, ctx2);
      return super.with(ctx2, fn, thisArg, ...args);
    }
  }
  return SentryContextManager2;
}
function groupSpansWithParents(spans) {
  const nodeMap = /* @__PURE__ */ new Map();
  for (const span of spans) {
    createOrUpdateSpanNodeAndRefs(nodeMap, span);
  }
  return Array.from(nodeMap, function([_id, spanNode]) {
    return spanNode;
  });
}
function getLocalParentId(span) {
  const parentIsRemote = span.attributes[SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE] === true;
  return !parentIsRemote ? span.parentSpanId : void 0;
}
function createOrUpdateSpanNodeAndRefs(nodeMap, span) {
  const id = span.spanContext().spanId;
  const parentId = getLocalParentId(span);
  if (!parentId) {
    createOrUpdateNode(nodeMap, { id, span, children: [] });
    return;
  }
  const parentNode = createOrGetParentNode(nodeMap, parentId);
  const node2 = createOrUpdateNode(nodeMap, { id, span, parentNode, children: [] });
  parentNode.children.push(node2);
}
function createOrGetParentNode(nodeMap, id) {
  const existing = nodeMap.get(id);
  if (existing) {
    return existing;
  }
  return createOrUpdateNode(nodeMap, { id, children: [] });
}
function createOrUpdateNode(nodeMap, spanNode) {
  const existing = nodeMap.get(spanNode.id);
  if (existing && existing.span) {
    return existing;
  }
  if (existing && !existing.span) {
    existing.span = spanNode.span;
    existing.parentNode = spanNode.parentNode;
    return existing;
  }
  nodeMap.set(spanNode.id, spanNode);
  return spanNode;
}
const canonicalGrpcErrorCodesMap = {
  "1": "cancelled",
  "2": "unknown_error",
  "3": "invalid_argument",
  "4": "deadline_exceeded",
  "5": "not_found",
  "6": "already_exists",
  "7": "permission_denied",
  "8": "resource_exhausted",
  "9": "failed_precondition",
  "10": "aborted",
  "11": "out_of_range",
  "12": "unimplemented",
  "13": "internal_error",
  "14": "unavailable",
  "15": "data_loss",
  "16": "unauthenticated"
};
const isStatusErrorMessageValid = (message) => {
  return Object.values(canonicalGrpcErrorCodesMap).includes(message);
};
function mapStatus(span) {
  const attributes = spanHasAttributes(span) ? span.attributes : {};
  const status = spanHasStatus(span) ? span.status : void 0;
  if (status) {
    if (status.code === SpanStatusCode.OK) {
      return { code: SPAN_STATUS_OK };
    } else if (status.code === SpanStatusCode.ERROR) {
      if (typeof status.message === "undefined") {
        const inferredStatus2 = inferStatusFromAttributes(attributes);
        if (inferredStatus2) {
          return inferredStatus2;
        }
      }
      if (status.message && isStatusErrorMessageValid(status.message)) {
        return { code: SPAN_STATUS_ERROR, message: status.message };
      } else {
        return { code: SPAN_STATUS_ERROR, message: "unknown_error" };
      }
    }
  }
  const inferredStatus = inferStatusFromAttributes(attributes);
  if (inferredStatus) {
    return inferredStatus;
  }
  if (status && status.code === SpanStatusCode.UNSET) {
    return { code: SPAN_STATUS_OK };
  } else {
    return { code: SPAN_STATUS_ERROR, message: "unknown_error" };
  }
}
function inferStatusFromAttributes(attributes) {
  const httpCodeAttribute = attributes[SEMATTRS_HTTP_STATUS_CODE];
  const grpcCodeAttribute = attributes[SEMATTRS_RPC_GRPC_STATUS_CODE];
  const numberHttpCode = typeof httpCodeAttribute === "number" ? httpCodeAttribute : typeof httpCodeAttribute === "string" ? parseInt(httpCodeAttribute) : void 0;
  if (typeof numberHttpCode === "number") {
    return getSpanStatusFromHttpCode(numberHttpCode);
  }
  if (typeof grpcCodeAttribute === "string") {
    return { code: SPAN_STATUS_ERROR, message: canonicalGrpcErrorCodesMap[grpcCodeAttribute] || "unknown_error" };
  }
  return void 0;
}
function _optionalChain$2(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
const MAX_SPAN_COUNT = 1e3;
const DEFAULT_TIMEOUT = 300;
class SentrySpanExporter {
  constructor(options) {
    this._finishedSpans = [];
    this._timeout = _optionalChain$2([options, "optionalAccess", (_) => _.timeout]) || DEFAULT_TIMEOUT;
  }
  /** Export a single span. */
  export(span) {
    this._finishedSpans.push(span);
    if (getLocalParentId(span)) {
      const openSpanCount = this._finishedSpans.length;
      DEBUG_BUILD$1 && logger.log(`SpanExporter has ${openSpanCount} unsent spans remaining`);
      this._cleanupOldSpans();
      return;
    }
    this._clearTimeout();
    this._flushTimeout = setTimeout(() => {
      this.flush();
    }, 1);
  }
  /** Try to flush any pending spans immediately. */
  flush() {
    this._clearTimeout();
    const openSpanCount = this._finishedSpans.length;
    const remainingSpans = maybeSend(this._finishedSpans);
    const remainingOpenSpanCount = remainingSpans.length;
    const sentSpanCount = openSpanCount - remainingOpenSpanCount;
    DEBUG_BUILD$1 && logger.log(`SpanExporter exported ${sentSpanCount} spans, ${remainingOpenSpanCount} unsent spans remaining`);
    this._cleanupOldSpans(remainingSpans);
  }
  /** Clear the exporter. */
  clear() {
    this._finishedSpans = [];
    this._clearTimeout();
  }
  /** Clear the flush timeout. */
  _clearTimeout() {
    if (this._flushTimeout) {
      clearTimeout(this._flushTimeout);
      this._flushTimeout = void 0;
    }
  }
  /**
   * Remove any span that is older than 5min.
   * We do this to avoid leaking memory.
   */
  _cleanupOldSpans(spans = this._finishedSpans) {
    this._finishedSpans = spans.filter((span) => {
      const shouldDrop = shouldCleanupSpan(span, this._timeout);
      DEBUG_BUILD$1 && shouldDrop && logger.log(
        `SpanExporter dropping span ${span.name} (${span.spanContext().spanId}) because it is pending for more than 5 minutes.`
      );
      return !shouldDrop;
    });
  }
}
function maybeSend(spans) {
  const grouped = groupSpansWithParents(spans);
  const remaining = new Set(grouped);
  const rootNodes = getCompletedRootNodes(grouped);
  rootNodes.forEach((root) => {
    remaining.delete(root);
    const span = root.span;
    const transactionEvent = createTransactionForOtelSpan(span);
    const spans2 = transactionEvent.spans || [];
    root.children.forEach((child) => {
      createAndFinishSpanForOtelSpan(child, spans2, remaining);
    });
    transactionEvent.spans = spans2.length > MAX_SPAN_COUNT ? spans2.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT) : spans2;
    const measurements = timedEventsToMeasurements(span.events);
    if (measurements) {
      transactionEvent.measurements = measurements;
    }
    captureEvent(transactionEvent);
  });
  return Array.from(remaining).map((node2) => node2.span).filter((span) => !!span);
}
function nodeIsCompletedRootNode(node2) {
  return !!node2.span && !node2.parentNode;
}
function getCompletedRootNodes(nodes) {
  return nodes.filter(nodeIsCompletedRootNode);
}
function shouldCleanupSpan(span, maxStartTimeOffsetSeconds) {
  const cutoff = Date.now() / 1e3 - maxStartTimeOffsetSeconds;
  return spanTimeInputToSeconds(span.startTime) < cutoff;
}
function parseSpan(span) {
  const attributes = span.attributes;
  const origin = attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN];
  const op = attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP];
  const source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
  return { origin, op, source };
}
function createTransactionForOtelSpan(span) {
  const { op, description, data, origin = "manual", source } = getSpanData(span);
  const capturedSpanScopes = getCapturedScopesOnSpan(span);
  const sampleRate = span.attributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
  const attributes = dropUndefinedKeys({
    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source,
    [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate,
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
    ...data,
    ...removeSentryAttributes(span.attributes)
  });
  const { traceId: trace_id, spanId: span_id } = span.spanContext();
  const parentSpanIdFromTraceState = _optionalChain$2([span, "access", (_2) => _2.spanContext, "call", (_3) => _3(), "access", (_4) => _4.traceState, "optionalAccess", (_5) => _5.get, "call", (_6) => _6(SENTRY_TRACE_STATE_PARENT_SPAN_ID)]);
  const parent_span_id = typeof parentSpanIdFromTraceState === "string" ? parentSpanIdFromTraceState || void 0 : span.parentSpanId;
  const status = mapStatus(span);
  const traceContext = dropUndefinedKeys({
    parent_span_id,
    span_id,
    trace_id,
    data: attributes,
    origin,
    op,
    status: getStatusMessage(status)
    // As per protocol, span status is allowed to be undefined
  });
  const transactionEvent = {
    contexts: {
      trace: traceContext,
      otel: {
        resource: span.resource.attributes
      }
    },
    spans: [],
    start_timestamp: spanTimeInputToSeconds(span.startTime),
    timestamp: spanTimeInputToSeconds(span.endTime),
    transaction: description,
    type: "transaction",
    sdkProcessingMetadata: {
      ...dropUndefinedKeys({
        capturedSpanScope: capturedSpanScopes.scope,
        capturedSpanIsolationScope: capturedSpanScopes.isolationScope,
        sampleRate,
        dynamicSamplingContext: getDynamicSamplingContextFromSpan(span)
      })
    },
    ...source && {
      transaction_info: {
        source
      }
    },
    _metrics_summary: getMetricSummaryJsonForSpan(span)
  };
  return transactionEvent;
}
function createAndFinishSpanForOtelSpan(node2, spans, remaining) {
  remaining.delete(node2);
  const span = node2.span;
  const shouldDrop = !span;
  if (shouldDrop) {
    node2.children.forEach((child) => {
      createAndFinishSpanForOtelSpan(child, spans, remaining);
    });
    return;
  }
  const span_id = span.spanContext().spanId;
  const trace_id = span.spanContext().traceId;
  const { attributes, startTime, endTime, parentSpanId } = span;
  const { op, description, data, origin = "manual" } = getSpanData(span);
  const allData = dropUndefinedKeys({
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
    ...removeSentryAttributes(attributes),
    ...data
  });
  const status = mapStatus(span);
  const spanJSON = dropUndefinedKeys({
    span_id,
    trace_id,
    data: allData,
    description,
    parent_span_id: parentSpanId,
    start_timestamp: spanTimeInputToSeconds(startTime),
    // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
    timestamp: spanTimeInputToSeconds(endTime) || void 0,
    status: getStatusMessage(status),
    // As per protocol, span status is allowed to be undefined
    op,
    origin,
    _metrics_summary: getMetricSummaryJsonForSpan(span),
    measurements: timedEventsToMeasurements(span.events)
  });
  spans.push(spanJSON);
  node2.children.forEach((child) => {
    createAndFinishSpanForOtelSpan(child, spans, remaining);
  });
}
function getSpanData(span) {
  const { op: definedOp, source: definedSource, origin } = parseSpan(span);
  const { op: inferredOp, description, source: inferredSource, data: inferredData } = parseSpanDescription(span);
  const op = definedOp || inferredOp;
  const source = definedSource || inferredSource;
  const data = { ...inferredData, ...getData(span) };
  return {
    op,
    description,
    source,
    origin,
    data
  };
}
function removeSentryAttributes(data) {
  const cleanedData = { ...data };
  delete cleanedData[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
  delete cleanedData[SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE];
  return cleanedData;
}
function getData(span) {
  const attributes = span.attributes;
  const data = {};
  if (span.kind !== SpanKind.INTERNAL) {
    data["otel.kind"] = SpanKind[span.kind];
  }
  if (attributes[SEMATTRS_HTTP_STATUS_CODE]) {
    const statusCode = attributes[SEMATTRS_HTTP_STATUS_CODE];
    data["http.response.status_code"] = statusCode;
  }
  const requestData = getRequestSpanData(span);
  if (requestData.url) {
    data.url = requestData.url;
  }
  if (requestData["http.query"]) {
    data["http.query"] = requestData["http.query"].slice(1);
  }
  if (requestData["http.fragment"]) {
    data["http.fragment"] = requestData["http.fragment"].slice(1);
  }
  return data;
}
function _optionalChain$1(ops) {
  let lastAccessLHS = void 0;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return void 0;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = void 0;
    }
  }
  return value;
}
function onSpanStart(span, parentContext) {
  const parentSpan = trace.getSpan(parentContext);
  let scopes = getScopesFromContext(parentContext);
  if (parentSpan && !parentSpan.spanContext().isRemote) {
    addChildSpanToSpan(parentSpan, span);
  }
  if (parentSpan && parentSpan.spanContext().isRemote) {
    span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE, true);
  }
  if (parentContext === ROOT_CONTEXT) {
    scopes = {
      scope: getDefaultCurrentScope(),
      isolationScope: getDefaultIsolationScope()
    };
  }
  if (scopes) {
    setCapturedScopesOnSpan(span, scopes.scope, scopes.isolationScope);
  }
  logSpanStart(span);
  const client = getClient();
  _optionalChain$1([client, "optionalAccess", (_) => _.emit, "call", (_2) => _2("spanStart", span)]);
}
function onSpanEnd(span) {
  logSpanEnd(span);
  const client = getClient();
  _optionalChain$1([client, "optionalAccess", (_3) => _3.emit, "call", (_4) => _4("spanEnd", span)]);
}
class SentrySpanProcessor {
  constructor(options) {
    setIsSetup("SentrySpanProcessor");
    this._exporter = new SentrySpanExporter(options);
  }
  /**
   * @inheritDoc
   */
  async forceFlush() {
    this._exporter.flush();
  }
  /**
   * @inheritDoc
   */
  async shutdown() {
    this._exporter.clear();
  }
  /**
   * @inheritDoc
   */
  onStart(span, parentContext) {
    onSpanStart(span, parentContext);
  }
  /** @inheritDoc */
  onEnd(span) {
    onSpanEnd(span);
    this._exporter.export(span);
  }
}
class SentrySampler {
  constructor(client) {
    this._client = client;
    setIsSetup("SentrySampler");
  }
  /** @inheritDoc */
  shouldSample(context2, traceId, spanName, spanKind, spanAttributes, _links) {
    const options = this._client.getOptions();
    const parentSpan = trace.getSpan(context2);
    const parentContext = _optionalChain([parentSpan, "optionalAccess", (_) => _.spanContext, "call", (_2) => _2()]);
    if (!hasTracingEnabled(options)) {
      return wrapSamplingDecision({ decision: void 0, context: context2, spanAttributes });
    }
    if (spanKind === SpanKind.CLIENT && spanAttributes[SEMATTRS_HTTP_METHOD] && (!parentSpan || _optionalChain([parentContext, "optionalAccess", (_3) => _3.isRemote]))) {
      return wrapSamplingDecision({ decision: void 0, context: context2, spanAttributes });
    }
    const parentSampled = parentSpan ? getParentSampled(parentSpan, traceId, spanName) : void 0;
    const {
      description: inferredSpanName,
      data: inferredAttributes,
      op
    } = inferSpanData(spanName, spanAttributes, spanKind);
    const mergedAttributes = {
      ...inferredAttributes,
      ...spanAttributes
    };
    if (op) {
      mergedAttributes[SEMANTIC_ATTRIBUTE_SENTRY_OP] = op;
    }
    const mutableSamplingDecision = { decision: true };
    this._client.emit(
      "beforeSampling",
      {
        spanAttributes: mergedAttributes,
        spanName: inferredSpanName,
        parentSampled,
        parentContext
      },
      mutableSamplingDecision
    );
    if (!mutableSamplingDecision.decision) {
      return wrapSamplingDecision({ decision: void 0, context: context2, spanAttributes });
    }
    const [sampled, sampleRate] = sampleSpan(options, {
      name: inferredSpanName,
      attributes: mergedAttributes,
      transactionContext: {
        name: inferredSpanName,
        parentSampled
      },
      parentSampled
    });
    const attributes = {
      [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate
    };
    const method = `${spanAttributes[SEMATTRS_HTTP_METHOD]}`.toUpperCase();
    if (method === "OPTIONS" || method === "HEAD") {
      DEBUG_BUILD$1 && logger.log(`[Tracing] Not sampling span because HTTP method is '${method}' for ${spanName}`);
      return {
        ...wrapSamplingDecision({ decision: SamplingDecision.NOT_RECORD, context: context2, spanAttributes }),
        attributes
      };
    }
    if (!sampled) {
      return {
        ...wrapSamplingDecision({ decision: SamplingDecision.NOT_RECORD, context: context2, spanAttributes }),
        attributes
      };
    }
    return {
      ...wrapSamplingDecision({ decision: SamplingDecision.RECORD_AND_SAMPLED, context: context2, spanAttributes }),
      attributes
    };
  }
  /** Returns the sampler name or short description with the configuration. */
  toString() {
    return "SentrySampler";
  }
}
function getParentRemoteSampled(parentSpan) {
  const traceId = parentSpan.spanContext().traceId;
  const traceparentData = getPropagationContextFromSpan(parentSpan);
  return traceparentData && traceId === traceparentData.traceId ? traceparentData.sampled : void 0;
}
function getParentSampled(parentSpan, traceId, spanName) {
  const parentContext = parentSpan.spanContext();
  if (isSpanContextValid(parentContext) && parentContext.traceId === traceId) {
    if (parentContext.isRemote) {
      const parentSampled2 = getParentRemoteSampled(parentSpan);
      DEBUG_BUILD$1 && logger.log(`[Tracing] Inheriting remote parent's sampled decision for ${spanName}: ${parentSampled2}`);
      return parentSampled2;
    }
    const parentSampled = getSamplingDecision(parentContext);
    DEBUG_BUILD$1 && logger.log(`[Tracing] Inheriting parent's sampled decision for ${spanName}: ${parentSampled}`);
    return parentSampled;
  }
  return void 0;
}
function wrapSamplingDecision({
  decision,
  context: context2,
  spanAttributes
}) {
  const traceState = getBaseTraceState(context2, spanAttributes);
  if (decision == void 0) {
    return { decision: SamplingDecision.NOT_RECORD, traceState };
  }
  if (decision === SamplingDecision.NOT_RECORD) {
    return { decision, traceState: traceState.set(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING, "1") };
  }
  return { decision, traceState };
}
function getBaseTraceState(context2, spanAttributes) {
  const parentSpan = trace.getSpan(context2);
  const parentContext = _optionalChain([parentSpan, "optionalAccess", (_4) => _4.spanContext, "call", (_5) => _5()]);
  let traceState = _optionalChain([parentContext, "optionalAccess", (_6) => _6.traceState]) || new TraceState();
  const url = spanAttributes[SEMATTRS_HTTP_URL];
  if (url && typeof url === "string") {
    traceState = traceState.set(SENTRY_TRACE_STATE_URL, url);
  }
  return traceState;
}
function addOpenTelemetryInstrumentation(...instrumentations) {
  registerInstrumentations({
    instrumentations
  });
}
function addOriginToSpan(span, origin) {
  span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, origin);
}
const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const NODE_VERSION = parseSemver(process.versions.node);
const NODE_MAJOR = NODE_VERSION.major;
const _nativeNodeFetchIntegration = (options = {}) => {
  const _breadcrumbs = typeof options.breadcrumbs === "undefined" ? true : options.breadcrumbs;
  const _ignoreOutgoingRequests = options.ignoreOutgoingRequests;
  async function getInstrumentation() {
    if (NODE_MAJOR < 18) {
      DEBUG_BUILD && logger.log("NodeFetch is not supported on Node < 18, skipping instrumentation...");
      return;
    }
    try {
      const pkg = await import("./index-DncEpGwI.js").then((n) => n.i);
      const { FetchInstrumentation } = pkg;
      class SentryNodeFetchInstrumentation extends FetchInstrumentation {
        // We extend this method so we have access to request _and_ response for the breadcrumb
        onHeaders({ request, response }) {
          if (_breadcrumbs) {
            _addRequestBreadcrumb(request, response);
          }
          return super.onHeaders({ request, response });
        }
      }
      return new SentryNodeFetchInstrumentation({
        ignoreRequestHook: (request) => {
          const url = getAbsoluteUrl(request.origin, request.path);
          const tracingDisabled = !hasTracingEnabled();
          const shouldIgnore = _ignoreOutgoingRequests && url && _ignoreOutgoingRequests(url);
          if (shouldIgnore) {
            return true;
          }
          if (tracingDisabled) {
            const ctx = context.active();
            const addedHeaders = {};
            const activeSpan = trace.getSpan(ctx);
            const propagationContext = activeSpan ? getPropagationContextFromSpan(activeSpan) : getCurrentScope().getPropagationContext();
            const spanContext = generateSpanContextForPropagationContext(propagationContext);
            spanContext.traceState = _optionalChain([spanContext, "access", (_) => _.traceState, "optionalAccess", (_2) => _2.set, "call", (_3) => _3("sentry.url", url)]);
            const ctxWithUrlTraceState = trace.setSpanContext(ctx, spanContext);
            propagation.inject(ctxWithUrlTraceState, addedHeaders);
            const requestHeaders = request.headers;
            if (Array.isArray(requestHeaders)) {
              Object.entries(addedHeaders).forEach((headers) => requestHeaders.push(...headers));
            } else {
              request.headers += Object.entries(addedHeaders).map(([k, v]) => `${k}: ${v}\r
`).join("");
            }
            return true;
          }
          return false;
        },
        onRequest: ({ span }) => {
          _updateSpan(span);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      });
    } catch (error) {
      DEBUG_BUILD && logger.log("Error while loading NodeFetch instrumentation: \n", error);
    }
  }
  return {
    name: "NodeFetch",
    setupOnce() {
      getInstrumentation().then((instrumentation) => {
        if (instrumentation) {
          addOpenTelemetryInstrumentation(instrumentation);
        }
      });
    }
  };
};
const nativeNodeFetchIntegration = defineIntegration(_nativeNodeFetchIntegration);
function _updateSpan(span) {
  addOriginToSpan(span, "auto.http.otel.node_fetch");
}
function _addRequestBreadcrumb(request, response) {
  const data = getBreadcrumbData(request);
  addBreadcrumb(
    {
      category: "http",
      data: {
        status_code: response.statusCode,
        ...data
      },
      type: "http"
    },
    {
      event: "response",
      request,
      response
    }
  );
}
function getBreadcrumbData(request) {
  try {
    const url = new URL(request.path, request.origin);
    const parsedUrl = parseUrl(url.toString());
    const data = {
      url: getSanitizedUrlString(parsedUrl),
      "http.method": request.method || "GET"
    };
    if (parsedUrl.search) {
      data["http.query"] = parsedUrl.search;
    }
    if (parsedUrl.hash) {
      data["http.fragment"] = parsedUrl.hash;
    }
    return data;
  } catch (e) {
    return {};
  }
}
function getAbsoluteUrl(origin, path = "/") {
  const url = `${origin}`;
  if (origin.endsWith("/") && path.startsWith("/")) {
    return `${url}${path.slice(1)}`;
  }
  if (!origin.endsWith("/") && !path.startsWith("/")) {
    return `${url}/${path.slice(1)}`;
  }
  return `${url}${path}`;
}
const INTEGRATION_NAME$4 = "Console";
const _consoleIntegration = () => {
  return {
    name: INTEGRATION_NAME$4,
    setup(client) {
      addConsoleInstrumentationHandler(({ args, level }) => {
        if (getClient() !== client) {
          return;
        }
        addBreadcrumb(
          {
            category: "console",
            level: severityLevelFromString(level),
            message: util.format.apply(void 0, args)
          },
          {
            input: [...args],
            level
          }
        );
      });
    }
  };
};
const consoleIntegration = defineIntegration(_consoleIntegration);
const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const INTEGRATION_NAME$3 = "Context";
const _nodeContextIntegration = (options = {}) => {
  let cachedContext;
  const _options = {
    app: true,
    os: true,
    device: true,
    culture: true,
    cloudResource: true,
    ...options
  };
  async function addContext(event) {
    if (cachedContext === void 0) {
      cachedContext = _getContexts();
    }
    const updatedContext = _updateContext(await cachedContext);
    event.contexts = {
      ...event.contexts,
      app: { ...updatedContext.app, ..._optionalChain([event, "access", (_) => _.contexts, "optionalAccess", (_2) => _2.app]) },
      os: { ...updatedContext.os, ..._optionalChain([event, "access", (_3) => _3.contexts, "optionalAccess", (_4) => _4.os]) },
      device: { ...updatedContext.device, ..._optionalChain([event, "access", (_5) => _5.contexts, "optionalAccess", (_6) => _6.device]) },
      culture: { ...updatedContext.culture, ..._optionalChain([event, "access", (_7) => _7.contexts, "optionalAccess", (_8) => _8.culture]) },
      cloud_resource: { ...updatedContext.cloud_resource, ..._optionalChain([event, "access", (_9) => _9.contexts, "optionalAccess", (_10) => _10.cloud_resource]) }
    };
    return event;
  }
  async function _getContexts() {
    const contexts = {};
    if (_options.os) {
      contexts.os = await getOsContext();
    }
    if (_options.app) {
      contexts.app = getAppContext();
    }
    if (_options.device) {
      contexts.device = getDeviceContext(_options.device);
    }
    if (_options.culture) {
      const culture = getCultureContext();
      if (culture) {
        contexts.culture = culture;
      }
    }
    if (_options.cloudResource) {
      contexts.cloud_resource = getCloudResourceContext();
    }
    return contexts;
  }
  return {
    name: INTEGRATION_NAME$3,
    processEvent(event) {
      return addContext(event);
    }
  };
};
const nodeContextIntegration = defineIntegration(_nodeContextIntegration);
function _updateContext(contexts) {
  if (_optionalChain([contexts, "optionalAccess", (_11) => _11.app, "optionalAccess", (_12) => _12.app_memory])) {
    contexts.app.app_memory = process.memoryUsage().rss;
  }
  if (_optionalChain([contexts, "optionalAccess", (_13) => _13.app, "optionalAccess", (_14) => _14.free_memory]) && typeof process.availableMemory === "function") {
    const freeMemory = _optionalChain([process, "access", (_15) => _15.availableMemory, "optionalCall", (_16) => _16()]);
    if (freeMemory != null) {
      contexts.app.free_memory = freeMemory;
    }
  }
  if (_optionalChain([contexts, "optionalAccess", (_17) => _17.device, "optionalAccess", (_18) => _18.free_memory])) {
    contexts.device.free_memory = os.freemem();
  }
  return contexts;
}
async function getOsContext() {
  const platformId = os.platform();
  switch (platformId) {
    case "darwin":
      return getDarwinInfo();
    case "linux":
      return getLinuxInfo();
    default:
      return {
        name: PLATFORM_NAMES[platformId] || platformId,
        version: os.release()
      };
  }
}
function getCultureContext() {
  try {
    if (typeof process.versions.icu !== "string") {
      return;
    }
    const january = /* @__PURE__ */ new Date(9e8);
    const spanish = new Intl.DateTimeFormat("es", { month: "long" });
    if (spanish.format(january) === "enero") {
      const options = Intl.DateTimeFormat().resolvedOptions();
      return {
        locale: options.locale,
        timezone: options.timeZone
      };
    }
  } catch (err) {
  }
  return;
}
function getAppContext() {
  const app_memory = process.memoryUsage().rss;
  const app_start_time = new Date(Date.now() - process.uptime() * 1e3).toISOString();
  const appContext = { app_start_time, app_memory };
  if (typeof process.availableMemory === "function") {
    const freeMemory = _optionalChain([process, "access", (_19) => _19.availableMemory, "optionalCall", (_20) => _20()]);
    if (freeMemory != null) {
      appContext.free_memory = freeMemory;
    }
  }
  return appContext;
}
function getDeviceContext(deviceOpt) {
  const device = {};
  let uptime;
  try {
    uptime = os.uptime && os.uptime();
  } catch (e) {
  }
  if (typeof uptime === "number") {
    device.boot_time = new Date(Date.now() - uptime * 1e3).toISOString();
  }
  device.arch = os.arch();
  if (deviceOpt === true || deviceOpt.memory) {
    device.memory_size = os.totalmem();
    device.free_memory = os.freemem();
  }
  if (deviceOpt === true || deviceOpt.cpu) {
    const cpuInfo = os.cpus();
    const firstCpu = cpuInfo && cpuInfo[0];
    if (firstCpu) {
      device.processor_count = cpuInfo.length;
      device.cpu_description = firstCpu.model;
      device.processor_frequency = firstCpu.speed;
    }
  }
  return device;
}
const PLATFORM_NAMES = {
  aix: "IBM AIX",
  freebsd: "FreeBSD",
  openbsd: "OpenBSD",
  sunos: "SunOS",
  win32: "Windows"
};
const LINUX_DISTROS = [
  { name: "fedora-release", distros: ["Fedora"] },
  { name: "redhat-release", distros: ["Red Hat Linux", "Centos"] },
  { name: "redhat_version", distros: ["Red Hat Linux"] },
  { name: "SuSE-release", distros: ["SUSE Linux"] },
  { name: "lsb-release", distros: ["Ubuntu Linux", "Arch Linux"] },
  { name: "debian_version", distros: ["Debian"] },
  { name: "debian_release", distros: ["Debian"] },
  { name: "arch-release", distros: ["Arch Linux"] },
  { name: "gentoo-release", distros: ["Gentoo Linux"] },
  { name: "novell-release", distros: ["SUSE Linux"] },
  { name: "alpine-release", distros: ["Alpine Linux"] }
];
const LINUX_VERSIONS = {
  alpine: (content) => content,
  arch: (content) => matchFirst(/distrib_release=(.*)/, content),
  centos: (content) => matchFirst(/release ([^ ]+)/, content),
  debian: (content) => content,
  fedora: (content) => matchFirst(/release (..)/, content),
  mint: (content) => matchFirst(/distrib_release=(.*)/, content),
  red: (content) => matchFirst(/release ([^ ]+)/, content),
  suse: (content) => matchFirst(/VERSION = (.*)\n/, content),
  ubuntu: (content) => matchFirst(/distrib_release=(.*)/, content)
};
function matchFirst(regex, text) {
  const match = regex.exec(text);
  return match ? match[1] : void 0;
}
async function getDarwinInfo() {
  const darwinInfo = {
    kernel_version: os.release(),
    name: "Mac OS X",
    version: `10.${Number(os.release().split(".")[0]) - 4}`
  };
  try {
    const output = await new Promise((resolve2, reject) => {
      execFile("/usr/bin/sw_vers", (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve2(stdout);
      });
    });
    darwinInfo.name = matchFirst(/^ProductName:\s+(.*)$/m, output);
    darwinInfo.version = matchFirst(/^ProductVersion:\s+(.*)$/m, output);
    darwinInfo.build = matchFirst(/^BuildVersion:\s+(.*)$/m, output);
  } catch (e) {
  }
  return darwinInfo;
}
function getLinuxDistroId(name) {
  return name.split(" ")[0].toLowerCase();
}
async function getLinuxInfo() {
  const linuxInfo = {
    kernel_version: os.release(),
    name: "Linux"
  };
  try {
    const etcFiles = await readDirAsync("/etc");
    const distroFile = LINUX_DISTROS.find((file) => etcFiles.includes(file.name));
    if (!distroFile) {
      return linuxInfo;
    }
    const distroPath = join$1("/etc", distroFile.name);
    const contents = (await readFileAsync(distroPath, { encoding: "utf-8" })).toLowerCase();
    const { distros } = distroFile;
    linuxInfo.name = distros.find((d) => contents.indexOf(getLinuxDistroId(d)) >= 0) || distros[0];
    const id = getLinuxDistroId(linuxInfo.name);
    linuxInfo.version = _optionalChain([LINUX_VERSIONS, "access", (_21) => _21[id], "optionalCall", (_22) => _22(contents)]);
  } catch (e) {
  }
  return linuxInfo;
}
function getCloudResourceContext() {
  if (process.env.VERCEL) {
    return {
      "cloud.provider": "vercel",
      "cloud.region": process.env.VERCEL_REGION
    };
  } else if (process.env.AWS_REGION) {
    return {
      "cloud.provider": "aws",
      "cloud.region": process.env.AWS_REGION,
      "cloud.platform": process.env.AWS_EXECUTION_ENV
    };
  } else if (process.env.GCP_PROJECT) {
    return {
      "cloud.provider": "gcp"
    };
  } else if (process.env.ALIYUN_REGION_ID) {
    return {
      "cloud.provider": "alibaba_cloud",
      "cloud.region": process.env.ALIYUN_REGION_ID
    };
  } else if (process.env.WEBSITE_SITE_NAME && process.env.REGION_NAME) {
    return {
      "cloud.provider": "azure",
      "cloud.region": process.env.REGION_NAME
    };
  } else if (process.env.IBM_CLOUD_REGION) {
    return {
      "cloud.provider": "ibm_cloud",
      "cloud.region": process.env.IBM_CLOUD_REGION
    };
  } else if (process.env.TENCENTCLOUD_REGION) {
    return {
      "cloud.provider": "tencent_cloud",
      "cloud.region": process.env.TENCENTCLOUD_REGION,
      "cloud.account.id": process.env.TENCENTCLOUD_APPID,
      "cloud.availability_zone": process.env.TENCENTCLOUD_ZONE
    };
  } else if (process.env.NETLIFY) {
    return {
      "cloud.provider": "netlify"
    };
  } else if (process.env.FLY_REGION) {
    return {
      "cloud.provider": "fly.io",
      "cloud.region": process.env.FLY_REGION
    };
  } else if (process.env.DYNO) {
    return {
      "cloud.provider": "heroku"
    };
  } else {
    return void 0;
  }
}
const LRU_FILE_CONTENTS_CACHE = new LRUMap(10);
const LRU_FILE_CONTENTS_FS_READ_FAILED = new LRUMap(20);
const DEFAULT_LINES_OF_CONTEXT = 7;
const INTEGRATION_NAME$2 = "ContextLines";
const MAX_CONTEXTLINES_COLNO = 1e3;
const MAX_CONTEXTLINES_LINENO = 1e4;
function emplace(map, key, contents) {
  const value = map.get(key);
  if (value === void 0) {
    map.set(key, contents);
    return contents;
  }
  return value;
}
function shouldSkipContextLinesForFile(path) {
  if (path.startsWith("node:")) return true;
  if (path.endsWith(".min.js")) return true;
  if (path.endsWith(".min.cjs")) return true;
  if (path.endsWith(".min.mjs")) return true;
  if (path.startsWith("data:")) return true;
  return false;
}
function shouldSkipContextLinesForFrame(frame) {
  if (frame.lineno !== void 0 && frame.lineno > MAX_CONTEXTLINES_LINENO) return true;
  if (frame.colno !== void 0 && frame.colno > MAX_CONTEXTLINES_COLNO) return true;
  return false;
}
function rangeExistsInContentCache(file, range) {
  const contents = LRU_FILE_CONTENTS_CACHE.get(file);
  if (contents === void 0) return false;
  for (let i = range[0]; i <= range[1]; i++) {
    if (contents[i] === void 0) {
      return false;
    }
  }
  return true;
}
function makeLineReaderRanges(lines, linecontext) {
  if (!lines.length) {
    return [];
  }
  let i = 0;
  const line = lines[0];
  if (typeof line !== "number") {
    return [];
  }
  let current = makeContextRange(line, linecontext);
  const out = [];
  while (true) {
    if (i === lines.length - 1) {
      out.push(current);
      break;
    }
    const next = lines[i + 1];
    if (typeof next !== "number") {
      break;
    }
    if (next <= current[1]) {
      current[1] = next + linecontext;
    } else {
      out.push(current);
      current = makeContextRange(next, linecontext);
    }
    i++;
  }
  return out;
}
function getContextLinesFromFile(path, ranges, output) {
  return new Promise((resolve2, _reject) => {
    const stream = createReadStream(path);
    const lineReaded = createInterface({
      input: stream
    });
    let lineNumber = 0;
    let currentRangeIndex = 0;
    const range = ranges[currentRangeIndex];
    if (range === void 0) {
      resolve2();
      return;
    }
    let rangeStart = range[0];
    let rangeEnd = range[1];
    function onStreamError(e) {
      LRU_FILE_CONTENTS_FS_READ_FAILED.set(path, 1);
      DEBUG_BUILD && logger.error(`Failed to read file: ${path}. Error: ${e}`);
      lineReaded.close();
      lineReaded.removeAllListeners();
      resolve2();
    }
    stream.on("error", onStreamError);
    lineReaded.on("error", onStreamError);
    lineReaded.on("close", resolve2);
    lineReaded.on("line", (line) => {
      lineNumber++;
      if (lineNumber < rangeStart) return;
      output[lineNumber] = snipLine(line, 0);
      if (lineNumber >= rangeEnd) {
        if (currentRangeIndex === ranges.length - 1) {
          lineReaded.close();
          lineReaded.removeAllListeners();
          return;
        }
        currentRangeIndex++;
        const range2 = ranges[currentRangeIndex];
        if (range2 === void 0) {
          lineReaded.close();
          lineReaded.removeAllListeners();
          return;
        }
        rangeStart = range2[0];
        rangeEnd = range2[1];
      }
    });
  });
}
async function addSourceContext(event, contextLines) {
  const filesToLines = {};
  if (contextLines > 0 && _optionalChain([event, "access", (_) => _.exception, "optionalAccess", (_2) => _2.values])) {
    for (const exception of event.exception.values) {
      if (!_optionalChain([exception, "access", (_3) => _3.stacktrace, "optionalAccess", (_4) => _4.frames, "optionalAccess", (_5) => _5.length])) {
        continue;
      }
      for (let i = exception.stacktrace.frames.length - 1; i >= 0; i--) {
        const frame = exception.stacktrace.frames[i];
        const filename = _optionalChain([frame, "optionalAccess", (_6) => _6.filename]);
        if (!frame || typeof filename !== "string" || typeof frame.lineno !== "number" || shouldSkipContextLinesForFile(filename) || shouldSkipContextLinesForFrame(frame)) {
          continue;
        }
        const filesToLinesOutput = filesToLines[filename];
        if (!filesToLinesOutput) filesToLines[filename] = [];
        filesToLines[filename].push(frame.lineno);
      }
    }
  }
  const files = Object.keys(filesToLines);
  if (files.length == 0) {
    return event;
  }
  const readlinePromises = [];
  for (const file of files) {
    if (LRU_FILE_CONTENTS_FS_READ_FAILED.get(file)) {
      continue;
    }
    const filesToLineRanges = filesToLines[file];
    if (!filesToLineRanges) {
      continue;
    }
    filesToLineRanges.sort((a, b) => a - b);
    const ranges = makeLineReaderRanges(filesToLineRanges, contextLines);
    if (ranges.every((r) => rangeExistsInContentCache(file, r))) {
      continue;
    }
    const cache = emplace(LRU_FILE_CONTENTS_CACHE, file, {});
    readlinePromises.push(getContextLinesFromFile(file, ranges, cache));
  }
  await Promise.all(readlinePromises).catch(() => {
    DEBUG_BUILD && logger.log("Failed to read one or more source files and resolve context lines");
  });
  if (contextLines > 0 && _optionalChain([event, "access", (_7) => _7.exception, "optionalAccess", (_8) => _8.values])) {
    for (const exception of event.exception.values) {
      if (exception.stacktrace && exception.stacktrace.frames && exception.stacktrace.frames.length > 0) {
        addSourceContextToFrames(exception.stacktrace.frames, contextLines, LRU_FILE_CONTENTS_CACHE);
      }
    }
  }
  return event;
}
function addSourceContextToFrames(frames, contextLines, cache) {
  for (const frame of frames) {
    if (frame.filename && frame.context_line === void 0 && typeof frame.lineno === "number") {
      const contents = cache.get(frame.filename);
      if (contents === void 0) {
        continue;
      }
      addContextToFrame(frame.lineno, frame, contextLines, contents);
    }
  }
}
function clearLineContext(frame) {
  delete frame.pre_context;
  delete frame.context_line;
  delete frame.post_context;
}
function addContextToFrame(lineno, frame, contextLines, contents) {
  if (frame.lineno === void 0 || contents === void 0) {
    DEBUG_BUILD && logger.error("Cannot resolve context for frame with no lineno or file contents");
    return;
  }
  frame.pre_context = [];
  for (let i = makeRangeStart(lineno, contextLines); i < lineno; i++) {
    const line = contents[i];
    if (line === void 0) {
      clearLineContext(frame);
      DEBUG_BUILD && logger.error(`Could not find line ${i} in file ${frame.filename}`);
      return;
    }
    frame.pre_context.push(line);
  }
  if (contents[lineno] === void 0) {
    clearLineContext(frame);
    DEBUG_BUILD && logger.error(`Could not find line ${lineno} in file ${frame.filename}`);
    return;
  }
  frame.context_line = contents[lineno];
  const end = makeRangeEnd(lineno, contextLines);
  frame.post_context = [];
  for (let i = lineno + 1; i <= end; i++) {
    const line = contents[i];
    if (line === void 0) {
      break;
    }
    frame.post_context.push(line);
  }
}
function makeRangeStart(line, linecontext) {
  return Math.max(1, line - linecontext);
}
function makeRangeEnd(line, linecontext) {
  return line + linecontext;
}
function makeContextRange(line, linecontext) {
  return [makeRangeStart(line, linecontext), makeRangeEnd(line, linecontext)];
}
const _contextLinesIntegration = (options = {}) => {
  const contextLines = options.frameContextLines !== void 0 ? options.frameContextLines : DEFAULT_LINES_OF_CONTEXT;
  return {
    name: INTEGRATION_NAME$2,
    processEvent(event) {
      return addSourceContext(event, contextLines);
    }
  };
};
const contextLinesIntegration = defineIntegration(_contextLinesIntegration);
function createRateLimiter(maxPerSecond, enable, disable) {
  let count = 0;
  let retrySeconds = 5;
  let disabledTimeout = 0;
  setInterval(() => {
    if (disabledTimeout === 0) {
      if (count > maxPerSecond) {
        retrySeconds *= 2;
        disable(retrySeconds);
        if (retrySeconds > 86400) {
          retrySeconds = 86400;
        }
        disabledTimeout = retrySeconds;
      }
    } else {
      disabledTimeout -= 1;
      if (disabledTimeout === 0) {
        enable();
      }
    }
    count = 0;
  }, 1e3).unref();
  return () => {
    count += 1;
  };
}
function isAnonymous(name) {
  return name !== void 0 && (name.length === 0 || name === "?" || name === "<anonymous>");
}
function functionNamesMatch(a, b) {
  return a === b || isAnonymous(a) && isAnonymous(b);
}
function hashFrames(frames) {
  if (frames === void 0) {
    return;
  }
  return frames.slice(-10).reduce((acc, frame) => `${acc},${frame.function},${frame.lineno},${frame.colno}`, "");
}
function hashFromStack(stackParser, stack) {
  if (stack === void 0) {
    return void 0;
  }
  return hashFrames(stackParser(stack, 1));
}
const base64WorkerScript = "LyohIEBzZW50cnkvbm9kZSA4LjI2LjAgKGJmZjlkZmQpIHwgaHR0cHM6Ly9naXRodWIuY29tL2dldHNlbnRyeS9zZW50cnktamF2YXNjcmlwdCAqLwppbXBvcnR7U2Vzc2lvbiBhcyBlfWZyb20ibm9kZTppbnNwZWN0b3IvcHJvbWlzZXMiO2ltcG9ydHt3b3JrZXJEYXRhIGFzIG4scGFyZW50UG9ydCBhcyB0fWZyb20ibm9kZTp3b3JrZXJfdGhyZWFkcyI7aW1wb3J0e3Bvc2l4IGFzIG8sc2VwIGFzIHJ9ZnJvbSJub2RlOnBhdGgiO2NvbnN0IGk9NTAscz0iPyIsYz0vXChlcnJvcjogKC4qKVwpLyxhPS9jYXB0dXJlTWVzc2FnZXxjYXB0dXJlRXhjZXB0aW9uLztmdW5jdGlvbiB1KGUpe3JldHVybiBlW2UubGVuZ3RoLTFdfHx7fX1jb25zdCBmPS9eKFxTKzpcXHxcLz8pKFtcc1xTXSo/KSgoPzpcLnsxLDJ9fFteL1xcXSs/fCkoXC5bXi4vXFxdKnwpKSg/OlsvXFxdKikkLztmdW5jdGlvbiBsKGUpe2NvbnN0IG49ZnVuY3Rpb24oZSl7Y29uc3Qgbj1lLmxlbmd0aD4xMDI0P2A8dHJ1bmNhdGVkPiR7ZS5zbGljZSgtMTAyNCl9YDplLHQ9Zi5leGVjKG4pO3JldHVybiB0P3Quc2xpY2UoMSk6W119KGUpLHQ9blswXXx8IiI7bGV0IG89blsxXTtyZXR1cm4gdHx8bz8obyYmKG89by5zbGljZSgwLG8ubGVuZ3RoLTEpKSx0K28pOiIuIn1mdW5jdGlvbiBkKGUsbj0hMSl7cmV0dXJuIShufHxlJiYhZS5zdGFydHNXaXRoKCIvIikmJiFlLm1hdGNoKC9eW0EtWl06LykmJiFlLnN0YXJ0c1dpdGgoIi4iKSYmIWUubWF0Y2goL15bYS16QS1aXShbYS16QS1aMC05LlwtK10pKjpcL1wvLykpJiZ2b2lkIDAhPT1lJiYhZS5pbmNsdWRlcygibm9kZV9tb2R1bGVzLyIpfWZ1bmN0aW9uIHAoZSl7Y29uc3Qgbj0vXlxzKlstXXs0LH0kLyx0PS9hdCAoPzphc3luYyApPyg/OiguKz8pXHMrXCgpPyg/OiguKyk6KFxkKyk6KFxkKyk/fChbXildKykpXCk/LztyZXR1cm4gbz0+e2NvbnN0IHI9by5tYXRjaCh0KTtpZihyKXtsZXQgbix0LG8saSxjO2lmKHJbMV0pe289clsxXTtsZXQgZT1vLmxhc3RJbmRleE9mKCIuIik7aWYoIi4iPT09b1tlLTFdJiZlLS0sZT4wKXtuPW8uc2xpY2UoMCxlKSx0PW8uc2xpY2UoZSsxKTtjb25zdCByPW4uaW5kZXhPZigiLk1vZHVsZSIpO3I+MCYmKG89by5zbGljZShyKzEpLG49bi5zbGljZSgwLHIpKX1pPXZvaWQgMH10JiYoaT1uLGM9dCksIjxhbm9ueW1vdXM+Ij09PXQmJihjPXZvaWQgMCxvPXZvaWQgMCksdm9pZCAwPT09byYmKGM9Y3x8cyxvPWk/YCR7aX0uJHtjfWA6Yyk7bGV0IGE9clsyXSYmclsyXS5zdGFydHNXaXRoKCJmaWxlOi8vIik/clsyXS5zbGljZSg3KTpyWzJdO2NvbnN0IHU9Im5hdGl2ZSI9PT1yWzVdO3JldHVybiBhJiZhLm1hdGNoKC9cL1tBLVpdOi8pJiYoYT1hLnNsaWNlKDEpKSxhfHwhcls1XXx8dXx8KGE9cls1XSkse2ZpbGVuYW1lOmEsbW9kdWxlOmU/ZShhKTp2b2lkIDAsZnVuY3Rpb246byxsaW5lbm86ZyhyWzNdKSxjb2xubzpnKHJbNF0pLGluX2FwcDpkKGF8fCIiLHUpfX1pZihvLm1hdGNoKG4pKXJldHVybntmaWxlbmFtZTpvfX19ZnVuY3Rpb24gZyhlKXtyZXR1cm4gcGFyc2VJbnQoZXx8IiIsMTApfHx2b2lkIDB9ZnVuY3Rpb24gbShlKXtyZXR1cm4gZS5yZXBsYWNlKC9eW0EtWl06LywiIikucmVwbGFjZSgvXFwvZywiLyIpfWNvbnN0IGI9biwkPWZ1bmN0aW9uKC4uLmUpe2NvbnN0IG49ZS5zb3J0KCgoZSxuKT0+ZVswXS1uWzBdKSkubWFwKChlPT5lWzFdKSk7cmV0dXJuKGUsdD0wLG89MCk9Pntjb25zdCByPVtdLGY9ZS5zcGxpdCgiXG4iKTtmb3IobGV0IGU9dDtlPGYubGVuZ3RoO2UrKyl7Y29uc3QgdD1mW2VdO2lmKHQubGVuZ3RoPjEwMjQpY29udGludWU7Y29uc3Qgcz1jLnRlc3QodCk/dC5yZXBsYWNlKGMsIiQxIik6dDtpZighcy5tYXRjaCgvXFMqRXJyb3I6IC8pKXtmb3IoY29uc3QgZSBvZiBuKXtjb25zdCBuPWUocyk7aWYobil7ci5wdXNoKG4pO2JyZWFrfX1pZihyLmxlbmd0aD49aStvKWJyZWFrfX1yZXR1cm4gZnVuY3Rpb24oZSl7aWYoIWUubGVuZ3RoKXJldHVybltdO2NvbnN0IG49QXJyYXkuZnJvbShlKTsvc2VudHJ5V3JhcHBlZC8udGVzdCh1KG4pLmZ1bmN0aW9ufHwiIikmJm4ucG9wKCk7bi5yZXZlcnNlKCksYS50ZXN0KHUobikuZnVuY3Rpb258fCIiKSYmKG4ucG9wKCksYS50ZXN0KHUobikuZnVuY3Rpb258fCIiKSYmbi5wb3AoKSk7cmV0dXJuIG4uc2xpY2UoMCxpKS5tYXAoKGU9Pih7Li4uZSxmaWxlbmFtZTplLmZpbGVuYW1lfHx1KG4pLmZpbGVuYW1lLGZ1bmN0aW9uOmUuZnVuY3Rpb258fHN9KSkpfShyLnNsaWNlKG8pKX19KFs5MCxwKGZ1bmN0aW9uKGU9KHByb2Nlc3MuYXJndlsxXT9sKHByb2Nlc3MuYXJndlsxXSk6cHJvY2Vzcy5jd2QoKSksbj0iXFwiPT09cil7Y29uc3QgdD1uP20oZSk6ZTtyZXR1cm4gZT0+e2lmKCFlKXJldHVybjtjb25zdCByPW4/bShlKTplO2xldHtkaXI6aSxiYXNlOnMsZXh0OmN9PW8ucGFyc2Uocik7Ii5qcyIhPT1jJiYiLm1qcyIhPT1jJiYiLmNqcyIhPT1jfHwocz1zLnNsaWNlKDAsLTEqYy5sZW5ndGgpKSxpfHwoaT0iLiIpO2NvbnN0IGE9aS5sYXN0SW5kZXhPZigiL25vZGVfbW9kdWxlcyIpO2lmKGE+LTEpcmV0dXJuYCR7aS5zbGljZShhKzE0KS5yZXBsYWNlKC9cLy9nLCIuIil9OiR7c31gO2lmKGkuc3RhcnRzV2l0aCh0KSl7bGV0IGU9aS5zbGljZSh0Lmxlbmd0aCsxKS5yZXBsYWNlKC9cLy9nLCIuIik7cmV0dXJuIGUmJihlKz0iOiIpLGUrPXMsZX1yZXR1cm4gc319KGIuYmFzZVBhdGgpKV0pO2Z1bmN0aW9uIHYoLi4uZSl7Yi5kZWJ1ZyYmY29uc29sZS5sb2coIltMb2NhbFZhcmlhYmxlcyBXb3JrZXJdIiwuLi5lKX1hc3luYyBmdW5jdGlvbiB3KGUsbix0LG8pe2NvbnN0IHI9YXdhaXQgZS5wb3N0KCJSdW50aW1lLmdldFByb3BlcnRpZXMiLHtvYmplY3RJZDpuLG93blByb3BlcnRpZXM6ITB9KTtvW3RdPXIucmVzdWx0LmZpbHRlcigoZT0+Imxlbmd0aCIhPT1lLm5hbWUmJiFpc05hTihwYXJzZUludChlLm5hbWUsMTApKSkpLnNvcnQoKChlLG4pPT5wYXJzZUludChlLm5hbWUsMTApLXBhcnNlSW50KG4ubmFtZSwxMCkpKS5tYXAoKGU9PmUudmFsdWU/LnZhbHVlKSl9YXN5bmMgZnVuY3Rpb24geShlLG4sdCxvKXtjb25zdCByPWF3YWl0IGUucG9zdCgiUnVudGltZS5nZXRQcm9wZXJ0aWVzIix7b2JqZWN0SWQ6bixvd25Qcm9wZXJ0aWVzOiEwfSk7b1t0XT1yLnJlc3VsdC5tYXAoKGU9PltlLm5hbWUsZS52YWx1ZT8udmFsdWVdKSkucmVkdWNlKCgoZSxbbix0XSk9PihlW25dPXQsZSkpLHt9KX1mdW5jdGlvbiBoKGUsbil7ZS52YWx1ZSYmKCJ2YWx1ZSJpbiBlLnZhbHVlP3ZvaWQgMD09PWUudmFsdWUudmFsdWV8fG51bGw9PT1lLnZhbHVlLnZhbHVlP25bZS5uYW1lXT1gPCR7ZS52YWx1ZS52YWx1ZX0+YDpuW2UubmFtZV09ZS52YWx1ZS52YWx1ZToiZGVzY3JpcHRpb24iaW4gZS52YWx1ZSYmImZ1bmN0aW9uIiE9PWUudmFsdWUudHlwZT9uW2UubmFtZV09YDwke2UudmFsdWUuZGVzY3JpcHRpb259PmA6InVuZGVmaW5lZCI9PT1lLnZhbHVlLnR5cGUmJihuW2UubmFtZV09Ijx1bmRlZmluZWQ+IikpfWFzeW5jIGZ1bmN0aW9uIFAoZSxuKXtjb25zdCB0PWF3YWl0IGUucG9zdCgiUnVudGltZS5nZXRQcm9wZXJ0aWVzIix7b2JqZWN0SWQ6bixvd25Qcm9wZXJ0aWVzOiEwfSksbz17fTtmb3IoY29uc3QgbiBvZiB0LnJlc3VsdClpZihuPy52YWx1ZT8ub2JqZWN0SWQmJiJBcnJheSI9PT1uPy52YWx1ZS5jbGFzc05hbWUpe2NvbnN0IHQ9bi52YWx1ZS5vYmplY3RJZDthd2FpdCB3KGUsdCxuLm5hbWUsbyl9ZWxzZSBpZihuPy52YWx1ZT8ub2JqZWN0SWQmJiJPYmplY3QiPT09bj8udmFsdWU/LmNsYXNzTmFtZSl7Y29uc3QgdD1uLnZhbHVlLm9iamVjdElkO2F3YWl0IHkoZSx0LG4ubmFtZSxvKX1lbHNlIG4/LnZhbHVlJiZoKG4sbyk7cmV0dXJuIG99bGV0IHg7KGFzeW5jIGZ1bmN0aW9uKCl7Y29uc3Qgbj1uZXcgZTtuLmNvbm5lY3RUb01haW5UaHJlYWQoKSx2KCJDb25uZWN0ZWQgdG8gbWFpbiB0aHJlYWQiKTtsZXQgbz0hMTtuLm9uKCJEZWJ1Z2dlci5yZXN1bWVkIiwoKCk9PntvPSExfSkpLG4ub24oIkRlYnVnZ2VyLnBhdXNlZCIsKGU9PntvPSEwLGFzeW5jIGZ1bmN0aW9uKGUsbix7cmVhc29uOm8sZGF0YTpyLGNhbGxGcmFtZXM6aX0pe2lmKCJleGNlcHRpb24iIT09byYmInByb21pc2VSZWplY3Rpb24iIT09bylyZXR1cm47eD8uKCk7Y29uc3Qgcz1mdW5jdGlvbihlLG4pe2lmKHZvaWQgMCE9PW4pcmV0dXJuIGZ1bmN0aW9uKGUpe2lmKHZvaWQgMCE9PWUpcmV0dXJuIGUuc2xpY2UoLTEwKS5yZWR1Y2UoKChlLG4pPT5gJHtlfSwke24uZnVuY3Rpb259LCR7bi5saW5lbm99LCR7bi5jb2xub31gKSwiIil9KGUobiwxKSl9KG4scj8uZGVzY3JpcHRpb24pO2lmKG51bGw9PXMpcmV0dXJuO2NvbnN0IGM9W107Zm9yKGxldCBuPTA7bjxpLmxlbmd0aDtuKyspe2NvbnN0e3Njb3BlQ2hhaW46dCxmdW5jdGlvbk5hbWU6byx0aGlzOnJ9PWlbbl0scz10LmZpbmQoKGU9PiJsb2NhbCI9PT1lLnR5cGUpKSxhPSJnbG9iYWwiIT09ci5jbGFzc05hbWUmJnIuY2xhc3NOYW1lP2Ake3IuY2xhc3NOYW1lfS4ke299YDpvO2lmKHZvaWQgMD09PXM/Lm9iamVjdC5vYmplY3RJZCljW25dPXtmdW5jdGlvbjphfTtlbHNle2NvbnN0IHQ9YXdhaXQgUChlLHMub2JqZWN0Lm9iamVjdElkKTtjW25dPXtmdW5jdGlvbjphLHZhcnM6dH19fXQ/LnBvc3RNZXNzYWdlKHtleGNlcHRpb25IYXNoOnMsZnJhbWVzOmN9KX0obiwkLGUucGFyYW1zKS50aGVuKCgoKT0+bz9uLnBvc3QoIkRlYnVnZ2VyLnJlc3VtZSIpOlByb21pc2UucmVzb2x2ZSgpKSwoZT0+e30pKX0pKSxhd2FpdCBuLnBvc3QoIkRlYnVnZ2VyLmVuYWJsZSIpO2NvbnN0IHI9ITEhPT1iLmNhcHR1cmVBbGxFeGNlcHRpb25zO2lmKGF3YWl0IG4ucG9zdCgiRGVidWdnZXIuc2V0UGF1c2VPbkV4Y2VwdGlvbnMiLHtzdGF0ZTpyPyJhbGwiOiJ1bmNhdWdodCJ9KSxyKXtjb25zdCBlPWIubWF4RXhjZXB0aW9uc1BlclNlY29uZHx8NTA7eD1mdW5jdGlvbihlLG4sdCl7bGV0IG89MCxyPTUsaT0wO3JldHVybiBzZXRJbnRlcnZhbCgoKCk9PnswPT09aT9vPmUmJihyKj0yLHQocikscj44NjQwMCYmKHI9ODY0MDApLGk9cik6KGktPTEsMD09PWkmJm4oKSksbz0wfSksMWUzKS51bnJlZigpLCgpPT57bys9MX19KGUsKGFzeW5jKCk9Pnt2KCJSYXRlLWxpbWl0IGxpZnRlZC4iKSxhd2FpdCBuLnBvc3QoIkRlYnVnZ2VyLnNldFBhdXNlT25FeGNlcHRpb25zIix7c3RhdGU6ImFsbCJ9KX0pLChhc3luYyBlPT57dihgUmF0ZS1saW1pdCBleGNlZWRlZC4gRGlzYWJsaW5nIGNhcHR1cmluZyBvZiBjYXVnaHQgZXhjZXB0aW9ucyBmb3IgJHtlfSBzZWNvbmRzLmApLGF3YWl0IG4ucG9zdCgiRGVidWdnZXIuc2V0UGF1c2VPbkV4Y2VwdGlvbnMiLHtzdGF0ZToidW5jYXVnaHQifSl9KSl9fSkoKS5jYXRjaCgoZT0+e3YoIkZhaWxlZCB0byBzdGFydCBkZWJ1Z2dlciIsZSl9KSksc2V0SW50ZXJ2YWwoKCgpPT57fSksMWU0KTs=";
function log(...args) {
  logger.log("[LocalVariables]", ...args);
}
const localVariablesAsyncIntegration = defineIntegration((integrationOptions = {}) => {
  const cachedFrames = new LRUMap(20);
  function addLocalVariablesToException(exception) {
    const hash = hashFrames(_optionalChain([exception, "optionalAccess", (_) => _.stacktrace, "optionalAccess", (_2) => _2.frames]));
    if (hash === void 0) {
      return;
    }
    const cachedFrame = cachedFrames.remove(hash);
    if (cachedFrame === void 0) {
      return;
    }
    const frames = (_optionalChain([exception, "access", (_3) => _3.stacktrace, "optionalAccess", (_4) => _4.frames]) || []).filter((frame) => frame.function !== "new Promise");
    for (let i = 0; i < frames.length; i++) {
      const frameIndex = frames.length - i - 1;
      const cachedFrameVariable = cachedFrame[i];
      const frameVariable = frames[frameIndex];
      if (!frameVariable || !cachedFrameVariable) {
        break;
      }
      if (
        // We need to have vars to add
        cachedFrameVariable.vars === void 0 || // We're not interested in frames that are not in_app because the vars are not relevant
        frameVariable.in_app === false || // The function names need to match
        !functionNamesMatch(frameVariable.function, cachedFrameVariable.function)
      ) {
        continue;
      }
      frameVariable.vars = cachedFrameVariable.vars;
    }
  }
  function addLocalVariablesToEvent(event) {
    for (const exception of _optionalChain([event, "access", (_5) => _5.exception, "optionalAccess", (_6) => _6.values]) || []) {
      addLocalVariablesToException(exception);
    }
    return event;
  }
  async function startInspector() {
    const inspector = await import("node:inspector");
    if (!inspector.url()) {
      inspector.open(0);
    }
  }
  function startWorker(options) {
    const worker = new Worker(new URL(`data:application/javascript;base64,${base64WorkerScript}`), {
      workerData: options,
      // We don't want any Node args to be passed to the worker
      execArgv: []
    });
    process.on("exit", () => {
      worker.terminate();
    });
    worker.on("message", ({ exceptionHash, frames }) => {
      cachedFrames.set(exceptionHash, frames);
    });
    worker.once("error", (err) => {
      log("Worker error", err);
    });
    worker.once("exit", (code) => {
      log("Worker exit", code);
    });
    worker.unref();
  }
  return {
    name: "LocalVariablesAsync",
    setup(client) {
      const clientOptions = client.getOptions();
      if (!clientOptions.includeLocalVariables) {
        return;
      }
      const options = {
        ...integrationOptions,
        debug: logger.isEnabled()
      };
      startInspector().then(
        () => {
          try {
            startWorker(options);
          } catch (e) {
            logger.error("Failed to start worker", e);
          }
        },
        (e) => {
          logger.error("Failed to start inspector", e);
        }
      );
    },
    processEvent(event) {
      return addLocalVariablesToEvent(event);
    }
  };
});
function createCallbackList(complete) {
  let callbacks = [];
  let completedCalled = false;
  function checkedComplete(result) {
    callbacks = [];
    if (completedCalled) {
      return;
    }
    completedCalled = true;
    complete(result);
  }
  callbacks.push(checkedComplete);
  function add(fn) {
    callbacks.push(fn);
  }
  function next(result) {
    const popped = callbacks.pop() || checkedComplete;
    try {
      popped(result);
    } catch (_) {
      checkedComplete(result);
    }
  }
  return { add, next };
}
class AsyncSession {
  /** Throws if inspector API is not available */
  constructor(_session) {
    this._session = _session;
  }
  static async create(orDefault) {
    if (orDefault) {
      return orDefault;
    }
    const inspector = await import("node:inspector");
    return new AsyncSession(new inspector.Session());
  }
  /** @inheritdoc */
  configureAndConnect(onPause, captureAll) {
    this._session.connect();
    this._session.on("Debugger.paused", (event) => {
      onPause(event, () => {
        this._session.post("Debugger.resume");
      });
    });
    this._session.post("Debugger.enable");
    this._session.post("Debugger.setPauseOnExceptions", { state: captureAll ? "all" : "uncaught" });
  }
  setPauseOnExceptions(captureAll) {
    this._session.post("Debugger.setPauseOnExceptions", { state: captureAll ? "all" : "uncaught" });
  }
  /** @inheritdoc */
  getLocalVariables(objectId, complete) {
    this._getProperties(objectId, (props) => {
      const { add, next } = createCallbackList(complete);
      for (const prop of props) {
        if (_optionalChain([prop, "optionalAccess", (_2) => _2.value, "optionalAccess", (_3) => _3.objectId]) && _optionalChain([prop, "optionalAccess", (_4) => _4.value, "access", (_5) => _5.className]) === "Array") {
          const id = prop.value.objectId;
          add((vars) => this._unrollArray(id, prop.name, vars, next));
        } else if (_optionalChain([prop, "optionalAccess", (_6) => _6.value, "optionalAccess", (_7) => _7.objectId]) && _optionalChain([prop, "optionalAccess", (_8) => _8.value, "optionalAccess", (_9) => _9.className]) === "Object") {
          const id = prop.value.objectId;
          add((vars) => this._unrollObject(id, prop.name, vars, next));
        } else if (_optionalChain([prop, "optionalAccess", (_10) => _10.value])) {
          add((vars) => this._unrollOther(prop, vars, next));
        }
      }
      next({});
    });
  }
  /**
   * Gets all the PropertyDescriptors of an object
   */
  _getProperties(objectId, next) {
    this._session.post(
      "Runtime.getProperties",
      {
        objectId,
        ownProperties: true
      },
      (err, params) => {
        if (err) {
          next([]);
        } else {
          next(params.result);
        }
      }
    );
  }
  /**
   * Unrolls an array property
   */
  _unrollArray(objectId, name, vars, next) {
    this._getProperties(objectId, (props) => {
      vars[name] = props.filter((v) => v.name !== "length" && !isNaN(parseInt(v.name, 10))).sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10)).map((v) => _optionalChain([v, "optionalAccess", (_11) => _11.value, "optionalAccess", (_12) => _12.value]));
      next(vars);
    });
  }
  /**
   * Unrolls an object property
   */
  _unrollObject(objectId, name, vars, next) {
    this._getProperties(objectId, (props) => {
      vars[name] = props.map((v) => [v.name, _optionalChain([v, "optionalAccess", (_13) => _13.value, "optionalAccess", (_14) => _14.value])]).reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});
      next(vars);
    });
  }
  /**
   * Unrolls other properties
   */
  _unrollOther(prop, vars, next) {
    if (prop.value) {
      if ("value" in prop.value) {
        if (prop.value.value === void 0 || prop.value.value === null) {
          vars[prop.name] = `<${prop.value.value}>`;
        } else {
          vars[prop.name] = prop.value.value;
        }
      } else if ("description" in prop.value && prop.value.type !== "function") {
        vars[prop.name] = `<${prop.value.description}>`;
      } else if (prop.value.type === "undefined") {
        vars[prop.name] = "<undefined>";
      }
    }
    next(vars);
  }
}
const INTEGRATION_NAME$1 = "LocalVariables";
const _localVariablesSyncIntegration = (options = {}, sessionOverride) => {
  const cachedFrames = new LRUMap(20);
  let rateLimiter;
  let shouldProcessEvent = false;
  function addLocalVariablesToException(exception) {
    const hash = hashFrames(_optionalChain([exception, "optionalAccess", (_15) => _15.stacktrace, "optionalAccess", (_16) => _16.frames]));
    if (hash === void 0) {
      return;
    }
    const cachedFrame = cachedFrames.remove(hash);
    if (cachedFrame === void 0) {
      return;
    }
    const frames = (_optionalChain([exception, "access", (_17) => _17.stacktrace, "optionalAccess", (_18) => _18.frames]) || []).filter((frame) => frame.function !== "new Promise");
    for (let i = 0; i < frames.length; i++) {
      const frameIndex = frames.length - i - 1;
      const cachedFrameVariable = cachedFrame[i];
      const frameVariable = frames[frameIndex];
      if (!frameVariable || !cachedFrameVariable) {
        break;
      }
      if (
        // We need to have vars to add
        cachedFrameVariable.vars === void 0 || // We're not interested in frames that are not in_app because the vars are not relevant
        frameVariable.in_app === false || // The function names need to match
        !functionNamesMatch(frameVariable.function, cachedFrameVariable.function)
      ) {
        continue;
      }
      frameVariable.vars = cachedFrameVariable.vars;
    }
  }
  function addLocalVariablesToEvent(event) {
    for (const exception of _optionalChain([event, "optionalAccess", (_19) => _19.exception, "optionalAccess", (_20) => _20.values]) || []) {
      addLocalVariablesToException(exception);
    }
    return event;
  }
  return {
    name: INTEGRATION_NAME$1,
    setupOnce() {
      const client = getClient();
      const clientOptions = _optionalChain([client, "optionalAccess", (_21) => _21.getOptions, "call", (_22) => _22()]);
      if (!_optionalChain([clientOptions, "optionalAccess", (_23) => _23.includeLocalVariables])) {
        return;
      }
      const unsupportedNodeVersion = NODE_MAJOR < 18;
      if (unsupportedNodeVersion) {
        logger.log("The `LocalVariables` integration is only supported on Node >= v18.");
        return;
      }
      AsyncSession.create(sessionOverride).then(
        (session2) => {
          function handlePaused(stackParser, { params: { reason, data, callFrames } }, complete) {
            if (reason !== "exception" && reason !== "promiseRejection") {
              complete();
              return;
            }
            _optionalChain([rateLimiter, "optionalCall", (_24) => _24()]);
            const exceptionHash = hashFromStack(stackParser, _optionalChain([data, "optionalAccess", (_25) => _25.description]));
            if (exceptionHash == void 0) {
              complete();
              return;
            }
            const { add, next } = createCallbackList((frames) => {
              cachedFrames.set(exceptionHash, frames);
              complete();
            });
            for (let i = 0; i < Math.min(callFrames.length, 5); i++) {
              const { scopeChain, functionName, this: obj } = callFrames[i];
              const localScope = scopeChain.find((scope) => scope.type === "local");
              const fn = obj.className === "global" || !obj.className ? functionName : `${obj.className}.${functionName}`;
              if (_optionalChain([localScope, "optionalAccess", (_26) => _26.object, "access", (_27) => _27.objectId]) === void 0) {
                add((frames) => {
                  frames[i] = { function: fn };
                  next(frames);
                });
              } else {
                const id = localScope.object.objectId;
                add(
                  (frames) => _optionalChain([session2, "optionalAccess", (_28) => _28.getLocalVariables, "call", (_29) => _29(id, (vars) => {
                    frames[i] = { function: fn, vars };
                    next(frames);
                  })])
                );
              }
            }
            next([]);
          }
          const captureAll = options.captureAllExceptions !== false;
          session2.configureAndConnect(
            (ev, complete) => handlePaused(clientOptions.stackParser, ev, complete),
            captureAll
          );
          if (captureAll) {
            const max = options.maxExceptionsPerSecond || 50;
            rateLimiter = createRateLimiter(
              max,
              () => {
                logger.log("Local variables rate-limit lifted.");
                _optionalChain([session2, "optionalAccess", (_30) => _30.setPauseOnExceptions, "call", (_31) => _31(true)]);
              },
              (seconds) => {
                logger.log(
                  `Local variables rate-limit exceeded. Disabling capturing of caught exceptions for ${seconds} seconds.`
                );
                _optionalChain([session2, "optionalAccess", (_32) => _32.setPauseOnExceptions, "call", (_33) => _33(false)]);
              }
            );
          }
          shouldProcessEvent = true;
        },
        (error) => {
          logger.log("The `LocalVariables` integration failed to start.", error);
        }
      );
    },
    processEvent(event) {
      if (shouldProcessEvent) {
        return addLocalVariablesToEvent(event);
      }
      return event;
    },
    // These are entirely for testing
    _getCachedFramesCount() {
      return cachedFrames.size;
    },
    _getFirstCachedFrame() {
      return cachedFrames.values()[0];
    }
  };
};
const localVariablesSyncIntegration = defineIntegration(_localVariablesSyncIntegration);
const localVariablesIntegration = (options = {}) => {
  return NODE_VERSION.major < 19 ? localVariablesSyncIntegration(options) : localVariablesAsyncIntegration(options);
};
const DEFAULT_SHUTDOWN_TIMEOUT = 2e3;
function logAndExitProcess(error) {
  consoleSandbox(() => {
    console.error(error);
  });
  const client = getClient();
  if (client === void 0) {
    DEBUG_BUILD && logger.warn("No NodeClient was defined, we are exiting the process now.");
    global.process.exit(1);
    return;
  }
  const options = client.getOptions();
  const timeout = options && options.shutdownTimeout && options.shutdownTimeout > 0 && options.shutdownTimeout || DEFAULT_SHUTDOWN_TIMEOUT;
  client.close(timeout).then(
    (result) => {
      if (!result) {
        DEBUG_BUILD && logger.warn("We reached the timeout for emptying the request buffer, still exiting now!");
      }
      global.process.exit(1);
    },
    (error2) => {
      DEBUG_BUILD && logger.error(error2);
    }
  );
}
const INTEGRATION_NAME = "OnUnhandledRejection";
const _onUnhandledRejectionIntegration = (options = {}) => {
  const mode = options.mode || "warn";
  return {
    name: INTEGRATION_NAME,
    setup(client) {
      global.process.on("unhandledRejection", makeUnhandledPromiseHandler(client, { mode }));
    }
  };
};
const onUnhandledRejectionIntegration = defineIntegration(_onUnhandledRejectionIntegration);
function makeUnhandledPromiseHandler(client, options) {
  return function sendUnhandledPromise(reason, promise) {
    if (getClient() !== client) {
      return;
    }
    captureException(reason, {
      originalException: promise,
      captureContext: {
        extra: { unhandledPromiseRejection: true }
      },
      mechanism: {
        handled: false,
        type: "onunhandledrejection"
      }
    });
    handleRejection(reason, options);
  };
}
function handleRejection(reason, options) {
  const rejectionWarning = "This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:";
  if (options.mode === "warn") {
    consoleSandbox(() => {
      console.warn(rejectionWarning);
      console.error(reason && reason.stack ? reason.stack : reason);
    });
  } else if (options.mode === "strict") {
    consoleSandbox(() => {
      console.warn(rejectionWarning);
    });
    logAndExitProcess(reason);
  }
}
var src = {};
var AsyncHooksContextManager$1 = {};
var AbstractAsyncHooksContextManager$1 = {};
Object.defineProperty(AbstractAsyncHooksContextManager$1, "__esModule", { value: true });
AbstractAsyncHooksContextManager$1.AbstractAsyncHooksContextManager = void 0;
const events_1 = require$$7;
const ADD_LISTENER_METHODS = [
  "addListener",
  "on",
  "once",
  "prependListener",
  "prependOnceListener"
];
class AbstractAsyncHooksContextManager {
  constructor() {
    this._kOtListeners = Symbol("OtListeners");
    this._wrapped = false;
  }
  /**
   * Binds a the certain context or the active one to the target function and then returns the target
   * @param context A context (span) to be bind to target
   * @param target a function or event emitter. When target or one of its callbacks is called,
   *  the provided context will be used as the active context for the duration of the call.
   */
  bind(context2, target) {
    if (target instanceof events_1.EventEmitter) {
      return this._bindEventEmitter(context2, target);
    }
    if (typeof target === "function") {
      return this._bindFunction(context2, target);
    }
    return target;
  }
  _bindFunction(context2, target) {
    const manager = this;
    const contextWrapper = function(...args) {
      return manager.with(context2, () => target.apply(this, args));
    };
    Object.defineProperty(contextWrapper, "length", {
      enumerable: false,
      configurable: true,
      writable: false,
      value: target.length
    });
    return contextWrapper;
  }
  /**
   * By default, EventEmitter call their callback with their context, which we do
   * not want, instead we will bind a specific context to all callbacks that
   * go through it.
   * @param context the context we want to bind
   * @param ee EventEmitter an instance of EventEmitter to patch
   */
  _bindEventEmitter(context2, ee) {
    const map = this._getPatchMap(ee);
    if (map !== void 0)
      return ee;
    this._createPatchMap(ee);
    ADD_LISTENER_METHODS.forEach((methodName) => {
      if (ee[methodName] === void 0)
        return;
      ee[methodName] = this._patchAddListener(ee, ee[methodName], context2);
    });
    if (typeof ee.removeListener === "function") {
      ee.removeListener = this._patchRemoveListener(ee, ee.removeListener);
    }
    if (typeof ee.off === "function") {
      ee.off = this._patchRemoveListener(ee, ee.off);
    }
    if (typeof ee.removeAllListeners === "function") {
      ee.removeAllListeners = this._patchRemoveAllListeners(ee, ee.removeAllListeners);
    }
    return ee;
  }
  /**
   * Patch methods that remove a given listener so that we match the "patched"
   * version of that listener (the one that propagate context).
   * @param ee EventEmitter instance
   * @param original reference to the patched method
   */
  _patchRemoveListener(ee, original) {
    const contextManager = this;
    return function(event, listener) {
      var _a2;
      const events = (_a2 = contextManager._getPatchMap(ee)) === null || _a2 === void 0 ? void 0 : _a2[event];
      if (events === void 0) {
        return original.call(this, event, listener);
      }
      const patchedListener = events.get(listener);
      return original.call(this, event, patchedListener || listener);
    };
  }
  /**
   * Patch methods that remove all listeners so we remove our
   * internal references for a given event.
   * @param ee EventEmitter instance
   * @param original reference to the patched method
   */
  _patchRemoveAllListeners(ee, original) {
    const contextManager = this;
    return function(event) {
      const map = contextManager._getPatchMap(ee);
      if (map !== void 0) {
        if (arguments.length === 0) {
          contextManager._createPatchMap(ee);
        } else if (map[event] !== void 0) {
          delete map[event];
        }
      }
      return original.apply(this, arguments);
    };
  }
  /**
   * Patch methods on an event emitter instance that can add listeners so we
   * can force them to propagate a given context.
   * @param ee EventEmitter instance
   * @param original reference to the patched method
   * @param [context] context to propagate when calling listeners
   */
  _patchAddListener(ee, original, context2) {
    const contextManager = this;
    return function(event, listener) {
      if (contextManager._wrapped) {
        return original.call(this, event, listener);
      }
      let map = contextManager._getPatchMap(ee);
      if (map === void 0) {
        map = contextManager._createPatchMap(ee);
      }
      let listeners = map[event];
      if (listeners === void 0) {
        listeners = /* @__PURE__ */ new WeakMap();
        map[event] = listeners;
      }
      const patchedListener = contextManager.bind(context2, listener);
      listeners.set(listener, patchedListener);
      contextManager._wrapped = true;
      try {
        return original.call(this, event, patchedListener);
      } finally {
        contextManager._wrapped = false;
      }
    };
  }
  _createPatchMap(ee) {
    const map = /* @__PURE__ */ Object.create(null);
    ee[this._kOtListeners] = map;
    return map;
  }
  _getPatchMap(ee) {
    return ee[this._kOtListeners];
  }
}
AbstractAsyncHooksContextManager$1.AbstractAsyncHooksContextManager = AbstractAsyncHooksContextManager;
Object.defineProperty(AsyncHooksContextManager$1, "__esModule", { value: true });
AsyncHooksContextManager$1.AsyncHooksContextManager = void 0;
const api_1$1 = require$$2;
const asyncHooks = require$$1;
const AbstractAsyncHooksContextManager_1$1 = AbstractAsyncHooksContextManager$1;
class AsyncHooksContextManager extends AbstractAsyncHooksContextManager_1$1.AbstractAsyncHooksContextManager {
  constructor() {
    super();
    this._contexts = /* @__PURE__ */ new Map();
    this._stack = [];
    this._asyncHook = asyncHooks.createHook({
      init: this._init.bind(this),
      before: this._before.bind(this),
      after: this._after.bind(this),
      destroy: this._destroy.bind(this),
      promiseResolve: this._destroy.bind(this)
    });
  }
  active() {
    var _a2;
    return (_a2 = this._stack[this._stack.length - 1]) !== null && _a2 !== void 0 ? _a2 : api_1$1.ROOT_CONTEXT;
  }
  with(context2, fn, thisArg, ...args) {
    this._enterContext(context2);
    try {
      return fn.call(thisArg, ...args);
    } finally {
      this._exitContext();
    }
  }
  enable() {
    this._asyncHook.enable();
    return this;
  }
  disable() {
    this._asyncHook.disable();
    this._contexts.clear();
    this._stack = [];
    return this;
  }
  /**
   * Init hook will be called when userland create a async context, setting the
   * context as the current one if it exist.
   * @param uid id of the async context
   * @param type the resource type
   */
  _init(uid, type) {
    if (type === "TIMERWRAP")
      return;
    const context2 = this._stack[this._stack.length - 1];
    if (context2 !== void 0) {
      this._contexts.set(uid, context2);
    }
  }
  /**
   * Destroy hook will be called when a given context is no longer used so we can
   * remove its attached context.
   * @param uid uid of the async context
   */
  _destroy(uid) {
    this._contexts.delete(uid);
  }
  /**
   * Before hook is called just before executing a async context.
   * @param uid uid of the async context
   */
  _before(uid) {
    const context2 = this._contexts.get(uid);
    if (context2 !== void 0) {
      this._enterContext(context2);
    }
  }
  /**
   * After hook is called just after completing the execution of a async context.
   */
  _after() {
    this._exitContext();
  }
  /**
   * Set the given context as active
   */
  _enterContext(context2) {
    this._stack.push(context2);
  }
  /**
   * Remove the context at the root of the stack
   */
  _exitContext() {
    this._stack.pop();
  }
}
AsyncHooksContextManager$1.AsyncHooksContextManager = AsyncHooksContextManager;
var AsyncLocalStorageContextManager$1 = {};
Object.defineProperty(AsyncLocalStorageContextManager$1, "__esModule", { value: true });
AsyncLocalStorageContextManager$1.AsyncLocalStorageContextManager = void 0;
const api_1 = require$$2;
const async_hooks_1 = require$$1;
const AbstractAsyncHooksContextManager_1 = AbstractAsyncHooksContextManager$1;
class AsyncLocalStorageContextManager extends AbstractAsyncHooksContextManager_1.AbstractAsyncHooksContextManager {
  constructor() {
    super();
    this._asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
  }
  active() {
    var _a2;
    return (_a2 = this._asyncLocalStorage.getStore()) !== null && _a2 !== void 0 ? _a2 : api_1.ROOT_CONTEXT;
  }
  with(context2, fn, thisArg, ...args) {
    const cb = thisArg == null ? fn : fn.bind(thisArg);
    return this._asyncLocalStorage.run(context2, cb, ...args);
  }
  enable() {
    return this;
  }
  disable() {
    this._asyncLocalStorage.disable();
    return this;
  }
}
AsyncLocalStorageContextManager$1.AsyncLocalStorageContextManager = AsyncLocalStorageContextManager;
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsyncLocalStorageContextManager = exports.AsyncHooksContextManager = void 0;
  var AsyncHooksContextManager_1 = AsyncHooksContextManager$1;
  Object.defineProperty(exports, "AsyncHooksContextManager", { enumerable: true, get: function() {
    return AsyncHooksContextManager_1.AsyncHooksContextManager;
  } });
  var AsyncLocalStorageContextManager_1 = AsyncLocalStorageContextManager$1;
  Object.defineProperty(exports, "AsyncLocalStorageContextManager", { enumerable: true, get: function() {
    return AsyncLocalStorageContextManager_1.AsyncLocalStorageContextManager;
  } });
})(src);
const SentryContextManager = wrapContextManagerClass(src.AsyncLocalStorageContextManager);
function normalizeWindowsPath(path) {
  return path.replace(/^[A-Z]:/, "").replace(/\\/g, "/");
}
function createGetModuleFromFilename(basePath = process.argv[1] ? dirname(process.argv[1]) : process.cwd(), isWindows = sep === "\\") {
  const normalizedBase = isWindows ? normalizeWindowsPath(basePath) : basePath;
  return (filename) => {
    if (!filename) {
      return;
    }
    const normalizedFilename = isWindows ? normalizeWindowsPath(filename) : filename;
    let { dir, base: file, ext } = posix.parse(normalizedFilename);
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
      file = file.slice(0, ext.length * -1);
    }
    if (!dir) {
      dir = ".";
    }
    const n = dir.lastIndexOf("/node_modules");
    if (n > -1) {
      return `${dir.slice(n + 14).replace(/\//g, ".")}:${file}`;
    }
    if (dir.startsWith(normalizedBase)) {
      let moduleName = dir.slice(normalizedBase.length + 1).replace(/\//g, ".");
      if (moduleName) {
        moduleName += ":";
      }
      moduleName += file;
      return moduleName;
    }
    return file;
  };
}
const DEFAULT_CLIENT_REPORT_FLUSH_INTERVAL_MS = 6e4;
class NodeClient extends ServerRuntimeClient {
  constructor(options) {
    const clientOptions = {
      ...options,
      platform: "node",
      runtime: { name: "node", version: global.process.version },
      serverName: options.serverName || global.process.env.SENTRY_NAME || os.hostname()
    };
    applySdkMetadata(clientOptions, "node");
    logger.log(
      `Initializing Sentry: process: ${process.pid}, thread: ${isMainThread ? "main" : `worker-${threadId}`}.`
    );
    super(clientOptions);
  }
  /** Get the OTEL tracer. */
  get tracer() {
    if (this._tracer) {
      return this._tracer;
    }
    const name = "@sentry/node";
    const version2 = SDK_VERSION$1;
    const tracer = trace.getTracer(name, version2);
    this._tracer = tracer;
    return tracer;
  }
  // Eslint ignore explanation: This is already documented in super.
  // eslint-disable-next-line jsdoc/require-jsdoc
  async flush(timeout) {
    const provider = this.traceProvider;
    const spanProcessor = _optionalChain([provider, "optionalAccess", (_) => _.activeSpanProcessor]);
    if (spanProcessor) {
      await spanProcessor.forceFlush();
    }
    if (this.getOptions().sendClientReports) {
      this._flushOutcomes();
    }
    return super.flush(timeout);
  }
  // Eslint ignore explanation: This is already documented in super.
  // eslint-disable-next-line jsdoc/require-jsdoc
  close(timeout) {
    if (this._clientReportInterval) {
      clearInterval(this._clientReportInterval);
    }
    if (this._clientReportOnExitFlushListener) {
      process.off("beforeExit", this._clientReportOnExitFlushListener);
    }
    return super.close(timeout);
  }
  /**
   * Will start tracking client reports for this client.
   *
   * NOTICE: This method will create an interval that is periodically called and attach a `process.on('beforeExit')`
   * hook. To clean up these resources, call `.close()` when you no longer intend to use the client. Not doing so will
   * result in a memory leak.
   */
  // The reason client reports need to be manually activated with this method instead of just enabling them in a
  // constructor, is that if users periodically and unboundedly create new clients, we will create more and more
  // intervals and beforeExit listeners, thus leaking memory. In these situations, users are required to call
  // `client.close()` in order to dispose of the acquired resources.
  // We assume that calling this method in Sentry.init() is a sensible default, because calling Sentry.init() over and
  // over again would also result in memory leaks.
  // Note: We have experimented with using `FinalizationRegisty` to clear the interval when the client is garbage
  // collected, but it did not work, because the cleanup function never got called.
  startClientReportTracking() {
    const clientOptions = this.getOptions();
    if (clientOptions.sendClientReports) {
      this._clientReportOnExitFlushListener = () => {
        this._flushOutcomes();
      };
      this._clientReportInterval = setInterval(
        () => {
          DEBUG_BUILD && logger.log("Flushing client reports based on interval.");
          this._flushOutcomes();
        },
        _nullishCoalesce(clientOptions.clientReportFlushInterval, () => DEFAULT_CLIENT_REPORT_FLUSH_INTERVAL_MS)
      ).unref();
      process.on("beforeExit", this._clientReportOnExitFlushListener);
    }
  }
}
function initOpenTelemetry(client) {
  if (client.getOptions().debug) {
    setupOpenTelemetryLogger();
  }
  const provider = setupOtel(client);
  client.traceProvider = provider;
}
function setupOtel(client) {
  const provider = new BasicTracerProvider({
    sampler: new SentrySampler(client),
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: "node",
      [SEMRESATTRS_SERVICE_NAMESPACE]: "sentry",
      [SEMRESATTRS_SERVICE_VERSION]: SDK_VERSION$1
    }),
    forceFlushTimeoutMillis: 500
  });
  provider.addSpanProcessor(
    new SentrySpanProcessor({
      timeout: client.getOptions().maxSpanWaitDuration
    })
  );
  provider.register({
    propagator: new SentryPropagator(),
    contextManager: new SentryContextManager()
  });
  return provider;
}
function setupOpenTelemetryLogger() {
  const otelLogger = new Proxy(logger, {
    get(target, prop, receiver) {
      const actualProp = prop === "verbose" ? "debug" : prop;
      return Reflect.get(target, actualProp, receiver);
    }
  });
  diag.disable();
  diag.setLogger(otelLogger, DiagLogLevel.DEBUG);
}
let RENDERERS;
function trackRendererProperties() {
  if (RENDERERS) {
    return;
  }
  const renderers = RENDERERS = /* @__PURE__ */ new Map();
  function updateUrl(id, url) {
    const state = renderers.get(id) || { id };
    state.url = normalizeUrlToBase(url, app.getAppPath());
    renderers.set(id, state);
  }
  function updateTitle(id, title) {
    const state = renderers.get(id) || { id };
    state.title = title;
    renderers.set(id, state);
  }
  app.on("web-contents-created", (_, contents) => {
    const id = contents.id;
    contents.on("did-navigate", (_2, url) => updateUrl(id, url));
    contents.on("did-navigate-in-page", (_2, url) => updateUrl(id, url));
    contents.on("page-title-updated", (_2, title) => updateTitle(id, title));
    contents.on("destroyed", () => {
      setTimeout(() => {
        renderers.delete(id);
      }, 5e3);
    });
  });
}
function getRendererProperties(id) {
  return RENDERERS?.get(id);
}
const DEFAULT_OPTIONS$2 = {
  // We exclude events starting with remote as they can be quite verbose
  app: (name) => !name.startsWith("remote-"),
  autoUpdater: () => true,
  webContents: (name) => ["dom-ready", "context-menu", "load-url", "destroyed"].includes(name),
  browserWindow: (name) => [
    "closed",
    "close",
    "unresponsive",
    "responsive",
    "show",
    "blur",
    "focus",
    "hide",
    "maximize",
    "minimize",
    "restore",
    "enter-full-screen",
    "leave-full-screen"
  ].includes(name),
  screen: () => true,
  powerMonitor: () => true,
  captureWindowTitles: false
};
function normalizeOptions(options) {
  return Object.keys(options).reduce((obj, k) => {
    if (k === "captureWindowTitles") {
      obj[k] = !!options[k];
    } else {
      const val = options[k];
      if (Array.isArray(val)) {
        obj[k] = (name) => val.includes(name);
      } else if (typeof val === "function" || val === false) {
        obj[k] = val;
      }
    }
    return obj;
  }, {});
}
const electronBreadcrumbsIntegration = defineIntegration((userOptions = {}) => {
  const options = {
    ...DEFAULT_OPTIONS$2,
    ...normalizeOptions(userOptions)
  };
  function patchEventEmitter(emitter, category, shouldCapture, id) {
    const emit = emitter.emit.bind(emitter);
    emitter.emit = (event, ...args) => {
      if (shouldCapture && shouldCapture(event)) {
        const breadcrumb = {
          category: "electron",
          message: `${category}.${event}`,
          timestamp: (/* @__PURE__ */ new Date()).getTime() / 1e3,
          type: "ui"
        };
        if (id) {
          breadcrumb.data = { ...getRendererProperties(id) };
          if (!options.captureWindowTitles && breadcrumb.data?.title) {
            delete breadcrumb.data?.title;
          }
        }
        addBreadcrumb(breadcrumb);
      }
      return emit(event, ...args);
    };
  }
  return {
    name: "ElectronBreadcrumbs",
    setup(client) {
      const clientOptions = client.getOptions();
      trackRendererProperties();
      app.whenReady().then(() => {
        if (options.screen) {
          patchEventEmitter(screen, "screen", options.screen);
        }
        if (options.powerMonitor) {
          patchEventEmitter(powerMonitor, "powerMonitor", options.powerMonitor);
        }
      }, () => {
      });
      if (options.app) {
        patchEventEmitter(app, "app", options.app);
      }
      if (options.autoUpdater) {
        patchEventEmitter(autoUpdater, "autoUpdater", options.autoUpdater);
      }
      if (options.browserWindow) {
        app.on("browser-window-created", (_, window2) => {
          const id = window2.webContents.id;
          const windowName = clientOptions?.getRendererName?.(window2.webContents) || "window";
          patchEventEmitter(window2, windowName, options.browserWindow, id);
        });
      }
      if (options.webContents) {
        app.on("web-contents-created", (_, contents) => {
          const id = contents.id;
          const webContentsName = clientOptions?.getRendererName?.(contents) || "renderer";
          patchEventEmitter(contents, webContentsName, options.webContents, id);
        });
      }
    }
  };
});
const onUncaughtExceptionIntegration = defineIntegration(() => {
  return {
    name: "OnUncaughtException",
    setup(client) {
      const options = client.getOptions();
      global.process.on("uncaughtException", (error) => {
        captureException(error, {
          originalException: error,
          captureContext: {
            level: "fatal"
          },
          data: {
            mechanism: {
              handled: false,
              type: "generic"
            }
          }
        });
        client.flush(options.shutdownTimeout || 2e3).then(() => {
          if (options?.onFatalError) {
            options.onFatalError(error);
          } else if (global.process.listenerCount("uncaughtException") <= 2) {
            console.error("Uncaught Exception:");
            console.error(error);
            const ref = error.stack;
            const stack = ref !== void 0 ? ref : `${error.name}: ${error.message}`;
            const message = `Uncaught Exception:
${stack}`;
            dialog.showErrorBox("A JavaScript error occurred in the main process", message);
          }
        }, () => {
        });
      });
    }
  };
});
function getScopeData() {
  const scope = getIsolationScope().getScopeData();
  mergeScopeData(scope, getCurrentScope().getScopeData());
  scope.eventProcessors = [];
  return scope;
}
function addScopeListener(callback) {
  getIsolationScope().addScopeListener((isolation) => {
    const merged = getScopeData();
    callback(merged, isolation);
  });
  getCurrentScope().addScopeListener((current) => {
    const merged = getScopeData();
    callback(merged, current);
  });
}
const SDK_VERSION = "5.4.0";
const SDK_NAME = "sentry.javascript.electron";
function getSdkInfo() {
  return {
    name: SDK_NAME,
    packages: [
      {
        name: "npm:@sentry/electron",
        version: SDK_VERSION
      }
    ],
    version: SDK_VERSION
  };
}
function getDefaultReleaseName() {
  const app_name = app.name || app.getName();
  return `${app_name.replace(/\W/g, "-")}@${app.getVersion()}`;
}
function getDefaultEnvironment() {
  return app.isPackaged ? "production" : "development";
}
async function getEventDefaults(client) {
  let event = { message: "test" };
  const eventHint = {};
  for (const processor of client.getEventProcessors()) {
    if (event === null)
      break;
    event = await processor(event, eventHint);
  }
  delete event?.message;
  return event || {};
}
var IPCMode;
(function(IPCMode2) {
  IPCMode2[IPCMode2["Classic"] = 1] = "Classic";
  IPCMode2[IPCMode2["Protocol"] = 2] = "Protocol";
  IPCMode2[IPCMode2["Both"] = 3] = "Both";
})(IPCMode || (IPCMode = {}));
const PROTOCOL_SCHEME = "sentry-ipc";
var IPCChannel;
(function(IPCChannel2) {
  IPCChannel2["RENDERER_START"] = "sentry-electron.renderer-start";
  IPCChannel2["EVENT"] = "sentry-electron.event";
  IPCChannel2["SCOPE"] = "sentry-electron.scope";
  IPCChannel2["ENVELOPE"] = "sentry-electron.envelope";
  IPCChannel2["STATUS"] = "sentry-electron.status";
  IPCChannel2["ADD_METRIC"] = "sentry-electron.add-metric";
})(IPCChannel || (IPCChannel = {}));
const RENDERER_ID_HEADER = "sentry-electron-renderer-id";
const parsed = parseSemver(process.versions.electron);
const version = { major: parsed.major || 0, minor: parsed.minor || 0, patch: parsed.patch || 0 };
const EXIT_REASONS = [
  "clean-exit",
  "abnormal-exit",
  "killed",
  "crashed",
  "oom",
  "launch-failed",
  "integrity-failure"
];
function getSentryCachePath() {
  return join(app.getPath("userData"), "sentry");
}
function crashpadLinux() {
  if (version.major >= 16) {
    return true;
  }
  return app.commandLine.hasSwitch("enable-crashpad");
}
function usesCrashpad() {
  return process.platform !== "linux" || crashpadLinux();
}
function supportsProtocolHandle() {
  return version.major >= 25;
}
function registerProtocol(protocol2, scheme, callback) {
  if (supportsProtocolHandle()) {
    protocol2.handle(scheme, async (request) => {
      callback({
        windowId: request.headers.get(RENDERER_ID_HEADER) || void 0,
        url: request.url,
        body: Buffer.from(await request.arrayBuffer())
      });
      return new Response("");
    });
  } else {
    protocol2.registerStringProtocol(scheme, (request, complete) => {
      callback({
        windowId: request.headers[RENDERER_ID_HEADER],
        url: request.url,
        body: request.uploadData?.[0]?.bytes
      });
      complete("");
    });
  }
}
class Mutex {
  constructor() {
    this._entries = [];
    this._waiters = [];
    this._value = 1;
  }
  /** Run a task when all pending tasks are complete */
  async runExclusive(task) {
    const release = await this._acquire();
    try {
      return await task();
    } finally {
      release();
    }
  }
  /** Gets a promise that resolves when all pending tasks are complete */
  _acquire() {
    return new Promise((resolve2, reject) => {
      this._entries.push({ resolve: resolve2, reject });
      this._dispatch();
    });
  }
  /** Releases after a task is complete */
  _release() {
    this._value += 1;
    this._dispatch();
  }
  /** Dispatches pending tasks */
  _dispatch() {
    for (let weight = this._value; weight > 0; weight--) {
      const queueEntry = this._entries?.shift();
      if (!queueEntry)
        continue;
      this._value -= weight;
      weight = this._value + 1;
      queueEntry.resolve(this._newReleaser());
    }
    this._drainUnlockWaiters();
  }
  /** Creates a new releaser */
  _newReleaser() {
    let called = false;
    return () => {
      if (called)
        return;
      called = true;
      this._release();
    };
  }
  /** Drain unlock waiters */
  _drainUnlockWaiters() {
    for (let weight = this._value; weight > 0; weight--) {
      if (!this._waiters[weight - 1])
        continue;
      this._waiters.forEach((waiter) => waiter());
      this._waiters = [];
    }
  }
}
const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.*\d{0,10}Z$/;
function dateReviver(_, value) {
  if (typeof value === "string" && dateFormat.test(value)) {
    return new Date(value);
  }
  return value;
}
class Store {
  /**
   * Creates a new store.
   *
   * @param path A unique filename to store this data.
   * @param id A unique filename to store this data.
   * @param initial An initial value to initialize data with.
   */
  constructor(path, id, initial) {
    this._lock = new Mutex();
    this._path = join(path, `${id}.json`);
    this._initial = initial;
  }
  /**
   * Updates data by replacing it with the given value.
   * @param data New data to replace the previous one.
   */
  async set(data) {
    await this._lock.runExclusive(async () => {
      this._data = data;
      try {
        if (data === void 0) {
          try {
            await promises.unlink(this._path);
          } catch (_) {
          }
        } else {
          await promises.mkdir(dirname$1(this._path), { recursive: true });
          await promises.writeFile(this._path, JSON.stringify(data));
        }
      } catch (e) {
        logger.warn("Failed to write to store", e);
      }
    });
  }
  /**
   * Returns the current data.
   *
   * When invoked for the first time, it will try to load previously stored data
   * from disk. If the file does not exist, the initial value provided to the
   * constructor is used.
   */
  async get() {
    return this._lock.runExclusive(async () => {
      if (this._data === void 0) {
        try {
          this._data = JSON.parse(await promises.readFile(this._path, "utf8"), dateReviver);
        } catch (e) {
          this._data = this._initial;
        }
      }
      return this._data;
    });
  }
  /**
   * Updates data by passing it through the given function.
   * @param fn A function receiving the current data and returning new one.
   */
  async update(fn) {
    await this.set(fn(await this.get()));
  }
  /** Returns store to its initial state */
  async clear() {
    await this.set(this._initial);
  }
  /** Gets the Date that the file was last modified */
  async getModifiedDate() {
    try {
      return (await promises.stat(this._path))?.mtime;
    } catch (_) {
      return void 0;
    }
  }
}
class BufferedWriteStore extends Store {
  /**
   * Creates a new ThrottledStore.
   *
   * @param path A unique filename to store this data.
   * @param id A unique filename to store this data.
   * @param initial An initial value to initialize data with.
   * @param throttleTime The minimum time between writes
   */
  constructor(path, id, initial, _throttleTime = 500) {
    super(path, id, initial);
    this._throttleTime = _throttleTime;
  }
  /** @inheritdoc */
  async set(data) {
    this._data = data;
    this._pendingWrite = {
      // We overwrite the data for the pending write so that the latest data is written in the next flush
      data,
      // If there is already a pending timeout, we keep that rather than starting the timeout again
      timeout: this._pendingWrite?.timeout || setTimeout(() => this._writePending(), this._throttleTime)
    };
  }
  /** Writes the pending write to disk */
  _writePending() {
    if (this._pendingWrite) {
      const data = this._pendingWrite.data;
      this._pendingWrite = void 0;
      super.set(data).catch(() => {
      });
    }
  }
}
const PERSIST_INTERVAL_MS = 6e4;
let sessionStore;
let previousSession;
function getSessionStore() {
  if (!sessionStore) {
    sessionStore = new Store(getSentryCachePath(), "session", void 0);
    previousSession = sessionStore.get();
  }
  return sessionStore;
}
let persistTimer;
function startSession(sendOnCreate) {
  const session2 = startSession$1();
  if (sendOnCreate) {
    captureSession();
  }
  getSessionStore().set(session2).catch(() => {
  });
  persistTimer = setInterval(async () => {
    const currentSession = getCurrentScope().getSession();
    if (currentSession && currentSession.status === "ok") {
      await getSessionStore().set(currentSession);
    }
  }, PERSIST_INTERVAL_MS);
}
async function endSession() {
  if (persistTimer) {
    clearInterval(persistTimer);
  }
  const session2 = getCurrentScope().getSession();
  if (session2) {
    if (session2.status === "ok") {
      logger.log("Ending session");
      endSession$1();
    } else {
      logger.log("Session was already ended");
    }
  } else {
    logger.log("No session");
  }
  await getSessionStore().clear();
  await flush(2e3);
}
async function checkPreviousSession(crashed) {
  const client = getClient();
  const previous = await previousSession;
  if (previous && client) {
    if (previous.status !== "ok") {
      previousSession = void 0;
      return;
    }
    const status = crashed ? "crashed" : "abnormal";
    logger.log(`Found previous ${status} session`);
    const sesh = makeSession(previous);
    updateSession(sesh, {
      status,
      errors: (sesh.errors || 0) + 1,
      release: previous.attrs?.release,
      environment: previous.attrs?.environment
    });
    await client.sendSession(sesh);
    previousSession = void 0;
  }
}
function sessionCrashed() {
  if (persistTimer) {
    clearInterval(persistTimer);
  }
  logger.log("Session Crashed");
  const session2 = getCurrentScope().getSession();
  if (!session2) {
    logger.log("No session to update");
    return;
  }
  if (session2.status === "ok") {
    logger.log("Setting session as crashed");
    const errors = session2.errors + 1;
    updateSession(session2, { status: "crashed", errors });
    captureSession();
  } else {
    logger.log("Session already ended");
  }
}
function sessionAnr() {
  if (persistTimer) {
    clearInterval(persistTimer);
  }
  const session2 = getCurrentScope().getSession();
  if (!session2) {
    return;
  }
  if (session2.status === "ok") {
    logger.log("Setting session as abnormal ANR");
    updateSession(session2, { status: "abnormal", abnormal_mechanism: "anr_foreground" });
    captureSession();
  }
}
function endSessionOnExit() {
  app.on("before-quit", () => {
    app.removeListener("will-quit", exitHandler);
    app.on("will-quit", exitHandler);
  });
}
const exitHandler = async (event) => {
  if (event.defaultPrevented) {
    return;
  }
  logger.log("[Session] Exit Handler");
  event.preventDefault();
  try {
    await endSession();
  } catch (e) {
    logger.warn("[Session] Error ending session:", e);
  }
  app.exit();
};
const MAX_AGE_DAYS = 30;
const MS_PER_DAY = 24 * 3600 * 1e3;
const NOT_MODIFIED_MS = 1e3;
const MAX_RETRY_MS = 5e3;
const RETRY_DELAY_MS = 500;
const MAX_RETRIES = MAX_RETRY_MS / RETRY_DELAY_MS;
const MINIDUMP_HEADER = "MDMP";
function delay(ms) {
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}
function createMinidumpLoader(getMinidumpPaths, preProcessFile = (file) => file) {
  const mutex = new Mutex();
  return async (deleteAll, callback) => {
    await mutex.runExclusive(async () => {
      for (const path of await getMinidumpPaths()) {
        try {
          if (deleteAll) {
            continue;
          }
          logger.log("Found minidump", path);
          let stats = await promises.stat(path);
          const thirtyDaysAgo = (/* @__PURE__ */ new Date()).getTime() - MAX_AGE_DAYS * MS_PER_DAY;
          if (stats.mtimeMs < thirtyDaysAgo) {
            logger.log(`Ignoring minidump as it is over ${MAX_AGE_DAYS} days old`);
            continue;
          }
          let retries = 0;
          while (retries <= MAX_RETRIES) {
            const twoSecondsAgo = (/* @__PURE__ */ new Date()).getTime() - NOT_MODIFIED_MS;
            if (stats.mtimeMs < twoSecondsAgo) {
              const file = await promises.readFile(path);
              const data = preProcessFile(file);
              if (data.length < 1e4 || data.subarray(0, 4).toString() !== MINIDUMP_HEADER) {
                logger.warn("Dropping minidump as it appears invalid.");
                break;
              }
              logger.log("Sending minidump");
              callback({
                attachmentType: "event.minidump",
                filename: basename(path),
                data
              });
              break;
            }
            logger.log(`Waiting. Minidump has been modified in the last ${NOT_MODIFIED_MS} milliseconds.`);
            retries += 1;
            await delay(RETRY_DELAY_MS);
            stats = await promises.stat(path);
          }
          if (retries >= MAX_RETRIES) {
            logger.warn("Timed out waiting for minidump to stop being modified");
          }
        } catch (e) {
          logger.error("Failed to load minidump", e);
        } finally {
          try {
            await promises.unlink(path);
          } catch (e) {
            logger.warn("Could not delete minidump", path);
          }
        }
      }
    });
  };
}
async function deleteCrashpadMetadataFile(crashesDirectory, waitMs = 100) {
  if (waitMs > 2e3) {
    return;
  }
  const metadataPath = join(crashesDirectory, "metadata");
  try {
    await promises.unlink(metadataPath);
    logger.log("Deleted Crashpad metadata file", metadataPath);
  } catch (e) {
    if (e.code && e.code == "EBUSY") {
      setTimeout(async () => {
        await deleteCrashpadMetadataFile(crashesDirectory, waitMs * 2);
      }, waitMs);
    }
  }
}
async function readDirsAsync(paths) {
  const found = [];
  for (const path of paths) {
    try {
      const files = await promises.readdir(path);
      found.push(...files.map((file) => join(path, file)));
    } catch (_) {
    }
  }
  return found;
}
function crashpadMinidumpLoader() {
  const crashesDirectory = app.getPath("crashDumps");
  const crashpadSubDirectory = process.platform === "win32" ? "reports" : "completed";
  const dumpDirectories = [join(crashesDirectory, crashpadSubDirectory)];
  if (process.platform === "darwin") {
    dumpDirectories.push(join(crashesDirectory, "pending"));
  }
  return createMinidumpLoader(async () => {
    await deleteCrashpadMetadataFile(crashesDirectory).catch((error) => logger.error(error));
    const files = await readDirsAsync(dumpDirectories);
    return files.filter((file) => file.endsWith(".dmp"));
  });
}
function minidumpFromBreakpadMultipart(file) {
  const binaryStart = file.lastIndexOf("Content-Type: application/octet-stream");
  if (binaryStart > 0) {
    const dumpStart = file.indexOf(MINIDUMP_HEADER, binaryStart);
    const dumpEnd = file.lastIndexOf("----------------------------");
    if (dumpStart > 0 && dumpEnd > 0 && dumpEnd > dumpStart) {
      return file.subarray(dumpStart, dumpEnd);
    }
  }
  return file;
}
function removeBreakpadMetadata(crashesDirectory, paths) {
  Promise.all(paths.filter((file) => file.endsWith(".txt") && !file.endsWith("log.txt")).map(async (file) => {
    const path = join(crashesDirectory, file);
    try {
      await promises.unlink(path);
    } catch (e) {
      logger.warn("Could not delete", path);
    }
  })).catch(() => {
  });
}
function breakpadMinidumpLoader() {
  const crashesDirectory = app.getPath("crashDumps");
  return createMinidumpLoader(async () => {
    const files = await promises.readdir(crashesDirectory);
    removeBreakpadMetadata(crashesDirectory, files);
    return files.filter((file) => file.endsWith(".dmp")).map((file) => join(crashesDirectory, file));
  }, minidumpFromBreakpadMultipart);
}
function getMinidumpLoader() {
  return usesCrashpad() ? crashpadMinidumpLoader() : breakpadMinidumpLoader();
}
const sentryMinidumpIntegration = defineIntegration((options = {}) => {
  let minidumpsRemaining = options.maxMinidumpsPerSession || 10;
  let scopeStore;
  let scopeLastRun;
  let minidumpLoader;
  function startCrashReporter() {
    logger.log("Starting Electron crashReporter");
    crashReporter.start({
      companyName: "",
      ignoreSystemCrashHandler: true,
      productName: app.name || app.getName(),
      // Empty string doesn't work for Linux Crashpad and no submitURL doesn't work for older versions of Electron
      submitURL: "https://f.a.k/e",
      uploadToServer: false,
      compress: true
    });
  }
  function setupScopeListener(client) {
    function scopeChanged(scope) {
      setImmediate(async () => scopeStore?.set({
        scope,
        event: await getEventDefaults(client)
      }));
    }
    addScopeListener((scope) => {
      scopeChanged(scope);
    });
    scopeChanged(getScopeData());
  }
  async function sendNativeCrashes(client, eventIn) {
    const event = eventIn;
    if (event.tags?.["event.process"] === "browser") {
      const previousRun = await scopeLastRun;
      if (previousRun) {
        if (previousRun.scope) {
          applyScopeDataToEvent(event, previousRun.scope);
        }
        event.release = previousRun.event?.release || event.release;
        event.environment = previousRun.event?.environment || event.environment;
        event.contexts = previousRun.event?.contexts || event.contexts;
      }
    }
    if (!event) {
      return false;
    }
    if (minidumpsRemaining <= 0) {
      logger.log("Not sending minidumps because the limit has been reached");
    }
    const deleteAll = client.getOptions().enabled === false || minidumpsRemaining <= 0;
    let minidumpFound = false;
    await minidumpLoader?.(deleteAll, (attachment) => {
      minidumpFound = true;
      if (minidumpsRemaining > 0) {
        minidumpsRemaining -= 1;
        captureEvent(event, { attachments: [attachment] });
      }
    });
    return minidumpFound;
  }
  async function sendRendererCrash(client, options2, contents, details) {
    const { getRendererName: getRendererName2 } = options2;
    const crashedProcess = getRendererName2?.(contents) || "renderer";
    logger.log(`'${crashedProcess}' process '${details.reason}'`);
    const found = await sendNativeCrashes(client, {
      contexts: {
        electron: {
          crashed_url: getRendererProperties(contents.id)?.url || "unknown",
          details
        }
      },
      level: "fatal",
      // The default is javascript
      platform: "native",
      tags: {
        "event.environment": "native",
        "event.process": crashedProcess,
        "exit.reason": details.reason
      }
    });
    if (found) {
      sessionCrashed();
    }
  }
  async function sendChildProcessCrash(client, options2, details) {
    logger.log(`${details.type} process has ${details.reason}`);
    const found = await sendNativeCrashes(client, {
      contexts: {
        electron: { details }
      },
      level: "fatal",
      // The default is javascript
      platform: "native",
      tags: {
        "event.environment": "native",
        "event.process": details.type,
        "exit.reason": details.reason,
        event_type: "native"
      }
    });
    if (found) {
      sessionCrashed();
    }
  }
  return {
    name: "SentryMinidump",
    setup(client) {
      if (process.mas) {
        return;
      }
      startCrashReporter();
      scopeStore = new BufferedWriteStore(getSentryCachePath(), "scope_v3", {
        scope: new Scope().getScopeData()
      });
      scopeLastRun = scopeStore.get();
      minidumpLoader = getMinidumpLoader();
      const options2 = client.getOptions();
      setupScopeListener(client);
      if (!options2?.dsn) {
        throw new SentryError("Attempted to enable Electron native crash reporter but no DSN was supplied");
      }
      trackRendererProperties();
      app.on("render-process-gone", async (_, contents, details) => {
        if (EXIT_REASONS.includes(details.reason)) {
          await sendRendererCrash(client, options2, contents, details);
        }
      });
      app.on("child-process-gone", async (_, details) => {
        if (EXIT_REASONS.includes(details.reason)) {
          await sendChildProcessCrash(client, options2, details);
        }
      });
      sendNativeCrashes(client, {
        level: "fatal",
        platform: "native",
        tags: {
          "event.environment": "native",
          "event.process": "browser"
        }
      }).then((minidumpsFound) => (
        // Check for previous uncompleted session. If a previous session exists
        // and no minidumps were found, its likely an abnormal exit
        checkPreviousSession(minidumpsFound)
      )).catch((error) => logger.error(error));
    }
  };
});
var isMergeableObject = function isMergeableObject2(value) {
  return isNonNullObject(value) && !isSpecial(value);
};
function isNonNullObject(value) {
  return !!value && typeof value === "object";
}
function isSpecial(value) {
  var stringValue = Object.prototype.toString.call(value);
  return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
}
var canUseSymbol = typeof Symbol === "function" && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
function isReactElement(value) {
  return value.$$typeof === REACT_ELEMENT_TYPE;
}
function emptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}
function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
}
function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(function(element) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}
function getMergeFunction(key, options) {
  if (!options.customMerge) {
    return deepmerge;
  }
  var customMerge = options.customMerge(key);
  return typeof customMerge === "function" ? customMerge : deepmerge;
}
function getEnumerableOwnPropertySymbols(target) {
  return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
    return Object.propertyIsEnumerable.call(target, symbol);
  }) : [];
}
function getKeys(target) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}
function propertyIsOnObject(object, property) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
}
function propertyIsUnsafe(target, key) {
  return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
}
function mergeObject(target, source, options) {
  var destination = {};
  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(function(key) {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }
  getKeys(source).forEach(function(key) {
    if (propertyIsUnsafe(target, key)) {
      return;
    }
    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}
function deepmerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || isMergeableObject;
  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
  var sourceIsArray = Array.isArray(source);
  var targetIsArray = Array.isArray(target);
  var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}
deepmerge.all = function deepmergeAll(array, options) {
  if (!Array.isArray(array)) {
    throw new Error("first argument should be an array");
  }
  return array.reduce(function(prev, next) {
    return deepmerge(prev, next, options);
  }, {});
};
var deepmerge_1 = deepmerge;
var cjs = deepmerge_1;
const deepMerge = /* @__PURE__ */ getDefaultExportFromCjs(cjs);
function removePrivateProperties(event) {
  delete event.sdkProcessingMetadata?.capturedSpanScope;
  delete event.sdkProcessingMetadata?.capturedSpanIsolationScope;
  for (const span of event.spans || []) {
    delete span.spanRecorder;
  }
}
function mergeEvents(defaults, event) {
  removePrivateProperties(event);
  const newEvent = deepMerge(defaults, event);
  if (event.spans || defaults.spans) {
    newEvent.spans = event.spans || defaults.spans;
  }
  return {
    ...newEvent,
    sdk: {
      ...defaults.sdk,
      ...event.sdk
    }
  };
}
function normalizePaths(event, basePath) {
  for (const exception of event.exception?.values || []) {
    for (const frame of exception.stacktrace?.frames || []) {
      if (frame.filename) {
        frame.filename = normalizeUrlToBase(frame.filename, basePath);
      }
    }
  }
  for (const debugImage of event.debug_meta?.images || []) {
    if (debugImage.type === "sourcemap") {
      debugImage.code_file = normalizeUrlToBase(debugImage.code_file, basePath);
    }
  }
  if (event.transaction) {
    event.transaction = normalizeUrlToBase(event.transaction, basePath);
  }
  const { request = {} } = event;
  if (request.url) {
    request.url = normalizeUrlToBase(request.url, basePath);
  }
  if (event.contexts?.feedback?.url && typeof event.contexts.feedback.url === "string") {
    event.contexts.feedback.url = normalizeUrlToBase(event.contexts.feedback.url, basePath);
  }
  return event;
}
function normalizeUrlsInReplayEnvelope(envelope, basePath) {
  let modifiedEnvelope = createEnvelope(envelope[0]);
  let isReplay = false;
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type === "replay_event") {
      isReplay = true;
      const [headers, event] = item;
      const currentScope = getCurrentScope().getScopeData();
      event.breadcrumbs = currentScope.breadcrumbs;
      event.tags = currentScope.tags;
      event.user = currentScope.user;
      if (Array.isArray(event.urls)) {
        event.urls = event.urls.map((url) => normalizeUrlToBase(url, basePath));
      }
      if (event?.request?.url) {
        event.request.url = normalizeUrlToBase(event.request.url, basePath);
      }
      modifiedEnvelope = addItemToEnvelope(modifiedEnvelope, [headers, event]);
    } else if (type === "replay_recording") {
      modifiedEnvelope = addItemToEnvelope(modifiedEnvelope, item);
    }
  });
  return isReplay ? modifiedEnvelope : envelope;
}
function normaliseProfile(profile, basePath) {
  for (const frame of profile.profile.frames) {
    if (frame.abs_path) {
      frame.abs_path = normalizeUrlToBase(frame.abs_path, basePath);
    }
  }
}
function getPreloadPath() {
  try {
    return require.resolve("../../preload/index.js");
  } catch (_) {
    try {
      const currentDir = fileURLToPath(import.meta.url);
      return resolve(currentDir, "..", "..", "..", "..", "preload", "index.js");
    } catch (_2) {
    }
  }
  return void 0;
}
const preloadInjectionIntegration = defineIntegration(() => {
  return {
    name: "PreloadInjection",
    setup(client) {
      const options = client.getOptions();
      if ((options.ipcMode & IPCMode.Classic) === 0) {
        return;
      }
      app.once("ready", () => {
        const path = getPreloadPath();
        if (path && typeof path === "string" && isAbsolute(path) && existsSync(path)) {
          for (const sesh of options.getSessions()) {
            const existing = sesh.getPreloads();
            sesh.setPreloads([path, ...existing]);
          }
        } else {
          logger.log("The preload script could not be injected automatically. This is most likely caused by bundling of the main process");
        }
      });
    }
  };
});
const mainProcessSessionIntegration = defineIntegration((options = {}) => {
  return {
    name: "MainProcessSession",
    setup() {
      startSession(!!options.sendOnCreate);
      endSessionOnExit();
    }
  };
});
const DEFAULT_OPTIONS$1 = {
  screen: true
};
const additionalContextIntegration = defineIntegration((userOptions = {}) => {
  const _lazyDeviceContext = {};
  const options = {
    ...DEFAULT_OPTIONS$1,
    ...userOptions
  };
  function _setPrimaryDisplayInfo() {
    const display = screen.getPrimaryDisplay();
    const width = Math.floor(display.size.width * display.scaleFactor);
    const height = Math.floor(display.size.height * display.scaleFactor);
    _lazyDeviceContext.screen_density = display.scaleFactor;
    _lazyDeviceContext.screen_resolution = `${width}x${height}`;
  }
  return {
    name: "AdditionalContext",
    setup() {
      app.whenReady().then(() => {
        const { screen: screen$1 } = options;
        if (screen$1) {
          _setPrimaryDisplayInfo();
          screen.on("display-metrics-changed", () => {
            _setPrimaryDisplayInfo();
          });
        }
      }, () => {
      });
    },
    processEvent(event) {
      const device = _lazyDeviceContext;
      return mergeEvents(event, { contexts: { device } });
    }
  };
});
function parseOptions(optionsIn) {
  const { method, options } = typeof optionsIn === "string" ? (
    // eslint-disable-next-line deprecation/deprecation
    { method: "GET", options: urlModule.parse(optionsIn) }
  ) : { method: (optionsIn.method || "GET").toUpperCase(), options: optionsIn };
  let url = "url" in options ? options.url : void 0;
  if (!url) {
    const urlObj = {};
    urlObj.protocol = options.protocol || "http:";
    if (options.host) {
      urlObj.host = options.host;
    } else {
      if (options.hostname) {
        urlObj.hostname = options.hostname;
      } else {
        urlObj.hostname = "localhost";
      }
      if (options.port) {
        urlObj.port = options.port;
      }
    }
    const pathObj = urlModule.parse(options.path || "/");
    urlObj.pathname = pathObj.pathname;
    urlObj.search = pathObj.search;
    urlObj.hash = pathObj.hash;
    url = urlModule.format(urlObj);
  }
  return {
    method,
    url
  };
}
function addHeadersToRequest(request, url, sentryTraceHeader, dynamicSamplingContext) {
  logger.log(`[Tracing] Adding sentry-trace header ${sentryTraceHeader} to outgoing request to "${url}": `);
  request.setHeader("sentry-trace", sentryTraceHeader);
  const sentryBaggageHeader = dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext);
  if (sentryBaggageHeader) {
    request.setHeader("baggage", sentryBaggageHeader);
  }
}
function createWrappedRequestFactory(options, tracePropagationTargets) {
  const createSpanUrlMap = new LRUMap(100);
  const headersUrlMap = new LRUMap(100);
  const shouldCreateSpan = (method, url) => {
    if (options.tracing === void 0) {
      return true;
    }
    if (options.tracing === false) {
      return false;
    }
    const key = `${method}:${url}`;
    const cachedDecision = createSpanUrlMap.get(key);
    if (cachedDecision !== void 0) {
      return cachedDecision;
    }
    const decision = options.tracing === true || options.tracing(method, url);
    createSpanUrlMap.set(key, decision);
    return decision;
  };
  const shouldAttachTraceData = (method, url) => {
    const key = `${method}:${url}`;
    const cachedDecision = headersUrlMap.get(key);
    if (cachedDecision !== void 0) {
      return cachedDecision;
    }
    if (tracePropagationTargets) {
      const decision = stringMatchesSomePattern(url, tracePropagationTargets);
      headersUrlMap.set(key, decision);
      return decision;
    }
    return true;
  };
  return function wrappedRequestMethodFactory(originalRequestMethod) {
    return function requestMethod(reqOptions) {
      const { url, method } = parseOptions(reqOptions);
      const request = originalRequestMethod.apply(this, [reqOptions]);
      if (url.match(/sentry_key/) || request.getHeader("x-sentry-auth")) {
        return request;
      }
      const span = shouldCreateSpan(method, url) ? startInactiveSpan$1({
        name: `${method} ${url}`,
        onlyIfParent: true,
        attributes: {
          url,
          type: "net.request",
          "http.method": method
        },
        op: "http.client"
      }) : new SentryNonRecordingSpan();
      span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, "auto.http.electron.net");
      if (shouldAttachTraceData(method, url)) {
        const { traceId, spanId, sampled, dsc } = {
          ...getIsolationScope().getPropagationContext(),
          ...getCurrentScope().getPropagationContext()
        };
        if (span.isRecording()) {
          const sentryTraceHeader = spanToTraceHeader(span);
          const dynamicSamplingContext = dsc || getDynamicSamplingContextFromSpan(span);
          addHeadersToRequest(request, url, sentryTraceHeader, dynamicSamplingContext);
        } else {
          const sentryTraceHeader = generateSentryTraceHeader(traceId, spanId, sampled);
          const client = getClient();
          const dynamicSamplingContext = dsc || (client ? getDynamicSamplingContextFromClient(traceId, client) : void 0);
          addHeadersToRequest(request, url, sentryTraceHeader, dynamicSamplingContext);
        }
      }
      return request.once("response", function(res) {
        if (options.breadcrumbs !== false) {
          addRequestBreadcrumb("response", method, url, this, res);
        }
        if (res.statusCode) {
          setHttpStatus(span, res.statusCode);
        }
        span.end();
      }).once("error", function(_error) {
        if (options.breadcrumbs !== false) {
          addRequestBreadcrumb("error", method, url, this, void 0);
        }
        setHttpStatus(span, 500);
        span.end();
      });
    };
  };
}
function addRequestBreadcrumb(event, method, url, req, res) {
  addBreadcrumb({
    type: "http",
    category: "electron.net",
    data: {
      url,
      method,
      status_code: res?.statusCode
    }
  }, {
    event,
    request: req,
    response: res
  });
}
const electronNetIntegration = defineIntegration((options = {}) => {
  return {
    name: "ElectronNet",
    setup() {
      const clientOptions = getClient()?.getOptions();
      if (options.breadcrumbs === false && options.tracing === false) {
        return;
      }
      fill(net, "request", createWrappedRequestFactory(options, clientOptions?.tracePropagationTargets));
    }
  };
});
const DEFAULT_OPTIONS = {
  breadcrumbs: EXIT_REASONS,
  events: ["abnormal-exit", "launch-failed", "integrity-failure"]
};
function getMessageAndSeverity(reason, proc) {
  const message = `'${proc}' process exited with '${reason}'`;
  switch (reason) {
    case "abnormal-exit":
    case "killed":
      return { message, level: "warning" };
    case "crashed":
    case "oom":
    case "launch-failed":
    case "integrity-failure":
      return { message, level: "fatal" };
    default:
      return { message, level: "debug" };
  }
}
const childProcessIntegration = defineIntegration((userOptions = {}) => {
  const { breadcrumbs, events } = userOptions;
  const options = {
    breadcrumbs: Array.isArray(breadcrumbs) ? breadcrumbs : breadcrumbs === false ? [] : DEFAULT_OPTIONS.breadcrumbs,
    events: Array.isArray(events) ? events : events === false ? [] : DEFAULT_OPTIONS.events
  };
  return {
    name: "ChildProcess",
    setup(client) {
      const { breadcrumbs: breadcrumbs2, events: events2 } = options;
      const allReasons = Array.from(/* @__PURE__ */ new Set([...breadcrumbs2, ...events2]));
      if (allReasons.length > 0) {
        const clientOptions = client.getOptions();
        app.on("child-process-gone", (_, details) => {
          const { reason } = details;
          if (events2.includes(reason)) {
            const { message, level } = getMessageAndSeverity(details.reason, details.type);
            captureMessage(message, { level, tags: { "event.process": details.type } });
          }
          if (breadcrumbs2.includes(reason)) {
            addBreadcrumb({
              type: "process",
              category: "child-process",
              ...getMessageAndSeverity(details.reason, details.type),
              data: details
            });
          }
        });
        app.on("render-process-gone", (_, contents, details) => {
          const { reason } = details;
          const name = clientOptions?.getRendererName?.(contents) || "renderer";
          if (events2.includes(reason)) {
            const { message, level } = getMessageAndSeverity(details.reason, name);
            captureMessage(message, level);
          }
          if (breadcrumbs2.includes(reason)) {
            addBreadcrumb({
              type: "process",
              category: "child-process",
              ...getMessageAndSeverity(details.reason, name),
              data: details
            });
          }
        });
      }
    }
  };
});
const screenshotsIntegration = defineIntegration(() => {
  return {
    name: "Screenshots",
    async processEvent(event, hint, client) {
      const attachScreenshot = !!client.getOptions().attachScreenshot;
      if (!attachScreenshot) {
        return event;
      }
      if (!event.transaction && event.platform !== "native") {
        let count = 1;
        for (const window2 of BrowserWindow.getAllWindows()) {
          if (!hint.attachments) {
            hint.attachments = [];
          }
          try {
            if (!window2.isDestroyed() && window2.isVisible()) {
              const filename = count === 1 ? "screenshot.png" : `screenshot-${count}.png`;
              const image = await window2.capturePage();
              hint.attachments.push({ filename, data: image.toPNG(), contentType: "image/png" });
              count += 1;
            }
          } catch (e) {
            logger.error("Error capturing screenshot", e);
          }
        }
      }
      return event;
    }
  };
});
const DOCUMENT_POLICY_HEADER = "Document-Policy";
const JS_PROFILING_HEADER = "js-profiling";
let RENDERER_PROFILES;
function rendererProfileFromIpc(event, profile) {
  if (!RENDERER_PROFILES) {
    return;
  }
  const profile_id = profile.event_id;
  RENDERER_PROFILES.set(profile_id, profile);
  if (event) {
    event.contexts = {
      ...event.contexts,
      // Re-add the profile context which we can later use to find the correct profile
      profile: {
        profile_id
      }
    };
  }
}
function addJsProfilingHeader(responseHeaders = {}) {
  if (responseHeaders[DOCUMENT_POLICY_HEADER]) {
    const docPolicy = responseHeaders[DOCUMENT_POLICY_HEADER];
    if (Array.isArray(docPolicy)) {
      docPolicy.push(JS_PROFILING_HEADER);
    } else {
      responseHeaders[DOCUMENT_POLICY_HEADER] = [docPolicy, JS_PROFILING_HEADER];
    }
  } else {
    responseHeaders[DOCUMENT_POLICY_HEADER] = JS_PROFILING_HEADER;
  }
  return { responseHeaders };
}
const rendererProfilingIntegration = defineIntegration(() => {
  return {
    name: "RendererProfiling",
    setup(client) {
      const options = client.getOptions();
      if (!options.enableRendererProfiling) {
        return;
      }
      RENDERER_PROFILES = new LRUMap(10);
      app.on("ready", () => {
        for (const sesh of options.getSessions()) {
          sesh.webRequest.onHeadersReceived((details, callback) => {
            callback(addJsProfilingHeader(details.responseHeaders));
          });
        }
      });
      client.on?.("beforeEnvelope", (envelope) => {
        let profile_id;
        forEachEnvelopeItem(envelope, (item, type) => {
          if (type !== "transaction") {
            return;
          }
          for (let j = 1; j < item.length; j++) {
            const event = item[j];
            if (event?.contexts?.profile?.profile_id) {
              profile_id = event.contexts.profile.profile_id;
              delete event.contexts.profile;
            }
          }
        });
        if (!profile_id) {
          return;
        }
        const profile = RENDERER_PROFILES?.remove(profile_id);
        if (!profile) {
          return;
        }
        normaliseProfile(profile, app.getAppPath());
        profile.release = options.release || getDefaultReleaseName();
        profile.environment = options.environment || getDefaultEnvironment();
        envelope[1].push([{ type: "profile" }, profile]);
      });
    }
  };
});
const normalizePathsIntegration = defineIntegration(() => {
  return {
    name: "NormalizePaths",
    processEvent(event) {
      return normalizePaths(event, app.getAppPath());
    }
  };
});
function getAppMemory() {
  return app.getAppMetrics().reduce((acc, metric) => acc + metric.memory.workingSetSize * 1024, 0);
}
const electronContextIntegration = defineIntegration(() => {
  return {
    name: "ElectronContext",
    processEvent(event, _, client) {
      delete event.server_name;
      delete event.tags?.server_name;
      delete event.contexts?.runtime;
      delete event.contexts?.app?.app_memory;
      if (event.request?.headers) {
        delete event.request.headers["User-Agent"];
      }
      const { release = getDefaultReleaseName(), environment = getDefaultEnvironment() } = client.getOptions();
      return mergeEvents({
        contexts: {
          app: {
            app_name: app.name || app.getName(),
            app_version: app.getVersion(),
            build_type: process.mas ? "app-store" : process.windowsStore ? "windows-store" : void 0,
            app_memory: getAppMemory(),
            app_arch: process.arch
          },
          browser: {
            name: "Chrome"
          },
          chrome: {
            name: "Chrome",
            type: "runtime",
            version: process.versions.chrome
          },
          device: {
            family: "Desktop"
          },
          node: {
            name: "Node",
            type: "runtime",
            version: process.versions.node
          },
          runtime: {
            name: "Electron",
            version: process.versions.electron
          }
        },
        environment,
        release,
        tags: {
          "event.origin": "electron",
          "event.environment": "javascript",
          "event.process": "browser"
        }
      }, event);
    }
  };
});
const GZIP_THRESHOLD = 1024 * 32;
function streamFromBody(body) {
  return new Readable({
    read() {
      this.push(body);
      this.push(null);
    }
  });
}
function getRequestOptions(url) {
  const { hostname, pathname, port, protocol: protocol2, search } = new URL$1(url);
  return {
    method: "POST",
    hostname,
    path: `${pathname}${search}`,
    port: parseInt(port, 10),
    protocol: protocol2
  };
}
function makeElectronTransport(options) {
  return createTransport(options, createElectronNetRequestExecutor(options.url, options.headers || {}));
}
function createElectronNetRequestExecutor(url, baseHeaders) {
  baseHeaders["Content-Type"] = "application/x-sentry-envelope";
  return function makeRequest(request) {
    return app.whenReady().then(() => new Promise((resolve2, reject) => {
      let bodyStream = streamFromBody(request.body);
      const headers = { ...baseHeaders };
      if (request.body.length > GZIP_THRESHOLD) {
        headers["content-encoding"] = "gzip";
        bodyStream = bodyStream.pipe(createGzip());
      }
      const req = net.request(getRequestOptions(url));
      for (const [header, value] of Object.entries(headers)) {
        req.setHeader(header, value);
      }
      req.on("response", (res) => {
        res.on("error", reject);
        res.on("data", () => {
        });
        res.on("end", () => {
        });
        const retryAfterHeader = res.headers["retry-after"] ?? null;
        const rateLimitsHeader = res.headers["x-sentry-rate-limits"] ?? null;
        resolve2({
          statusCode: res.statusCode,
          headers: dropUndefinedKeys({
            "retry-after": Array.isArray(retryAfterHeader) ? retryAfterHeader[0] || null : retryAfterHeader,
            "x-sentry-rate-limits": Array.isArray(rateLimitsHeader) ? rateLimitsHeader[0] || null : rateLimitsHeader
          })
        });
      });
      req.on("error", reject);
      bodyStream.pipe(req);
    }));
  };
}
const MILLISECONDS_PER_DAY = 864e5;
function isOutdated(request, maxAgeDays) {
  const cutOff = Date.now() - MILLISECONDS_PER_DAY * maxAgeDays;
  return request.date.getTime() < cutOff;
}
function getSentAtFromEnvelope(envelope) {
  const header = envelope[0];
  if (typeof header.sent_at === "string") {
    return new Date(header.sent_at);
  }
  return void 0;
}
function createOfflineStore(userOptions) {
  function log2(...args) {
    logger.log(`[Offline Store]:`, ...args);
  }
  const options = {
    maxAgeDays: userOptions.maxAgeDays || 30,
    maxQueueSize: userOptions.maxQueueSize || 30,
    queuePath: userOptions.queuePath || join(getSentryCachePath(), "queue")
  };
  const queue = new Store(options.queuePath, "queue-v2", []);
  function removeBody(id) {
    promises.unlink(join(options.queuePath, id)).catch(() => {
    });
  }
  function removeStaleRequests(queue2) {
    while (queue2[0] && isOutdated(queue2[0], options.maxAgeDays)) {
      const removed = queue2.shift();
      log2("Removing stale envelope", removed);
      removeBody(removed.id);
    }
  }
  async function insert(env2, which, previousDate) {
    log2(`${which}ing envelope into offline storage`);
    const id = uuid4();
    try {
      const data = serializeEnvelope(env2);
      await promises.mkdir(options.queuePath, { recursive: true });
      await promises.writeFile(join(options.queuePath, id), data);
    } catch (e) {
      log2("Failed to save", e);
    }
    await queue.update((queue2) => {
      if (which === "push") {
        removeStaleRequests(queue2);
        if (queue2.length >= options.maxQueueSize) {
          removeBody(id);
          return queue2;
        }
      }
      queue2[which]({ id, date: previousDate || getSentAtFromEnvelope(env2) || /* @__PURE__ */ new Date() });
      return queue2;
    });
  }
  let lastShiftedDate;
  return {
    push: async (env2) => {
      await insert(env2, "push");
    },
    unshift: async (env2) => {
      await insert(env2, "unshift", lastShiftedDate);
    },
    shift: async () => {
      log2("Popping envelope from offline storage");
      let request;
      await queue.update((queue2) => {
        removeStaleRequests(queue2);
        request = queue2.shift();
        return queue2;
      });
      if (request) {
        try {
          const data = await promises.readFile(join(options.queuePath, request.id));
          removeBody(request.id);
          lastShiftedDate = request.date;
          return parseEnvelope(data);
        } catch (e) {
          log2("Failed to read", e);
        }
      }
      return void 0;
    }
  };
}
function makeShouldSendTransport(baseTransport) {
  return (options) => {
    const transport = baseTransport(options);
    return {
      ...transport,
      send: async (envelope) => {
        const shouldAttemptSend = options.shouldSend === void 0 || await options.shouldSend(envelope);
        if (shouldAttemptSend) {
          return transport.send(envelope);
        }
        throw new Error("'shouldSend' callback returned false. Skipped sending.");
      }
    };
  };
}
function makeElectronOfflineTransport(baseTransport = makeElectronTransport) {
  return (userOptions) => {
    return makeOfflineTransport(makeShouldSendTransport(baseTransport))({
      flushAtStartup: true,
      createStore: createOfflineStore,
      ...userOptions
    });
  };
}
function getRendererName(contents) {
  const options = getClient()?.getOptions();
  return options?.getRendererName?.(contents);
}
function sendRendererAnrEvent(contents, blockedMs, frames) {
  sessionAnr();
  const rendererName = getRendererName(contents) || "renderer";
  const event = {
    level: "error",
    exception: {
      values: [
        {
          type: "ApplicationNotResponding",
          value: `Application Not Responding for at least ${blockedMs} ms`,
          stacktrace: { frames },
          mechanism: {
            // This ensures the UI doesn't say 'Crashed in' for the stack trace
            type: "ANR"
          }
        }
      ]
    },
    tags: {
      "event.process": rendererName
    }
  };
  captureEvent(event);
}
function rendererDebugger(contents, pausedStack) {
  contents.debugger.attach("1.3");
  const scripts = /* @__PURE__ */ new Map();
  const getModuleFromFilename = createGetModuleFromFilename(app.getAppPath());
  contents.debugger.on("message", (_, method, params) => {
    if (method === "Debugger.scriptParsed") {
      const param = params;
      scripts.set(param.scriptId, param.url);
    } else if (method === "Debugger.paused") {
      const param = params;
      if (param.reason !== "other") {
        return;
      }
      const callFrames = [...param.callFrames];
      contents.debugger.sendCommand("Debugger.resume").then(null, () => {
      });
      const stackFrames = stripSentryFramesAndReverse(callFrames.map((frame) => callFrameToStackFrame(frame, scripts.get(frame.location.scriptId), getModuleFromFilename)));
      pausedStack(stackFrames);
    }
  });
  contents.debugger.sendCommand("Debugger.enable").catch(() => {
  });
  return () => {
    return contents.debugger.sendCommand("Debugger.pause");
  };
}
let rendererWatchdogTimers;
function createHrTimer() {
  let lastPoll = process.hrtime();
  return {
    getTimeMs: () => {
      const [seconds, nanoSeconds] = process.hrtime(lastPoll);
      return Math.floor(seconds * 1e3 + nanoSeconds / 1e6);
    },
    reset: () => {
      lastPoll = process.hrtime();
    }
  };
}
function createRendererAnrStatusHandler() {
  function log2(message, ...args) {
    logger.log(`[Renderer ANR] ${message}`, ...args);
  }
  return (message, contents) => {
    rendererWatchdogTimers = rendererWatchdogTimers || /* @__PURE__ */ new Map();
    let watchdog = rendererWatchdogTimers.get(contents);
    if (watchdog === void 0) {
      log2("Renderer sent first status message", message.config);
      let pauseAndCapture;
      if (message.config.captureStackTrace) {
        log2("Connecting to debugger");
        pauseAndCapture = rendererDebugger(contents, (frames) => {
          log2("Event captured with stack frames");
          sendRendererAnrEvent(contents, message.config.anrThreshold, frames);
        });
      }
      watchdog = watchdogTimer(createHrTimer, 100, message.config.anrThreshold, async () => {
        log2("Watchdog timeout");
        if (pauseAndCapture) {
          log2("Pausing debugger to capture stack trace");
          pauseAndCapture();
        } else {
          log2("Capturing event");
          sendRendererAnrEvent(contents, message.config.anrThreshold);
        }
      });
      contents.once("destroyed", () => {
        rendererWatchdogTimers?.delete(contents);
      });
      rendererWatchdogTimers.set(contents, watchdog);
    }
    watchdog.poll();
    if (message.status !== "alive") {
      log2("Renderer visibility changed", message.status);
      watchdog.enabled(message.status === "visible");
    }
  };
}
let KNOWN_RENDERERS;
let WINDOW_ID_TO_WEB_CONTENTS;
const SENTRY_CUSTOM_SCHEME = {
  scheme: PROTOCOL_SCHEME,
  privileges: { bypassCSP: true, corsEnabled: true, supportFetchAPI: true, secure: true }
};
function newProtocolRenderer() {
  KNOWN_RENDERERS = KNOWN_RENDERERS || /* @__PURE__ */ new Set();
  WINDOW_ID_TO_WEB_CONTENTS = WINDOW_ID_TO_WEB_CONTENTS || /* @__PURE__ */ new Map();
  for (const wc of webContents.getAllWebContents()) {
    const wcId = wc.id;
    if (KNOWN_RENDERERS.has(wcId)) {
      continue;
    }
    if (!wc.isDestroyed()) {
      wc.executeJavaScript("window.__SENTRY_RENDERER_ID__").then((windowId) => {
        if (windowId && KNOWN_RENDERERS && WINDOW_ID_TO_WEB_CONTENTS) {
          KNOWN_RENDERERS.add(wcId);
          WINDOW_ID_TO_WEB_CONTENTS.set(windowId, wcId);
          wc.once("destroyed", () => {
            KNOWN_RENDERERS?.delete(wcId);
            WINDOW_ID_TO_WEB_CONTENTS?.delete(windowId);
          });
        }
      }, logger.error);
    }
  }
}
function captureEventFromRenderer(options, event, attachments, contents) {
  const process2 = contents ? options?.getRendererName?.(contents) || "renderer" : "renderer";
  event.breadcrumbs = event.breadcrumbs || [];
  delete event.environment;
  delete event.sdk?.name;
  delete event.sdk?.version;
  delete event.sdk?.packages;
  captureEvent(mergeEvents(event, { tags: { "event.process": process2 } }), { attachments });
}
function handleEvent(options, jsonEvent, contents) {
  let event;
  try {
    event = JSON.parse(jsonEvent);
  } catch {
    logger.warn("sentry-electron received an invalid event message");
    return;
  }
  captureEventFromRenderer(options, event, [], contents);
}
function eventFromEnvelope(envelope) {
  let event;
  const attachments = [];
  let profile;
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type === "event" || type === "transaction" || type === "feedback") {
      event = Array.isArray(item) ? item[1] : void 0;
    } else if (type === "attachment") {
      const [headers, data] = item;
      attachments.push({
        filename: headers.filename,
        attachmentType: headers.attachment_type,
        contentType: headers.content_type,
        data
      });
    } else if (type === "profile") {
      profile = item[1];
    }
  });
  return event ? [event, attachments, profile] : void 0;
}
function handleEnvelope(options, env2, contents) {
  const envelope = parseEnvelope(env2);
  const eventAndAttachments = eventFromEnvelope(envelope);
  if (eventAndAttachments) {
    const [event, attachments, profile] = eventAndAttachments;
    if (profile) {
      rendererProfileFromIpc(event, profile);
    }
    captureEventFromRenderer(options, event, attachments, contents);
  } else {
    const normalizedEnvelope = normalizeUrlsInReplayEnvelope(envelope, app.getAppPath());
    void getClient()?.getTransport()?.send(normalizedEnvelope);
  }
}
function handleMetric(metric) {
  const client = getClient();
  if (!client) {
    return;
  }
  const metricsAggregator = metricsDefault.getMetricsAggregatorForClient(client);
  metricsAggregator.add(metric.metricType, metric.name, metric.value, metric.unit, metric.tags, metric.timestamp);
}
function hasKeys(obj) {
  return obj != void 0 && Object.keys(obj).length > 0;
}
function handleScope(options, jsonScope) {
  let sentScope;
  try {
    sentScope = JSON.parse(jsonScope);
  } catch {
    logger.warn("sentry-electron received an invalid scope message");
    return;
  }
  const scope = getCurrentScope();
  if (hasKeys(sentScope.user)) {
    scope.setUser(sentScope.user);
  }
  if (hasKeys(sentScope.tags)) {
    scope.setTags(sentScope.tags);
  }
  if (hasKeys(sentScope.extra)) {
    scope.setExtras(sentScope.extra);
  }
  for (const attachment of sentScope.attachments || []) {
    scope.addAttachment(attachment);
  }
  const breadcrumb = sentScope.breadcrumbs.pop();
  if (breadcrumb) {
    scope.addBreadcrumb(breadcrumb, options?.maxBreadcrumbs || 100);
  }
}
function configureProtocol(options) {
  if (app.isReady()) {
    throw new SentryError("Sentry SDK should be initialized before the Electron app 'ready' event is fired");
  }
  protocol.registerSchemesAsPrivileged([SENTRY_CUSTOM_SCHEME]);
  protocol.registerSchemesAsPrivileged = new Proxy(protocol.registerSchemesAsPrivileged, {
    apply: (target, __, args) => {
      target([...args[0], SENTRY_CUSTOM_SCHEME]);
    }
  });
  const rendererStatusChanged = createRendererAnrStatusHandler();
  app.whenReady().then(() => {
    for (const sesh of options.getSessions()) {
      registerProtocol(sesh.protocol, PROTOCOL_SCHEME, (request) => {
        const getWebContents = () => {
          const webContentsId = request.windowId ? WINDOW_ID_TO_WEB_CONTENTS?.get(request.windowId) : void 0;
          return webContentsId ? webContents.fromId(webContentsId) : void 0;
        };
        const data = request.body;
        if (request.url.startsWith(`${PROTOCOL_SCHEME}://${IPCChannel.RENDERER_START}`)) {
          newProtocolRenderer();
        } else if (request.url.startsWith(`${PROTOCOL_SCHEME}://${IPCChannel.EVENT}`) && data) {
          handleEvent(options, data.toString(), getWebContents());
        } else if (request.url.startsWith(`${PROTOCOL_SCHEME}://${IPCChannel.SCOPE}`) && data) {
          handleScope(options, data.toString());
        } else if (request.url.startsWith(`${PROTOCOL_SCHEME}://${IPCChannel.ENVELOPE}`) && data) {
          handleEnvelope(options, data, getWebContents());
        } else if (request.url.startsWith(`${PROTOCOL_SCHEME}://${IPCChannel.ADD_METRIC}`) && data) {
          handleMetric(JSON.parse(data.toString()));
        } else if (request.url.startsWith(`${PROTOCOL_SCHEME}://${IPCChannel.STATUS}`) && data) {
          const contents = getWebContents();
          if (contents) {
            const status = JSON.parse(data.toString()).status;
            rendererStatusChanged(status, contents);
          }
        }
      });
    }
  }).catch((error) => logger.error(error));
}
function configureClassic(options) {
  ipcMain.on(IPCChannel.RENDERER_START, ({ sender }) => {
    const id = sender.id;
    KNOWN_RENDERERS = KNOWN_RENDERERS || /* @__PURE__ */ new Set();
    if (KNOWN_RENDERERS.has(id)) {
      return;
    }
    if (!sender.isDestroyed()) {
      KNOWN_RENDERERS.add(id);
      sender.once("destroyed", () => {
        KNOWN_RENDERERS?.delete(id);
      });
    }
  });
  ipcMain.on(IPCChannel.EVENT, ({ sender }, jsonEvent) => handleEvent(options, jsonEvent, sender));
  ipcMain.on(IPCChannel.SCOPE, (_, jsonScope) => handleScope(options, jsonScope));
  ipcMain.on(IPCChannel.ENVELOPE, ({ sender }, env2) => handleEnvelope(options, env2, sender));
  const rendererStatusChanged = createRendererAnrStatusHandler();
  ipcMain.on(IPCChannel.STATUS, ({ sender }, status) => rendererStatusChanged(status, sender));
  ipcMain.on(IPCChannel.ADD_METRIC, (_, metric) => handleMetric(metric));
}
function configureIPC(options) {
  if ((options.ipcMode & IPCMode.Protocol) > 0) {
    configureProtocol(options);
  }
  if ((options.ipcMode & IPCMode.Classic) > 0) {
    configureClassic(options);
  }
}
const defaultStackParser = createStackParser(nodeStackLineParser(createGetModuleFromFilename(app.getAppPath())));
function getDefaultIntegrations(options) {
  const integrations = [
    // Electron integrations
    sentryMinidumpIntegration(),
    electronBreadcrumbsIntegration(),
    electronNetIntegration(),
    electronContextIntegration(),
    childProcessIntegration(),
    normalizePathsIntegration(),
    onUncaughtExceptionIntegration(),
    preloadInjectionIntegration(),
    additionalContextIntegration(),
    screenshotsIntegration(),
    // Node integrations
    inboundFiltersIntegration(),
    functionToStringIntegration(),
    linkedErrorsIntegration(),
    consoleIntegration(),
    nativeNodeFetchIntegration(),
    onUnhandledRejectionIntegration(),
    contextLinesIntegration(),
    localVariablesIntegration(),
    nodeContextIntegration({ cloudResource: false })
  ];
  if (options.autoSessionTracking !== false) {
    integrations.push(mainProcessSessionIntegration());
  }
  if (options.attachScreenshot) {
    integrations.push(screenshotsIntegration());
  }
  if (options.enableRendererProfiling) {
    integrations.push(rendererProfilingIntegration());
  }
  return integrations;
}
function init(userOptions) {
  const optionsWithDefaults = {
    _metadata: { sdk: getSdkInfo() },
    ipcMode: IPCMode.Both,
    release: getDefaultReleaseName(),
    environment: getDefaultEnvironment(),
    defaultIntegrations: getDefaultIntegrations(userOptions),
    transport: makeElectronOfflineTransport(),
    transportOptions: {},
    getSessions: () => [session.defaultSession],
    ...userOptions,
    stackParser: stackParserFromStackParserOptions(userOptions.stackParser || defaultStackParser)
  };
  const options = {
    ...optionsWithDefaults,
    integrations: getIntegrationsToSetup(optionsWithDefaults)
  };
  removeRedundantIntegrations(options);
  configureIPC(options);
  setOpenTelemetryContextAsyncContextStrategy();
  const scope = getCurrentScope();
  scope.update(options.initialScope);
  const client = new NodeClient(options);
  scope.setClient(client);
  client.init();
  if (!options.skipOpenTelemetrySetup) {
    initOpenTelemetry(client);
  }
}
const INTEGRATION_OVERRIDES = [
  { userAdded: "ElectronMinidump", toRemove: "SentryMinidump" },
  { userAdded: "BrowserWindowSession", toRemove: "MainProcessSession" }
];
function removeRedundantIntegrations(options) {
  for (const { userAdded, toRemove } of INTEGRATION_OVERRIDES) {
    if (options.integrations.some((i) => i.name === userAdded)) {
      options.integrations = options.integrations.filter((i) => i.name !== toRemove);
    }
  }
}
init({
  enabled: false,
  dsn: process.env.SENTRY_DSN,
  transportOptions: {
    maxAgeDays: 15,
    maxQueueSize: 30,
    flushAtStartup: true
  }
});
app.whenReady().then(async () => {
  const mainWindow = new BrowserWindow({
    icon,
    show: false,
    webPreferences: {
      preload: resolve(__dirname, "../preload/index.mjs")
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    await mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "#init");
  } else {
    await mainWindow.loadFile(resolve(__dirname, "../renderer/index.html"), {
      hash: "init"
    });
  }
});
export {
  DBSYSTEMVALUES_FIRSTSQL as $,
  AWSECSLAUNCHTYPEVALUES_EC2 as A,
  DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE as B,
  CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS as C,
  DBCASSANDRACONSISTENCYLEVELVALUES_ALL as D,
  DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM as E,
  DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL as F,
  DBCASSANDRACONSISTENCYLEVELVALUES_ONE as G,
  DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM as H,
  DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL as I,
  DBCASSANDRACONSISTENCYLEVELVALUES_THREE as J,
  DBCASSANDRACONSISTENCYLEVELVALUES_TWO as K,
  DBSYSTEMVALUES_ADABAS as L,
  DBSYSTEMVALUES_CACHE as M,
  DBSYSTEMVALUES_CASSANDRA as N,
  DBSYSTEMVALUES_CLOUDSCAPE as O,
  DBSYSTEMVALUES_COCKROACHDB as P,
  DBSYSTEMVALUES_COLDFUSION as Q,
  DBSYSTEMVALUES_COSMOSDB as R,
  DBSYSTEMVALUES_COUCHBASE as S,
  DBSYSTEMVALUES_COUCHDB as T,
  DBSYSTEMVALUES_DB2 as U,
  DBSYSTEMVALUES_DERBY as V,
  DBSYSTEMVALUES_DYNAMODB as W,
  DBSYSTEMVALUES_EDB as X,
  DBSYSTEMVALUES_ELASTICSEARCH as Y,
  DBSYSTEMVALUES_FILEMAKER as Z,
  DBSYSTEMVALUES_FIREBIRD as _,
  AWSECSLAUNCHTYPEVALUES_FARGATE as a,
  MESSAGINGDESTINATIONKINDVALUES_QUEUE as a$,
  DBSYSTEMVALUES_GEODE as a0,
  DBSYSTEMVALUES_H2 as a1,
  DBSYSTEMVALUES_HANADB as a2,
  DBSYSTEMVALUES_HBASE as a3,
  DBSYSTEMVALUES_HIVE as a4,
  DBSYSTEMVALUES_HSQLDB as a5,
  DBSYSTEMVALUES_INFORMIX as a6,
  DBSYSTEMVALUES_INGRES as a7,
  DBSYSTEMVALUES_INSTANTDB as a8,
  DBSYSTEMVALUES_INTERBASE as a9,
  FAASINVOKEDPROVIDERVALUES_AWS as aA,
  FAASINVOKEDPROVIDERVALUES_AZURE as aB,
  FAASINVOKEDPROVIDERVALUES_GCP as aC,
  FAASTRIGGERVALUES_DATASOURCE as aD,
  FAASTRIGGERVALUES_HTTP as aE,
  FAASTRIGGERVALUES_OTHER as aF,
  FAASTRIGGERVALUES_PUBSUB as aG,
  FAASTRIGGERVALUES_TIMER as aH,
  FaasDocumentOperationValues as aI,
  FaasInvokedProviderValues as aJ,
  FaasTriggerValues as aK,
  HOSTARCHVALUES_AMD64 as aL,
  HOSTARCHVALUES_ARM32 as aM,
  HOSTARCHVALUES_ARM64 as aN,
  HOSTARCHVALUES_IA64 as aO,
  HOSTARCHVALUES_PPC32 as aP,
  HOSTARCHVALUES_PPC64 as aQ,
  HOSTARCHVALUES_X86 as aR,
  HTTPFLAVORVALUES_HTTP_1_0 as aS,
  HTTPFLAVORVALUES_HTTP_1_1 as aT,
  HTTPFLAVORVALUES_HTTP_2_0 as aU,
  HTTPFLAVORVALUES_QUIC as aV,
  HTTPFLAVORVALUES_SPDY as aW,
  HostArchValues as aX,
  HttpFlavorValues as aY,
  MESSAGETYPEVALUES_RECEIVED as aZ,
  MESSAGETYPEVALUES_SENT as a_,
  DBSYSTEMVALUES_MARIADB as aa,
  DBSYSTEMVALUES_MAXDB as ab,
  DBSYSTEMVALUES_MEMCACHED as ac,
  DBSYSTEMVALUES_MONGODB as ad,
  DBSYSTEMVALUES_MSSQL as ae,
  DBSYSTEMVALUES_MYSQL as af,
  DBSYSTEMVALUES_NEO4J as ag,
  DBSYSTEMVALUES_NETEZZA as ah,
  DBSYSTEMVALUES_ORACLE as ai,
  DBSYSTEMVALUES_OTHER_SQL as aj,
  DBSYSTEMVALUES_PERVASIVE as ak,
  DBSYSTEMVALUES_POINTBASE as al,
  DBSYSTEMVALUES_POSTGRESQL as am,
  DBSYSTEMVALUES_PROGRESS as an,
  DBSYSTEMVALUES_REDIS as ao,
  DBSYSTEMVALUES_REDSHIFT as ap,
  DBSYSTEMVALUES_SQLITE as aq,
  DBSYSTEMVALUES_SYBASE as ar,
  DBSYSTEMVALUES_TERADATA as as,
  DBSYSTEMVALUES_VERTICA as at,
  DbCassandraConsistencyLevelValues as au,
  DbSystemValues as av,
  FAASDOCUMENTOPERATIONVALUES_DELETE as aw,
  FAASDOCUMENTOPERATIONVALUES_EDIT as ax,
  FAASDOCUMENTOPERATIONVALUES_INSERT as ay,
  FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD as az,
  AwsEcsLaunchtypeValues as b,
  RPCGRPCSTATUSCODEVALUES_OK as b$,
  MESSAGINGDESTINATIONKINDVALUES_TOPIC as b0,
  MESSAGINGOPERATIONVALUES_PROCESS as b1,
  MESSAGINGOPERATIONVALUES_RECEIVE as b2,
  MessageTypeValues as b3,
  MessagingDestinationKindValues as b4,
  MessagingOperationValues as b5,
  NETHOSTCONNECTIONSUBTYPEVALUES_CDMA as b6,
  NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT as b7,
  NETHOSTCONNECTIONSUBTYPEVALUES_EDGE as b8,
  NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD as b9,
  NETTRANSPORTVALUES_OTHER as bA,
  NETTRANSPORTVALUES_PIPE as bB,
  NETTRANSPORTVALUES_UNIX as bC,
  NetHostConnectionSubtypeValues as bD,
  NetHostConnectionTypeValues as bE,
  NetTransportValues as bF,
  OSTYPEVALUES_AIX as bG,
  OSTYPEVALUES_DARWIN as bH,
  OSTYPEVALUES_DRAGONFLYBSD as bI,
  OSTYPEVALUES_FREEBSD as bJ,
  OSTYPEVALUES_HPUX as bK,
  OSTYPEVALUES_LINUX as bL,
  OSTYPEVALUES_NETBSD as bM,
  OSTYPEVALUES_OPENBSD as bN,
  OSTYPEVALUES_SOLARIS as bO,
  OSTYPEVALUES_WINDOWS as bP,
  OSTYPEVALUES_Z_OS as bQ,
  OsTypeValues as bR,
  RPCGRPCSTATUSCODEVALUES_ABORTED as bS,
  RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS as bT,
  RPCGRPCSTATUSCODEVALUES_CANCELLED as bU,
  RPCGRPCSTATUSCODEVALUES_DATA_LOSS as bV,
  RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED as bW,
  RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION as bX,
  RPCGRPCSTATUSCODEVALUES_INTERNAL as bY,
  RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT as bZ,
  RPCGRPCSTATUSCODEVALUES_NOT_FOUND as b_,
  NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 as ba,
  NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A as bb,
  NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B as bc,
  NETHOSTCONNECTIONSUBTYPEVALUES_GPRS as bd,
  NETHOSTCONNECTIONSUBTYPEVALUES_GSM as be,
  NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA as bf,
  NETHOSTCONNECTIONSUBTYPEVALUES_HSPA as bg,
  NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP as bh,
  NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA as bi,
  NETHOSTCONNECTIONSUBTYPEVALUES_IDEN as bj,
  NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN as bk,
  NETHOSTCONNECTIONSUBTYPEVALUES_LTE as bl,
  NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA as bm,
  NETHOSTCONNECTIONSUBTYPEVALUES_NR as bn,
  NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA as bo,
  NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA as bp,
  NETHOSTCONNECTIONSUBTYPEVALUES_UMTS as bq,
  NETHOSTCONNECTIONTYPEVALUES_CELL as br,
  NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE as bs,
  NETHOSTCONNECTIONTYPEVALUES_UNKNOWN as bt,
  NETHOSTCONNECTIONTYPEVALUES_WIFI as bu,
  NETHOSTCONNECTIONTYPEVALUES_WIRED as bv,
  NETTRANSPORTVALUES_INPROC as bw,
  NETTRANSPORTVALUES_IP as bx,
  NETTRANSPORTVALUES_IP_TCP as by,
  NETTRANSPORTVALUES_IP_UDP as bz,
  CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC as c,
  SEMATTRS_FAAS_CRON as c$,
  RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE as c0,
  RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED as c1,
  RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED as c2,
  RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED as c3,
  RPCGRPCSTATUSCODEVALUES_UNAVAILABLE as c4,
  RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED as c5,
  RPCGRPCSTATUSCODEVALUES_UNKNOWN as c6,
  RpcGrpcStatusCodeValues as c7,
  SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET as c8,
  SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS as c9,
  SEMATTRS_DB_CASSANDRA_COORDINATOR_DC as cA,
  SEMATTRS_DB_CASSANDRA_COORDINATOR_ID as cB,
  SEMATTRS_DB_CASSANDRA_IDEMPOTENCE as cC,
  SEMATTRS_DB_CASSANDRA_KEYSPACE as cD,
  SEMATTRS_DB_CASSANDRA_PAGE_SIZE as cE,
  SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT as cF,
  SEMATTRS_DB_CASSANDRA_TABLE as cG,
  SEMATTRS_DB_CONNECTION_STRING as cH,
  SEMATTRS_DB_HBASE_NAMESPACE as cI,
  SEMATTRS_DB_JDBC_DRIVER_CLASSNAME as cJ,
  SEMATTRS_DB_MONGODB_COLLECTION as cK,
  SEMATTRS_DB_MSSQL_INSTANCE_NAME as cL,
  SEMATTRS_DB_NAME as cM,
  SEMATTRS_DB_OPERATION as cN,
  SEMATTRS_DB_REDIS_DATABASE_INDEX as cO,
  SEMATTRS_DB_SQL_TABLE as cP,
  SEMATTRS_DB_STATEMENT as cQ,
  SEMATTRS_DB_SYSTEM as cR,
  SEMATTRS_DB_USER as cS,
  SEMATTRS_ENDUSER_ID as cT,
  SEMATTRS_ENDUSER_ROLE as cU,
  SEMATTRS_ENDUSER_SCOPE as cV,
  SEMATTRS_EXCEPTION_ESCAPED as cW,
  SEMATTRS_EXCEPTION_MESSAGE as cX,
  SEMATTRS_EXCEPTION_STACKTRACE as cY,
  SEMATTRS_EXCEPTION_TYPE as cZ,
  SEMATTRS_FAAS_COLDSTART as c_,
  SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ as ca,
  SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY as cb,
  SEMATTRS_AWS_DYNAMODB_COUNT as cc,
  SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE as cd,
  SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES as ce,
  SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES as cf,
  SEMATTRS_AWS_DYNAMODB_INDEX_NAME as cg,
  SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS as ch,
  SEMATTRS_AWS_DYNAMODB_LIMIT as ci,
  SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES as cj,
  SEMATTRS_AWS_DYNAMODB_PROJECTION as ck,
  SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY as cl,
  SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY as cm,
  SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT as cn,
  SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD as co,
  SEMATTRS_AWS_DYNAMODB_SEGMENT as cp,
  SEMATTRS_AWS_DYNAMODB_SELECT as cq,
  SEMATTRS_AWS_DYNAMODB_TABLE_COUNT as cr,
  SEMATTRS_AWS_DYNAMODB_TABLE_NAMES as cs,
  SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS as ct,
  SEMATTRS_AWS_LAMBDA_INVOKED_ARN as cu,
  SEMATTRS_CODE_FILEPATH as cv,
  SEMATTRS_CODE_FUNCTION as cw,
  SEMATTRS_CODE_LINENO as cx,
  SEMATTRS_CODE_NAMESPACE as cy,
  SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL as cz,
  CLOUDPLATFORMVALUES_AWS_EC2 as d,
  SEMATTRS_RPC_GRPC_STATUS_CODE as d$,
  SEMATTRS_FAAS_DOCUMENT_COLLECTION as d0,
  SEMATTRS_FAAS_DOCUMENT_NAME as d1,
  SEMATTRS_FAAS_DOCUMENT_OPERATION as d2,
  SEMATTRS_FAAS_DOCUMENT_TIME as d3,
  SEMATTRS_FAAS_EXECUTION as d4,
  SEMATTRS_FAAS_INVOKED_NAME as d5,
  SEMATTRS_FAAS_INVOKED_PROVIDER as d6,
  SEMATTRS_FAAS_INVOKED_REGION as d7,
  SEMATTRS_FAAS_TIME as d8,
  SEMATTRS_FAAS_TRIGGER as d9,
  SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY as dA,
  SEMATTRS_MESSAGING_KAFKA_PARTITION as dB,
  SEMATTRS_MESSAGING_KAFKA_TOMBSTONE as dC,
  SEMATTRS_MESSAGING_MESSAGE_ID as dD,
  SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES as dE,
  SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES as dF,
  SEMATTRS_MESSAGING_OPERATION as dG,
  SEMATTRS_MESSAGING_PROTOCOL as dH,
  SEMATTRS_MESSAGING_PROTOCOL_VERSION as dI,
  SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY as dJ,
  SEMATTRS_MESSAGING_SYSTEM as dK,
  SEMATTRS_MESSAGING_TEMP_DESTINATION as dL,
  SEMATTRS_MESSAGING_URL as dM,
  SEMATTRS_NET_HOST_CARRIER_ICC as dN,
  SEMATTRS_NET_HOST_CARRIER_MCC as dO,
  SEMATTRS_NET_HOST_CARRIER_MNC as dP,
  SEMATTRS_NET_HOST_CARRIER_NAME as dQ,
  SEMATTRS_NET_HOST_CONNECTION_SUBTYPE as dR,
  SEMATTRS_NET_HOST_CONNECTION_TYPE as dS,
  SEMATTRS_NET_HOST_IP as dT,
  SEMATTRS_NET_HOST_NAME as dU,
  SEMATTRS_NET_HOST_PORT as dV,
  SEMATTRS_NET_PEER_IP as dW,
  SEMATTRS_NET_PEER_NAME as dX,
  SEMATTRS_NET_PEER_PORT as dY,
  SEMATTRS_NET_TRANSPORT as dZ,
  SEMATTRS_PEER_SERVICE as d_,
  SEMATTRS_HTTP_CLIENT_IP as da,
  SEMATTRS_HTTP_FLAVOR as db,
  SEMATTRS_HTTP_HOST as dc,
  SEMATTRS_HTTP_METHOD as dd,
  SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH as de,
  SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED as df,
  SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH as dg,
  SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED as dh,
  SEMATTRS_HTTP_ROUTE as di,
  SEMATTRS_HTTP_SCHEME as dj,
  SEMATTRS_HTTP_SERVER_NAME as dk,
  SEMATTRS_HTTP_STATUS_CODE as dl,
  SEMATTRS_HTTP_TARGET as dm,
  SEMATTRS_HTTP_URL as dn,
  SEMATTRS_HTTP_USER_AGENT as dp,
  SEMATTRS_MESSAGE_COMPRESSED_SIZE as dq,
  SEMATTRS_MESSAGE_ID as dr,
  SEMATTRS_MESSAGE_TYPE as ds,
  SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE as dt,
  SEMATTRS_MESSAGING_CONSUMER_ID as du,
  SEMATTRS_MESSAGING_CONVERSATION_ID as dv,
  SEMATTRS_MESSAGING_DESTINATION as dw,
  SEMATTRS_MESSAGING_DESTINATION_KIND as dx,
  SEMATTRS_MESSAGING_KAFKA_CLIENT_ID as dy,
  SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP as dz,
  CLOUDPLATFORMVALUES_AWS_ECS as e,
  SEMRESATTRS_K8S_STATEFULSET_NAME as e$,
  SEMATTRS_RPC_JSONRPC_ERROR_CODE as e0,
  SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE as e1,
  SEMATTRS_RPC_JSONRPC_REQUEST_ID as e2,
  SEMATTRS_RPC_JSONRPC_VERSION as e3,
  SEMATTRS_RPC_METHOD as e4,
  SEMATTRS_RPC_SERVICE as e5,
  SEMATTRS_RPC_SYSTEM as e6,
  SEMATTRS_THREAD_ID as e7,
  SEMATTRS_THREAD_NAME as e8,
  SEMRESATTRS_AWS_ECS_CLUSTER_ARN as e9,
  SEMRESATTRS_FAAS_MAX_MEMORY as eA,
  SEMRESATTRS_FAAS_NAME as eB,
  SEMRESATTRS_FAAS_VERSION as eC,
  SEMRESATTRS_HOST_ARCH as eD,
  SEMRESATTRS_HOST_ID as eE,
  SEMRESATTRS_HOST_IMAGE_ID as eF,
  SEMRESATTRS_HOST_IMAGE_NAME as eG,
  SEMRESATTRS_HOST_IMAGE_VERSION as eH,
  SEMRESATTRS_HOST_NAME as eI,
  SEMRESATTRS_HOST_TYPE as eJ,
  SEMRESATTRS_K8S_CLUSTER_NAME as eK,
  SEMRESATTRS_K8S_CONTAINER_NAME as eL,
  SEMRESATTRS_K8S_CRONJOB_NAME as eM,
  SEMRESATTRS_K8S_CRONJOB_UID as eN,
  SEMRESATTRS_K8S_DAEMONSET_NAME as eO,
  SEMRESATTRS_K8S_DAEMONSET_UID as eP,
  SEMRESATTRS_K8S_DEPLOYMENT_NAME as eQ,
  SEMRESATTRS_K8S_DEPLOYMENT_UID as eR,
  SEMRESATTRS_K8S_JOB_NAME as eS,
  SEMRESATTRS_K8S_JOB_UID as eT,
  SEMRESATTRS_K8S_NAMESPACE_NAME as eU,
  SEMRESATTRS_K8S_NODE_NAME as eV,
  SEMRESATTRS_K8S_NODE_UID as eW,
  SEMRESATTRS_K8S_POD_NAME as eX,
  SEMRESATTRS_K8S_POD_UID as eY,
  SEMRESATTRS_K8S_REPLICASET_NAME as eZ,
  SEMRESATTRS_K8S_REPLICASET_UID as e_,
  SEMRESATTRS_AWS_ECS_CONTAINER_ARN as ea,
  SEMRESATTRS_AWS_ECS_LAUNCHTYPE as eb,
  SEMRESATTRS_AWS_ECS_TASK_ARN as ec,
  SEMRESATTRS_AWS_ECS_TASK_FAMILY as ed,
  SEMRESATTRS_AWS_ECS_TASK_REVISION as ee,
  SEMRESATTRS_AWS_EKS_CLUSTER_ARN as ef,
  SEMRESATTRS_AWS_LOG_GROUP_ARNS as eg,
  SEMRESATTRS_AWS_LOG_GROUP_NAMES as eh,
  SEMRESATTRS_AWS_LOG_STREAM_ARNS as ei,
  SEMRESATTRS_AWS_LOG_STREAM_NAMES as ej,
  SEMRESATTRS_CLOUD_ACCOUNT_ID as ek,
  SEMRESATTRS_CLOUD_AVAILABILITY_ZONE as el,
  SEMRESATTRS_CLOUD_PLATFORM as em,
  SEMRESATTRS_CLOUD_PROVIDER as en,
  SEMRESATTRS_CLOUD_REGION as eo,
  SEMRESATTRS_CONTAINER_ID as ep,
  SEMRESATTRS_CONTAINER_IMAGE_NAME as eq,
  SEMRESATTRS_CONTAINER_IMAGE_TAG as er,
  SEMRESATTRS_CONTAINER_NAME as es,
  SEMRESATTRS_CONTAINER_RUNTIME as et,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT as eu,
  SEMRESATTRS_DEVICE_ID as ev,
  SEMRESATTRS_DEVICE_MODEL_IDENTIFIER as ew,
  SEMRESATTRS_DEVICE_MODEL_NAME as ex,
  SEMRESATTRS_FAAS_ID as ey,
  SEMRESATTRS_FAAS_INSTANCE as ez,
  CLOUDPLATFORMVALUES_AWS_EKS as f,
  SEMRESATTRS_K8S_STATEFULSET_UID as f0,
  SEMRESATTRS_OS_DESCRIPTION as f1,
  SEMRESATTRS_OS_NAME as f2,
  SEMRESATTRS_OS_TYPE as f3,
  SEMRESATTRS_OS_VERSION as f4,
  SEMRESATTRS_PROCESS_COMMAND as f5,
  SEMRESATTRS_PROCESS_COMMAND_ARGS as f6,
  SEMRESATTRS_PROCESS_COMMAND_LINE as f7,
  SEMRESATTRS_PROCESS_EXECUTABLE_NAME as f8,
  SEMRESATTRS_PROCESS_EXECUTABLE_PATH as f9,
  TELEMETRYSDKLANGUAGEVALUES_RUBY as fA,
  TELEMETRYSDKLANGUAGEVALUES_WEBJS as fB,
  TelemetrySdkLanguageValues as fC,
  getAugmentedNamespace as fD,
  commonjsGlobal as fE,
  require$$2 as fF,
  SEMRESATTRS_PROCESS_OWNER as fa,
  SEMRESATTRS_PROCESS_PID as fb,
  SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION as fc,
  SEMRESATTRS_PROCESS_RUNTIME_NAME as fd,
  SEMRESATTRS_PROCESS_RUNTIME_VERSION as fe,
  SEMRESATTRS_SERVICE_INSTANCE_ID as ff,
  SEMRESATTRS_SERVICE_NAME as fg,
  SEMRESATTRS_SERVICE_NAMESPACE as fh,
  SEMRESATTRS_SERVICE_VERSION as fi,
  SEMRESATTRS_TELEMETRY_AUTO_VERSION as fj,
  SEMRESATTRS_TELEMETRY_SDK_LANGUAGE as fk,
  SEMRESATTRS_TELEMETRY_SDK_NAME as fl,
  SEMRESATTRS_TELEMETRY_SDK_VERSION as fm,
  SEMRESATTRS_WEBENGINE_DESCRIPTION as fn,
  SEMRESATTRS_WEBENGINE_NAME as fo,
  SEMRESATTRS_WEBENGINE_VERSION as fp,
  SemanticAttributes as fq,
  SemanticResourceAttributes as fr,
  TELEMETRYSDKLANGUAGEVALUES_CPP as fs,
  TELEMETRYSDKLANGUAGEVALUES_DOTNET as ft,
  TELEMETRYSDKLANGUAGEVALUES_ERLANG as fu,
  TELEMETRYSDKLANGUAGEVALUES_GO as fv,
  TELEMETRYSDKLANGUAGEVALUES_JAVA as fw,
  TELEMETRYSDKLANGUAGEVALUES_NODEJS as fx,
  TELEMETRYSDKLANGUAGEVALUES_PHP as fy,
  TELEMETRYSDKLANGUAGEVALUES_PYTHON as fz,
  CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK as g,
  CLOUDPLATFORMVALUES_AWS_LAMBDA as h,
  CLOUDPLATFORMVALUES_AZURE_AKS as i,
  CLOUDPLATFORMVALUES_AZURE_APP_SERVICE as j,
  CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES as k,
  CLOUDPLATFORMVALUES_AZURE_FUNCTIONS as l,
  CLOUDPLATFORMVALUES_AZURE_VM as m,
  CLOUDPLATFORMVALUES_GCP_APP_ENGINE as n,
  CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS as o,
  CLOUDPLATFORMVALUES_GCP_CLOUD_RUN as p,
  CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE as q,
  CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE as r,
  CLOUDPROVIDERVALUES_ALIBABA_CLOUD as s,
  CLOUDPROVIDERVALUES_AWS as t,
  CLOUDPROVIDERVALUES_AZURE as u,
  CLOUDPROVIDERVALUES_GCP as v,
  CloudPlatformValues as w,
  CloudProviderValues as x,
  DBCASSANDRACONSISTENCYLEVELVALUES_ANY as y,
  DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM as z
};
